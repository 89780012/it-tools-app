# 2026-11-26：JSON / JSON Lines 转换器

## 工具与范围

- 名称：JSON / JSON Lines 转换器。
- 默认路由：`/tools/json-lines-converter`；中文路由：`/zh/tools/json-lines-converter`。
- 现有目录已有 JSON 格式化、CSV/YAML/XML/TOML 转换，但没有 JSON 数组与 JSON Lines（JSONL / NDJSON）双向转换。本次只增加该工具，用于日志导出、逐行数据集与 JSON 数组之间的转换。
- 输入支持粘贴和本地 UTF-8 文件导入。按 `.json`、`.jsonl`、`.ndjson` 扩展名选择方向；其他扩展名保留当前方向。
- 提供方向切换、空行策略、示例、转换、清空、记录计数、复制和 `.jsonl` / `.json` 下载。空数组产生可下载的空文件。
- 处理完全在浏览器内完成，不上传输入，不新增 npm 依赖或后端服务。

## 实现与边界

- `src/lib/json-lines.ts` 使用现有 `lossless-json`，保留大整数、小数、指数和负零的数值文本。保留嵌套对象、数组、布尔值、null 和字符串转义。
- JSON 输入顶层必须是数组；JSON Lines 每个物理行可为任意 JSON 值。支持 LF、CRLF、文件开头 BOM 和末尾换行。可选择跳过空行，并显示跳过数量。
- 无效记录显示原始物理行号，不输出部分转换结果。语法错误、冲突的重复键、非 UTF-8 文件、读取失败及复制/下载失败均有提示。
- 输入限制为 UTF-8 5 MiB、50,000 条记录、100 层嵌套。JSON 数组输出每条记录使用紧凑格式，避免缩进造成输出过度膨胀。
- 编辑输入、切换选项、加载示例或清空均清除旧结果。文件异步读取完成后会核对操作版本，避免恢复已清空或已替换的内容。
- 复用 Workbench、Panel、Field、Button、Input、Textarea 和下载函数。增加目录条目、搜索别名及数据转换相关工具推荐。
- 新增 `json-lines-additions` 全部 12 种语言字典，包含界面、错误和 SEO 文案。沿用现有路由、字典合并与 SEO 预渲染机制；工具总数为 74，包含隐藏的翻译工具，当前菜单显示 73 个工具。

## 检查记录

检查在本 worktree 的生产构建上完成，未访问外部转换服务。

| 检查 | 结果 |
| --- | --- |
| `npm run test:run` | 34 个测试文件、641 项测试通过，包括新工具核心及交互测试、目录完整性、12 语言键与插值、SEO 和现有网络回归测试。 |
| `npm run lint` | TypeScript 检查通过。 |
| `npm run test:run -- src/app/__tests__/json-lines-converter.test.tsx` | 修正测试查询参数后再次验证，6 项通过。 |
| `npm run build` | 类型检查、Vite 构建和预渲染通过，生成 912 页（12 × 76）及目录驱动的站点地图。 |
| `npx playwright test --config playwright.json-lines.config.ts` | Chromium 3 组检查全部通过，耗时约 14 秒，无页面运行时错误。专用配置启动本地生产预览，不启动或依赖 Go。 |
| 构建 HTML 核验 | 新路由的全部 12 语言初始 HTML 均包含本地化名称、description、正确 canonical 和 12 条 hreflang。 |
| `git diff --check` | 通过。 |

核心测试包括双向混合数据、Unicode 与换行转义、大整数/小数/指数/负零、BOM/CRLF、严格空行模式、物理行号、非法 JSON、冲突的重复键、原型相关键、空数组，以及字节数、记录数和嵌套深度的边界。

浏览器检查包括：示例转换、真实剪贴板读写、下载文件名和实际内容、空文件下载、NDJSON 文件导入及方向选择、JSON 反向下载、错误行号、非 UTF-8 文件拒绝、清空与旧结果失效。所有 `/api/*` 请求被测试拦截，工具仍正常工作。

全部 12 种语言在 390px 宽度下完成转换，检查翻译键未泄漏、页面无横向溢出及阿拉伯语 RTL。390px 和 1440px 下实际切换深浅色主题并截图；已查看中文移动端、阿拉伯语移动端和英文深色桌面截图，布局与交互控件正常。

报告和截图保存在本 worktree 的忽略目录，不纳入源码提交：

- `test-results/json-lines/results.json`
- `test-results/json-lines/report/index.html`
- `test-results/json-lines/runs/`（6 张截图）

首次验证发现新增测试把 Playwright 的 `exact` 参数用于 Testing Library，以及 `toHaveValue` 不支持的非对称字符串匹配；已修正测试 API 用法并重新通过类型检查、页面测试及生产构建，没有删除测试或降低断言要求。

## 剩余限制与保留项

- 本机没有中文字体，中文截图字形显示为方框；中文 DOM 文本、翻译字典、交互和 SEO 检查通过。未修改系统字体或配置，中文实际字形仍需在具备 CJK 字体的浏览器中复核。
- 构建保留现有依赖的提示：TOML 的 `stream` 浏览器外部化和 `eval`、英语字典同时静态/动态导入、超过 500 kB 的分包。构建未失败，未调整检查门槛。
- 本次未修改后端，未运行 Go 测试；浏览器验证使用本工具专用的纯前端生产预览配置。
- 已核对 `docs/api-network-deployment.md`，保留翻译菜单隐藏、AliDNS 单服务商和现有网络修复。
- 未修改 `.env`、依赖清单、部署配置、Tunnel、系统配置、自动化脚本或主工作目录；未提交、推送或部署。
