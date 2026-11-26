package main

import (
	"bytes"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"io"
	"math/big"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"strings"
	"testing"
	"time"
)

func TestNetworkToolValidation(t *testing.T) {
	handler := newHandler(config{})
	for _, test := range []struct{ path, body string }{
		{"/api/dns", `{"name":"example.com/a","type":"A","resolver":"google"}`},
		{"/api/dns", `{"name":"example.com","type":"AXFR","resolver":"google"}`},
		{"/api/dns", `{"name":"example.com","type":"A","resolver":"http://localhost"}`},
		{"/api/tls", `{"host":"127.0.0.1"}`},
		{"/api/tls", `{"host":"localhost"}`},
		{"/api/tls", `{"host":"example.com:443"}`},
		{"/api/stream", `{"url":"http://127.0.0.1","method":"GET"}`},
		{"/api/stream", `{"url":"file:///etc/passwd","method":"GET"}`},
		{"/api/stream", `{"url":"https://example.com","method":"TRACE"}`},
	} {
		request := httptest.NewRequest("POST", test.path, strings.NewReader(test.body))
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, request)
		if response.Code != 400 {
			t.Errorf("%s %s status %d", test.path, test.body, response.Code)
		}
	}
	for _, name := range []string{"example.com", "_acme-challenge.example.com", "xn--bcher-kva.example", "a.example."} {
		if !validDNSName(name) {
			t.Errorf("valid DNS name rejected %s", name)
		}
	}
	for _, name := range []string{"", "a..com", "-a.com", strings.Repeat("a", 64) + ".com", "a.com/x"} {
		if validDNSName(name) {
			t.Errorf("invalid DNS name accepted %s", name)
		}
	}
}
func TestTLSInspection(t *testing.T) {
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	now := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	template := &x509.Certificate{SerialNumber: big.NewInt(1), Subject: pkix.Name{CommonName: "example.com"}, DNSNames: []string{"example.com"}, NotBefore: now.Add(-time.Hour), NotAfter: now.Add(48 * time.Hour), KeyUsage: x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign, ExtKeyUsage: []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth}, IsCA: true, BasicConstraintsValid: true}
	der, err := x509.CreateCertificate(rand.Reader, template, template, &key.PublicKey, key)
	if err != nil {
		t.Fatal(err)
	}
	certificate, err := x509.ParseCertificate(der)
	if err != nil {
		t.Fatal(err)
	}
	roots := x509.NewCertPool()
	roots.AddCert(certificate)
	state := tls.ConnectionState{Version: tls.VersionTLS13, CipherSuite: tls.TLS_AES_128_GCM_SHA256, PeerCertificates: []*x509.Certificate{certificate}}
	report, err := inspectTLS(state, "example.com", now, roots)
	if err != nil || !report.ChainValid || !report.HostnameValid || !report.ValidNow || report.DaysRemaining != 2 || len(report.Certificates[0].Fingerprint) != 64 {
		t.Fatalf("unexpected report %+v, %v", report, err)
	}
	report, _ = inspectTLS(state, "wrong.example", now, roots)
	if report.HostnameValid || !report.ChainValid {
		t.Fatalf("hostname and trust must be independent %+v", report)
	}
	report, _ = inspectTLS(state, "example.com", now.Add(72*time.Hour), roots)
	if report.ValidNow || report.ChainValid {
		t.Fatalf("expired certificate accepted %+v", report)
	}
	report, _ = inspectTLS(state, "example.com", now, x509.NewCertPool())
	if report.ChainValid {
		t.Fatal("untrusted certificate accepted")
	}
}
func TestProxyMultipartPreservesBytesAndFields(t *testing.T) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	requestJSON, _ := json.Marshal(proxyRequest{URL: "https://example.com/upload", Method: "POST", Headers: map[string]string{"content-type": "incorrect", "Authorization": "Bearer test"}})
	writer.WriteField("request", string(requestJSON))
	writer.WriteField("fields", `[["tag","one"],["tag","two"]]`)
	writer.WriteField("fileFields", `["attachment"]`)
	fileHeaders := make(textproto.MIMEHeader)
	fileHeaders.Set("Content-Disposition", `form-data; name="files"; filename="image.bin"`)
	fileHeaders.Set("Content-Type", "image/png")
	part, _ := writer.CreatePart(fileHeaders)
	part.Write([]byte{0, 1, 2, 255})
	writer.Close()
	request := httptest.NewRequest("POST", "/api/proxy", &body)
	request.Header.Set("Content-Type", writer.FormDataContentType())
	input, reader, err := readProxyInput(httptest.NewRecorder(), request)
	if err != nil {
		t.Fatal(err)
	}
	if input.Headers["Authorization"] != "Bearer test" || input.Headers["content-type"] != "" {
		t.Fatalf("headers %+v", input.Headers)
	}
	outbound := httptest.NewRequest("POST", "https://example.com/upload", reader)
	outbound.Header.Set("Content-Type", input.Headers["Content-Type"])
	if err := outbound.ParseMultipartForm(1 << 20); err != nil {
		t.Fatal(err)
	}
	defer outbound.MultipartForm.RemoveAll()
	if strings.Join(outbound.MultipartForm.Value["tag"], ",") != "one,two" {
		t.Fatal("repeated fields lost")
	}
	file, header, err := outbound.FormFile("attachment")
	if err != nil {
		t.Fatal(err)
	}
	defer file.Close()
	data, _ := io.ReadAll(file)
	if header.Header.Get("Content-Type") != "image/png" || header.Filename != "image.bin" || !bytes.Equal(data, []byte{0, 1, 2, 255}) {
		t.Fatal("file changed")
	}
}
func TestReadProxyJSONRetainsRequest(t *testing.T) {
	request := httptest.NewRequest("POST", "/api/proxy", strings.NewReader(`{"url":"https://example.com","method":"POST","data":"abc"}`))
	input, body, err := readProxyInput(httptest.NewRecorder(), request)
	if err != nil || body != nil || input.URL != "https://example.com" || string(input.Data) != `"abc"` {
		t.Fatalf("request lost %+v %v", input, err)
	}
}

