# IT 工具集合 — 当前架构

本项目已迁移到 React 19 + Vite + TypeScript + Tailwind CSS 4，后端为独立 Go 服务。Next.js 和 next-intl 不属于当前应用依赖。运行和部署说明以 README.md 为准。

## 入口与构建

- `index.html` → `src/main.tsx`：加载语言资源，以 React `createRoot` 启动浏览器应用。
- `src/App.tsx`：React Router、共享布局、语言上下文、页面选择和客户端 SEO 更新。
- `src/entry-server.tsx`：通过 React `renderToString` 与 MemoryRouter 预渲染页面。
- `script/generate-seo-pages.mjs`：构建后生成 12 种语言的首页、更新日志和 77 个工具页面，共 948 页，并从工具目录生成站点地图。
- `backend/main.go`：提供 API 和 `dist/` 静态文件，处理规范 URL 重定向及 404。

`src/app/[locale]/.../page.tsx` 沿用迁移前的文件命名。Vite 的 `import.meta.glob` 负责收集工具模块；目录名本身没有框架路由功能。不要添加 Next layout、middleware 或服务端 API 文件。

## 开发命令

使用 npm 和 `package-lock.json` 管理依赖，Docker 构建执行 `npm ci`。

```bash
npm install
npm run dev:full
npm run build
npm run lint
npm run test:run
npm run test:api
npm run test:browser
```

- 开发前端端口：5173；API 端口：8080。
- `npm run lint` 执行 TypeScript 检查。
- `npm run build` 包含类型检查、Vite 构建及 SEO 页面预渲染。
- Linux 容器部署：`bash deploy.sh`，具体环境变量见 `.env.example` 与 README。

## 模块与规范

- `src/components/`：业务组件及 shadcn/ui 基础组件，优先复用已有组件。
- `src/lib/`：工具配置和纯函数。
- `src/i18n/config.ts`：12 种语言配置，默认 en 无路径前缀，其余使用 `/{locale}`。
- `src/i18n/compat.tsx`：项目自有翻译上下文；直接从 `@/i18n/compat` 引入 `useLocale`、`useTranslations`。
- `src/i18n/messages/*-additions/{locale}.json`：新增工具的 12 语言分组字典，通过 `src/i18n/additions.ts` 在客户端和预渲染中合并。
- `src/i18n/navigation.ts`：基于 React Router 的本地化 `Link`、`useRouter`、`usePathname`。
- `src/seo/metadata.ts`：客户端与构建预渲染共享的 SEO 规则。

工具功能优先在客户端实现，所有界面文本同步维护 12 种语言。新增工具需更新 `src/lib/tools-config.ts`、创建工具组件、补充翻译与 SEO 数据。保留可访问性、移动端及深浅色主题支持。

使用普通 `<img>` 展示本地图片与数据 URL，使用 `@/i18n/navigation` 的 `Link` 导航。不引入 `next/*`、`next-intl` 或相应别名。

## 验证与历史资料

Vitest 覆盖工具页面、翻译、SEO 和工具函数，Go API 使用 `go test`，Playwright 通过 `npm run test:browser` 验证真实浏览器交互、语言、RTL 和移动端。修改后执行相关测试及生产构建。

`docs/seo-parity-audit.md` 与 `script/check-seo-parity.mjs` 保留迁移时对上游 SEO 的校验记录；后者按需使用独立 Next.js 参考依赖，不属于构建或应用运行链路。历史更新日志可保留原架构名称。
