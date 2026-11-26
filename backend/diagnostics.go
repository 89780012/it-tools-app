package main

import (
	"context"
	"crypto/rand"
	"crypto/x509"
	"errors"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"syscall"
	"time"
)

type requestIDKey struct{}

type observedResponse struct {
	http.ResponseWriter
	status int
}

func (w *observedResponse) Unwrap() http.ResponseWriter { return w.ResponseWriter }

func (w *observedResponse) WriteHeader(status int) {
	if status >= 100 && status < 200 {
		w.ResponseWriter.WriteHeader(status)
		return
	}
	if w.status == 0 {
		w.status = status
		w.ResponseWriter.WriteHeader(status)
	}
}

func (w *observedResponse) Write(data []byte) (int, error) {
	w.WriteHeader(http.StatusOK)
	return w.ResponseWriter.Write(data)
}

func (w *observedResponse) Flush() {
	w.WriteHeader(http.StatusOK)
	_ = http.NewResponseController(w.ResponseWriter).Flush()
}

func requestLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		id := rand.Text()
		w.Header().Set("X-Request-ID", id)
		r = r.WithContext(context.WithValue(r.Context(), requestIDKey{}, id))
		observed := &observedResponse{ResponseWriter: w}
		next.ServeHTTP(observed, r)
		if observed.status == 0 {
			observed.status = http.StatusOK
		}
		// Use fixed route names; never log query strings, bodies, or credentials.
		route := "/api/*"
		switch r.URL.Path {
		case "/api/health", "/api/proxy", "/api/dns", "/api/tls", "/api/stream", "/api/i18n-translate", "/api/detect-language", "/api/certificates/status", "/api/certificates/start", "/api/certificates/download":
			route = r.URL.Path
		}
		if route != "/api/health" || observed.status >= 400 {
			log.Printf("api_request request_id=%q method=%q route=%q status=%d duration_ms=%d", id, r.Method, route, observed.status, time.Since(start).Milliseconds())
		}
	})
}

func networkErrorKind(err error) string {
	var dnsError *net.DNSError
	var unknownAuthority x509.UnknownAuthorityError
	var certificateInvalid x509.CertificateInvalidError
	var hostnameError x509.HostnameError
	var netError net.Error
	switch {
	case err == nil:
		return "upstream_response"
	case errors.Is(err, context.Canceled):
		return "canceled"
	case errors.Is(err, context.DeadlineExceeded):
		return "timeout"
	case errors.As(err, &dnsError):
		return "dns"
	case errors.As(err, &unknownAuthority), errors.As(err, &certificateInvalid), errors.As(err, &hostnameError):
		return "tls_certificate"
	case errors.Is(err, syscall.ECONNRESET):
		return "connection_reset"
	case errors.Is(err, syscall.ECONNREFUSED):
		return "connection_refused"
	case errors.Is(err, syscall.ENETUNREACH), errors.Is(err, syscall.EHOSTUNREACH):
		return "network_unreachable"
	case errors.As(err, &netError) && netError.Timeout():
		return "timeout"
	case errors.Is(err, io.EOF), errors.Is(err, io.ErrUnexpectedEOF):
		return "unexpected_eof"
	default:
		return "upstream_error"
	}
}

func logUpstreamFailure(ctx context.Context, operation string, err error, status int) {
	id, _ := ctx.Value(requestIDKey{}).(string)
	log.Printf("upstream_failure request_id=%q operation=%q kind=%q upstream_status=%d", id, operation, networkErrorKind(err), status)
}

func upstreamErrorStatus(err error) int {
	if networkErrorKind(err) == "timeout" {
		return http.StatusGatewayTimeout
	}
	return http.StatusBadGateway
}

func requestTimeout(name string, fallback time.Duration) time.Duration {
	seconds, err := strconv.Atoi(os.Getenv(name))
	if err != nil || seconds < 1 || seconds > 120 {
		return fallback
	}
	return time.Duration(seconds) * time.Second
}
