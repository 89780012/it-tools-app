[根目录](../../CLAUDE.md) > [src](../) > **hooks**

# React Hooks 模块文档

## 变更记录 (Changelog)

### 2025-09-07 22:58:58 - 模块文档初始化
- 📱 记录 `useIsMobile` Hook 实现和用法
- 🔍 识别移动端检测逻辑和响应式断点
- 📊 标记为基础模块，需要扩展更多 Hooks

---

## 模块职责

React Hooks 模块提供项目中使用的自定义 React Hooks，目前主要包含响应式设计相关的 Hook。这些 Hooks 封装了常用的状态逻辑和副作用，提高组件的可复用性。

## 入口与启动

### 当前 Hooks
- **`use-mobile.ts`** - 移动端检测 Hook

### 文件结构
```
hooks/
└── use-mobile.ts    # 移动端检测 Hook (20 行)
```

## 对外接口

### useIsMobile Hook
```typescript
export function useIsMobile(): boolean

// 使用方式
import { useIsMobile } from '@/hooks/use-mobile';

function MyComponent() {
  const isMobile = useIsMobile();
  
  return (
    <div>
      {isMobile ? '移动端布局' : '桌面端布局'}
    </div>
  );
}
```

### Hook 特性
- **响应式检测**: 实时监听窗口大小变化
- **断点配置**: 768px 作为移动端/桌面端分界线
- **初始状态**: 初始值为 `undefined`，避免水合不匹配
- **事件监听**: 使用 `matchMedia` API 监听媒体查询变化

## 关键依赖与配置

### React 依赖
- `react` - useState, useEffect Hooks

### 配置参数
```typescript
const MOBILE_BREAKPOINT = 768  // 移动端断点 (px)
```

### 实现细节
- 使用 `window.matchMedia` 进行媒体查询
- 监听窗口大小变化事件
- 组件卸载时清理事件监听器
- 返回 `!!isMobile` 确保布尔值类型

## 数据模型

### Hook 状态管理
```typescript
// 内部状态
const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

// 媒体查询监听
const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

// 变化处理
const onChange = () => {
  setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
}
```

### 断点逻辑
- **移动端**: `window.innerWidth < 768px`
- **桌面端**: `window.innerWidth >= 768px`
- **匹配 Tailwind**: 与 Tailwind CSS `md:` 断点一致

## 测试与质量

### 当前状态
- ❌ 缺少 Hook 单元测试
- ❌ 缺少响应式行为测试
- ❌ 缺少事件监听器清理测试
- ❌ 缺少 SSR 兼容性测试
- ✅ TypeScript 类型安全
- ✅ 事件监听器正确清理

### 测试建议
- **Hook 测试**: 使用 `@testing-library/react-hooks` 测试 Hook 逻辑
- **响应式测试**: 模拟窗口大小变化，验证状态更新
- **事件清理测试**: 验证组件卸载时事件监听器被正确移除
- **SSR 测试**: 确保服务端渲染时不会出错
- **性能测试**: 验证频繁窗口变化时的性能表现

## 常见问题 (FAQ)

### Q: 为什么初始状态是 `undefined`？
A: 避免服务端渲染和客户端渲染不匹配的问题。在服务端无法获取窗口大小，所以初始状态设为 `undefined`，客户端首次渲染后再设置真实值。

### Q: 768px 断点是如何选择的？
A: 768px 是常见的平板和手机分界线，也与 Tailwind CSS 的 `md:` 断点保持一致，确保 Hook 检测结果和 CSS 媒体查询行为一致。

### Q: 如何修改移动端断点？
A: 修改 `MOBILE_BREAKPOINT` 常量的值，但要注意与项目中其他响应式设计保持一致。

### Q: Hook 的性能如何？
A: 使用了 `matchMedia` API 和事件监听器，性能良好。在窗口大小变化时才会触发状态更新，避免了频繁的计算。

## 扩展建议

### 建议新增的 Hooks

#### useLocalStorage
```typescript
export function useLocalStorage<T>(
  key: string, 
  initialValue: T
): [T, (value: T) => void]
```

#### useDebounce
```typescript
export function useDebounce<T>(
  value: T, 
  delay: number
): T
```

#### useTheme
```typescript
export function useTheme(): {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}
```

#### useCopyToClipboard
```typescript
export function useCopyToClipboard(): {
  copy: (text: string) => Promise<boolean>;
  copied: boolean;
}
```

#### useLocalizedRouter (国际化路由)
```typescript
export function useLocalizedRouter(): {
  push: (href: string) => void;
  replace: (href: string) => void;
  currentLocale: Locale;
}
```

## 相关文件清单

### Hook 文件
- `use-mobile.ts` - 移动端检测 Hook (20 行)

### 使用示例
```typescript
// 在 shadcn/ui 组件中使用
import { useIsMobile } from '@/hooks/use-mobile';

export function AppSidebar() {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <MobileSidebar />; 
  }
  
  return <DesktopSidebar />;
}

// 在响应式组件中使用
export function ToolContainer() {
  const isMobile = useIsMobile();
  
  return (
    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
      {/* 内容 */}
    </div>
  );
}
```

---

*最后更新: 2025-09-07 22:58:58*