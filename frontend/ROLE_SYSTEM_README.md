# 统一角色管理系统

## 概述

这个统一的角色管理系统提供了一个集中式的方式来管理用户角色，支持动态从后端获取角色列表，并提供统一的角色显示名称映射。

## 核心特性

- 🔄 **动态角色加载**: 自动从后端API获取最新的角色列表
- 🎨 **统一显示映射**: 提供一致的角色显示名称和样式配置
- 🔧 **可扩展配置**: 支持添加自定义角色映射和配置
- 💾 **缓存机制**: 避免重复请求，提高性能
- 🌐 **全局可用**: 可在任何模块中使用，保证一致性

## 文件结构

```
frontend/
├── src/
│   └── config/
│       └── roles.ts          # 核心角色管理系统
├── pages/
│   └── admin/
│       └── users.ts          # 用户管理页面（使用示例）
└── examples/
    └── role-usage-examples.ts # 使用示例
```

## 快速开始

### 1. 初始化角色系统

在应用启动时初始化角色系统：

```typescript
import { initializeRoleSystem } from './src/config/roles';

// 在应用启动时调用
async function initApp() {
    await initializeRoleSystem();
}
```

### 2. 基本使用

```typescript
import { getRoleDisplayName, getRoleConfig } from './src/config/roles';

// 获取角色显示名称
const displayName = getRoleDisplayName('admin'); // "管理员"

// 获取角色详细配置
const config = getRoleConfig('admin');
console.log(config); 
// {
//   name: 'admin',
//   displayName: '管理员',
//   description: '系统管理员，拥有所有权限',
//   color: 'red',
//   icon: 'fas fa-crown'
// }
```

### 3. 在UI组件中使用

```typescript
import { roleManager } from './src/config/roles';

// 创建角色选择器
function createRoleSelector() {
    const roles = roleManager.getAllRoles();
    
    return roles.map(role => `
        <option value="${role.name}">
            ${role.displayName}
            ${role.description ? ` - ${role.description}` : ''}
        </option>
    `).join('');
}
```

## API 参考

### RoleManager 类

#### 方法

- `updateRolesFromBackend()`: 从后端更新角色列表
- `getRoleDisplayName(roleName)`: 获取角色显示名称
- `getRoleConfig(roleName)`: 获取角色配置
- `getAllRoles()`: 获取所有角色
- `getAllRoleNames()`: 获取所有角色名称
- `addCustomRole(roleName, config)`: 添加自定义角色映射
- `isInitialized()`: 检查是否已初始化

### 全局函数

- `getRoleDisplayName(roleName)`: 获取角色显示名称
- `getRoleConfig(roleName)`: 获取角色配置
- `initializeRoleSystem()`: 初始化角色系统

## 默认角色配置

系统预定义了以下角色：

| 角色名 | 显示名称 | 描述 | 颜色 | 图标 |
|--------|----------|------|------|------|
| admin | 管理员 | 系统管理员，拥有所有权限 | red | fas fa-crown |
| paid1 | VIP用户 | 付费用户等级1，可使用基础付费服务 | blue | fas fa-star |
| paid2 | 高级用户 | 付费用户等级2，可使用高级付费服务 | purple | fas fa-gem |
| user | 普通用户 | 基础用户，可使用免费服务 | gray | fas fa-user |

## 自定义角色

### 添加自定义角色映射

```typescript
import { roleManager } from './src/config/roles';

roleManager.addCustomRole('vip_plus', {
    displayName: 'VIP Plus用户',
    description: '高级VIP用户，享受所有特权',
    color: 'gold',
    icon: 'fas fa-diamond'
});
```

### 扩展默认配置

如果后端返回了新的角色，系统会自动添加到角色列表中。如果该角色在默认配置中存在，会使用默认配置的显示名称和样式；否则会使用角色原名作为显示名称。

## 后端API要求

角色管理系统需要后端提供以下API：

### GET /admin/roles

返回格式：
```json
{
    "success": true,
    "data": {
        "roles": [
            {
                "id": 1,
                "name": "admin",
                "description": "系统管理员",
                "created_at": "2025-01-01T00:00:00Z",
                "updated_at": "2025-01-01T00:00:00Z"
            }
        ]
    }
}
```

## 最佳实践

1. **应用启动时初始化**: 在应用的主入口点调用 `initializeRoleSystem()`
2. **使用统一函数**: 始终使用 `getRoleDisplayName()` 而不是硬编码角色名称
3. **动态更新**: 在需要最新角色数据时调用 `roleManager.updateRolesFromBackend()`
4. **错误处理**: 处理角色不存在的情况，提供合理的降级显示

## 使用示例

更多详细的使用示例请参考 `examples/role-usage-examples.ts` 文件。

## 注意事项

- 角色系统是单例模式，全局共享状态
- 初始化是异步的，确保在使用前完成初始化
- 角色配置支持颜色和图标，可用于UI显示
- 系统会自动合并默认配置和后端数据
