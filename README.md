# 沙锅导图

一个基于React的智能思维导图应用,支持自然对话式创建和编辑思维导图,集成AI助手实现智能问答。

## 主要特性

- 🤖 AI智能问答
- 📝 自然对话式编辑
- 🎯 直观的思维导图展示
- 🖱️ 支持缩放和拖拽
- ✨ 流畅的动画效果
- 📱 响应式布局

## 快速开始

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.14.0

### 安装
npm install

### 运行
启动后端服务:
npm run server:dev

启动前端开发服务器:
npm start

### 开发环境配置(可选)
1. 复制 `.env.example` 为 `.env`
2. 配置必要的环境变量:
REACT_APP_API_URL=http://localhost:3001
ARK_API_KEY=your_api_key
API_BASE_URL=your_base_url

## 项目结构
src/
├── components/ # 通用组件
├── features/ # 功能模块
│ ├── ai/ # AI 相关功能
│ ├── canvas/ # 画布功能
│ ├── nodes/ # 节点功能
│ └── layout/ # 布局功能
├── services/ # API 服务
├── hooks/ # 自定义 Hooks
└── shared/ # 共享工具和配置

## 技术栈
- React 18
- TypeScript
- D3.js - 布局算法
- Express - 后端服务
- OpenAI API - AI能力支持

## 使用说明

1. 创建节点
- 按 Tab 键创建新的问题节点
- 双击节点编辑内容

2. 操作画布
- 鼠标拖拽移动画布
- 滚轮缩放画布
- 点击节点选中

3. AI 问答
- 编辑问题节点触发 AI 回答
- 支持流式响应显示

## 开发指南

### 代码规范
- 使用 ESLint 和 Prettier 进行代码格式化
- 遵循 TypeScript 类型定义
- 组件采用函数式编程

## 布局系统

本项目实现了一个灵活的节点布局系统，用于处理思维导图中节点的动态布局。

### 布局系统架构

布局系统由以下几个主要部分组成：

1. **布局服务 (LayoutService)**：
   - 管理不同类型的布局算法
   - 提供统一的接口进行布局计算
   - 支持动态切换布局类型
   - 位于 `src/features/layout/services/LayoutService.js`

2. **布局管理器 (LayoutManager)**：
   - 实现具体的布局算法
   - 当前支持树形布局 (TreeLayoutManager)
   - 未来可扩展支持力导向布局、径向布局等
   - 位于 `src/features/layout/utils/treeLayout.js`

3. **布局配置 (LayoutConfig)**：
   - 集中管理布局参数
   - 支持自定义配置
   - 位于 `src/features/layout/config/layoutConfig.js`

### 使用方法

```javascript
// 使用默认布局服务
import { defaultLayoutService } from 'features/layout/services/LayoutService';

// 计算节点布局
const updatedNodes = defaultLayoutService.calculateLayout(nodes);

// 更新布局配置
defaultLayoutService.updateConfig({
  minNodeDistance: 100,
  questionAnswerGap: 200
});

// 切换布局类型
defaultLayoutService.setLayoutType(LAYOUT_TYPES.TREE);
```

### 扩展布局系统

要添加新的布局类型，需要：

1. 创建新的布局管理器类，实现 `calculateLayout` 方法
2. 在 `LayoutService` 中注册新的布局管理器
3. 在 `LAYOUT_TYPES` 中添加新的布局类型
