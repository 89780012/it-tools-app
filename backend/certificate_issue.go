package main

import (
	"archive/zip"
	"bytes"
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/mail"
	"net/url"
	"os"
	"regexp"
	"slices"
	"strings"
	"sync"
	"time"
)

const certificateSessionTTL = 30 * time.Minute

var certificateLabel = regexp.MustCompile(`^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$`)
var certificateTLD = regexp.MustCompile(`[a-z]`)

func normalizeCertificateNames(names []string) ([]string, bool) {
	if len(names) < 1 || len(names) > 20 {
		return nil, false
	}
	seen := make(map[string]bool)
	result := make([]string, 0, len(names))
	for _, raw := range names {
		name := strings.TrimSuffix(strings.ToLower(strings.TrimSpace(raw)), ".")
		host := strings.TrimPrefix(name, "*.")
		labels := strings.Split(host, ".")
		tld := labels[len(labels)-1]
		if len(host) > 253 || len(labels) < 2 || !certificateTLD.MatchString(tld) || slices.Contains([]string{"localhost", "local", "test", "invalid", "example", "internal", "onion"}, tld) {
			return nil, false
		}
		for _, label := range labels {
			if !certificateLabel.MatchString(label) {
				return nil, false
			}
		}
		if !seen[name] {
			result = append(result, name)
			seen[name] = true
		}
	}
	return result, true
}

type certificateSession struct {
	order       certificateOrder
	records     []certificateRecord
	domains     []string
	key         *ecdsa.PrivateKey
	csr         []byte
	zip         []byte
	expires     time.Time
	nextAttempt time.Time
	busy        bool
}

type certificateService struct {
	authority  certificateAuthority
	lookupTXT  func(context.Context, string) ([]string, error)
	origin     string
	accessHash [32]byte
	staging    bool
	mu         sync.Mutex
	sessions   map[[32]byte]*certificateSession
	slots      chan struct{}
	nextStart  time.Time
}

func certificateServiceFromEnv() *certificateService {
	if os.Getenv("CERTIFICATE_ISSUANCE_ENABLED") != "true" {
		return nil
	}
	origin := strings.TrimSpace(os.Getenv("CERTIFICATE_ORIGIN"))
	u, err := url.Parse(origin)
	secureOrigin := err == nil && u.Hostname() != "" && u.User == nil && origin == u.Scheme+"://"+u.Host &&
		(u.Scheme == "https" || (u.Scheme == "http" && slices.Contains([]string{"localhost", "127.0.0.1", "::1"}, u.Hostname())))
	access := strings.TrimSpace(os.Getenv("CERTIFICATE_ACCESS_TOKEN"))
	email := strings.TrimSpace(os.Getenv("CERTIFICATE_ACME_EMAIL"))
	address, emailErr := mail.ParseAddress(email)
	key, keyErr := readACMEAccountKey(strings.TrimSpace(os.Getenv("CERTIFICATE_ACME_KEY_BASE64")))
	mode := os.Getenv("CERTIFICATE_ACME_ENV")
	if !secureOrigin || len(access) < 32 || len(access) > 256 || emailErr != nil || address.Address != email || keyErr != nil || (mode != "production" && mode != "staging") || os.Getenv("CERTIFICATE_ACME_ACCEPT_TOS") != "true" {
		log.Print("certificate issuance disabled: invalid or incomplete CERTIFICATE_* configuration")
		return nil
	}
	staging := mode == "staging"
	authority := newLetsEncryptAuthority(key, email, staging)
	return &certificateService{authority: authority, lookupTXT: authority.lookupTXT, origin: origin, accessHash: sha256.Sum256([]byte(access)), staging: staging, sessions: make(map[[32]byte]*certificateSession), slots: make(chan struct{}, 2)}
}

func certificateError(w http.ResponseWriter, status int, code string) {
	writeJSON(w, status, map[string]string{"error": code})
}

