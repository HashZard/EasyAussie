// frontend/js/components/spa-router.js
class SpaRouter {
    constructor(config) {
        this.containerId = config.containerId;
        this.basePath = config.basePath;
        this.defaultView = config.defaultView;
        this.container = document.getElementById(this.containerId);
        this.currentView = null;

        this.init();
    }

    init() {
        // 绑定导航事件
        document.querySelectorAll(`.spa-nav[data-spa="${this.containerId}"]`).forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const view = link.getAttribute("data-view");
                console.log('👉 nav clicked, loading view:', view);  // ✅ 加这一行

                this.loadView(view);

                // 更新激活状态
                this.updateActiveState(link);
            });
        });

        // 处理浏览器前进后退
        window.addEventListener('popstate', (e) => {
            const view = e.state?.view || this.defaultView;
            this.loadView(view, false);
        });

        // 加载默认视图
        this.loadView(this.defaultView);
    }

    async loadView(view, pushState = true) {
        try {
            const response = await fetch(`${this.basePath}/${view}.html`);
            if (!response.ok) throw new Error('页面加载失败');

            const html = await response.text();
            this.container.innerHTML = html;
            this.currentView = view;

            // 更新浏览器历史
            if (pushState) {
                window.history.pushState({view}, '', `#${view}`);
            }

            // ✅ Step 1: 移除旧 JS 脚本（避免重复执行）
            const oldScript = document.getElementById('spa-view-script');
            if (oldScript) oldScript.remove();

            // ✅ Step 2: 动态加载新页面的 JS 脚本（按模块加载）
            const script = document.createElement('script');
            script.type = 'module';
            script.id = 'spa-view-script';
            script.src = `/js/management/${view}.js`;  // ⚠️ 路径与你页面结构保持一致
            document.body.appendChild(script);

            // ✅ Step 3: 派发视图加载完成事件（可用于全局监听）
            console.log('🚩 about to dispatch viewLoaded event:', view);

            script.onload = () => {
                console.log('📦 Script loaded, dispatching viewLoaded for:', view);

                const event = new CustomEvent('viewLoaded', {
                    detail: {view},
                    bubbles: true
                });
                document.dispatchEvent(event);
            };

            document.body.appendChild(script);

            console.log('✅ dispatched viewLoaded event');

        } catch (error) {
            console.error('Error:', error);
            this.container.innerHTML = '<div class="p-4">加载失败，请稍后重试</div>';
        }
    }

    updateActiveState(activeLink) {
        document.querySelectorAll(`.spa-nav[data-spa="${this.containerId}"]`).forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }
}

export default SpaRouter;