# 浏览器页面巡检结果

## 修复

`@iarna/toml/lib/create-date.js` 读取 `global.Date`，在 Vite 浏览器环境抛出 `ReferenceError: global is not defined`，导致 React 根节点清空。

在 `vite.config.ts` 中增加 `define: { global: 'globalThis' }`，同时作用于开发依赖预构建和生产构建。

## 浏览器巡检

地址：`http://127.0.0.1:5173`。

在内置浏览器中运行 `script/browser-route-audit.js`，逐条切换真实应用路由，等待公共布局、语言资源和工具懒加载模块渲染，检查正文、控件数量，并监听 `error` 和 `unhandledrejection`。全量检查采用浏览器内的客户端路由切换；不是逐 URL 重新加载文档，也不是仅请求 HTTP 或挂载隔离组件。

每种语言检查 44 个工具页、首页和更新日志，共 46 页。

| 语言 | 检查页面数 | 通过 | 失败 |
| --- | ---: | ---: | ---: |
| zh | 46 | 46 | 0 |
| en（默认无前缀） | 46 | 46 | 0 |
| es | 46 | 46 | 0 |
| de | 46 | 46 | 0 |
| fr | 46 | 46 | 0 |
| it | 46 | 46 | 0 |
| pt | 46 | 46 | 0 |
| ru | 46 | 46 | 0 |
| ja | 46 | 46 | 0 |
| ko | 46 | 46 | 0 |
| ar | 46 | 46 | 0 |
| hi | 46 | 46 | 0 |
| 合计 | 552 | 552 | 0 |

未发现白屏或未捕获运行异常。阿拉伯文的 `dir` 为 `rtl`。

## TOML 转换复查

另外直接导航加载以下两条中文路由，在开发服务（5173）和生产预览（4173）中均点击转换按钮，检查输出：

- `/zh/tools/json-to-toml`：示例 JSON 成功转换为 TOML，保留 title、port 及 database 嵌套配置。
- `/zh/tools/toml-to-json`：示例 TOML 成功转换为 JSON，port 为数值 8080，database 嵌套结构正确。

## 项目检查

`npm run check` 退出码为 0：TypeScript、Vite 生产构建、9 个前端测试文件的 144 个用例、Go API 测试均通过。

构建保留原有的 stream 外置、TOML 依赖 eval、英文翻译静态/动态导入和较大 chunk 提示。

## 覆盖边界与复用

本次全站检查针对页面加载与白屏；没有逐项操作每个工具的全部按钮，也没有验证需要外部服务、API 密钥或上传素材的完整业务流程。

在开发服务器的浏览器控制台可再次执行：

```js
await (await import('/script/browser-route-audit.js')).auditRoutes(['zh'])
```

返回每条路由的路径、标题、正文长度、控件数、未捕获异常和通过状态。可传入其他语言数组；多语言巡检耗时较长，建议按语言分批运行。

## 逐语言交互复查

后续通过页面语言菜单依次切换全部 12 种语言，验证整页刷新后保留当前工具路径，核对各语言的 JSON→TOML 页面标题，并逐语言实际执行 JSON→TOML→JSON 往返转换。

测试数据包含中文、重音字符 `café`、数值、布尔值 `false` 和嵌套对象。全部 12 种语言的数据往返保持一致，标题与对应翻译资源一致，未捕获运行异常。英文无前缀路径以及其他语言前缀均正确。

截图复查发现阿拉伯文的正文按 RTL 排列，但侧栏仍固定在左侧，造成输出区被遮挡。已在 `AppSidebar` 中按当前语言设置侧栏方向：阿拉伯文使用右侧，其余语言使用左侧。修复后浏览器测量英文、阿拉伯文的侧栏与正文重叠宽度均为 0；阿拉伯文保持 `dir="rtl"`，转换复查通过。

`script/browser-route-audit.js` 新增 `auditLocaleInteraction(nextLocale)`，可在 JSON→TOML 页面执行当前语言转换检查并通过语言菜单切到下一种语言。结果保存在当前标签页的 `sessionStorage['locale-interaction-results']`，可跨整页刷新保留，并包含正文与侧栏重叠检查。

本轮修复后再次执行 `npm run check`，生产构建、144 个前端测试和 Go API 测试通过。本轮逐语言交互复查集中于 TOML 双向转换和公共语言切换；前文的 552 条全站路由检查结果来自上一轮巡检。
