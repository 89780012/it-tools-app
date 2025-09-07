[根目录](../../CLAUDE.md) > [src](../) > **lib**

# 核心库模块文档

## 变更记录 (Changelog)

### 2025-09-07 19:36:52 - 模块文档初始化
- 分析核心工具库架构
- 记录工具配置和云服务集成

---

## 模块职责

核心库模块提供应用的基础设施和配置管理，包括工具配置定义、云服务集成（R2 存储、D1 数据库）、以及通用工具函数。是应用的数据层和服务层核心。

## 入口与启动

- **工具配置**: `tools-config.ts` - 工具分类和定义的中心配置
- **工具函数**: `utils.ts` - 通用工具函数库
- **R2 存储**: `r2-storage.ts` - Cloudflare R2 对象存储服务
- **D1 数据库**: `d1-database.ts` - Cloudflare D1 SQLite 数据库服务

## 对外接口

### 工具配置系统
```typescript
export interface Tool {
  id: string           // 工具唯一标识
  name: string         // 工具名称
  description: string  // 工具描述
  category: string     // 所属分类
  path: string         // 路由路径
  icon?: string        // 图标名称
}

export interface ToolCategory {
  id: string           // 分类唯一标识
  name: string         // 分类名称
  description: string  // 分类描述
  icon?: string        // 分类图标
  tools: Tool[]        // 该分类下的工具列表
}
```

### R2 存储服务
```typescript
export class R2Storage {
  // 上传文件到 R2
  uploadFile(key: string, file: File | Buffer, contentType?: string): Promise<string>
  
  // 获取文件访问 URL（带签名）
  getFileUrl(key: string, expiresIn?: number): Promise<string>
  
  // 删除文件
  deleteFile(key: string): Promise<void>
  
  // 获取文件流
  getFile(key: string): Promise<ReadableStream<Uint8Array> | null>
}
```

### D1 数据库服务
```typescript
export class D1DatabaseService {
  // 查询数据
  query<T>(sql: string, params?: any[]): Promise<T[]>
  
  // 查询单条记录
  queryFirst<T>(sql: string, params?: any[]): Promise<T | null>
  
  // 执行写操作
  execute(sql: string, params?: any[]): Promise<D1Result>
  
  // 批量执行
  batchExecute(queries: Array<{ sql: string; params?: any[] }>): Promise<D1Result[]>
  
  // 便捷的 CRUD 方法
  insert(tableName: string, data: Record<string, any>): Promise<D1Result>
  update(tableName: string, data: Record<string, any>, where: string, whereParams?: any[]): Promise<D1Result>
  delete(tableName: string, where: string, whereParams?: any[]): Promise<D1Result>
}
```

## 关键依赖与配置

### 云服务依赖
- `@aws-sdk/client-s3` - AWS S3 兼容客户端（用于 R2）
- `@aws-sdk/s3-request-presigner` - S3 预签名 URL 生成

### 工具函数依赖
- `clsx` - 条件样式类组合
- `tailwind-merge` - Tailwind 样式合并优化

### 类型定义
```typescript
// R2 配置接口
export interface R2Config {
  accountId: string        // Cloudflare 账户 ID
  accessKeyId: string      // R2 访问密钥 ID
  secretAccessKey: string  // R2 访问密钥
  bucketName: string       // 存储桶名称
  region?: string          // 区域（默认 'auto'）
}
```

## 数据模型

### 当前工具配置
```typescript
export const toolsConfig: ToolCategory[] = [
  {
    id: "json",
    name: "JSON工具",
    description: "JSON数据处理和验证工具",
    icon: "braces",
    tools: [
      {
        id: "json-formatter",
        name: "JSON格式化器",
        description: "格式化、验证和压缩JSON数据",
        category: "json",
        path: "/tools/json-formatter",
        icon: "code"
      }
    ]
  },
  // ... 其他分类（文本、加密、网络、图片工具）
]
```

### D1 数据库结构
- 支持标准 SQLite 语法
- 提供类型安全的查询结果
- 内置连接池和事务支持
- 元数据跟踪（执行时间、影响行数等）

## 测试与质量

### 当前状态
- ❌ 缺少工具函数单元测试
- ❌ 缺少 R2 服务集成测试
- ❌ 缺少 D1 数据库测试
- ✅ TypeScript 类型安全保证
- ✅ 工具配置数据验证

### 测试建议
- **单元测试**: Jest 测试工具函数和配置验证
- **集成测试**: R2/D1 服务的 Mock 测试
- **端到端测试**: 实际云服务环境测试
- **性能测试**: 数据库查询性能监控

## 常见问题 (FAQ)

### Q: 如何添加新的工具分类？
A: 在 `tools-config.ts` 的 `toolsConfig` 数组中添加新的 `ToolCategory` 对象。

### Q: 如何配置 R2 存储服务？
A: 创建 `R2Storage` 实例时传入包含 accountId、accessKeyId、secretAccessKey 和 bucketName 的配置对象。

### Q: D1 数据库如何处理事务？
A: 使用 `batchExecute` 方法可以在单个事务中执行多个 SQL 语句。

### Q: 工具函数 `cn` 的作用是什么？
A: `cn` 函数结合了 `clsx` 和 `tailwind-merge`，用于智能合并 CSS 类名，避免 Tailwind 样式冲突。

## 相关文件清单

### 核心配置
- `tools-config.ts` - 工具配置中心 (63 行)
- `utils.ts` - 通用工具函数库

### 云服务集成
- `r2-storage.ts` - Cloudflare R2 存储服务 (72 行)
- `d1-database.ts` - Cloudflare D1 数据库服务 (108 行)

### 依赖文件
- `../../package.json` - 项目依赖配置
- `../app/globals.css` - 全局样式（包含 Tailwind 配置）

---

*最后更新: 2025-09-07 19:36:52*