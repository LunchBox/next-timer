# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作提供指导。

## 项目概述

一个使用 Next.js 16.1.6、React 19 和 Tailwind CSS v4 构建的多玩家计时器应用。该应用允许配置多个计时器，支持不同玩家、最大分钟数、反向模式以及单/多计时器操作。所有设置和计时器状态都持久化保存在 localStorage 中。

## 开发命令

- `npm run dev` - 在 localhost:3000 启动开发服务器
- `npm run build` - 构建生产版本
- `npm start` - 启动生产服务器

未配置代码检查或测试脚本。项目使用严格模式的 TypeScript。

## 架构概述

该应用遵循客户端状态管理模式，使用自定义钩子将数据存储在 localStorage 中。主页面 (`app/page.tsx`) 协调多个计时器实例和设置。

### 关键目录

- `app/` - Next.js App Router 组件和页面
- `app/components/` - 可复用的 UI 组件 (Button, Timer, TimerSettings, TimerDialog)
- `hooks/` - 状态管理的自定义 React 钩子 (`useSettingStore`, `useTimerStore`, `useLocalStorage`)
- `config/` - 配置常量 (`setting.ts`)
- `types/` - TypeScript 接口 (`timer.ts`)
- `utils/` - 工具函数 (`confirmations.ts`)

### 状态管理

- **设置**: 由 `useSettingStore` 钩子管理。将 `maxMinutes` (1-60)、`playerCount` (1-40)、`allowMultiTimer`、`reverseMode` 存储在 localStorage 中。
- **计时器**: 由 `useTimerStore` 钩子（单个计时器）和 `useTimerStores`（多个计时器）管理。每个计时器状态包括 `time`、`isRunning`、`isLoaded`、`showTimeOut`。计时器数据按玩家 ID (`timer-0`、`timer-1` 等) 持久化保存。

### 计时器逻辑

- 使用 `requestAnimationFrame` 实现平滑更新。
- 支持**正常模式**（向上计数到最大值）和**反向模式**（从最大值向下计数）。
- 计时器循环基于 `performance.now()` 计算经过时间，并考虑暂停时间。
- 达到时间限制时显示超时对话框；在反向模式下，超时发生在零时刻。
- 如果 `allowMultiTimer` 为 false，则一次只能运行一个计时器，并且会为活动计时器显示大型对话框。

### 关键实现细节

- **Hydration 安全性**: 组件检查 `isClient` 状态以防止 SSR 不匹配。
- **稳定引用**: `useMemo` 确保计时器设置不会不必要地改变。
- **存储验证**: localStorage 值在加载时进行验证；无效数据回退到默认值。
- **三重确认**: 破坏性操作（全部重置、切换反向模式）使用三步确认 (`utils/confirmations.ts`)。

### 样式

- 使用 `@tailwindcss/postcss` 的 Tailwind CSS v4。无自定义配置文件；使用默认的 v4 设置。
- 通过 `dark:` 变体支持暗黑模式（尽管使用不多）。
- 按钮变体: `primary`, `secondary`, `danger`, `ghost`。

### 配置

- `config/setting.ts` 定义常量: `DEFAULT_MAX_MINUTES=15`, `DEFAULT_PLAYER_COUNT=10`, `MAX_MINUTES_LIMIT=60`, `MAX_PLAYER_COUNT=40`。
- 存储键使用 `timer-` 前缀进行命名空间隔离。

### 重要模式

1. **计时器 ID**: 从零开始；对应玩家编号（玩家 1 = ID 0）。
2. **最大计时器**: 在 `useTimerStores` 中始终创建 `MAX_PLAYER_COUNT` (40) 个计时器实例，然后切片到请求的数量。这确保在渲染过程中钩子调用一致。
3. **清除数据**: 更改 `maxMinutes` 或 `playerCount` 会清除受影响的计时器存储条目。
4. **反向模式切换**: 需要三重确认，并在切换前暂停所有正在运行的计时器。

### 添加功能时的注意事项

- 遵循现有模式：使用自定义钩子进行状态管理，使用 localStorage 进行持久化。
- 防御性地验证 localStorage 输入。
- 确保使用 `cancelAnimationFrame` 清理计时器循环。
- 对破坏性操作使用 `tripleConfirm` 工具函数。
- 使用浏览器 API 时保持组件为客户端 (`"use client"`)。

### 备注

- 目前未使用 API 路由或服务器组件。
- 无数据库（Prisma 在 devDependencies 中但未使用）。
- 应用完全是客户端；持久化仅使用 localStorage。
- 项目设置了路径别名 `@/*` 指向根目录。