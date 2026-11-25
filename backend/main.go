package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/netip"
	"net/textproto"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

const (
	maxRequestBytes  = 1 << 20
	maxProxyBody     = 2 << 20
	maxAIResponse    = 1 << 20
	outboundTimeout  = 15 * time.Second
	defaultAllowList = "http://localhost:5173"
)

type config struct {
	allowedOrigins map[string]struct{}
	translateURL   string
	translateKey   string
	translateModel string
}

func configFromEnv() config {
	origins := strings.Split(os.Getenv("ALLOWED_ORIGINS"), ",")
	if strings.TrimSpace(os.Getenv("ALLOWED_ORIGINS")) == "" {
		origins = []string{defaultAllowList}
	}
	allowed := make(map[string]struct{}, len(origins))
	for _, origin := range origins {
		if origin = strings.TrimSpace(origin); origin != "" {
			allowed[origin] = struct{}{}
		}
	}
	return config{
		allowedOrigins: allowed,
		translateURL:   strings.TrimSpace(os.Getenv("I18N_TRANSLATE_API_URL")),
		translateKey:   strings.TrimSpace(os.Getenv("I18N_TRANSLATE_API_KEY")),
		translateModel: strings.TrimSpace(os.Getenv("I18N_TRANSLATE_API_MODEL")),
	}
}

func main() {
	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		port = "8080"
	}
	if _, err := strconv.Atoi(port); err != nil {
		log.Fatalf("invalid PORT %q: must be a port number", port)
	}

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           spaHandler(newHandler(configFromEnv()), resolveWebDir()),
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Printf("IT Tools API listening on %s", server.Addr)
	log.Fatal(server.ListenAndServe())

}
func resolveWebDir() string {
	if configured := strings.TrimSpace(os.Getenv("WEB_DIST_DIR")); configured != "" {
		return configured
	}
	for _, candidate := range []string{"dist", "../dist"} {
		info, err := os.Stat(filepath.Join(candidate, "index.html"))
		if err == nil && !info.IsDir() {
			return candidate
		}
	}
	return ""
}

func spaHandler(api http.Handler, webDir string) http.Handler {
	if webDir == "" {
		return api
	}
	root, err := filepath.Abs(webDir)
	if err != nil {
		return api
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api" || strings.HasPrefix(r.URL.Path, "/api/") {
			api.ServeHTTP(w, r)
			return
		}
		if r.URL.Path != "/" && strings.HasSuffix(r.URL.Path, "/") {
			destination := strings.TrimRight(r.URL.Path, "/")
			if r.URL.RawQuery != "" {
				destination += "?" + r.URL.RawQuery
			}
			http.Redirect(w, r, destination, http.StatusPermanentRedirect)
			return
		}
		if r.URL.Path == "/en" || strings.HasPrefix(r.URL.Path, "/en/") {
			destination := strings.TrimPrefix(r.URL.Path, "/en")
			if destination == "" {
				destination = "/"
			}
			if r.URL.RawQuery != "" {
				destination += "?" + r.URL.RawQuery
			}
			http.Redirect(w, r, destination, http.StatusTemporaryRedirect)
			return
		}
		relative := strings.TrimPrefix(path.Clean("/"+r.URL.Path), "/")
		target := filepath.Join(root, filepath.FromSlash(relative))
		if info, statErr := os.Stat(target); statErr == nil && info.IsDir() {
			target = filepath.Join(target, "index.html")
		}
		file, openErr := os.Open(target)
		if openErr != nil {
			http.NotFound(w, r)
			return
		}
		defer file.Close()
		info, statErr := file.Stat()
		if statErr != nil || info.IsDir() {
			http.NotFound(w, r)
			return
		}
		http.ServeContent(w, r, info.Name(), info.ModTime(), file)
	})
}
func newHandler(cfg config) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", healthHandler)
	mux.HandleFunc("POST /api/proxy", proxyHandler)
	mux.HandleFunc("POST /api/i18n-translate", translateHandler(cfg))
	mux.HandleFunc("POST /api/detect-language", detectLanguageHandler(cfg))
	return corsMiddleware(cfg.allowedOrigins, mux)
}

func corsMiddleware(allowed map[string]struct{}, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			if _, ok := allowed[origin]; !ok {
				http.Error(w, "origin is not allowed", http.StatusForbidden)
				return
			}
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		}
		if r.Method == http.MethodOptions {
			if origin == "" {
				http.Error(w, "origin is required", http.StatusForbidden)
				return
			}
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func healthHandler(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "it-tools-api",
	})
}

type proxyRequest struct {
	URL     string            `json:"url"`
	Method  string            `json:"method"`
	Headers map[string]string `json:"headers"`
	Data    json.RawMessage   `json:"data"`
}

