[根目录](../../CLAUDE.md) > [src](../) > **app**

# App Router 模块文档

## 变更记录 (Changelog)

### 2025-09-07 19:36:52 - 模块文档初始化
- 分析 Next.js App Router 结构
- 记录路由配置与页面组件

---

## 模块职责

App Router 模块负责应用的路由结构、布局组件和页面渲染。基于 Next.js 15.5.2 App Router 架构，提供现代化的文件系统路由和嵌套布局功能。

## 入口与启动

- **根布局**: `layout.tsx` - 应用全局布局，包含主题提供者和国际化上下文
- **首页**: `page.tsx` - 应用首页，展示工具分类和功能特点
- **工具布局**: `tools/layout.tsx` - 工具页面专用布局
- **工具页面**: `tools/*/page.tsx` - 各个工具的具体实现页面

## 对外接口

### 路由结构
```
/                    # 首页 - 工具概览
/tools/              # 工具页面布局
/tools/json-formatter # JSON 格式化工具
```

### 页面组件
- `RootLayout`: 全局布局组件，配置字体、主题、国际化
- `Home`: 首页组件，展示工具分类和统计信息
- `JsonFormatterPage`: JSON 格式化工具页面

## 关键依赖与配置

### 内部依赖
- `@/components/theme-provider` - 主题切换功能
- `@/i18n/context` - 国际化上下文
- `@/components/header` - 页面头部组件
- `@/components/app-sidebar` - 侧边栏导航
- `@/lib/tools-config` - 工具配置数据

### 外部依赖
- `next/font/google` - Google 字体加载
- `lucide-react` - 图标组件库

### 配置信息
- **字体配置**: Geist Sans + Geist Mono
- **元数据**: SEO 优化的标题和描述
- **语言设置**: 中文为默认语言 (zh-CN)
- **主题支持**: 系统主题、亮色/暗色切换

## 数据模型

### 页面元数据
```typescript
export const metadata: Metadata = {
  title: "IT工具集合 - 开发者必备工具箱",
  description: "专为开发者打造的在线工具集合，包含JSON格式化、文本处理、加密解密等实用工具"
}
```

### 字体配置
```typescript
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono", 
  subsets: ["latin"]
});
```

## 测试与质量

### 当前状态
- ❌ 缺少页面组件单元测试
- ❌ 缺少路由测试
- ❌ 缺少SEO测试
- ✅ TypeScript 类型检查通过

### 测试建议
- **页面渲染测试**: 使用 `@testing-library/react` 测试页面组件
- **路由测试**: 测试页面间导航功能
- **元数据测试**: 验证 SEO 元数据正确性
- **布局测试**: 测试响应式布局适配

## 常见问题 (FAQ)

### Q: 如何添加新的工具页面？
A: 在 `tools/` 目录下创建新文件夹，添加 `page.tsx` 文件，并在 `@/lib/tools-config.ts` 中注册工具配置。

### Q: 如何修改全局样式？
A: 编辑 `globals.css` 文件，或通过 `layout.tsx` 调整 Tailwind CSS 变量。

### Q: 如何配置新的字体？
A: 在 `layout.tsx` 中使用 `next/font` 加载字体，并添加到 CSS 变量中。

## 相关文件清单

### 核心文件
- `layout.tsx` - 根布局组件 (45 行)
- `page.tsx` - 首页组件 (167 行)
- `globals.css` - 全局样式
- `favicon.ico` - 网站图标

### 工具页面
- `tools/layout.tsx` - 工具页面布局
- `tools/json-formatter/page.tsx` - JSON 格式化工具 (178 行)

### 依赖文件
- `../../next.config.ts` - Next.js 配置
- `../../tsconfig.json` - TypeScript 配置
- `../../package.json` - 项目依赖

---

*最后更新: 2025-09-07 19:36:52*