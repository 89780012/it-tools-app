package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestStaticCachePolicy(t *testing.T) {
	root := t.TempDir()
	for _, name := range []string{"index.html", "zh/tools/json-formatter/index.html", "assets/index-AbCd1234.js", "assets/index-AbCd1234.css", "robots.txt", "sitemap.xml"} {
		filename := filepath.Join(root, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(filename), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filename, []byte("test content"), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	handler := spaHandler(newHandler(config{}), root)
	for _, test := range []struct {
		path  string
		html  bool
		cache string
	}{
		{path: "/", html: true, cache: "no-cache, max-age=0, must-revalidate"},
		{path: "/index.html", html: true, cache: "no-cache, max-age=0, must-revalidate"},
		{path: "/zh/tools/json-formatter", html: true, cache: "no-cache, max-age=0, must-revalidate"},
		{path: "/zh/tools/json-formatter?version=new", html: true, cache: "no-cache, max-age=0, must-revalidate"},
		{path: "/assets/index-AbCd1234.js", cache: "public, max-age=31536000, immutable"},
		{path: "/assets/index-AbCd1234.css", cache: "public, max-age=31536000, immutable"},
		{path: "/robots.txt", cache: "no-cache, max-age=0, must-revalidate"},
		{path: "/sitemap.xml", cache: "no-cache, max-age=0, must-revalidate"},
	} {
		t.Run(test.path, func(t *testing.T) {
			for _, method := range []string{http.MethodGet, http.MethodHead} {
				recorder := httptest.NewRecorder()
				handler.ServeHTTP(recorder, httptest.NewRequest(method, test.path, nil))
				if recorder.Code != http.StatusOK {
					t.Fatalf("%s: status = %d", method, recorder.Code)
				}
				if got := recorder.Header().Get("Cache-Control"); got != test.cache {
					t.Errorf("%s: Cache-Control = %q, want %q", method, got, test.cache)
				}
				wantCDN := ""
				if test.html {
					wantCDN = "no-store"
				}
				if got := recorder.Header().Get("CDN-Cache-Control"); got != wantCDN {
					t.Errorf("%s: CDN-Cache-Control = %q, want %q", method, got, wantCDN)
				}
				if test.html {
					request := httptest.NewRequest(method, test.path, nil)
					request.Header.Set("If-Modified-Since", recorder.Header().Get("Last-Modified"))
					conditional := httptest.NewRecorder()
					handler.ServeHTTP(conditional, request)
					if conditional.Code != http.StatusNotModified || conditional.Header().Get("Cache-Control") != test.cache || conditional.Header().Get("CDN-Cache-Control") != "no-store" {
						t.Errorf("%s: conditional HTML response lost cache policy: status=%d headers=%v", method, conditional.Code, conditional.Header())
					}
				}
			}
		})
	}

	missing := httptest.NewRecorder()
	handler.ServeHTTP(missing, httptest.NewRequest(http.MethodGet, "/assets/missing-AbCd1234.js", nil))
	if missing.Code != http.StatusNotFound || missing.Header().Get("Cache-Control") != "" {
		t.Fatalf("missing assets must not receive immutable cache policy: status=%d headers=%v", missing.Code, missing.Header())
	}
}
