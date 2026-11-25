# SEO 一致性扫描与验证报告

## 对比基准

- 远程仓库：https://github.com/89780012/it-tools-app
- 分支：`main`
- 固定版本：`6437a2904c88123150bf56640b26069be30d50cc`
- 本地扫描起点：`5857ae19a59c742c855442df3ac2514144fbf4b4`
- 远程架构：Next.js 15.5.2；本地架构：Vite + React + Go。
- 使用远程源码和同版本 Next.js 的真实 metadata 解析器、标签生成器作为对照；未修改远程仓库，也未部署线上。
- 域名以远程默认配置 `https://www.toolkitpub.com` 为准。构建和客户端使用同一套规则。

## 扫描范围与结果

先比较两边全部已跟踪文件的清单及内容，再追踪布局、页面、翻译、工具配置、SEO 组件、国际化路由、抓取文件、静态构建和 Go 服务。

| 项目 | 范围 | 验证结果 |
| --- | --- | --- |
| 页面 metadata | 44 个工具 + 首页 + 更新日志，12 种语言，共 552 页 | 全部与远程解析结果一致 |
| title / description / keywords | 包含标题模板、页面覆盖布局 | 一致 |
| canonical / hreflang | 包含远程特殊继承规则 | 一致，每页一个 canonical |
| Open Graph / Twitter | 包含图片、站点名、语言、页面覆盖规则 | 一致 |
| 机器人及站点声明 | robots、googlebot、作者、发布者、分类、站点验证 | 一致 |
| 结构化数据声明 | 远程 `other['application/ld+json']` | 按远程原样输出为 meta |
| 语言资源 | 12 份完整 JSON 字典 | 与远程逐对象比较一致，未修改文案 |
| SEO 组件及工具配置 | 4 个 SEO 组件、tools-config | 源文件与远程一致，未修改 |
| robots.txt | Host 和 Sitemap 声明 | 内容一致，比较时统一 CRLF/LF |
| sitemap | 主 sitemap + 12 个语言 sitemap | 13 份内容一致，构建不再覆盖 |
| 首屏正文 | 所有 552 页 | React 组件预渲染，含页面正文和可抓取内链 |
| HTTP 交付 | 所有 552 页 | HTTP 200，正文与对应静态文件完全相同 |
| URL 行为 | `/en`、尾斜杠、查询串、未知路由、HEAD | 重定向和状态码检查通过 |
| 浏览器导航 | 12 种语言 × 首页/更新日志/JSON Formatter/JSON Key Fixer/Linux Log Helper | 60 次导航通过，客户端标签与静态标签一致 |

metadata 对比忽略标签顺序和内部 `data-seo` 属性，逐项比较标签名称、属性和值。正文检查确认预渲染页面内容和内链存在；没有将 Vite 与 Next.js 的框架 HTML、资源文件名或页面 DOM 做逐字节等同比较。

## 本次修复

1. 新增 `src/seo/metadata.ts`，恢复远程 metadata 的继承、覆盖和标题模板，构建与客户端共用。
2. 替换旧的客户端标签追加逻辑，清理旧标签，修复重复 canonical/hreflang 以及使用当前访问域名的问题。
3. 构建时渲染现有页面组件，修复仅输出空 `root` 容器的问题；完整生成 552 页。
4. 恢复 robots 原文，保留原有 sitemap 文件，补齐 favicon 的生产输出。
5. 客户端启动前加载当前语言字典，防止接管中文等页面时临时写入英语 SEO 文案；缓存语言资源并避免过期异步结果覆盖。
6. Go 服务直接返回路由 HTML，避免目录重定向；尾斜杠返回 308，显式 `/en` 前缀返回 307，保留查询参数，未知页面及资源返回 404。
7. 新增 SEO 标签导航回归测试及可复用的远程一致性检查脚本，更新运行文档。

本次保留任务开始前的用户改动：`docs/browser-route-audit.md`、`script/browser-route-audit.js`、`src/components/app-sidebar.tsx`。

## 为保持一致而保留的远程问题

以下均来自指定远程版本，本次没有作为 SEO 优化擅自更改：

- 首页只声明 en/zh/hi 和 x-default；JSON Key Fixer 只声明 en/zh/hi/de；大部分工具声明 12 种语言。
- 更新日志和 Linux Log Helper 的 canonical/hreflang 继承首页。
- 一部分页面覆盖 Open Graph 对象后不再输出 `og:url`，大部分工具也不继承首页社交图片。
- 结构化数据 JSON 被放在 meta 中，远程没有输出标准 `script[type="application/ld+json"]`。
- 首页引用 `/og-image.png`、`/og-image-small.png`，远程仓库没有这两个文件，本地也没有新增替代图片。
- sitemap 中的 URL 清单、时间戳、频率和优先级保持远程文件内容，没有自动补齐新工具。

## 复验方法

常规构建、前后端测试：

```powershell
npm run check
```

完整源码对比需准备固定版本远程检出，以及独立的 Next.js 15.5.2 参考依赖。下列 PowerShell 示例将临时文件放在会话 scratch 目录：

```powershell
git clone --depth 1 https://github.com/89780012/it-tools-app.git "$env:PI_SCRATCH_DIR\seo-upstream"
# 确认检出的版本与本报告一致；远程 main 变化时应重新审计。
npm install --prefix "$env:PI_SCRATCH_DIR\seo-reference" --ignore-scripts --no-audit --no-fund next@15.5.2 react@19.1.0 react-dom@19.1.0
npm run build
node script/check-seo-parity.mjs "$env:PI_SCRATCH_DIR\seo-upstream" "$env:PI_SCRATCH_DIR\seo-reference"
```

本次实际检查：

- `npm run check`：通过；生产构建生成 552 页，前端 10 个测试文件共 147 项通过，Go 测试通过。
- `check-seo-parity.mjs`：552/552 页通过，全部语言字典、robots 和 13 份 sitemap 通过。
- 本地 Go 生产服务全量 HTTP 检查：552 页及 404、重定向、HEAD 通过。
- 浏览器执行 JavaScript 后的 60 次多语言导航检查：通过。
- `git diff --check`：通过。

构建仍有现有大体积 JS 分包提示，不阻塞构建。本报告证明固定远程源码版本、默认正式域名配置下的 SEO 输出一致；线上部署配置和搜索引擎收录结果不属于本次本地验证范围。
