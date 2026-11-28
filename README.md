# IT Tools Collection

A multilingual online toolbox for developers. The application uses **React 19 + Vite + TypeScript + Tailwind CSS 4 + shadcn/ui** on the frontend and a standalone **Go 1.25+** API server.

The catalog contains **83 tools in 12 categories**, with 12 languages throughout. The catalog covers regex testing, JWT inspection, text diff/batch processing, JSON-to-TypeScript/Go, SQL formatting, JSONPath/Schema, URL editing, YAML/XML formatting, IPv4 subnets, integer/byte conversions, PEM certificates, free Nginx certificate setup, Markdown tables, CSS formatting, WCAG contrast and local image compression. Time conversion, HTTP debugging and seeded mock data have expanded controls. Favorites and recent tool history persist locally without retaining tool input.

The latest expansion adds local file checksums, list set operations, chmod permissions, QR image reading, CSV/TSV editing, SQL INSERT generation, DNS comparison, live TLS inspection and WebSocket/SSE debugging. Existing pages include JSON repair/JSON5 conversion, visual Cron schedules with IANA time zones, HTTP authentication/form uploads/cURL export, image cropping/rotation/batch ZIP export, Java/Python/C# models and JSON Schema generation, text naming conversion and statistics. Global search supports Ctrl/Cmd+K and task aliases, with related tools selected by workflow.

File hashes run incrementally in the browser. CSV input is limited to 5 MB, 50,000 rows and 200 columns. Batch images accept 30 files totaling 100 MiB. HTTP uploads accept 20 files totaling 8 MiB. DNS uses Google or Cloudflare resolvers through the Go server, TLS checks public domains on port 443, and SSE connections last up to 60 seconds or 2 MiB. WebSocket connects directly from the browser. Generated Java models use Jackson, Python uses Python 3.11 TypedDict, and C# uses System.Text.Json. Array/primitive roots in Java and C# use a value wrapper, shown in the tool guidance.

JSON / JSON Lines conversion is available at `/tools/json-lines-converter` (Chinese: `/zh/tools/json-lines-converter`). Convert JSON arrays and NDJSON logs locally, import UTF-8 files, copy or download results, and locate invalid records by line number. Large integers and decimals retain their precision. Limits: 5 MiB, 50,000 records and 100 nesting levels; blank-line skipping is optional. See [the implementation and verification record](docs/daily-tool-2026-11-26.md).

The [Aspect Ratio Calculator](docs/daily-tool-2026-11-27.md) at `/tools/aspect-ratio-calculator` simplifies a resolution to a ratio and calculates pixel dimensions from a target width, height, or bounding box. It runs locally in the browser and copies the ratio and dimensions as plain text.

The [Date Duration Calculator](docs/daily-tool-2026-11-28.md) at `/tools/date-duration-calculator` (Chinese: `/zh/tools/date-duration-calculator`) counts calendar days, full weeks and business days. Choose whether to include the end date and enter optional holidays, with duplicate dates removed. It runs locally, supports Gregorian years 0001–9999 and provides a copyable, downloadable summary. Business days use Monday–Friday; public holidays and substitute working weekends are not loaded automatically.

The [Semantic Version Sorter](docs/hourly-tool-2026-11-28-12.md) at `/tools/semver-sorter` (Chinese: `/zh/tools/semver-sorter`) orders release tags using SemVer 2.0 precedence and finds the highest stable version. It handles prereleases, optional lowercase `v` prefixes and arbitrarily large numeric identifiers locally, preserves build metadata and duplicate tags, and supports copy and text download. Limits: 10,000 versions and 500,000 UTF-16 code units; version ranges are not supported.

The [JSON Merge Patch tool](docs/hourly-tool-2026-11-28-14.md) at `/tools/json-merge-patch` (Chinese: `/zh/tools/json-merge-patch`) applies RFC 7396 patches to configurations locally. It merges objects recursively, deletes null-valued members, replaces arrays and preserves large number precision. Enter target JSON and patch JSON, load an example, copy or download `merged.json`, and clear both inputs. Limits: 500,000 UTF-16 code units per input, 64 nesting levels and 5,000,000 code units in the formatted output. Root scalar and array patches replace the whole document; JSON Patch operation arrays (RFC 6902) are not interpreted.

