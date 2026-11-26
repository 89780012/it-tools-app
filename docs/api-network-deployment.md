# API 网络部署记录（2026-11-26）

## 已实施

- cloudflared 的独立 Compose 启动命令已加入 `--protocol http2`，四条连接均注册为 HTTP/2。配置位于 `/www/server/panel/data/compose/cloudflared/docker-compose.yaml`，原配置备份为同目录的 `docker-compose.yaml.before-http2-20261126`（权限 0600）。该文件包含 Tunnel 凭据，不应提交到 Git。
- 应用 `.env` 已补齐 `https://toolkitpub.com` 允许来源；项目 Compose 默认值和 `.env.example` 同步包含带与不带 www 的域名。
- DNS 目前仅开放实测可达的 AliDNS，暂时移除 Cloudflare、Google 及对比选项；后端也拒绝已停用的提供商。
- IP 查询切换为 `https://ipwho.is/`，浏览器的当前 IP 检测及指定 IP 查询均通过公网页面验证。
- 普通代理与 AI 请求分别使用 30 秒和 90 秒默认总超时；单个目标 IP 的连接尝试最多 3 秒。
- API 日志增加请求 ID、状态、耗时和脱敏的错误分类，保持 SSE 实时刷新。
- 应用 `.env` 的构建配置使用 `GOPROXY=https://goproxy.cn`，解决本服务器访问默认 Go 模块源超时的问题。

## 仍需管理员配置

### AI 翻译和语言检测

在项目 `.env` 中填写以下三个值，再运行 `bash deploy.sh`：

```dotenv
I18N_TRANSLATE_API_URL=https://YOUR_PROVIDER/v1/chat/completions
I18N_TRANSLATE_API_KEY=YOUR_KEY
I18N_TRANSLATE_API_MODEL=YOUR_MODEL
```

URL 必须是服务商支持的完整 chat-completions 地址，模型需支持当前请求使用的 JSON 输出格式。未配置时两个接口返回 503；服务器中没有可直接使用的这组配置。i18n JSON 翻译入口已通过 `src/lib/tools-config.ts` 的 `hiddenToolIds` 暂时隐藏，配置服务后可从该集合移除它以恢复菜单。

### Cloudflare 裸域名重定向

公网实测 `POST https://toolkitpub.com/api/proxy` 与 `/api/dns` 返回 Cloudflare 的 **301**，Location 指向同路径的 `https://www.toolkitpub.com`。部分客户端跟随 301 时会把 POST 改为 GET，最终收到应用的 405。

在 Cloudflare Rules 中定位裸域名到 www 的重定向，将状态码改为 **308**（或 307），保留路径和查询参数；也可以让该规则排除 `/api/*`。修改前，API 客户端直接使用 `https://www.toolkitpub.com/api/...`。应用已允许两个 Origin，但无法修改发生在边缘的重定向。

### Cloudflare 对非浏览器请求的拦截

默认 Python User-Agent 的请求实测返回 **403 / error code: 1010**，且没有应用的 `X-Request-ID`；浏览器与其他 User-Agent 的请求可通过。这表明拦截发生在 Cloudflare 边缘。检查 Security Events 和 Browser Integrity Check（浏览器完整性检查）；若需要支持这些 API 客户端，针对匹配的 API 路径配置合适的例外，而非关闭整站防护。

当前环境没有 Cloudflare 管理 API 凭据或控制台连接，Tunnel 运行 token 不能替代站点规则管理权限。

### 指定公共 DNS 服务的出站访问

绕过 Tunnel 直接调用本机 API，停用前，Cloudflare DNS 返回连接重置，Google DNS 在 10 秒超时。AliDNS 查询正常，因此默认 DNS 功能可用；如必须使用 Cloudflare/Google 对比，需要让服务器/Docker 出站网络能访问 `cloudflare-dns.com:443` 和 `dns.google:443`。修改 Tunnel 入站协议不会改变这些出站连接。