func certificateNoStore(w http.ResponseWriter) {
	w.Header().Set("Cache-Control", "no-store, private")
	w.Header().Set("CDN-Cache-Control", "no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
}

func registerCertificateRoutes(mux *http.ServeMux, service *certificateService) {
	mux.HandleFunc("GET /api/certificates/status", func(w http.ResponseWriter, r *http.Request) {
		certificateNoStore(w)
		enabled := service != nil && r.Header.Get("Sec-Fetch-Site") != "cross-site"
		writeJSON(w, http.StatusOK, map[string]bool{"enabled": enabled, "staging": enabled && service.staging})
	})
	for _, endpoint := range []string{"start", "download"} {
		mux.HandleFunc("POST /api/certificates/"+endpoint, func(w http.ResponseWriter, r *http.Request) {
			certificateNoStore(w)
			if service == nil {
				certificateError(w, http.StatusServiceUnavailable, "disabled")
				return
			}
			if r.Header.Get("Origin") != service.origin {
				certificateError(w, http.StatusForbidden, "origin")
				return
			}
			if endpoint == "start" {
				service.start(w, r)
			} else {
				service.download(w, r)
			}
		})
	}
}

func (s *certificateService) acquire(w http.ResponseWriter) bool {
	select {
	case s.slots <- struct{}{}:
		return true
	default:
		certificateError(w, http.StatusTooManyRequests, "busy")
		return false
	}
}

func randomCertificateToken() (string, error) {
	var data [32]byte
	if _, err := rand.Read(data[:]); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(data[:]), nil
}

func (s *certificateService) start(w http.ResponseWriter, r *http.Request) {
	access, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
	if !ok || !constantCertificateToken(s.accessHash, access) {
		certificateError(w, http.StatusUnauthorized, "access")
		return
	}
	var input struct {
		Domains []string `json:"domains"`
	}
	_ = http.NewResponseController(w).SetReadDeadline(time.Now().Add(5 * time.Second))
	defer http.NewResponseController(w).SetReadDeadline(time.Time{})
	r.Body = http.MaxBytesReader(w, r.Body, 8192)
	if decodeJSON(w, r, &input) != nil {
		certificateError(w, http.StatusBadRequest, "invalid")
		return
	}
	domains, ok := normalizeCertificateNames(input.Domains)
	if !ok {
		certificateError(w, http.StatusBadRequest, "invalid")
		return
	}
	if !s.acquire(w) {
		return
	}
	defer func() { <-s.slots }()
	s.mu.Lock()
	if len(s.sessions) >= 32 || time.Now().Before(s.nextStart) {
		s.mu.Unlock()
		certificateError(w, http.StatusTooManyRequests, "busy")
		return
	}
	s.nextStart = time.Now().Add(10 * time.Second)
	s.mu.Unlock()
	ctx, cancel := context.WithTimeout(r.Context(), 35*time.Second)
	defer cancel()
	order, err := s.authority.start(ctx, domains)
	if err != nil {
		certificateError(w, http.StatusBadGateway, "upstream")
		return
	}
	records := make([]certificateRecord, 0, len(order.challenges)+len(domains))
	covered := map[string]bool{}
	for _, item := range order.challenges {
		records = append(records, item.record)
	}
	// Require a fresh per-order proof even if the CA reuses an authorization
	// or a pending ACME challenge from a different session.
	for _, domain := range domains {
		name := "_acme-challenge." + strings.TrimPrefix(domain, "*.")
		if covered[name] {
			continue
		}
		value, err := randomCertificateToken()
		if err != nil {
			certificateError(w, http.StatusInternalServerError, "upstream")
			return
		}
		records = append(records, certificateRecord{name, value})
		covered[name] = true
	}
	token, err := randomCertificateToken()
	if err != nil {
		certificateError(w, http.StatusInternalServerError, "upstream")
		return
	}
	expires := time.Now().Add(certificateSessionTTL)
	if !order.expires.IsZero() && order.expires.Before(expires) {
		expires = order.expires
	}
	if !time.Now().Before(expires) {
		certificateError(w, http.StatusBadGateway, "upstream")
		return
	}
	id := sha256.Sum256([]byte(token))
	entry := &certificateSession{order: order, records: records, domains: domains, expires: expires}
	s.mu.Lock()
	// An order may take long enough for a concurrent start to finish first.
	if len(s.sessions) >= 32 {
		s.mu.Unlock()
		certificateError(w, http.StatusTooManyRequests, "busy")
		return
	}
	s.sessions[id] = entry
	s.mu.Unlock()
	time.AfterFunc(time.Until(expires), func() { s.mu.Lock(); delete(s.sessions, id); s.mu.Unlock() })
	writeJSON(w, http.StatusCreated, map[string]any{"token": token, "records": records, "expires": expires, "staging": s.staging})
}

func constantCertificateToken(hash [32]byte, candidate string) bool {
	actual := sha256.Sum256([]byte(candidate))
	return subtle.ConstantTimeCompare(hash[:], actual[:]) == 1
}

func (s *certificateService) download(w http.ResponseWriter, r *http.Request) {
	token, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
	if !ok || len(token) != 43 {
		certificateError(w, http.StatusNotFound, "expired")
		return
	}
	id := sha256.Sum256([]byte(token))
	s.mu.Lock()
	entry := s.sessions[id]
	if entry == nil || !time.Now().Before(entry.expires) {
		s.mu.Unlock()
		certificateError(w, http.StatusNotFound, "expired")
		return
	}
	if entry.busy {
		s.mu.Unlock()
		certificateError(w, http.StatusTooManyRequests, "busy")
		return
	}
	if entry.zip != nil {
		archived := entry.zip
		s.mu.Unlock()
		writeCertificateZIP(w, archived)
		return
	}
	if time.Now().Before(entry.nextAttempt) {
		s.mu.Unlock()
		certificateError(w, http.StatusTooManyRequests, "busy")
		return
	}
	if !s.acquire(w) {
		s.mu.Unlock()
		return
	}
	entry.busy = true
	entry.nextAttempt = time.Now().Add(5 * time.Second)
	s.mu.Unlock()
	defer func() { s.mu.Lock(); entry.busy = false; s.mu.Unlock(); <-s.slots }()
	ctx, cancel := context.WithDeadline(r.Context(), minTime(entry.expires, time.Now().Add(40*time.Second)))
	defer cancel()
	dnsCtx, stopDNS := context.WithTimeout(ctx, 6*time.Second)
	err := checkCertificateRecords(dnsCtx, s.lookupTXT, entry.records)
	stopDNS()
	if err != nil {
		certificateError(w, http.StatusConflict, "dns")
		return
	}
	if entry.key == nil {
		key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
		if err != nil {
			certificateError(w, http.StatusInternalServerError, "upstream")
			return
		}
		csr, err := x509.CreateCertificateRequest(rand.Reader, &x509.CertificateRequest{DNSNames: entry.domains}, key)
		if err != nil {
			certificateError(w, http.StatusInternalServerError, "upstream")
			return
		}
		entry.key, entry.csr = key, csr
	}
	chain, err := s.authority.issue(ctx, entry.order, entry.csr)
	if errors.Is(err, errCertificateRejected) {
		s.mu.Lock()
		delete(s.sessions, id)
		s.mu.Unlock()
		certificateError(w, http.StatusUnprocessableEntity, "rejected")
		return
	}
	if err != nil {
		certificateError(w, http.StatusBadGateway, "upstream")
		return
	}
	archived, err := makeCertificateZIP(entry, chain, s.staging)
	if err != nil {
		certificateError(w, http.StatusBadGateway, "upstream")
		return
	}
	s.mu.Lock()
	if !time.Now().Before(entry.expires) {
		s.mu.Unlock()
		certificateError(w, http.StatusNotFound, "expired")
		return
	}
	entry.zip, entry.key, entry.csr = archived, nil, nil
	s.mu.Unlock()
	writeCertificateZIP(w, archived)
}

func minTime(a, b time.Time) time.Time {
	if a.Before(b) {
		return a
	}
	return b
}

func makeCertificateZIP(entry *certificateSession, chain [][]byte, staging bool) ([]byte, error) {
	if len(chain) < 2 || len(chain) > 10 {
		return nil, errors.New("incomplete certificate chain")
	}
	leaf, err := x509.ParseCertificate(chain[0])
	if err != nil {
		return nil, err
	}
	key, ok := leaf.PublicKey.(*ecdsa.PublicKey)
	want, got := slices.Clone(entry.domains), slices.Clone(leaf.DNSNames)
	slices.Sort(want)
	slices.Sort(got)
	now := time.Now()
	if !ok || !key.Equal(&entry.key.PublicKey) || !slices.Equal(want, got) || leaf.IsCA || now.Before(leaf.NotBefore) || !now.Before(leaf.NotAfter) {
		return nil, errors.New("issued certificate mismatch")
	}
	intermediates := x509.NewCertPool()
	var fullchain bytes.Buffer
	for i, der := range chain {
		if i > 0 {
			cert, err := x509.ParseCertificate(der)
			if err != nil {
				return nil, err
			}
			intermediates.AddCert(cert)
		}
		if err := pem.Encode(&fullchain, &pem.Block{Type: "CERTIFICATE", Bytes: der}); err != nil {
			return nil, err
		}
	}
	if !staging {
		if _, err := leaf.Verify(x509.VerifyOptions{Intermediates: intermediates}); err != nil {
			return nil, err
		}
	}
	keyBytes, err := x509.MarshalPKCS8PrivateKey(entry.key)
	if err != nil {
		return nil, err
	}
	folder := strings.Replace(entry.domains[0], "*.", "wildcard-", 1)
	if len(folder) > 240 {
		folder = fmt.Sprintf("cert-%x", sha256.Sum256([]byte(entry.domains[0])))
	}
	directory := "/etc/nginx/ssl/" + folder
	hint := "# Add these directives inside the existing HTTPS server block.\n"
	if staging {
		hint = "# TEST ONLY: staging certificates are NOT publicly trusted.\n" + hint
	}
	hint += fmt.Sprintf("# Keep privkey.pem private (chmod 600); validate with nginx -t before reload.\n# Not automatically renewed. Expires: %s\nssl_certificate %s/fullchain.pem;\nssl_certificate_key %s/privkey.pem;\n", leaf.NotAfter.UTC().Format(time.RFC3339), directory, directory)
	var buffer bytes.Buffer
	archive := zip.NewWriter(&buffer)
	for _, file := range []struct {
		name string
		mode os.FileMode
		data []byte
	}{
		{"fullchain.pem", 0644, fullchain.Bytes()},
		{"privkey.pem", 0600, pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: keyBytes})},
		{"nginx.conf", 0644, []byte(hint)},
	} {
		header := &zip.FileHeader{Name: file.name, Method: zip.Deflate}
		header.SetMode(file.mode)
		target, err := archive.CreateHeader(header)
		if err != nil {
			return nil, err
		}
		if _, err := target.Write(file.data); err != nil {
			return nil, err
		}
	}
	if err := archive.Close(); err != nil {
		return nil, err
	}
	return buffer.Bytes(), nil
}

func writeCertificateZIP(w http.ResponseWriter, data []byte) {
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", `attachment; filename="nginx-certificate.zip"`)
	w.Header().Set("Content-Length", fmt.Sprint(len(data)))
	_, _ = w.Write(data)
}