The IPv6 Subnet Calculator at `/tools/ipv6-subnet-calculator` (Chinese: `/zh/tools/ipv6-subnet-calculator`) calculates network ranges and exact address counts for /0–/128 prefixes locally using BigInt. It accepts compressed IPv6 addresses and dotted IPv4 tails, normalizes the output to hexadecimal, and offers a copyable, downloadable summary. Address counts include reserved addresses and do not estimate usable hosts. See [the implementation and verification record](docs/hourly-tool-2026-11-28-15.md).

The [TOTP Generator](docs/hourly-tool-2026-11-28-16.md) at `/tools/totp-generator` (Chinese: `/zh/tools/totp-generator`) generates RFC 6238 one-time codes locally from Base32 secrets. It supports SHA-1/256/512, 6 or 8 digits, periods of 1–300 seconds, live device time and fixed Unix timestamps. Copy or download only the generated code; secrets stay in page memory. The example uses the published RFC test secret.

The [Unicode Normalizer](docs/hourly-tool-2026-11-28-17.md) at `/tools/unicode-normalizer` (Chinese: `/zh/tools/unicode-normalizer`) converts text to NFC, NFD, NFKC or NFKD locally. Compare code points, UTF-16 units and UTF-8 byte counts, inspect the first 64 code points, and copy or download the complete normalized text. Whitespace is preserved; compatibility forms can remove meaningful distinctions. Limits: 100,000 UTF-16 units in the input and 1,000,000 in the output.

The [IPv4 CIDR Aggregator](docs/hourly-tool-2026-11-28-18.md) at `/tools/ipv4-cidr-aggregator` (Chinese: `/zh/tools/ipv4-cidr-aggregator`) reduces firewall allowlists to the smallest exact CIDR list locally. It normalizes host bits, removes duplicate and covered networks, merges adjacent ranges without filling gaps, and reports unique address counts. Paste one IPv4 address or CIDR per line, load an example, copy or download the result, or clear the input. Bare addresses mean /32; leading zeros, comments, ranges and IPv6 are rejected. Limits: 10,000 non-empty entries and 500,000 UTF-16 code units. Counts include network, broadcast and reserved addresses.

The [JSON Pointer Resolver](docs/hourly-tool-2026-11-28-19.md) at `/tools/json-pointer` (Chinese: `/zh/tools/json-pointer`) extracts one exact value using RFC 6901 pointers or URI fragments. It supports escaped keys, arrays, scalar roots, Unicode and precision-preserving numbers locally, with example, clear, copy and JSON download controls. Empty pointers select the document root; `/` selects an empty key. Missing keys, invalid escapes, duplicate object keys and invalid array indices produce explicit errors. Limits: 500,000 UTF-16 units of JSON, 4,096 of pointer text, 64 nesting levels and 5,000,000 units of formatted output.

## Requirements

- Node.js 20+
- npm 10+
- Go 1.25+

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

### Cloudflare Tunnel 与 API 连通性

