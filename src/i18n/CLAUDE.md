[根目录](../../CLAUDE.md) > [src](../) > **i18n**

# 国际化模块文档

## 变更记录 (Changelog)

### 2025-09-07 22:58:58 - 升级到 next-intl 4.3.6
- ⬆️ 从自定义 i18n 系统升级到 next-intl 4.3.6
- 🌐 新增 Hindi (hi) 语言支持，现支持 zh/en/hi
- 🔄 实现 `as-needed` 路由前缀模式 (默认语言无前缀)
- 📱 配置路由国际化和中间件集成
- 🎯 默认语言改为英文 (en)，禁用浏览器语言检测
- 📁 重构文件结构：`locales/` → `messages/`

### 2025-09-07 19:36:52 - 模块文档初始化
- 分析自定义国际化系统架构
- 记录多语言支持实现

---

## 模块职责

国际化模块提供应用的多语言支持系统，基于 next-intl 4.3.6 实现。支持中文（zh）、英文（en）和 Hindi（hi）三种语言，通过路由前缀和中间件实现自动语言检测和页面国际化。

## 入口与启动

### 核心配置文件
- **语言配置**: `config.ts` - 定义支持的语言列表和默认语言
- **路由配置**: `routing.ts` - next-intl 路由和前缀配置
- **导航工具**: `navigation.ts` - 国际化导航 API
- **服务端配置**: `request.ts` - 服务端渲染国际化支持

### 文件结构
```
i18n/
├── config.ts          # 语言配置 (zh/en/hi, 默认 en)
├── routing.ts         # 路由国际化配置
├── navigation.ts      # 导航 API (Link, redirect, useRouter)
├── request.ts         # 服务端国际化
├── index.ts          # 统一导出
└── messages/         # 翻译文件目录
    ├── zh.json       # 中文翻译 (93 行)
    ├── en.json       # 英文翻译
    └── hi.json       # Hindi 翻译 (如存在)
```

## 对外接口

### 语言配置
```typescript
// config.ts
export type Locale = (typeof locales)[number];
export const locales = ['zh', 'en', 'hi'] as const;
export const defaultLocale: Locale = 'en';
```

### 路由配置
```typescript
// routing.ts  
export const routing = defineRouting({
  locales: ['zh', 'en', 'hi'],
  defaultLocale: 'en',
  localePrefix: "as-needed",    // 默认语言不显示前缀
  localeDetection: false        // 禁用浏览器语言检测
});
```

### 国际化 Hooks (next-intl)
```typescript
// 在组件中使用
import { useTranslations, useLocale } from 'next-intl';

const t = useTranslations();
const locale = useLocale();

// 翻译文本
const title = t('header.title');
const toolName = t('tools.json-formatter.name');
```

### 导航 API
```typescript
// navigation.ts - 类型安全的国际化导航
import { Link, redirect, useRouter } from '@/i18n/navigation';

// 自动处理语言前缀的链接
<Link href="/tools/json-formatter">JSON 工具</Link>

// 编程式导航
const router = useRouter();
router.push('/tools/json-formatter');
```

## 关键依赖与配置

### 外部依赖
- `next-intl` 4.3.6 - 完整的 Next.js 国际化解决方案
- `next` 15.5.2 - Next.js 框架支持

### 路由集成
- **中间件**: `../middleware.ts` - 自动路由分发和语言检测
- **App Router**: `../app/[locale]/` - 动态语言路由
- **布局**: `../app/layout.tsx` - NextIntlClientProvider 配置

### 配置特点
- **路由模式**: `as-needed` (默认语言无前缀，其他有前缀)
- **默认语言**: English (en)
- **语言检测**: 禁用自动检测，手动控制
- **服务端渲染**: 支持 SSR 国际化

## 数据模型

