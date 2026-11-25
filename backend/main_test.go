package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestHealth(t *testing.T) {
	handler := newHandler(config{allowedOrigins: map[string]struct{}{}})
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/api/health", nil)

	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
	var response map[string]string
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode health response: %v", err)
	}
	if response["status"] != "ok" || response["service"] != "it-tools-api" {
		t.Fatalf("unexpected health response: %#v", response)
	}
}

func TestProxyRejectsInvalidURL(t *testing.T) {
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/proxy", strings.NewReader(`{"url":"file:///etc/passwd","method":"GET"}`))
	request.Header.Set("Content-Type", "application/json")

	proxyHandler(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d; body: %s", recorder.Code, http.StatusBadRequest, recorder.Body.String())
	}
}

func TestTranslateUnavailableWithoutConfiguration(t *testing.T) {
	handler := translateHandler(config{})
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/i18n-translate", strings.NewReader(`{"sourceLanguage":"en","targetLanguage":"fr","entries":[]}`))
	request.Header.Set("Content-Type", "application/json")

	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d; body: %s", recorder.Code, http.StatusServiceUnavailable, recorder.Body.String())
	}
	var response map[string]string
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode error response: %v", err)
	}
	if !strings.Contains(response["error"], "not configured") {
		t.Fatalf("expected clear configuration error, got %#v", response)
	}
}

func TestProxyRejectsPrivateAndUnresolvableHostnames(t *testing.T) {
	for _, target := range []string{"http://127.0.0.1/", "http://192.168.1.2/", "http://does-not-exist.invalid/"} {
		t.Run(target, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			request := httptest.NewRequest(http.MethodPost, "/api/proxy", strings.NewReader(`{"url":"`+target+`"}`))
			proxyHandler(recorder, request)
			if recorder.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want %d; body: %s", recorder.Code, http.StatusBadRequest, recorder.Body.String())
			}
		})
	}
}

func TestCORSAllowsOnlyConfiguredOrigins(t *testing.T) {
	handler := newHandler(config{allowedOrigins: map[string]struct{}{"https://example.test": {}}})

	allowed := httptest.NewRecorder()
	allowedRequest := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	allowedRequest.Header.Set("Origin", "https://example.test")
	handler.ServeHTTP(allowed, allowedRequest)
	if allowed.Code != http.StatusOK || allowed.Header().Get("Access-Control-Allow-Origin") != "https://example.test" {
		t.Fatalf("configured origin was not allowed: status=%d header=%q", allowed.Code, allowed.Header().Get("Access-Control-Allow-Origin"))
	}

	blocked := httptest.NewRecorder()
	blockedRequest := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	blockedRequest.Header.Set("Origin", "https://attacker.test")
	handler.ServeHTTP(blocked, blockedRequest)
	if blocked.Code != http.StatusForbidden {
		t.Fatalf("unconfigured origin status = %d, want %d", blocked.Code, http.StatusForbidden)
	}
}

func TestSPAHandlerServesStaticAndFallbackRoutes(t *testing.T) {
	root := t.TempDir()
	if err := os.MkdirAll(filepath.Join(root, "zh", "tools", "json-formatter"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "index.html"), []byte("SPA entry"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "zh", "tools", "json-formatter", "index.html"), []byte("localized static SEO entry"), 0o644); err != nil {
		t.Fatal(err)
	}
	handler := spaHandler(newHandler(config{allowedOrigins: map[string]struct{}{}}), root)

	for _, test := range []struct {
		path string
		want string
	}{
		{path: "/zh/tools/json-formatter", want: "localized static SEO entry"},
		{path: "/client-side-route", want: "SPA entry"},
	} {
		recorder := httptest.NewRecorder()
		handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, test.path, nil))
		if recorder.Code != http.StatusOK || !strings.Contains(recorder.Body.String(), test.want) {
			t.Errorf("GET %s: status=%d body=%q", test.path, recorder.Code, recorder.Body.String())
		}
	}

	api := httptest.NewRecorder()
	handler.ServeHTTP(api, httptest.NewRequest(http.MethodGet, "/api/health", nil))
	if api.Code != http.StatusOK || !strings.Contains(api.Body.String(), "it-tools-api") {
		t.Fatalf("API route did not reach Go handler: status=%d body=%q", api.Code, api.Body.String())
	}
}
