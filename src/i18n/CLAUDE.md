[根目录](../../CLAUDE.md) > [src](../) > **i18n**

# 国际化模块文档

## 变更记录 (Changelog)

### 2025-09-07 19:36:52 - 模块文档初始化
- 分析自定义国际化系统架构
- 记录多语言支持实现

---

## 模块职责

国际化模块提供应用的多语言支持系统，目前支持中文（zh）和英文（en）两种语言。采用自定义的轻量级 i18n 实现，基于 React Context 提供全局语言状态管理和文本翻译功能。

## 入口与启动

- **主入口**: `index.ts` - 导出语言配置和类型定义
- **Context 提供者**: `context.tsx` - React Context 实现的 i18n 系统
- **语言包**: `locales/zh.json`、`locales/en.json` - 翻译文本资源

## 对外接口

### 类型定义
```typescript
export type Locale = 'zh' | 'en'
export type LocaleMessages = typeof zh
export const defaultLocale: Locale = 'zh'
```

### Context API
```typescript
interface I18nContextType {
  locale: Locale                    // 当前语言
  setLocale: (locale: Locale) => void  // 切换语言
  t: (key: string) => string          // 翻译函数
}

// Hook 使用方式
const { locale, setLocale, t } = useI18n()
```

### 翻译函数
- 支持嵌套键值查找（如 `"tools.json-formatter.name"`）
- 找不到翻译时返回原始键值
- 类型安全的翻译键提示

## 关键依赖与配置

### React 依赖
- `react` - Context API 和 Hooks
- 无外部 i18n 库依赖，完全自实现

### 内部配置
- **默认语言**: 中文 (`zh`)
- **支持语言**: 中文 (`zh`)、英文 (`en`)
- **翻译文件格式**: JSON 嵌套对象结构

## 数据模型

### 语言包结构
```typescript
// zh.json / en.json 结构
{
  "common": {
    "tools": "工具",
    "language": "语言",
    "theme": "主题",
    // ... 通用文本
  },
  "header": {
    "title": "IT工具集合",
    "subtitle": "开发者必备工具箱"
  },
  "categories": {
    "json": "JSON工具",
    "text": "文本工具",
    // ... 分类名称
  },
  "tools": {
    "json-formatter": {
      "name": "JSON格式化器",
      "description": "格式化、验证和压缩JSON数据",
      // ... 工具相关文本
    }
  }
}
```

### 翻译键命名规范
- `common.*` - 通用文本（按钮、操作等）
- `header.*` - 页面头部相关
- `categories.*` - 工具分类名称
- `tools.{tool-id}.*` - 具体工具的文本

## 测试与质量

### 当前状态
- ❌ 缺少翻译完整性测试
- ❌ 缺少语言切换功能测试
- ❌ 缺少翻译文本格式验证
- ✅ TypeScript 类型安全
- ✅ 翻译键嵌套查找正常工作

### 测试建议
- **翻译覆盖测试**: 确保所有使用的翻译键都有对应翻译
- **语言切换测试**: 测试语言切换后 UI 正确更新
- **翻译函数测试**: 测试 `t()` 函数的各种场景
- **JSON 格式验证**: 验证语言包 JSON 文件格式正确

## 常见问题 (FAQ)

### Q: 如何添加新的语言？
A: 1) 在 `locales/` 目录添加新的语言 JSON 文件；2) 更新 `index.ts` 中的 `locales` 对象和 `Locale` 类型。

### Q: 如何添加新的翻译文本？
A: 在对应的语言 JSON 文件中添加键值对，建议保持 zh.json 和 en.json 结构一致。

### Q: 翻译键如何组织？
A: 使用点分隔的嵌套键（如 `tools.json-formatter.name`），按功能模块分组。

### Q: 如何处理动态翻译内容？
A: 当前不支持参数化翻译，需要在组件中组合静态翻译文本。

## 相关文件清单

### 核心文件
- `index.ts` - 语言配置导出 (12 行)
- `context.tsx` - i18n Context 实现 (45 行)

### 语言资源
- `locales/zh.json` - 中文翻译 (33 行)
- `locales/en.json` - 英文翻译

### 使用示例
```typescript
// 在组件中使用
const { t, locale, setLocale } = useI18n()

// 翻译文本
const title = t('header.title')              // "IT工具集合"
const toolName = t('tools.json-formatter.name')  // "JSON格式化器"

// 切换语言
setLocale('en')
```

---

*最后更新: 2025-09-07 19:36:52*