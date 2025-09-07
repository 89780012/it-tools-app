[根目录](../../CLAUDE.md) > [src](../) > **components**

# Components 模块文档

## 变更记录 (Changelog)

### 2025-09-07 19:36:52 - 模块文档初始化
- 分析 React 组件架构
- 记录 UI 组件库和业务组件

---

## 模块职责

Components 模块提供应用的完整 UI 组件体系，包括基础 UI 组件库（基于 shadcn/ui）和业务逻辑组件。负责用户界面展示、交互逻辑和主题切换功能。

## 入口与启动

- **UI 组件库**: `ui/` 目录包含所有基础 UI 组件
- **应用侧边栏**: `app-sidebar.tsx` - 主导航组件
- **页面头部**: `header.tsx` - 顶部工具栏
- **主题提供者**: `theme-provider.tsx` - 主题系统核心

## 对外接口

### 基础 UI 组件
- `Button` - 按钮组件，支持多种变体
- `Card` - 卡片容器组件
- `Input/Textarea` - 输入组件
- `Select` - 下拉选择组件
- `Dropdown Menu` - 下拉菜单
- `Sheet/Sidebar` - 侧边面板组件
- `Tooltip` - 工具提示
- `Skeleton` - 骨架屏加载
- `Separator` - 分割线

### 业务组件
- `AppSidebar` - 应用主侧边栏，展示工具分类和导航
- `Header` - 页面头部，包含标题和功能按钮
- `ThemeProvider` - 主题切换系统
- `ThemeToggle` - 主题切换按钮
- `LanguageToggle` - 语言切换按钮

## 关键依赖与配置

### UI 框架依赖
- `@radix-ui/react-*` - Radix UI 无障碍组件基础
- `lucide-react` - 图标库
- `class-variance-authority` - 组件变体管理
- `clsx` - 条件样式类组合

### 内部依赖
- `@/lib/utils` - 工具函数（cn 样式合并）
- `@/i18n/context` - 国际化 Hook
- `@/lib/tools-config` - 工具配置数据

### shadcn/ui 配置
```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide"
}
```

## 数据模型

### 工具分类显示
```typescript
// AppSidebar 组件中的图标映射
const iconMap = {
  braces: Braces,    // JSON 工具
  type: Type,        // 文本工具
  shield: Shield,    // 加密工具
  globe: Globe,      // 网络工具
  image: Image,      // 图片工具
  code: Code,        // 代码工具
}
```

### 主题系统
- 支持 `light`、`dark`、`system` 三种模式
- 基于 CSS Variables 的主题切换
- 禁用切换动画以避免闪烁

## 测试与质量

### 当前状态
- ❌ 缺少组件单元测试
- ❌ 缺少视觉回归测试
- ❌ 缺少可访问性测试
- ✅ TypeScript 类型安全
- ✅ shadcn/ui 组件已经过测试

### 测试建议
- **组件测试**: 使用 Jest + React Testing Library
- **视觉测试**: Storybook + Chromatic
- **可访问性测试**: @testing-library/jest-dom
- **交互测试**: 用户操作流程测试

## 常见问题 (FAQ)

### Q: 如何添加新的 UI 组件？
A: 使用 shadcn/ui CLI: `npx shadcn@latest add [component]`，或手动创建组件文件。

### Q: 如何自定义主题颜色？
A: 修改 `globals.css` 中的 CSS Variables，或调整 `components.json` 配置。

### Q: 如何确保组件可访问性？
A: shadcn/ui 基于 Radix UI，已内置可访问性支持。自定义组件需要遵循 ARIA 规范。

### Q: 组件样式如何管理？
A: 使用 Tailwind CSS 工具类 + CVA (Class Variance Authority) 管理组件变体。

## 相关文件清单

### 基础 UI 组件 (`ui/`)
- `button.tsx` - 按钮组件
- `card.tsx` - 卡片组件
- `input.tsx` - 输入框组件
- `textarea.tsx` - 多行文本框
- `select.tsx` - 选择器组件
- `dropdown-menu.tsx` - 下拉菜单
- `separator.tsx` - 分割线
- `sheet.tsx` - 侧边面板
- `tooltip.tsx` - 工具提示
- `skeleton.tsx` - 骨架屏
- `sidebar.tsx` - 侧边栏基础组件

### 业务组件
- `app-sidebar.tsx` - 应用侧边栏 (118 行)
- `header.tsx` - 页面头部
- `theme-provider.tsx` - 主题提供者
- `theme-toggle.tsx` - 主题切换按钮
- `language-toggle.tsx` - 语言切换按钮

### 配置文件
- `../../components.json` - shadcn/ui 配置
- `../lib/utils.ts` - 组件工具函数

---

*最后更新: 2025-09-07 19:36:52*