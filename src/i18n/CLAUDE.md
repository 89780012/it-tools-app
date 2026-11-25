[项目架构](../../CLAUDE.md)

# 国际化模块

当前国际化由项目自有 React Context 实现，直接依赖 React 和 React Router。翻译目录含 zh/en/es/de/fr/it/pt/ru/ja/ko/ar/hi 共 12 种语言，默认 en 不使用路径前缀，其余使用 `/{locale}`。

## 文件职责

- `config.ts`：语言列表、默认语言与 Locale 类型。
- `compat.tsx`：LocaleProvider、useLocale、useTranslations、语言字典缓存与按需加载、localePath。
- `navigation.ts`：本地化 Link、usePathname、useRouter、redirect。
- `index.ts`：语言偏好持久化。
- `messages/*.json`：翻译字典。
- `messages/*-additions/{locale}.json` 与 `additions.ts`：新增工具分组字典及深度合并，同步用于客户端、预渲染和 SEO。每组必须包含全部 12 种语言。
- `__tests__/compat.test.tsx`：翻译、路由和字典加载测试。

## 使用方式

```tsx
import { useLocale, useTranslations } from '@/i18n/compat'
import { Link } from '@/i18n/navigation'

const t = useTranslations()
const locale = useLocale()
// Link 自动添加当前语言前缀，href 传无前缀的应用路径。
```

保持各语言翻译键同步。翻译支持命名空间、`{name}` 插值、`t.raw()` 和 `t.has()`。浏览器入口先加载当前语言字典；预渲染通过 LocaleProvider 的 initialMessages 提供字典。

分组字典可以覆盖同名旧键，但未指定的嵌套键必须保留。`__tests__/additions.test.ts` 检查分组键、插值参数和全部工具元数据的完整性。

语言切换保持当前页面路径。阿拉伯语页面方向由共享 SEO/语言设置代码设为 RTL。不要添加 Next 专属请求配置、路由中间件或第三方 Next 翻译别名。

验证执行 `npm run test:run` 和 `npm run build`。