type proxyResponse struct {
	Status     int               `json:"status"`
	StatusText string            `json:"statusText"`
	Headers    map[string]string `json:"headers"`
	Body       string            `json:"body"`
}

func proxyHandler(w http.ResponseWriter, r *http.Request) {
	var input proxyRequest
	if err := decodeJSON(w, r, &input); err != nil {
		writeInputError(w, err)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), outboundTimeout)
	defer cancel()
	target, err := url.ParseRequestURI(strings.TrimSpace(input.URL))
	if err != nil || target.Host == "" || target.User != nil || (target.Scheme != "http" && target.Scheme != "https") {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "url must be a valid http or https URL without user information"})
		return
	}
	if _, err := resolvePublicHost(ctx, target.Hostname()); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "url host is not publicly reachable"})
		return
	}

	method := strings.TrimSpace(input.Method)
	if method == "" {
		method = http.MethodGet
	}
	if !validMethod(method) || strings.EqualFold(method, http.MethodConnect) || strings.EqualFold(method, http.MethodTrace) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid or unsupported HTTP method"})
		return
	}

	var requestBody io.Reader
	if len(input.Data) != 0 && string(input.Data) != "null" && method != http.MethodGet && method != http.MethodHead {
		var data any
		if err := json.Unmarshal(input.Data, &data); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "data must be valid JSON"})
			return
		}
		if text, ok := data.(string); ok {
			requestBody = strings.NewReader(text)
		} else {
			encoded, err := json.Marshal(data)
			if err != nil {
				writeJSON(w, http.StatusBadRequest, map[string]string{"error": "data could not be encoded"})
				return
			}
			requestBody = bytes.NewReader(encoded)
		}
	}

	outbound, err := http.NewRequestWithContext(ctx, method, target.String(), requestBody)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid proxy request"})
		return
	}
	for name, value := range input.Headers {
		canonical := textproto.CanonicalMIMEHeaderKey(name)
		if canonical == "" || isHopByHopHeader(canonical) || strings.EqualFold(canonical, "Host") {
			continue
		}
		outbound.Header.Set(canonical, value)
	}
	if requestBody != nil && outbound.Header.Get("Content-Type") == "" {
		outbound.Header.Set("Content-Type", "application/json")
	}

	transport := &http.Transport{
		Proxy: nil,
		DialContext: func(ctx context.Context, network, address string) (net.Conn, error) {
			host, port, err := net.SplitHostPort(address)
			if err != nil {
				return nil, err
			}
			ips, err := resolvePublicHost(ctx, host)
			if err != nil {
				return nil, err
			}
			dialer := &net.Dialer{}
			var lastErr error
			for _, ip := range ips {
				conn, err := dialer.DialContext(ctx, network, net.JoinHostPort(ip.String(), port))
				if err == nil {
					return conn, nil
				}
				lastErr = err
			}
			return nil, lastErr
		},
	}
	defer transport.CloseIdleConnections()
	client := &http.Client{
		Transport: transport,
		Timeout:   outboundTimeout,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 10 {
				return errors.New("too many redirects")
			}
			if req.URL.User != nil || (req.URL.Scheme != "http" && req.URL.Scheme != "https") {
				return errors.New("redirect URL must use http or https without user information")
			}
			_, err := resolvePublicHost(req.Context(), req.URL.Hostname())
			return err
		},
	}
	response, err := client.Do(outbound)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "proxy request failed"})
		return
	}
	defer response.Body.Close()

	body, err := io.ReadAll(io.LimitReader(response.Body, maxProxyBody+1))
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "failed to read upstream response"})
		return
	}
	if len(body) > maxProxyBody {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "upstream response exceeds 2 MB limit"})
		return
	}
	responseHeaders := make(map[string]string, len(response.Header))
	for name, values := range response.Header {
		responseHeaders[name] = strings.Join(values, ", ")
	}
	writeJSON(w, http.StatusOK, proxyResponse{
		Status:     response.StatusCode,
		StatusText: statusText(response.StatusCode),
		Headers:    responseHeaders,
		Body:       string(body),
	})
}

func validMethod(method string) bool {
	if method == "" {
		return false
	}
	for _, r := range method {
		if !(r >= 'A' && r <= 'Z' || r >= 'a' && r <= 'z' || strings.ContainsRune("!#$%&'*+-.^_`|~", r) || r >= '0' && r <= '9') {
			return false
		}
	}
	return true
}

func isHopByHopHeader(name string) bool {
	switch strings.ToLower(name) {
	case "connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade", "content-length":
		return true
	default:
		return false
	}
}

func statusText(code int) string {
	if text := http.StatusText(code); text != "" {
		return text
	}
	return ""
}

