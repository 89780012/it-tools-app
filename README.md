# IT Tools Collection

A multilingual online toolbox for developers. The application now uses **React 19 + Vite + TypeScript + Tailwind CSS 4 + shadcn/ui** on the frontend and a standalone **Go 1.22+** API server. Existing tool pages and the full translation catalog are retained.

The catalog contains **64 tools in 12 categories**, with 12 languages throughout. The latest additions cover regex testing, JWT inspection, text diff/batch processing, JSON-to-TypeScript/Go, SQL formatting, JSONPath/Schema, URL editing, YAML/XML formatting, IPv4 subnets, integer/byte conversions, PEM certificates, free Nginx certificate setup, Markdown tables, CSS formatting, WCAG contrast and local image compression. Time conversion, HTTP debugging and seeded mock data have expanded controls. Favorites and recent tool history persist locally without retaining tool input.

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

## Linux Docker 一键部署

服务器安装并启动 Docker Engine 和 Docker Compose v2 后，在项目根目录执行。无需在宿主机安装 Node.js 或 Go，首次构建需要能够下载基础镜像和 npm 依赖。

```bash
cp .env.example .env
vi .env
bash deploy.sh
```

在 `.env` 中把实际访问地址加入 `ALLOWED_ORIGINS`，否则从服务器 IP 或其他域名发出的 API 请求可能被拒绝。例如服务器通过 `http://203.0.113.10:8080` 访问时：

```dotenv
APP_PORT=8080
ALLOWED_ORIGINS=http://203.0.113.10:8080,https://www.toolkitpub.com
```

启动成功后访问 `http://服务器IP:8080`；健康检查地址为 `/api/health`。如果服务器防火墙启用，需要放行对应宿主机端口。使用 HTTPS 反向代理时，将公开域名加入 `ALLOWED_ORIGINS`；若代理就在宿主机上，可设置 `APP_BIND_ADDRESS=127.0.0.1`。修改端口后应同步调整允许来源中的端口，来源不带末尾 `/`。

```bash
bash deploy.sh          # 构建/更新镜像，后台启动，等待健康检查通过
bash deploy.sh status   # 查看容器状态
bash deploy.sh logs     # 持续查看日志
bash deploy.sh down     # 停止并移除本项目容器和网络
```

也可直接运行 `docker compose up -d --build --wait --wait-timeout 120`。代码更新后重新执行 `bash deploy.sh` 即可；构建失败时脚本返回非零退出码，启动失败时显示容器状态与最近日志。若当前用户没有 Docker 权限，可使用 `sudo bash deploy.sh`。

`Dockerfile` 分别构建前端和 Go，前端构建包含 792 个 SEO 页面预渲染。最终镜像仅包含 Go 程序、静态页面和运行所需文件，以普通用户运行；Compose 配置健康检查、自动重启和日志轮转。SEO 正式域名继续保持 `https://www.toolkitpub.com`。

翻译及语言检测需要在 `.env` 中填写 `I18N_TRANSLATE_API_URL`、`I18N_TRANSLATE_API_KEY`、`I18N_TRANSLATE_API_MODEL`；未配置时其余工具照常使用，这两个 API 返回 503。`.env` 不进入 Git 或镜像，只在容器运行时注入。

## Production build and run

```bash
npm run build
cd backend
go run .
```

The build creates `dist/` with 792 prerendered pages (64 tools, home and changelog in 12 languages), including complete initial HTML and metadata. robots.txt is retained; the 12 locale sitemaps and sitemap index are generated from the current catalog. The Go service serves `dist/` (or `../dist` when launched from `backend/`), routes `/api/*` to the API handlers, redirects explicit `/en` prefixes and trailing slashes, and returns HTTP 404 for missing routes. Set `WEB_DIST_DIR` to use another static directory.

For a static host, deploy `dist/`, serve each route's `index.html` without adding a trailing slash, return 404 for missing routes, and route `/api/*` to the Go service. SEO URLs use the upstream production origin `https://www.toolkitpub.com`.

