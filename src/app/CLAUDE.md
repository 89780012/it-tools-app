[项目架构](../../CLAUDE.md)

# 页面模块

`src/app/` 保存 React 页面组件与全局样式。当前应用由 Vite 构建，入口为 `src/main.tsx`，路由和共享布局在 `src/App.tsx`。

`[locale]/page.tsx` 为首页，`[locale]/changelog/page.tsx` 为更新日志，`[locale]/tools/*/page.tsx` 为工具组件。目录名称保留迁移前的组织方式，语言解析和模块加载由应用代码实现。

## 开发规范

- 页面使用 TypeScript 和 React Hooks，不需要 Next 的 `use client` 指令、layout 或 metadata 导出。
- 翻译从 `@/i18n/compat` 引入 `useTranslations`；导航从 `@/i18n/navigation` 引入 `Link`。
- 工具登记在 `src/lib/tools-config.ts`，翻译维护全部 12 种语言。
- SEO 规则在 `src/seo/metadata.ts`；构建预渲染通过 `src/entry-server.tsx` 复用页面组件。
- 避免在模块加载或初始渲染时无条件调用浏览器专属 API，以支持构建预渲染。
- 图片使用普通 `<img>`，工具页面复用现有 UI、复制/下载、错误处理及响应式布局。

## 验证

`npm run build` 检查类型、打包并预渲染所有语言页面。`npm run test:run` 包含 `src/app/__tests__/tool-pages.test.tsx` 的页面渲染检查。浏览器开发环境可通过 `script/browser-route-audit.js` 检查真实路由与懒加载模块。
