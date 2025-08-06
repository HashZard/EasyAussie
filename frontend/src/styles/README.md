# EasyAussie 样式系统指南

## 概述

EasyAussie 采用模块化的 CSS 样式系统，结合了 Tailwind CSS 和自定义组件样式，为项目提供一致、现代化的设计体验。

## 目录结构

```
src/styles/
├── main.css                 # 主样式文件，导入所有模块
├── base/
│   ├── variables.css        # CSS 自定义属性（变量）
│   └── reset.css           # 重置样式和基础样式
├── components/
│   ├── buttons.css         # 按钮组件样式
│   ├── forms.css           # 表单组件样式
│   └── layout.css          # 布局和卡片组件样式
└── pages/
    └── result-pages.css    # 结果页面专用样式
```

## 设计系统

### 颜色体系

#### 主色调
- `--ea-primary-500`: #3b82f6 (主要蓝色)
- `--ea-primary-600`: #2563eb (深蓝色)
- `--ea-primary-700`: #1d4ed8 (更深蓝色)

#### 状态色彩
- `--ea-success-600`: #16a34a (成功绿色)
- `--ea-error-600`: #dc2626 (错误红色)
- `--ea-warning-600`: #d97706 (警告橙色)

#### 中性色彩
- `--ea-gray-50` 到 `--ea-gray-900`: 完整的灰色色阶

### 间距系统

- `--ea-spacing-xs`: 0.25rem (4px)
- `--ea-spacing-sm`: 0.5rem (8px)
- `--ea-spacing-md`: 1rem (16px)
- `--ea-spacing-lg`: 1.5rem (24px)
- `--ea-spacing-xl`: 2rem (32px)
- `--ea-spacing-2xl`: 3rem (48px)

### 字体系统

- `--ea-text-xs`: 0.75rem (12px)
- `--ea-text-sm`: 0.875rem (14px)
- `--ea-text-base`: 1rem (16px)
- `--ea-text-lg`: 1.125rem (18px)
- `--ea-text-xl`: 1.25rem (20px)
- `--ea-text-2xl`: 1.5rem (24px)
- `--ea-text-3xl`: 1.875rem (30px)

## 组件样式

### 按钮组件

#### 基础按钮
```html
<button class="ea-btn ea-btn-primary">主要按钮</button>
<button class="ea-btn ea-btn-secondary">次要按钮</button>
<button class="ea-btn ea-btn-outline">轮廓按钮</button>
```

#### 按钮尺寸
```html
<button class="ea-btn ea-btn-primary ea-btn-sm">小按钮</button>
<button class="ea-btn ea-btn-primary">默认按钮</button>
<button class="ea-btn ea-btn-primary ea-btn-lg">大按钮</button>
<button class="ea-btn ea-btn-primary ea-btn-xl">超大按钮</button>
```

#### 按钮状态
```html
<button class="ea-btn ea-btn-success">成功按钮</button>
<button class="ea-btn ea-btn-danger">危险按钮</button>
<button class="ea-btn ea-btn-warning">警告按钮</button>
<button class="ea-btn ea-btn-text">文本按钮</button>
```

#### 带图标的按钮
```html
<button class="ea-btn ea-btn-primary">
    <svg class="ea-btn-icon">...</svg>
    按钮文字
</button>
```

### 表单组件

#### 基础表单元素
```html
<div class="ea-field">
    <label class="ea-label">标签</label>
    <input type="text" class="ea-input" placeholder="请输入...">
</div>

<div class="ea-field">
    <label class="ea-label">文本域</label>
    <textarea class="ea-textarea" placeholder="请输入..."></textarea>
</div>

<div class="ea-field">
    <label class="ea-label">选择框</label>
    <select class="ea-select">
        <option>选项1</option>
        <option>选项2</option>
    </select>
</div>
```

#### 表单布局
```html
<form class="ea-form">
    <div class="ea-form-row">
        <div class="ea-inline-field">
            <label class="ea-inline-label">姓名</label>
            <input type="text" class="ea-input">
        </div>
        <div class="ea-inline-field">
            <label class="ea-inline-label">年龄</label>
            <input type="number" class="ea-number-input">
        </div>
    </div>
</form>
```

#### 表单状态
```html
<div class="ea-field ea-field-error">
    <label class="ea-label">有错误的字段</label>
    <input type="text" class="ea-input">
    <span class="ea-error-text">这是错误提示</span>
</div>

<div class="ea-field ea-field-success">
    <label class="ea-label">成功的字段</label>
    <input type="text" class="ea-input">
    <span class="ea-success-text">验证成功</span>
</div>
```

### 布局组件

#### 卡片
```html
<div class="ea-card">
    <div class="ea-card-header">
        <h3>卡片标题</h3>
    </div>
    <div class="ea-card-body">
        <p>卡片内容</p>
    </div>
    <div class="ea-card-footer">
        <button class="ea-btn ea-btn-primary">操作</button>
    </div>
</div>
```

#### 区域容器
```html
<div class="ea-section">
    <h2 class="ea-section-title">区域标题</h2>
    <p>区域内容</p>
</div>
```

