package main

import (
	"bytes"
	"context"
	"crypto/x509"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"syscall"
	"testing"
	"time"
)

func TestRequestLogsCorrelateFailuresWithoutCredentials(t *testing.T) {
	var logs bytes.Buffer
	previous := log.Writer()
	log.SetOutput(&logs)
	defer log.SetOutput(previous)
	handler := requestLogging(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		logUpstreamFailure(r.Context(), "proxy_request", &url.Error{Op: "Get", URL: "https://user:secret@example.com/?key=private", Err: syscall.ECONNRESET}, 0)
		w.WriteHeader(http.StatusBadGateway)
		_, _ = w.Write([]byte("failed"))
	}))
	r := httptest.NewRequest("POST", "/api/proxy?key=private", strings.NewReader("private body"))
	r.Header.Set("Authorization", "Bearer secret")
	r.Header.Set("X-Request-ID", "untrusted")
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, r)
	id := w.Header().Get("X-Request-ID")
	if id == "" || id == "untrusted" || strings.Count(logs.String(), id) != 2 || !strings.Contains(logs.String(), "connection_reset") || !strings.Contains(logs.String(), "status=502") {
		t.Fatalf("missing correlated diagnostics: %s", logs.String())
	}
	for _, forbidden := range []string{"secret", "private", "example.com", "Authorization", "untrusted"} {
		if strings.Contains(logs.String(), forbidden) {
			t.Fatalf("logs contain %s", forbidden)
		}
	}
}

func TestRequestLoggingPreservesStreamingFlush(t *testing.T) {
	firstChunk := "data: ready\n\n"
	release := make(chan struct{})
	server := httptest.NewServer(requestLogging(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		_, _ = io.WriteString(w, firstChunk)
		w.(http.Flusher).Flush()
		select {
		case <-release:
		case <-r.Context().Done():
		}
	})))
	defer server.Close()
	defer close(release)
	client := &http.Client{Timeout: 2 * time.Second}
	response, err := client.Get(server.URL + "/api/stream")
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	body := make([]byte, len(firstChunk))
	if _, err := io.ReadFull(response.Body, body); err != nil || string(body) != firstChunk {
		t.Fatalf("stream was buffered: %q, %v", body, err)
	}
}

func TestNetworkFailureClassification(t *testing.T) {
	for _, test := range []struct {
		err  error
		kind string
	}{
		{context.DeadlineExceeded, "timeout"},
		{context.Canceled, "canceled"},
		{&net.DNSError{Err: "no such host"}, "dns"},
		{x509.UnknownAuthorityError{}, "tls_certificate"},
		{fmt.Errorf("wrapped: %w", syscall.ECONNRESET), "connection_reset"},
		{syscall.ECONNREFUSED, "connection_refused"},
		{syscall.ENETUNREACH, "network_unreachable"},
		{io.ErrUnexpectedEOF, "unexpected_eof"},
	} {
		if got := networkErrorKind(test.err); got != test.kind {
			t.Errorf("got %s, want %s", got, test.kind)
		}
	}
}

func TestPublicSiteOriginsAndPreflight(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://www.toolkitpub.com,https://toolkitpub.com")
	handler := newHandler(configFromEnv())
	for _, origin := range []string{"https://www.toolkitpub.com", "https://toolkitpub.com"} {
		request := httptest.NewRequest("OPTIONS", "/api/proxy", nil)
		request.Header.Set("Origin", origin)
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, request)
		if response.Code != 204 || response.Header().Get("Access-Control-Allow-Origin") != origin || response.Header().Get("X-Request-ID") == "" {
			t.Fatalf("origin %s failed: status=%d", origin, response.Code)
		}
	}
}

func TestAIRequestUsesIndependentDeadline(t *testing.T) {
	t.Setenv("AI_TIMEOUT_SECONDS", "1")
	t.Setenv("PROXY_TIMEOUT_SECONDS", "30")
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = io.Copy(io.Discard, r.Body)
		<-r.Context().Done()
	}))
	defer server.Close()
	_, status, err := callChatCompletion(context.Background(), config{translateURL: server.URL, translateModel: "test"}, "test", "test")
	if status != http.StatusGatewayTimeout || networkErrorKind(err) != "timeout" {
		t.Fatalf("unexpected timeout: status=%d err=%v", status, err)
	}
}
