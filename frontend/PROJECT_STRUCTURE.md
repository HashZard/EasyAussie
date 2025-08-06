# 📁 项目目录结构说明

## 🎯 重构后的清晰结构

### 📋 目录用途说明

```
frontend/
├── pages/                  # 📄 HTML页面文件 (用户访问的实际页面)
│   ├── service/           # 服务相关页面
│   │   ├── service.html   # 服务总览
│   │   ├── inspection.html # 房屋检查
│   │   ├── coverletter.html # 求职信服务
│   │   ├── application.html # 租房申请
│   │   └── airport-pickup.html # 机场接机
│   ├── auth/              # 认证相关页面
│   │   ├── login.html     # 登录页面
│   │   └── register.html  # 注册页面
│   ├── management/        # 管理后台页面
│   │   ├── admin.html     # 管理主页
│   │   ├── form-list.html # 表单列表
│   │   └── ...           # 其他管理页面
│   └── legacy/           # 📦 原版本备份
└── src/                  # 🛠️ 现代化源码
    ├── components/       # 🧩 可复用组件
    ├── controllers/      # 🎮 页面控制器 (原pages目录)
    │   ├── admin-page.ts # 管理后台逻辑控制器
    │   ├── demo-page.ts  # 演示页面控制器
    │   └── login-page.ts # 登录页面控制器
    ├── services/         # 🔧 核心服务
    ├── stores/           # 📦 状态管理
    ├── styles/           # 🎨 样式文件
    ├── types/            # 📝 TypeScript类型
    └── utils/            # 🛠️ 工具函数
```

## 🔄 重命名说明

### ✅ 问题解决
- **之前**: `src/pages/` 与根目录 `pages/` 命名冲突
- **现在**: `src/controllers/` 清楚表明这里存放页面逻辑控制器

### 📝 命名逻辑
- **`/pages/`**: HTML页面文件 - 用户直接访问
- **`/src/controllers/`**: TypeScript控制器 - 管理页面逻辑

### 🔗 引用更新
所有相关文件的import路径已更新：
- `'/src/pages/admin-page.js'` → `'/src/controllers/admin-page.js'`
- 确保所有引用正确指向新路径

## 🎯 新结构的优势

### 1. **清晰的职责分离**
- **HTML页面**: 结构和基础功能
- **TypeScript控制器**: 复杂逻辑和状态管理

### 2. **避免命名冲突**
- 不再有两个 `pages` 目录造成混淆
- 每个目录的用途一目了然

### 3. **更好的可维护性**
- 开发者能快速理解文件作用
- 新团队成员容易上手

### 4. **符合最佳实践**
- 遵循前端项目的常见约定
- 利于项目长期发展

## 🚀 使用指南

### 创建新页面时
1. **HTML页面**: 放在 `/pages/` 相应目录下
2. **复杂逻辑**: 创建对应的控制器到 `/src/controllers/`
3. **可复用组件**: 放在 `/src/components/`

### 示例
```typescript
// /pages/example/my-page.html
import { MyPageController } from '/src/controllers/my-page.js';

// /src/controllers/my-page.ts
export class MyPageController {
    // 页面逻辑处理
}
```

这样的结构更清晰、更专业！