- 同时使用 `www.toolkitpub.com` 和 `toolkitpub.com` 时，`ALLOWED_ORIGINS` 必须包含两个 HTTPS 来源。页面可打开不代表 API 的 Origin 校验已通过。
- 若 cloudflared 持续出现 `failed to accept QUIC stream: timeout: no recent network activity`，在 **cloudflared 服务**的启动命令中添加 `--protocol http2`（放在 `run` 之前），再通过它自己的 Compose 文件重新创建容器。该选项改用 TCP/7844；修改 IT Tools 的 Compose 不会改变 Tunnel 协议。检查日志中 4 条连接均注册为 `protocol=http2`，并继续观察错误和公网健康检查。
- Tunnel 不代理应用访问第三方服务的出站流量。DNS 工具目前仅开放 AliDNS，暂时移除不可达的 Cloudflare、Google 及对比选项。恢复其他提供商前需要先验证服务器的出站网络。
- IP 查询通过浏览器访问支持 HTTPS/CORS 的 `ipwho.is`，当前 IP 仍来自访问者的浏览器；免费服务没有返回的代理/托管/移动网络标记不会被推测为 `false`。
- 普通请求代理默认超时 30 秒，AI 请求默认 90 秒，分别用 `PROXY_TIMEOUT_SECONDS`、`AI_TIMEOUT_SECONDS` 调整（1–120 秒）。DNS/TLS 检查仍为 10 秒，SSE 仍为 60 秒或 2 MiB。
- API 返回 `X-Request-ID`，可在应用容器日志中按该 ID 查找状态、耗时与错误分类。日志不记录请求正文、完整目标 URL、密钥或 Authorization。
- 翻译和语言检测需要配置全部三个 `I18N_TRANSLATE_API_*` 变量；其中 URL 必须是兼容 OpenAI 的完整 chat-completions 地址。未配置时接口明确返回 503，i18n JSON 翻译菜单入口已暂时隐藏。
- 构建时若无法连接 `proxy.golang.org`，可在 `.env` 中设置 `GOPROXY=https://goproxy.cn`。该值仅传入 Go 构建阶段，模块校验仍然开启；依赖下载层按 `go.mod`/`go.sum` 缓存。

`Dockerfile` 分别构建前端和 Go，前端构建包含 1020 个 SEO 页面预渲染。最终镜像仅包含 Go 程序、静态页面和运行所需文件，以普通用户运行；Compose 配置健康检查、自动重启和日志轮转。SEO 正式域名继续保持 `https://www.toolkitpub.com`。

翻译及语言检测需要在 `.env` 中填写 `I18N_TRANSLATE_API_URL`、`I18N_TRANSLATE_API_KEY`、`I18N_TRANSLATE_API_MODEL`；未配置时其余工具照常使用，这两个 API 返回 503。`.env` 不进入 Git 或镜像，只在容器运行时注入。

## Production build and run

```bash
npm run build
cd backend
go run .
```

The build creates `dist/` with 1020 prerendered pages (83 tools, home and changelog in 12 languages), including complete initial HTML and metadata. robots.txt is retained; the 12 locale sitemaps and sitemap index are generated from the current catalog. The Go service serves `dist/` (or `../dist` when launched from `backend/`), routes `/api/*` to the API handlers, redirects explicit `/en` prefixes and trailing slashes, and returns HTTP 404 for missing routes. Set `WEB_DIST_DIR` to use another static directory.

For a static host, deploy `dist/`, serve each route's `index.html` without adding a trailing slash, return 404 for missing routes, and route `/api/*` to the Go service. SEO URLs use the upstream production origin `https://www.toolkitpub.com`.

### Nginx 公网证书在线签发

打开 `/zh/tools/nginx-certificate-generator` → **在线签发并下载**。输入你控制的域名和管理员签发口令，按页面提示添加所有 DNS TXT 记录，等待生效后点击 **验证 DNS 并下载 ZIP**。支持通配符；如需覆盖根域名，请单独添加。ZIP 包含 `fullchain.pem`、`privkey.pem` 和指向安装目录的 `nginx.conf` 片段。按片段中的路径安装，将私钥权限设为 `600`，把指令合并到现有 HTTPS `server` 块，运行 `nginx -t` 后再重载。下载的证书不会自动续期；需要无人值守续期时可使用页面的 Certbot 部署指南。浏览器内生成的自签名模式也保留，仅用于开发测试。