#### 网格布局
```html
<div class="ea-grid ea-grid-3">
    <div>项目1</div>
    <div>项目2</div>
    <div>项目3</div>
</div>
```

#### Flexbox 布局
```html
<div class="ea-flex ea-items-center ea-justify-between">
    <span>左侧内容</span>
    <span>右侧内容</span>
</div>
```

### 特殊页面组件

#### 结果页面
```html
<body class="ea-success-page">
    <main class="ea-result-container">
        <div class="ea-result-animation ea-success-animation">
            <div class="ea-result-icon-container">
                <div class="ea-result-icon-bg ea-success-icon-bg">
                    <svg class="ea-success-icon">...</svg>
                </div>
            </div>
        </div>
        
        <div class="ea-result-card">
            <h1 class="ea-result-title ea-success-title">成功标题</h1>
            <p class="ea-result-description">描述文字</p>
            
            <div class="ea-result-info-box ea-success-info-box">
                <h3 class="ea-result-info-title ea-success-info-title">
                    信息标题
                </h3>
                <ul class="ea-result-steps">
                    <li class="ea-result-step">
                        <span class="ea-result-step-number ea-success-step-number">1</span>
                        <span class="ea-result-step-text ea-success-step-text">步骤文字</span>
                    </li>
                </ul>
            </div>
            
            <div class="ea-result-actions">
                <button class="ea-btn ea-btn-primary">主要操作</button>
                <button class="ea-btn ea-btn-secondary">次要操作</button>
            </div>
        </div>
    </main>
</body>
```

## Tailwind CSS 集成

系统同时支持自定义样式类和 Tailwind CSS 类：

### 自定义类 vs Tailwind 类

```html
<!-- 自定义样式类 -->
<button class="ea-btn ea-btn-primary">自定义按钮</button>

<!-- Tailwind 样式类 -->
<button class="ea-btn-primary-tw">Tailwind 按钮</button>
```

### 混合使用
```html
<div class="ea-card bg-white p-6 rounded-lg shadow-sm">
    <!-- 可以混合使用自定义类和 Tailwind 类 -->
</div>
```

## 响应式设计

### 断点系统
- `--ea-breakpoint-sm`: 640px
- `--ea-breakpoint-md`: 768px
- `--ea-breakpoint-lg`: 1024px
- `--ea-breakpoint-xl`: 1280px

### 响应式类
```html
<div class="ea-grid ea-grid-1 ea-grid-md-2 ea-grid-lg-3">
    <!-- 移动端1列，平板2列，桌面3列 -->
</div>
```

## 动画系统

### 内置动画
- `ea-success-animation`: 成功页面动画
- `ea-error-animation`: 错误页面动画
- `animate-fadeIn`: 淡入动画
- `animate-slideUp`: 向上滑入动画
- `animate-slideDown`: 向下滑入动画

### 使用示例
```html
<div class="animate-fadeIn">
    <!-- 内容会淡入显示 -->
</div>
```

## 最佳实践

### 1. 优先使用组件类
```html
<!-- 推荐 -->
<button class="ea-btn ea-btn-primary">按钮</button>

<!-- 避免 -->
<button style="background: blue; padding: 8px;">按钮</button>
```

### 2. 保持一致性
```html
<!-- 统一使用间距变量 -->
<div class="ea-p-lg ea-m-md">内容</div>
```

### 3. 语义化命名
```html
<!-- 使用语义化的类名 -->
<div class="ea-form-group">
    <div class="ea-field">
        <label class="ea-label">标签</label>
        <input class="ea-input">
    </div>
</div>
```

### 4. 响应式优先
```html
<!-- 考虑移动端体验 -->
<div class="ea-grid ea-grid-1 ea-grid-md-2">
    <!-- 移动端单列，桌面端双列 -->
</div>
```

## 兼容性

### 浏览器支持
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 渐进增强
系统支持渐进增强，在不支持某些特性的浏览器中会有优雅降级。

### 无障碍
- 所有交互元素都有适当的焦点样式
- 支持键盘导航
- 符合 WCAG 2.1 AA 标准

## 维护指南

### 添加新组件
1. 在相应的 CSS 文件中添加样式
2. 在 `main.css` 中导入（如果是新文件）
3. 更新此文档
4. 添加使用示例

### 修改现有组件
1. 考虑向后兼容性
2. 更新相关文档
3. 测试所有使用该组件的页面

### 性能优化
- 定期清理未使用的样式
- 合并和压缩 CSS 文件
- 使用 CSS 自定义属性减少重复代码

## 故障排除

### 常见问题

1. **样式不生效**
   - 检查 CSS 文件路径是否正确
   - 确保 `main.css` 被正确导入
   - 检查类名是否正确

2. **动画不显示**
   - 检查浏览器是否支持 CSS 动画
   - 确认没有被 `prefers-reduced-motion` 禁用

3. **响应式布局问题**
   - 检查媒体查询是否正确
   - 确认视口 meta 标签设置正确

### 调试技巧
- 使用浏览器开发者工具检查样式
- 临时添加边框来调试布局问题
- 使用 CSS Grid Inspector 调试网格布局
