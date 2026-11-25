package main

import (
	"archive/zip"
	"bytes"
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"io"
	"math/big"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

const testCertificateOrigin = "https://toolbox.example.com"
const testCertificateAccess = "test-only-issuance-access-token-12345"

type testCertificateCA struct {
	t      *testing.T
	issued int
}

func (ca *testCertificateCA) start(_ context.Context, _ []string) (certificateOrder, error) {
	return certificateOrder{uri: "test-order", challenges: []certificateChallenge{{record: certificateRecord{"_acme-challenge.example.com", "mock-ca-value"}}}}, nil
}

func (ca *testCertificateCA) issue(_ context.Context, _ certificateOrder, csrDER []byte) ([][]byte, error) {
	ca.issued++
	csr, err := x509.ParseCertificateRequest(csrDER)
	if err != nil {
		ca.t.Fatal(err)
	}
	if err := csr.CheckSignature(); err != nil {
		ca.t.Fatal(err)
	}
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		ca.t.Fatal(err)
	}
	now := time.Now()
	issuer := &x509.Certificate{SerialNumber: big.NewInt(1), NotBefore: now.Add(-time.Hour), NotAfter: now.Add(time.Hour), IsCA: true, BasicConstraintsValid: true, KeyUsage: x509.KeyUsageCertSign}
	caDER, err := x509.CreateCertificate(rand.Reader, issuer, issuer, &key.PublicKey, key)
	if err != nil {
		ca.t.Fatal(err)
	}
	leaf := &x509.Certificate{SerialNumber: big.NewInt(2), DNSNames: csr.DNSNames, NotBefore: now.Add(-time.Minute), NotAfter: now.Add(time.Hour), ExtKeyUsage: []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth}}
	leafDER, err := x509.CreateCertificate(rand.Reader, leaf, issuer, csr.PublicKey, key)
	if err != nil {
		ca.t.Fatal(err)
	}
	return [][]byte{leafDER, caDER}, nil
}

func callCertificateAPI(h http.Handler, path, origin, token, body string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(http.MethodPost, "/api/certificates/"+path, strings.NewReader(body))
	request.Header.Set("Origin", origin)
	request.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	h.ServeHTTP(w, request)
	return w
}

