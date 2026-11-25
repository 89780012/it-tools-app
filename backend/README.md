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

Accepts JSON with `url` (required), `method`, `headers` (string values), and `data`. A string `data` value is sent as-is; other JSON values are encoded as JSON. The destination must be HTTP(S); localhost, private/reserved local addresses, unresolved names, and DNS results containing non-public addresses are rejected. Redirect destinations receive the same checks, and connections are made to validated IP addresses. The outbound request times out after 15 seconds and the response body is capped at 2 MiB. Success returns `{ "status", "statusText", "headers", "body" }`, where `body` is text.

### `POST /api/i18n-translate`

Accepts `{ "sourceLanguage": "en", "targetLanguage": "fr", "entries": [{ "key": "greeting", "value": "Hello" }] }` and returns `{ "translations": { "greeting": "Bonjour" } }`. The AI is asked to preserve entry keys and return translations keyed by those keys; numbered translations are also mapped back to the input keys.

### `POST /api/detect-language`

Accepts `{ "samples": ["Hello world"], "fileName": "optional.json" }` and returns `{ "language", "confidence", "languageName" }` based on the configured model.

All POST JSON request bodies are limited to 1 MiB. AI responses are limited to 1 MiB. CORS preflight requests are answered only for configured origins.

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