在线签发默认关闭。部署者先阅读 [Let's Encrypt 订户协议](https://letsencrypt.org/repository/)，在受保护的目录内生成账户密钥和随机签发口令（不要将输出提交到 Git 或共享到聊天）：

```sh
umask 077
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out acme-account.pem
openssl base64 -A -in acme-account.pem
openssl rand -hex 32
```

在 `.env` 中配置 `CERTIFICATE_ISSUANCE_ENABLED=true`、`CERTIFICATE_ORIGIN`（工具站点的 HTTPS 来源，无尾部斜线，同时加入 `ALLOWED_ORIGINS`）、`CERTIFICATE_ACCESS_TOKEN`（随机口令）、`CERTIFICATE_ACME_EMAIL`、`CERTIFICATE_ACME_KEY_BASE64`（账户密钥的单行 Base64）和 `CERTIFICATE_ACME_ACCEPT_TOS=true`。将 `.env` 权限设为 `600`，重新运行 `bash deploy.sh`。先以 `CERTIFICATE_ACME_ENV=staging` 验证部署流程（测试证书不受浏览器信任），验证后切换为 `production` 并重新部署、创建新订单。

请只通过可信的 HTTPS 工具站点签发，反向代理须保留 `Origin` 和 `Authorization` 请求头，不得记录这些凭证或缓存 `/api/certificates/` 的响应。该功能按单 Go 实例部署，订单和域名私钥仅在该实例内存中保留最多 30 分钟；刷新页面、过期或服务重启后需重新创建订单。ACME 账户密钥与下载的域名私钥不是同一个密钥。

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

The API exposes `GET /api/health`, `POST /api/proxy`, `POST /api/dns`, `POST /api/tls`, `POST /api/stream`, `POST /api/i18n-translate`, and `POST /api/detect-language`. Translation/detection return HTTP 503 until their API settings are provided. The proxy only allows public HTTP(S) targets and applies request, response, and timeout limits. See [backend/README.md](backend/README.md) for endpoint details.

## Verification

```bash
npm run build
npm run test:run
npm run test:api
npx playwright install chromium  # once per development machine
npm run test:browser
```

Browser tests start/reuse Vite on `localhost:5173` and Go on port 8080. They exercise tool controls and outputs, file uploads/downloads, catalog tool routes in all 12 languages, language switching, favorites/history, RTL, mobile layout and themes. Certificate checks independently verify downloaded signatures, SANs, fingerprints and private-key matches; public CA command generation is tested without contacting Let's Encrypt or issuing a certificate. External IP/translation response cases use deterministic fixtures; Go health and proxy rejection checks use the real local API. HTML/JSON reports, screenshots and failure traces go into the session scratch directory when `PI_SCRATCH_DIR` is set, otherwise `test-results/`. Use `npx playwright show-report <report-directory>` to inspect the report. `BROWSER_BASE_URL` can select an already running frontend.

`components.json` is configured for client-side shadcn/ui components; shared components are in `src/components/ui/`.

## 线上仍出现 Application error 时

当前应用部署后应加载 `/assets/` 下的 Vite 资源，并可访问 Go 服务的 `/api/health`。若页面仍加载 `/_next/static/`、包含 `self.__next_f` 或返回 `X-Powered-By: Next.js`，说明域名仍指向旧部署，或代理/CDN 正在提供旧 HTML。

1. 在服务器检出当前版本，运行 `bash deploy.sh`，确认新容器健康。
2. 从服务器直接访问应用端口，确认首页引用 `/assets/`，并检查 `/api/health`。
3. 将域名反向代理上游切到 Compose 的 `APP_PORT`，清除 Cloudflare/CDN 中旧首页和语言页面的 HTML 缓存。
4. 从公开域名重新检查首页、工具深层链接和语言切换。Go 服务对 HTML 设置 `Cache-Control: no-cache, max-age=0, must-revalidate` 和 `CDN-Cache-Control: no-store`；对 Vite `/assets/` 中的哈希资源设置一年 `immutable` 缓存。Cloudflare 缓存规则和反向代理必须尊重这些响应头，移除覆盖 HTML 的固定一天缓存策略。已有旧缓存需单独清除。

仅更新本地代码或通过浏览器强制刷新，无法替换服务器上的旧应用，也无法保证绕过 CDN 缓存。

可临时在 URL 添加唯一查询参数，对比 `CF-Cache-Status: HIT` 的旧 HTML 与 `MISS` 的新 HTML；这是排查方法，正式修复仍需清缓存并更新缓存规则。

## 每小时自动新增工具

通过 Codex CLI 与 systemd 每小时整点运行，每次新增一个工具并在测试通过后使用中文提交、推送 main、重新部署 Docker。同一小时成功后不重复生成，任务之间不并发。沿用本机自定义 API 配置，无需额外登录。安装、时间设置、日志和停用方法见 [工具自动化部署指南](docs/daily-tool-automation.md)。