func TestProxyMultipartRejectsBodylessMethodsAfterTrimming(t *testing.T) {
	for _, method := range []string{"", " ", "GET", " get ", "HEAD", " HEAD "} {
		t.Run(method, func(t *testing.T) {
			var body bytes.Buffer
			writer := multipart.NewWriter(&body)
			requestJSON, _ := json.Marshal(proxyRequest{URL: "https://example.com/upload", Method: method})
			writer.WriteField("request", string(requestJSON))
			writer.WriteField("fields", `[["tag","one"]]`)
			writer.WriteField("fileFields", `[]`)
			writer.Close()
			request := httptest.NewRequest("POST", "/api/proxy", &body)
			request.Header.Set("Content-Type", writer.FormDataContentType())
			_, _, err := readProxyInput(httptest.NewRecorder(), request)
			if err == nil {
				t.Fatal("bodyless method accepted multipart data")
			}
		})
	}
}

func TestEventStreamMediaTypeAndStatus(t *testing.T) {
	for _, test := range []struct {
		contentType string
		status      int
		want        int
	}{
		{"text/event-stream", 200, 200},
		{"Text/Event-Stream; charset=utf-8", 200, 200},
		{"text/event-streamx", 200, 502},
		{"text/event-stream; invalid", 200, 502},
		{"text/plain", 200, 502},
		{"", 200, 502},
		{"text/event-stream", 302, 502},
		{"text/event-stream", 500, 502},
	} {
		t.Run(test.contentType+http.StatusText(test.status), func(t *testing.T) {
			body := "id: 1\rdata: hello\r\r"
			upstream := &http.Response{StatusCode: test.status, Header: http.Header{"Content-Type": {test.contentType}}, Body: io.NopCloser(strings.NewReader(body))}
			response := httptest.NewRecorder()
			writeEventStream(response, upstream)
			if response.Code != test.want {
				t.Fatalf("got status %d, want %d", response.Code, test.want)
			}
			if test.want == 200 && (response.Body.String() != body || !response.Flushed || response.Header().Get("X-Accel-Buffering") != "no") {
				t.Fatal("stream bytes or streaming headers lost")
			}
			if test.want != 200 && !strings.Contains(response.Body.String(), `"invalidStream"`) {
				t.Fatal("invalid stream was not reported")
			}
		})
	}
}

func TestEventStreamResponseLimit(t *testing.T) {
	upstream := &http.Response{StatusCode: 200, Header: http.Header{"Content-Type": {"text/event-stream"}}, Body: io.NopCloser(strings.NewReader(strings.Repeat("x", 2*1024*1024+1)))}
	response := httptest.NewRecorder()
	writeEventStream(response, upstream)
	if response.Body.Len() != 2*1024*1024 {
		t.Fatalf("stream response limit not enforced: %d", response.Body.Len())
	}
}

type diagnosticTransport func(*http.Request) (*http.Response, error)

func (call diagnosticTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	return call(request)
}
func TestDNSResponsePreservesStatusRecordsAndTTL(t *testing.T) {
	for _, resolver := range []string{"alidns", "cloudflare", "google"} {
		t.Run(resolver, func(t *testing.T) {
			previous := http.DefaultClient
			defer func() { http.DefaultClient = previous }()
			http.DefaultClient = &http.Client{Transport: diagnosticTransport(func(request *http.Request) (*http.Response, error) {
				if request.URL.Scheme+"://"+request.URL.Host+request.URL.Path != dnsResolvers[resolver] || request.URL.Query().Get("name") != "_acme-challenge.example.com" || request.URL.Query().Get("type") != "TXT" {
					t.Fatalf("unexpected upstream %s", request.URL)
				}
				return &http.Response{StatusCode: 200, Header: http.Header{}, Body: io.NopCloser(strings.NewReader(`{"Status":0,"Answer":[{"name":"_acme-challenge.example.com","type":16,"TTL":300,"data":"token"}]}`))}, nil
			})}
			request := httptest.NewRequest("POST", "/api/dns", strings.NewReader(`{"name":"_acme-challenge.example.com","type":"TXT","resolver":"`+resolver+`"}`))
			response := httptest.NewRecorder()
			dnsLookupHandler(response, request)
			if response.Code != 200 || !strings.Contains(response.Body.String(), `"TTL":300`) || !strings.Contains(response.Body.String(), `"resolver":"`+resolver+`"`) {
				t.Fatalf("invalid response %d %s", response.Code, response.Body.String())
			}
		})
	}
}