func resolvePublicHost(ctx context.Context, host string) ([]net.IP, error) {
	host = strings.TrimSuffix(strings.ToLower(strings.TrimSpace(host)), ".")
	if host == "" || host == "localhost" || strings.HasSuffix(host, ".localhost") {
		return nil, errors.New("localhost is not allowed")
	}
	if ip := net.ParseIP(host); ip != nil {
		if !isPublicIP(ip) {
			return nil, errors.New("non-public IP address is not allowed")
		}
		return []net.IP{ip}, nil
	}
	addresses, err := net.DefaultResolver.LookupIPAddr(ctx, host)
	if err != nil || len(addresses) == 0 {
		return nil, fmt.Errorf("host could not be resolved: %w", err)
	}
	ips := make([]net.IP, 0, len(addresses))
	for _, address := range addresses {
		if !isPublicIP(address.IP) {
			return nil, errors.New("host resolves to a non-public IP address")
		}
		ips = append(ips, address.IP)
	}
	return ips, nil
}

func isPublicIP(ip net.IP) bool {
	addr, err := netip.ParseAddr(ip.String())
	if err != nil {
		return false
	}
	addr = addr.Unmap()
	if addr.IsPrivate() || addr.IsLoopback() || addr.IsLinkLocalUnicast() || addr.IsLinkLocalMulticast() || addr.IsMulticast() || addr.IsUnspecified() || !addr.IsGlobalUnicast() {
		return false
	}
	// Deny shared carrier-grade NAT and IPv4 benchmarking ranges as well.
	if addr.Is4() {
		for _, prefix := range []netip.Prefix{
			netip.MustParsePrefix("100.64.0.0/10"),
			netip.MustParsePrefix("198.18.0.0/15"),
		} {
			if prefix.Contains(addr) {
				return false
			}
		}
	}
	return true
}

type translateRequest struct {
	SourceLanguage string           `json:"sourceLanguage"`
	TargetLanguage string           `json:"targetLanguage"`
	Entries        []translateEntry `json:"entries"`
}

type translateEntry struct {
	Key   string  `json:"key"`
	Value *string `json:"value"`
}

func translateHandler(cfg config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !cfg.hasTranslationAPI() {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "translation API is not configured"})
			return
		}
		var input translateRequest
		if err := decodeJSON(w, r, &input); err != nil {
			writeInputError(w, err)
			return
		}
		if strings.TrimSpace(input.SourceLanguage) == "" || strings.TrimSpace(input.TargetLanguage) == "" || input.Entries == nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "sourceLanguage, targetLanguage, and an entries array are required"})
			return
		}
		for _, entry := range input.Entries {
			if strings.TrimSpace(entry.Key) == "" || entry.Value == nil {
				writeJSON(w, http.StatusBadRequest, map[string]string{"error": "each entry must include a non-empty key and a string value"})
				return
			}
		}
		if len(input.Entries) == 0 {
			writeJSON(w, http.StatusOK, map[string]any{"translations": map[string]string{}})
			return
		}

		var prompt strings.Builder
		fmt.Fprintf(&prompt, "Translate the value in each entry from %s to %s. Keep all entry keys unchanged, preserve placeholders and formatting, and translate only values. Return only a JSON object mapping each original key to its translated string.\nEntries:\n", input.SourceLanguage, input.TargetLanguage)
		for _, entry := range input.Entries {
			encoded, _ := json.Marshal(entry)
			prompt.Write(encoded)
			prompt.WriteByte('\n')
		}
		content, status, err := callChatCompletion(r.Context(), cfg, "You are a professional translator. Respond with a JSON object of translated strings keyed by each input entry's key.", prompt.String())
		if err != nil {
			writeAIError(w, status, "translation service request failed")
			return
		}
		var returned map[string]string
		if err := json.Unmarshal([]byte(content), &returned); err != nil {
			writeJSON(w, http.StatusBadGateway, map[string]string{"error": "translation service returned invalid JSON"})
			return
		}
		translations := make(map[string]string, len(input.Entries))
		for i, entry := range input.Entries {
			if value, ok := returned[entry.Key]; ok {
				translations[entry.Key] = value
			} else if value, ok := returned[strconv.Itoa(i+1)]; ok {
				translations[entry.Key] = value
			} else {
				translations[entry.Key] = *entry.Value
			}
		}
		writeJSON(w, http.StatusOK, map[string]any{"translations": translations})
	}
}

type detectRequest struct {
	Samples  []string `json:"samples"`
	FileName string   `json:"fileName"`
}

type detectionResult struct {
	Language     string  `json:"language"`
	Confidence   float64 `json:"confidence"`
	LanguageName string  `json:"languageName"`
}

