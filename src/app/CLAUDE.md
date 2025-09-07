[根目录](../../CLAUDE.md) > [src](../) > **app**

# App Router 模块文档

## 变更记录 (Changelog)

### 2025-09-07 22:58:58 - 国际化路由重构
- 🌐 实现 `[locale]` 动态路由结构，支持多语言路径
- 📱 添加 `middleware.ts` 处理语言路由分发
- 🔄 保留旧版首页 (`page.tsx`) 以兼容现有路由
- ⚡ 升级到 Next.js 15.5.2 + next-intl 4.3.6
- 🛠️ 新增两个可用工具：JSON 格式化器、JSON 转 CSV

### 2025-09-07 19:36:52 - 模块文档初始化
- 分析 Next.js App Router 结构
- 记录路由配置与页面组件

---

## 模块职责

App Router 模块负责应用的路由结构、布局组件和页面渲染。基于 Next.js 15.5.2 App Router 架构，实现了完整的国际化路由系统，支持多语言路径和中间件路由分发。

## 入口与启动

### 核心布局
- **根布局**: `layout.tsx` - 应用全局布局，配置字体、主题提供者和国际化
- **中间件**: `../middleware.ts` - 处理语言路由分发和路径匹配

### 页面结构
```
app/
├── layout.tsx          # 根布局 (NextIntlClientProvider)
├── page.tsx           # 旧版首页 (兼容性保留)
├── globals.css        # 全局样式
├── favicon.ico        # 网站图标
└── [locale]/          # 动态语言路由
    ├── page.tsx       # 新版首页 (多语言)
    └── tools/         # 工具页面
        ├── json-formatter/
        │   └── page.tsx
        └── json-to-csv/
            └── page.tsx
```

## 对外接口

### 路由结构 (国际化)
```
/                           # 根路径 (重定向到默认语言)
/zh/                        # 中文首页
/en/                        # 英文首页  
/hi/                        # Hindi 首页
/zh/tools/json-formatter    # JSON 格式化工具 (中文)
/zh/tools/json-to-csv       # JSON 转 CSV 工具 (中文)
/en/tools/json-formatter    # JSON 格式化工具 (英文)
/en/tools/json-to-csv       # JSON 转 CSV 工具 (英文)
```

### 页面组件
- `RootLayout`: 全局布局组件，配置字体、主题、国际化上下文
- `Home` (旧版): 根路径首页，基础国际化支持
- `LocalizedHome` (新版): 本地化首页，完整多语言支持
- `JsonFormatterPage`: JSON 格式化工具页面
- `JsonToCsvPage`: JSON 转 CSV 工具页面

## 关键依赖与配置

### 内部依赖
- `@/components/theme-provider` - 主题切换功能
- `@/components/header` - 页面头部组件
- `@/components/app-sidebar` - 侧边栏导航  
- `@/components/tool-container` - 工具容器组件
- `@/lib/tools-config` - 工具配置数据
- `@/i18n/*` - 国际化配置与消息

### 外部依赖
- `next/font/google` - Google 字体加载 (Geist Sans/Mono)
- `next-intl` - 国际化支持 (4.3.6)
- `lucide-react` - 图标组件库
- `@radix-ui/*` - UI 基础组件
- `class-variance-authority` - 样式变体管理

### 配置信息
- **字体配置**: Geist Sans (--font-geist-sans) + Geist Mono (--font-geist-mono)
- **语言支持**: zh/en/hi (默认: en)
- **主题支持**: light/dark/system (默认: system)
- **路由模式**: App Router + 动态 `[locale]` 路由
- **中间件**: 自动语言检测与路由分发

## 数据模型

### 全局布局配置
```typescript
// layout.tsx
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono", 
  subsets: ["latin"],
});

// HTML lang 属性硬编码为 "zh"
<html lang="zh" suppressHydrationWarning>
```

### 工具页面数据结构
```typescript
// 工具页面状态模型
interface ToolPageState {
  input: string;           // 用户输入
  output: string;          // 处理结果
  error: string;           // 错误信息
  isValid: boolean;        // 验证状态
}

// 工具配置引用
import { toolsConfig } from "@/lib/tools-config"
const popularTools = toolsConfig.flatMap(category => category.tools).slice(0, 6)
```

## 测试与质量

### 当前状态
- ❌ 缺少页面组件单元测试
- ❌ 缺少路由测试 (特别是多语言路由)
- ❌ 缺少中间件测试
- ❌ 缺少SEO测试
- ❌ 缺少工具页面集成测试
- ✅ TypeScript 类型检查通过
- ✅ ESLint 静态检查通过

### 测试建议
- **路由测试**: 测试多语言路由切换和中间件重定向
- **页面渲染测试**: 使用 `@testing-library/react` 测试页面组件
- **国际化测试**: 测试 next-intl 翻译功能
- **工具功能测试**: 测试 JSON 工具的输入输出逻辑
- **SEO测试**: 验证多语言页面的元数据
- **可访问性测试**: 确保所有页面符合 a11y 标准

## 常见问题 (FAQ)

### Q: 如何添加新的工具页面？
A: 
1. 在 `tools/` 目录下创建新文件夹，添加 `page.tsx` 文件
2. 在 `@/lib/tools-config.ts` 中注册工具配置
3. 在 `@/i18n/messages/` 各语言文件中添加翻译文本
4. 确保使用 `"use client"` 和 `useTranslations()` Hook

### Q: 如何修改全局样式？
A: 编辑 `globals.css` 文件，或通过 `layout.tsx` 调整 CSS 变量和 Tailwind 配置。

### Q: 多语言路由如何工作？
A: 
- `middleware.ts` 拦截所有请求，检测语言并重定向
- `[locale]/` 动态路由处理具体的语言页面
- `next-intl` 提供翻译支持和本地化上下文

### Q: 旧版首页 `page.tsx` 还有用吗？
A: 目前保留用于兼容性，但新功能应该在 `[locale]/page.tsx` 中开发。

## 相关文件清单

### 核心文件
- `layout.tsx` - 根布局组件 (39 行)
- `page.tsx` - 旧版首页组件 (173 行)
- `[locale]/page.tsx` - 新版本地化首页 (173 行)
- `globals.css` - 全局样式和 CSS 变量
- `favicon.ico` - 网站图标

### 工具页面 (多语言)
- `[locale]/tools/json-formatter/page.tsx` - JSON 格式化工具 (179 行)
- `[locale]/tools/json-to-csv/page.tsx` - JSON 转 CSV 工具

### 配置文件
- `../middleware.ts` - 多语言路由中间件 (14 行)
- `../../next.config.ts` - Next.js 配置
- `../../tsconfig.json` - TypeScript 配置

### 样式文件  
- `globals.css` - Tailwind CSS 基础样式
- `../../tailwind.config.js` - Tailwind 配置
- `../../postcss.config.mjs` - PostCSS 配置

### 国际化支持
- `@/i18n/config.ts` - 语言配置 (zh/en/hi)
- `@/i18n/routing.ts` - 路由国际化配置
- `@/i18n/messages/zh.json` - 中文翻译 (93 行)
- `@/i18n/messages/en.json` - 英文翻译

---

*最后更新: 2025-09-07 22:58:58*