The Nginx certificate tool at `/tools/nginx-certificate-generator` prepares Debian/Ubuntu Certbot commands for free Let's Encrypt certificates using the Nginx plugin, Webroot, or automated Cloudflare DNS (wildcards supported), plus Nginx TLS configuration and systemd renewal instructions. Public issuance requires domain control and running the commands on your server; the site does not issue public certificates itself. A separate local mode generates RSA-2048 or ECDSA P-256 self-signed certificates, PKCS#8 private keys and a configuration ZIP entirely in the browser. These development certificates are not publicly trusted, and private keys are never uploaded or persisted by the application.

## Languages and SEO

The existing 12 locale resources remain in `src/i18n/messages/` (`zh`, `en`, `es`, `de`, `fr`, `it`, `pt`, `ru`, `ja`, `ko`, `ar`, `hi`). English remains the default without a URL prefix; the other locales use `/{locale}/...`. Arabic pages set RTL direction.

New translations live in `src/i18n/messages/*-additions/{locale}.json`. `src/i18n/additions.ts` deep-merges them with the original locale files for both browser rendering and SEO. Keep all 12 files in each group synchronized; tests check every new key, interpolation parameter and tool metadata entry.

SEO metadata retains the original title templates, canonical/hreflang exceptions, Open Graph, Twitter, robots directives and site verification for existing tools. New tools have localized metadata and the same client/prerender rules. The build renders React components so crawlers receive content and internal links before JavaScript runs. See [SEO parity audit](docs/seo-parity-audit.md) for the migration baseline and retained upstream exceptions.

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
npx playwright install chromium  # once per development machine
npm run test:browser
```

Browser tests start/reuse Vite on `localhost:5173` and Go on port 8080. They exercise tool controls and outputs, file uploads/downloads, all 64 routes in all 12 languages, language switching, favorites/history, RTL, mobile layout and themes. Certificate checks independently verify downloaded signatures, SANs, fingerprints and private-key matches; public CA command generation is tested without contacting Let's Encrypt or issuing a certificate. External IP/translation response cases use deterministic fixtures; Go health and proxy rejection checks use the real local API. HTML/JSON reports, screenshots and failure traces go into the session scratch directory when `PI_SCRATCH_DIR` is set, otherwise `test-results/`. Use `npx playwright show-report <report-directory>` to inspect the report. `BROWSER_BASE_URL` can select an already running frontend.

`components.json` is configured for client-side shadcn/ui components; shared components are in `src/components/ui/`.

## 线上仍出现 Application error 时

当前应用部署后应加载 `/assets/` 下的 Vite 资源，并可访问 Go 服务的 `/api/health`。若页面仍加载 `/_next/static/`、包含 `self.__next_f` 或返回 `X-Powered-By: Next.js`，说明域名仍指向旧部署，或代理/CDN 正在提供旧 HTML。

1. 在服务器检出当前版本，运行 `bash deploy.sh`，确认新容器健康。
2. 从服务器直接访问应用端口，确认首页引用 `/assets/`，并检查 `/api/health`。
3. 将域名反向代理上游切到 Compose 的 `APP_PORT`，清除 Cloudflare/CDN 中旧首页和语言页面的 HTML 缓存。
4. 从公开域名重新检查首页、工具深层链接和语言切换。Go 服务对 HTML 设置 `Cache-Control: no-cache, max-age=0, must-revalidate` 和 `CDN-Cache-Control: no-store`；对 Vite `/assets/` 中的哈希资源设置一年 `immutable` 缓存。Cloudflare 缓存规则和反向代理必须尊重这些响应头，移除覆盖 HTML 的固定一天缓存策略。已有旧缓存需单独清除。

仅更新本地代码或通过浏览器强制刷新，无法替换服务器上的旧应用，也无法保证绕过 CDN 缓存。

可临时在 URL 添加唯一查询参数，对比 `CF-Cache-Status: HIT` 的旧 HTML 与 `MISS` 的新 HTML；这是排查方法，正式修复仍需清缓存并更新缓存规则。