func detectLanguageHandler(cfg config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !cfg.hasTranslationAPI() {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "language detection API is not configured"})
			return
		}
		var input detectRequest
		if err := decodeJSON(w, r, &input); err != nil {
			writeInputError(w, err)
			return
		}
		if len(input.Samples) == 0 {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "a non-empty samples array is required"})
			return
		}
		for _, sample := range input.Samples {
			if strings.TrimSpace(sample) == "" {
				writeJSON(w, http.StatusBadRequest, map[string]string{"error": "samples must contain non-empty strings"})
				return
			}
		}
		promptData := map[string]any{"samples": input.Samples}
		if input.FileName != "" {
			promptData["fileName"] = input.FileName
		}
		encoded, _ := json.Marshal(promptData)
		content, status, err := callChatCompletion(r.Context(), cfg,
			`Identify the language of the supplied text samples. Return only JSON with "language" (ISO 639-1 code), "confidence" (number from 0 to 1), and "languageName" (human-readable name).`,
			string(encoded))
		if err != nil {
			writeAIError(w, status, "language detection service request failed")
			return
		}
		var result detectionResult
		if err := json.Unmarshal([]byte(content), &result); err != nil || strings.TrimSpace(result.Language) == "" || result.Confidence < 0 || result.Confidence > 1 {
			writeJSON(w, http.StatusBadGateway, map[string]string{"error": "language detection service returned an invalid result"})
			return
		}
		if result.LanguageName == "" {
			result.LanguageName = result.Language
		}
		writeJSON(w, http.StatusOK, result)
	}
}

func (cfg config) hasTranslationAPI() bool {
	if cfg.translateURL == "" || cfg.translateKey == "" || cfg.translateModel == "" {
		return false
	}
	endpoint, err := url.ParseRequestURI(cfg.translateURL)
	return err == nil && endpoint.Host != "" && (endpoint.Scheme == "http" || endpoint.Scheme == "https") && endpoint.User == nil
}

type chatRequest struct {
	Model          string            `json:"model"`
	Messages       []chatMessage     `json:"messages"`
	Temperature    float64           `json:"temperature"`
	ResponseFormat map[string]string `json:"response_format"`
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error struct {
		Message string `json:"message"`
	} `json:"error"`
}

func callChatCompletion(parent context.Context, cfg config, systemPrompt, userPrompt string) (string, int, error) {
	payload := chatRequest{
		Model: cfg.translateModel,
		Messages: []chatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
		Temperature:    0.3,
		ResponseFormat: map[string]string{"type": "json_object"},
	}
	encoded, err := json.Marshal(payload)
	if err != nil {
		return "", http.StatusInternalServerError, err
	}
	ctx, cancel := context.WithTimeout(parent, outboundTimeout)
	defer cancel()
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, cfg.translateURL, bytes.NewReader(encoded))
	if err != nil {
		return "", http.StatusInternalServerError, err
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+cfg.translateKey)
	client := &http.Client{Timeout: outboundTimeout}
	response, err := client.Do(request)
	if err != nil {
		return "", http.StatusBadGateway, err
	}
	defer response.Body.Close()
	body, err := io.ReadAll(io.LimitReader(response.Body, maxAIResponse+1))
	if err != nil || len(body) > maxAIResponse {
		return "", http.StatusBadGateway, errors.New("invalid service response size")
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		var apiError chatResponse
		_ = json.Unmarshal(body, &apiError)
		if apiError.Error.Message != "" {
			return "", response.StatusCode, errors.New(apiError.Error.Message)
		}
		return "", response.StatusCode, errors.New("upstream service returned an error")
	}
	var result chatResponse
	if err := json.Unmarshal(body, &result); err != nil || len(result.Choices) == 0 || strings.TrimSpace(result.Choices[0].Message.Content) == "" {
		return "", http.StatusBadGateway, errors.New("service response did not contain a result")
	}
	return strings.TrimSpace(result.Choices[0].Message.Content), http.StatusOK, nil
}

func writeAIError(w http.ResponseWriter, status int, message string) {
	if status < 400 || status > 599 {
		status = http.StatusBadGateway
	}
	writeJSON(w, status, map[string]string{"error": message})
}

func decodeJSON(w http.ResponseWriter, r *http.Request, destination any) error {
	if r.Body == nil {
		return errors.New("request body is required")
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBytes)
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(destination); err != nil {
		var maxBytesError *http.MaxBytesError
		if errors.As(err, &maxBytesError) {
			return errors.New("request body exceeds 1 MB limit")
		}
		return errors.New("request body must contain valid JSON")
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		return errors.New("request body must contain exactly one JSON value")
	}
	return nil
}

func writeInputError(w http.ResponseWriter, err error) {
	status := http.StatusBadRequest
	if strings.Contains(err.Error(), "exceeds 1 MB") {
		status = http.StatusRequestEntityTooLarge
	}
	writeJSON(w, status, map[string]string{"error": err.Error()})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