### 翻译文件结构 (messages/*.json)
```typescript
// zh.json 结构示例
{
  "common": {
    "tools": "工具",
    "language": "语言", 
    "theme": "主题",
    "home": "首页",
    "search": "搜索",
    "clear": "清除",
    "copy": "复制",
    "format": "格式化",
    "minify": "压缩",
    "convert": "转换", 
    "download": "下载",
    "coming_soon": "即将推出更多工具...",
    "click_sidebar": "点击左侧菜单使用"
  },
  "theme": {
    "light": "亮色模式",
    "dark": "暗黑模式", 
    "system": "跟随系统"
  },
  "header": {
    "title": "IT工具集合",
    "subtitle": "开发者必备工具箱"
  },
  "meta": {
    "title": "IT工具集合 - 开发者必备工具箱",
    "description": "专为开发者打造的在线工具集合，包含JSON格式化、文本处理、加密解密等实用工具"
  },
  "home": {
    "tools_total": "工具总数",
    "tools_categories": "工具分类",
    "update_frequency": "更新频率",
    // ... 更多首页相关翻译
  },
  "categories": {
    "json": "JSON工具",
    "text": "文本工具",
    "crypto": "加密工具",
    "network": "网络工具",
    "image": "图片工具"
  },
  "tools": {
    "json-formatter": {
      "name": "JSON格式化器",
      "description": "格式化、验证和压缩JSON数据",
      "placeholder": "请输入JSON数据...",
      "invalid": "无效的JSON格式",
      // ... 更多工具相关翻译
    },
    "json-to-csv": {
      "name": "JSON转CSV", 
      "description": "将JSON数据转换为CSV格式",
      // ... 工具相关翻译
    }
  }
}
```

### 翻译键命名规范
- `common.*` - 通用 UI 文本（按钮、操作等）
- `theme.*` - 主题切换相关
- `header.*` - 页面头部相关
- `meta.*` - SEO 元数据
- `home.*` - 首页内容
- `categories.*` - 工具分类名称
- `tools.{tool-id}.*` - 具体工具的所有文本

## 测试与质量

### 当前状态
- ❌ 缺少翻译完整性测试
- ❌ 缺少语言切换功能测试
- ❌ 缺少路由国际化测试
- ❌ 缺少 Hindi 翻译文件
- ❌ 缺少翻译键覆盖率检查
- ✅ next-intl 类型安全
- ✅ 路由中间件正常工作
- ✅ 中英文翻译完整

### 测试建议
- **翻译覆盖测试**: 确保所有语言文件包含相同的翻译键
- **路由测试**: 测试多语言路由切换和重定向
- **中间件测试**: 测试语言检测和路由分发
- **翻译函数测试**: 测试 `useTranslations()` 的各种场景
- **参数化翻译测试**: 测试支持变量插值的翻译键
- **SEO 测试**: 验证多语言页面的元数据正确性

## 常见问题 (FAQ)

### Q: 如何添加新的语言？
A: 
1. 在 `config.ts` 中添加新语言到 `locales` 数组
2. 在 `messages/` 目录创建对应的 JSON 翻译文件
3. 确保翻译文件包含所有现有的翻译键

### Q: 如何添加新的翻译文本？
A: 在所有语言的 `messages/*.json` 文件中同步添加相同的键值对，保持结构一致。

### Q: 路由前缀如何工作？
A: 
- 默认语言 (en): `/tools/json-formatter` (无前缀)
- 其他语言 (zh): `/zh/tools/json-formatter` (有前缀)
- 中间件自动处理重定向

### Q: 如何处理带参数的翻译？
A: next-intl 支持参数化翻译，例如：
```json
"tools_count": "{count} 个工具"
```
```typescript
t('tools_count', { count: 5 })  // "5 个工具"
```

### Q: 如何在服务端组件中使用翻译？
A: 使用 `request.ts` 中的 `getTranslations` 函数：
```typescript
import { getTranslations } from '@/i18n/request';

const t = await getTranslations('common');
const title = t('title');
```

## 相关文件清单

### 配置文件
- `config.ts` - 语言配置 (4 行)
- `routing.ts` - 路由国际化配置 (14 行)  
- `navigation.ts` - 国际化导航 API
- `request.ts` - 服务端国际化支持
- `index.ts` - 统一导出

### 翻译文件
- `messages/zh.json` - 中文翻译 (93 行，完整)
- `messages/en.json` - 英文翻译 (预期完整)
- `messages/hi.json` - Hindi 翻译 (待添加)

### 集成文件  
- `../middleware.ts` - 路由中间件 (14 行)
- `../app/layout.tsx` - NextIntlClientProvider 配置
- `../app/[locale]/` - 多语言路由结构

### 使用示例
```typescript
// 客户端组件
import { useTranslations, useLocale } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations();
  const locale = useLocale();
  
  return (
    <div>
      <h1>{t('header.title')}</h1>
      <p>Current locale: {locale}</p>
    </div>
  );
}

// 类型安全的导航
import { Link } from '@/i18n/navigation';

<Link href="/tools/json-formatter">
  {t('tools.json-formatter.name')}
</Link>
```

---

*最后更新: 2025-09-07 22:58:58*