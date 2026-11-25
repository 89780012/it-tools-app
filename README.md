# IT Tools Collection

A multilingual online toolbox for developers. The application now uses **React 19 + Vite + TypeScript + Tailwind CSS 4 + shadcn/ui** on the frontend and a standalone **Go 1.22+** API server. Existing tool pages and the full translation catalog are retained.

## Requirements

- Node.js 20+
- npm 10+
- Go 1.22+

## Development

```bash
npm install
npm run dev:full
```

- Vite frontend: http://localhost:5173
- Go API: http://localhost:8080/api/health

Run only one side with `npm run dev` or `npm run dev:api`.

## Production build and run

```bash
npm run build
cd backend
go run .
```

The build creates the `dist/` static application, one localized HTML entry per language/tool route, and an updated sitemap. The Go service automatically serves `dist/` (or `../dist` when launched from `backend/`) when available, serves `/api/*` from the API handlers, and falls back to the SPA entry for client-side routes. Set `WEB_DIST_DIR` to use another static directory.

For a static host, deploy `dist/`, configure its SPA/static-directory fallback, and route `/api/*` to the Go service. Set `SEO_SITE_URL` during build if the canonical production origin differs from `https://www.toolkitpub.com`.

## Languages and SEO

The existing 12 locale resources remain in `src/i18n/messages/` (`zh`, `en`, `es`, `de`, `fr`, `it`, `pt`, `ru`, `ja`, `ko`, `ar`, `hi`). English remains the default without a URL prefix; the other locales use `/{locale}/...`. Arabic pages set RTL direction.

Tool titles, descriptions, and **Keywords** continue to come from each locale's `tools.<tool-id>.meta` message. The build-time generator writes localized page titles, descriptions, keyword meta tags, canonical URLs, hreflang links, and sitemap entries to static HTML so crawlers receive locale-specific metadata before JavaScript runs. The client also updates metadata during in-app navigation.

## Go API configuration

- `PORT` (default `8080`)
- `ALLOWED_ORIGINS` (comma-separated exact origins; default `http://localhost:5173`)
- `I18N_TRANSLATE_API_URL`
- `I18N_TRANSLATE_API_KEY`
- `I18N_TRANSLATE_API_MODEL`
- `WEB_DIST_DIR` (optional static directory)

The API exposes `GET /api/health`, `POST /api/proxy`, `POST /api/i18n-translate`, and `POST /api/detect-language`. Translation/detection return HTTP 503 until their API settings are provided. The proxy only allows public HTTP(S) targets and applies request, response, and timeout limits. See [backend/README.md](backend/README.md) for endpoint details.

## Verification

```bash
npm run build
npm run test:run
npm run test:api
```

`components.json` is configured for client-side shadcn/ui components; shared components are in `src/components/ui/`.
