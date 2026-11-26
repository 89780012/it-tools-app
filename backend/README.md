# IT Tools Go API

Standalone Go 1.25+ API and static SPA server. The certificate service uses `golang.org/x/crypto/acme`.

## Run

```sh
cd backend
go run .
```

The server listens on `PORT` (default `8080`). Configure browser origins with `ALLOWED_ORIGINS`, a comma-separated exact-origin list. The default is `http://localhost:5173`. Requests with an `Origin` not on the list are rejected; requests without an `Origin` are accepted for non-browser clients.

If a Vite `dist/` build is present in the project root (or alongside the running process), Go automatically serves it. Set `WEB_DIST_DIR` to override the static directory. API routes stay under `/api/`; missing client routes fall back to the generated SPA `index.html`.

Translation and language detection share an OpenAI-compatible chat-completions endpoint. Configure all of these environment variables to enable them:

- `I18N_TRANSLATE_API_URL`: chat completions URL
- `I18N_TRANSLATE_API_KEY`: bearer token
- `I18N_TRANSLATE_API_MODEL`: model name

No API key is embedded in the source. Both AI routes return HTTP 503 with a clear error if configuration is absent or invalid.

## Endpoints

### `GET /api/health`

Returns `{"status":"ok","service":"it-tools-api"}`.

### `POST /api/proxy`

Accepts JSON with `url` (required), `method`, `headers` (string values), and `data`. A string `data` value is sent as-is; other JSON values are encoded as JSON. The destination must be HTTP(S); localhost, private/reserved local addresses, unresolved names, and DNS results containing non-public addresses are rejected. Redirect destinations receive the same checks, and connections are made to validated IP addresses. The outbound request defaults to a 30-second total deadline (`PROXY_TIMEOUT_SECONDS`, range 1–120) and the response body is capped at 2 MiB. Each address gets at most 3 seconds to connect so an unreachable address does not consume the entire request deadline. Success returns `{ "status", "statusText", "headers", "body" }`, where `body` is text. Connection/read timeouts return HTTP 504.

### `POST /api/i18n-translate`

Accepts `{ "sourceLanguage": "en", "targetLanguage": "fr", "entries": [{ "key": "greeting", "value": "Hello" }] }` and returns `{ "translations": { "greeting": "Bonjour" } }`. The AI is asked to preserve entry keys and return translations keyed by those keys; numbered translations are also mapped back to the input keys.

### `POST /api/detect-language`

Accepts `{ "samples": ["Hello world"], "fileName": "optional.json" }` and returns `{ "language", "confidence", "languageName" }` based on the configured model.

All POST JSON request bodies are limited to 1 MiB. Multipart proxy requests have a 10 MiB envelope limit and accept up to 20 files totaling 8 MiB, plus 100 form fields. AI responses are limited to 1 MiB and have an independent 90-second total deadline (`AI_TIMEOUT_SECONDS`, range 1–120). Invalid deadline settings use the defaults. CORS preflight requests are answered only for configured origins.

API responses include a server-generated `X-Request-ID`. Request logs record that ID, a fixed route name, status and elapsed milliseconds. Upstream failures record the operation, error category and upstream status; URLs, request/response bodies, authorization headers and raw error strings are excluded. Successful health checks are omitted from logs. Streaming responses continue to flush immediately.

### Online certificate issuance

- `GET /api/certificates/status`: reports whether issuance is enabled and whether the CA is in staging mode.
- `POST /api/certificates/start`: accepts `{ "domains": ["example.com"] }` and a bearer issuance access token. Returns the order token, DNS TXT records, expiry, and staging flag.
- `POST /api/certificates/download`: accepts the order token as a bearer credential. Returns a no-store ZIP after DNS verification and issuance. HTTP 409 means retry the same order once DNS has propagated; HTTP 404 or 422 requires a new order.

Both POST endpoints require the configured exact `Origin`. The feature is opt-in; see the root README and `.env.example` for deployment configuration.

## Test

```sh
go test ./...
go vet ./...
```

### Network diagnostics and request uploads

`POST /api/dns` accepts `{ "name": "example.com", "type": "A", "resolver": "alidns" }`. Supported records are A, AAAA, CNAME, MX, TXT, NS and CAA. Resolvers are `alidns`, `cloudflare` and `google`. Responses contain the DNS status, answers with TTLs, authority records, resolver and check time. Queries time out after 10 seconds. The UI defaults to AliDNS; comparison queries all three and retains successful answers when another resolver fails. A query always uses the selected provider and never silently substitutes another provider's answers.

`POST /api/tls` accepts `{ "host": "example.com" }`. It connects to a validated public address on port 443, supplies SNI, and reports negotiated TLS version/cipher, certificate fingerprints and dates, hostname match and trust-chain verification independently. Invalid/expired certificates are collected for diagnosis and explicitly verified before reporting status. The connection times out after 10 seconds.

`POST /api/stream` accepts the proxy request shape with GET or POST, JSON string `data`, and headers. It forwards a public HTTP(S) event stream for up to 60 seconds or 2 MiB, flushing each chunk. Redirects are reported as errors so credentials stay with the requested origin. The browser can cancel the request at any time.

`POST /api/proxy` also accepts multipart form data. The `request` field contains the JSON request metadata, `fields` contains an array of name/value pairs, `fileFields` contains the corresponding destination field names, and repeated `files` parts contain file bytes. The server rebuilds the upstream multipart body, preserving filenames, content types and repeated fields. The existing public-target and redirect validation applies.
