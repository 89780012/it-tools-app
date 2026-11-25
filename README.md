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

The build creates `dist/` with 552 prerendered pages (44 tools, home and changelog in 12 languages), including complete initial HTML and metadata. Upstream robots.txt and all 13 sitemap XML files are retained. The Go service serves `dist/` (or `../dist` when launched from `backend/`), routes `/api/*` to the API handlers, redirects explicit `/en` prefixes and trailing slashes, and returns HTTP 404 for missing routes. Set `WEB_DIST_DIR` to use another static directory.

For a static host, deploy `dist/`, serve each route's `index.html` without adding a trailing slash, return 404 for missing routes, and route `/api/*` to the Go service. SEO URLs use the upstream production origin `https://www.toolkitpub.com`.

## Languages and SEO

The existing 12 locale resources remain in `src/i18n/messages/` (`zh`, `en`, `es`, `de`, `fr`, `it`, `pt`, `ru`, `ja`, `ko`, `ar`, `hi`). English remains the default without a URL prefix; the other locales use `/{locale}/...`. Arabic pages set RTL direction.

SEO metadata follows upstream Next.js layout/page inheritance, including title templates, canonical URLs, hreflang exceptions, Open Graph, Twitter, robots directives and site verification. Tool and changelog translations are unchanged. The build prerenders existing React components so crawlers receive content and internal links before JavaScript runs; the client uses the same metadata rules during navigation. See [SEO parity audit](docs/seo-parity-audit.md) for the reference revision, retained upstream issues and the full comparison command.

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