func TestCertificateIssuanceAndDownload(t *testing.T) {
	ca := &testCertificateCA{t: t}
	records := map[string][]string{}
	s := &certificateService{authority: ca, staging: true, origin: testCertificateOrigin, accessHash: sha256.Sum256([]byte(testCertificateAccess)), slots: make(chan struct{}, 2), sessions: make(map[[32]byte]*certificateSession), lookupTXT: func(_ context.Context, name string) ([]string, error) { return records[name], nil }}
	origins := map[string]struct{}{testCertificateOrigin: {}}
	handler := newHandler(config{allowedOrigins: origins, certificates: s})
	status := httptest.NewRecorder()
	handler.ServeHTTP(status, httptest.NewRequest(http.MethodGet, "/api/certificates/status", nil))
	if status.Code != 200 || !strings.Contains(status.Body.String(), `"staging":true`) {
		t.Fatalf("status: %d %s", status.Code, status.Body)
	}
	body := `{"domains":["Example.COM.","*.example.com","example.com"]}`
	for _, testcase := range []struct {
		origin, token, body string
		code                int
	}{
		{"", testCertificateAccess, body, 403},
		{testCertificateOrigin, "wrong", body, 401},
		{testCertificateOrigin, testCertificateAccess, `{"domains":["127.0.0.1"]}`, 400},
	} {
		if w := callCertificateAPI(handler, "start", testcase.origin, testcase.token, testcase.body); w.Code != testcase.code {
			t.Fatalf("start: got %d want %d: %s", w.Code, testcase.code, w.Body)
		}
	}
	start := callCertificateAPI(handler, "start", testCertificateOrigin, testCertificateAccess, body)
	if start.Code != 201 || !strings.Contains(start.Header().Get("Cache-Control"), "no-store") {
		t.Fatalf("start: %d %s", start.Code, start.Body)
	}
	var order struct {
		Token   string
		Records []certificateRecord
		Expires time.Time
	}
	if err := json.Unmarshal(start.Body.Bytes(), &order); err != nil {
		t.Fatal(err)
	}
	if len(order.Token) != 43 || len(order.Records) != 2 || !order.Expires.After(time.Now()) {
		t.Fatal("invalid order metadata")
	}
	if w := callCertificateAPI(handler, "start", testCertificateOrigin, testCertificateAccess, body); w.Code != 429 {
		t.Fatalf("rate limit: %d", w.Code)
	}
	if w := callCertificateAPI(handler, "download", testCertificateOrigin, strings.Repeat("x", 43), ""); w.Code != 404 {
		t.Fatalf("other order: %d", w.Code)
	}
	id := sha256.Sum256([]byte(order.Token))
	records["_acme-challenge.example.com."] = []string{"mock-ca-value"}
	if w := callCertificateAPI(handler, "download", testCertificateOrigin, order.Token, ""); w.Code != 409 || ca.issued != 0 {
		t.Fatalf("unproven order: %d, issues: %d", w.Code, ca.issued)
	}
	s.sessions[id].nextAttempt = time.Time{}
	for _, record := range order.Records {
		records[record.Name+"."] = append(records[record.Name+"."], record.Value)
	}
	download := callCertificateAPI(handler, "download", testCertificateOrigin, order.Token, "")
	if download.Code != 200 || download.Header().Get("Content-Type") != "application/zip" || !strings.Contains(download.Header().Get("Cache-Control"), "no-store") || ca.issued != 1 {
		t.Fatalf("download: status %d, issued %d", download.Code, ca.issued)
	}
	archive, err := zip.NewReader(bytes.NewReader(download.Body.Bytes()), int64(download.Body.Len()))
	if err != nil {
		t.Fatal(err)
	}
	files := map[string][]byte{}
	for _, f := range archive.File {
		if f.Name == "privkey.pem" && f.Mode().Perm() != 0600 {
			t.Fatal("incorrect private key permissions")
		}
		r, err := f.Open()
		if err != nil {
			t.Fatal(err)
		}
		files[f.Name], err = io.ReadAll(r)
		r.Close()
		if err != nil {
			t.Fatal(err)
		}
	}
	if len(files) != 3 || !bytes.Contains(files["nginx.conf"], []byte("/etc/nginx/ssl/example.com/fullchain.pem")) || !bytes.Contains(files["nginx.conf"], []byte("TEST ONLY")) {
		t.Fatal("missing or incorrect Nginx bundle contents")
	}
	leafBlock, rest := pem.Decode(files["fullchain.pem"])
	issuerBlock, _ := pem.Decode(rest)
	keyBlock, _ := pem.Decode(files["privkey.pem"])
	if leafBlock == nil || issuerBlock == nil || keyBlock == nil {
		t.Fatal("expected chain and key PEM")
	}
	leaf, err := x509.ParseCertificate(leafBlock.Bytes)
	if err != nil {
		t.Fatal(err)
	}
	issuer, err := x509.ParseCertificate(issuerBlock.Bytes)
	if err != nil {
		t.Fatal(err)
	}
	key, err := x509.ParsePKCS8PrivateKey(keyBlock.Bytes)
	if err != nil {
		t.Fatal(err)
	}
	if !key.(*ecdsa.PrivateKey).PublicKey.Equal(leaf.PublicKey) || leaf.VerifyHostname("foo.example.com") != nil || leaf.CheckSignatureFrom(issuer) != nil {
		t.Fatal("leaf certificate does not match key, names or issuer")
	}
	if _, err := makeCertificateZIP(&certificateSession{key: key.(*ecdsa.PrivateKey), domains: leaf.DNSNames}, [][]byte{leafBlock.Bytes, issuerBlock.Bytes}, false); err == nil {
		t.Fatal("production mode accepted untrusted CA")
	}
	delete(records, "_acme-challenge.example.com.")
	if w := callCertificateAPI(handler, "download", testCertificateOrigin, order.Token, ""); w.Code != 200 || !bytes.Equal(w.Body.Bytes(), download.Body.Bytes()) || ca.issued != 1 {
		t.Fatal("repeat download should not sign again")
	}
	s.sessions[id].expires = time.Now().Add(-time.Second)
	if w := callCertificateAPI(handler, "download", testCertificateOrigin, order.Token, ""); w.Code != 404 {
		t.Fatalf("expired: %d", w.Code)
	}
}

func TestCertificateIssuanceIsOptIn(t *testing.T) {
	t.Setenv("CERTIFICATE_ISSUANCE_ENABLED", "false")
	handler := newHandler(configFromEnv())
	status := httptest.NewRecorder()
	handler.ServeHTTP(status, httptest.NewRequest(http.MethodGet, "/api/certificates/status", nil))
	if status.Code != 200 || !strings.Contains(status.Body.String(), `"enabled":false`) {
		t.Fatalf("status: %d %s", status.Code, status.Body)
	}
	if w := callCertificateAPI(handler, "start", "", testCertificateAccess, `{"domains":["example.com"]}`); w.Code != http.StatusServiceUnavailable {
		t.Fatalf("disabled: %d", w.Code)
	}
}
