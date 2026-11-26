package main

import (
	"context"
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"
)

var dnsLabel = regexp.MustCompile(`^[a-zA-Z0-9_](?:[a-zA-Z0-9_-]{0,61}[a-zA-Z0-9_])?$`)

func validDNSName(name string) bool {
	if len(name) == 0 || len(name) > 253 {
		return false
	}
	for _, label := range strings.Split(strings.TrimSuffix(name, "."), ".") {
		if !dnsLabel.MatchString(label) {
			return false
		}
	}
	return true
}

var dnsResolvers = map[string]string{"cloudflare": "https://cloudflare-dns.com/dns-query", "google": "https://dns.google/resolve"}
var dnsTypes = map[string]bool{"A": true, "AAAA": true, "CNAME": true, "MX": true, "TXT": true, "NS": true, "CAA": true}

func dnsLookupHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name     string `json:"name"`
		Type     string `json:"type"`
		Resolver string `json:"resolver"`
	}
	if err := decodeJSON(w, r, &input); err != nil {
		writeInputError(w, err)
		return
	}
	input.Name = strings.TrimSpace(input.Name)
	endpoint, ok := dnsResolvers[input.Resolver]
	if !ok || !dnsTypes[input.Type] || !validDNSName(input.Name) {
		writeJSON(w, 400, map[string]string{"error": "invalid"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	request, _ := http.NewRequestWithContext(ctx, "GET", endpoint+"?"+url.Values{"name": {input.Name}, "type": {input.Type}}.Encode(), nil)
	request.Header.Set("Accept", "application/dns-json")
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		writeJSON(w, 502, map[string]string{"error": "networkFailed"})
		return
	}
	defer response.Body.Close()
	body, err := io.ReadAll(io.LimitReader(response.Body, 128*1024+1))
	if err != nil || response.StatusCode != 200 || len(body) > 128*1024 || !json.Valid(body) {
		writeJSON(w, 502, map[string]string{"error": "networkFailed"})
		return
	}
	var result struct {
		Status    int               `json:"Status"`
		Answer    []json.RawMessage `json:"Answer"`
		Authority []json.RawMessage `json:"Authority"`
	}
	if json.Unmarshal(body, &result) != nil {
		writeJSON(w, 502, map[string]string{"error": "networkFailed"})
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, 200, map[string]any{"resolver": input.Resolver, "status": result.Status, "answers": result.Answer, "authority": result.Authority, "checkedAt": time.Now().UTC()})
}

type certificateReport struct {
	Subject     string    `json:"subject"`
	Issuer      string    `json:"issuer"`
	DNSNames    []string  `json:"dnsNames"`
	NotBefore   time.Time `json:"notBefore"`
	NotAfter    time.Time `json:"notAfter"`
	Fingerprint string    `json:"fingerprint"`
}
type tlsReport struct {
	Host          string              `json:"host"`
	Version       string              `json:"version"`
	Cipher        string              `json:"cipher"`
	HostnameValid bool                `json:"hostnameValid"`
	ChainValid    bool                `json:"chainValid"`
	ValidNow      bool                `json:"validNow"`
	DaysRemaining int                 `json:"daysRemaining"`
	ChainError    string              `json:"chainError,omitempty"`
	Certificates  []certificateReport `json:"certificates"`
	CheckedAt     time.Time           `json:"checkedAt"`
}

func inspectTLS(state tls.ConnectionState, host string, now time.Time, roots *x509.CertPool) (tlsReport, error) {
	result := tlsReport{Host: host, Version: tls.VersionName(state.Version), Cipher: tls.CipherSuiteName(state.CipherSuite), CheckedAt: now}
	if len(state.PeerCertificates) == 0 {
		return result, errors.New("missing certificate")
	}
	leaf := state.PeerCertificates[0]
	result.HostnameValid = leaf.VerifyHostname(host) == nil
	result.ValidNow = !now.Before(leaf.NotBefore) && !now.After(leaf.NotAfter)
	result.DaysRemaining = int(leaf.NotAfter.Sub(now).Hours() / 24)
	intermediates := x509.NewCertPool()
	for _, certificate := range state.PeerCertificates[1:] {
		intermediates.AddCert(certificate)
	}
	_, err := leaf.Verify(x509.VerifyOptions{Roots: roots, Intermediates: intermediates, CurrentTime: now})
	result.ChainValid = err == nil
	if err != nil {
		result.ChainError = err.Error()
	}
	for _, certificate := range state.PeerCertificates {
		digest := sha256.Sum256(certificate.Raw)
		result.Certificates = append(result.Certificates, certificateReport{Subject: certificate.Subject.String(), Issuer: certificate.Issuer.String(), DNSNames: certificate.DNSNames, NotBefore: certificate.NotBefore, NotAfter: certificate.NotAfter, Fingerprint: hex.EncodeToString(digest[:])})
	}
	return result, nil
}
func tlsCheckHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Host string `json:"host"`
	}
	if err := decodeJSON(w, r, &input); err != nil {
		writeInputError(w, err)
		return
	}
	host := strings.TrimSuffix(strings.TrimSpace(input.Host), ".")
	if !validDNSName(host) || net.ParseIP(host) != nil {
		writeJSON(w, 400, map[string]string{"error": "invalid"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	ips, err := resolvePublicHost(ctx, host)
	if err != nil {
		writeJSON(w, 400, map[string]string{"error": "publicHost"})
		return
	}
	var connection net.Conn
	for _, ip := range ips {
		connection, err = (&net.Dialer{}).DialContext(ctx, "tcp", net.JoinHostPort(ip.String(), "443"))
		if err == nil {
			break
		}
	}
	if err != nil {
		writeJSON(w, 502, map[string]string{"error": "networkFailed"})
		return
	}
	defer connection.Close()
	// Collect invalid/expired chains for diagnosis, then explicitly verify below.
	secured := tls.Client(connection, &tls.Config{ServerName: host, InsecureSkipVerify: true, MinVersion: tls.VersionTLS10})
	if err = secured.HandshakeContext(ctx); err != nil {
		writeJSON(w, 502, map[string]string{"error": "networkFailed"})
		return
	}
	result, err := inspectTLS(secured.ConnectionState(), host, time.Now().UTC(), nil)
	if err != nil {
		writeJSON(w, 502, map[string]string{"error": "networkFailed"})
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, 200, result)
}

func publicTransport() *http.Transport {
	return &http.Transport{Proxy: nil, DialContext: func(ctx context.Context, network, address string) (net.Conn, error) {
		host, port, err := net.SplitHostPort(address)
		if err != nil {
			return nil, err
		}
		ips, err := resolvePublicHost(ctx, host)
		if err != nil {
			return nil, err
		}
		var lastErr error
		for _, ip := range ips {
			connection, err := (&net.Dialer{}).DialContext(ctx, network, net.JoinHostPort(ip.String(), port))
			if err == nil {
				return connection, nil
			}
			lastErr = err
		}
		return nil, lastErr
	}}
}
func streamHandler(w http.ResponseWriter, r *http.Request) {
	var input proxyRequest
	if err := decodeJSON(w, r, &input); err != nil {
		writeInputError(w, err)
		return
	}
	target, err := url.ParseRequestURI(input.URL)
	if err != nil || target.Host == "" || target.User != nil || (target.Scheme != "http" && target.Scheme != "https") {
		writeJSON(w, 400, map[string]string{"error": "invalid"})
		return
	}
	if input.Method != "GET" && input.Method != "POST" {
		writeJSON(w, 400, map[string]string{"error": "invalid"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 60*time.Second)
	defer cancel()
	if _, err := resolvePublicHost(ctx, target.Hostname()); err != nil {
		writeJSON(w, 400, map[string]string{"error": "publicHost"})
		return
	}
	var body string
	if len(input.Data) != 0 && string(input.Data) != "null" && json.Unmarshal(input.Data, &body) != nil {
		writeJSON(w, 400, map[string]string{"error": "invalid"})
		return
	}
	request, err := http.NewRequestWithContext(ctx, input.Method, target.String(), strings.NewReader(body))
	if err != nil {
		writeJSON(w, 400, map[string]string{"error": "invalid"})
		return
	}
	for name, value := range input.Headers {
		if !isHopByHopHeader(name) && !strings.EqualFold(name, "Host") {
			request.Header.Set(name, value)
		}
	}
	request.Header.Set("Accept", "text/event-stream")
	transport := publicTransport()
	defer transport.CloseIdleConnections()
	// Redirects are exposed to the user so custom credentials never cross origins.
	client := &http.Client{Transport: transport, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return http.ErrUseLastResponse }}
	response, err := client.Do(request)
	if err != nil {
		writeJSON(w, 502, map[string]string{"error": "networkFailed"})
		return
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 || !strings.HasPrefix(strings.ToLower(response.Header.Get("Content-Type")), "text/event-stream") {
		writeJSON(w, 502, map[string]string{"error": "invalidStream"})
		return
	}
	w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Accel-Buffering", "no")
	flusher, ok := w.(http.Flusher)
	if !ok {
		writeJSON(w, 500, map[string]string{"error": "networkFailed"})
		return
	}
	flusher.Flush()
	buffer := make([]byte, 16*1024)
	reader := io.LimitReader(response.Body, 2*1024*1024)
	for {
		count, err := reader.Read(buffer)
		if count > 0 {
			if _, writeErr := w.Write(buffer[:count]); writeErr != nil {
				return
			}
			flusher.Flush()
		}
		if err != nil {
			return
		}
	}
}
