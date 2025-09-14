# 侧边栏重构 - shadcn Sidebar 升级计划

## 任务概述
将现有的自定义侧边栏实现完全重构为 shadcn Sidebar 组件，获得现代化的交互体验和完整功能集。

## 技术上下文
- **项目**: IT工具集合 (it-tools-app)
- **技术栈**: Next.js 15.5.2 + React 19.1.0 + TypeScript + Tailwind CSS 4
- **UI框架**: shadcn/ui + Radix UI
- **国际化**: next-intl 4.3.6 (中文/英文/Hindi)
- **当前工具**: 3个JSON工具 (格式化器、转CSV、转YAML)

## 执行计划

### 阶段1: 架构重构
- [x] 备份原始文件 (安全保障)
- [ ] 重构 `layout-client.tsx` - 集成 SidebarProvider
- [ ] 重写 `app-sidebar.tsx` - 完全采用 shadcn 组件
- [ ] 升级 `header.tsx` - 添加 SidebarTrigger

### 阶段2: 功能集成
- [ ] 保持所有现有功能 (国际化、工具导航、图标映射)
- [ ] 添加 shadcn 高级特性 (状态持久化、键盘快捷键)
- [ ] 优化移动端体验 (Sheet 抽屉模式)

### 阶段3: 测试验证
- [ ] 基础功能测试 (导航、主题、国际化)
- [ ] shadcn 特性测试 (快捷键、持久化、移动端)
- [ ] 回归测试和性能验证

## 预期收益
- ✅ 现代化侧边栏交互体验
- ✅ 内置状态持久化 (Cookie记忆用户偏好)
- ✅ 键盘快捷键支持 (Cmd/Ctrl+B)
- ✅ 专业的移动端体验 (Sheet抽屉)
- ✅ 更稳定和可维护的组件架构
- ✅ 更好的可访问性支持

## 文件变更清单
1. `src/app/[locale]/layout-client.tsx` - 布局架构重构
2. `src/components/app-sidebar.tsx` - 侧边栏组件完全重写
3. `src/components/header.tsx` - Header集成 SidebarTrigger

## 回滚策略
- 所有原始文件已备份为 `.backup` 后缀
- 分阶段提交，便于精确回滚
- 详细记录所有变更点

---
**创建时间**: 2025-09-14
**执行状态**: 进行中
**预期完成**: 4-6小时