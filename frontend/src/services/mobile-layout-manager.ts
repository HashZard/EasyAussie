/**
 * 移动端页面布局管理器
 * 统一管理移动端页面的通用功能
 */

export class MobileLayoutManager {
    private isInitialized = false;

    constructor() {
        if (!this.isInitialized) {
            this.init();
            this.isInitialized = true;
        }
    }

    private init(): void {
        this.setupViewport();
        this.setupTouchOptimization();
        this.setupKeyboardHandling();
        this.setupScrollBehavior();
        this.setupPerformanceOptimization();
    }

    /**
     * 设置移动端视口
     */
    private setupViewport(): void {
        // 防止双击缩放
        document.addEventListener('touchstart', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });

        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(e) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // 阻止默认的拖拽行为
        document.addEventListener('touchmove', function(e) {
            const target = e.target as HTMLElement;
            if (target && !target.closest('.scrollable')) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    /**
     * 优化触摸交互
     */
    private setupTouchOptimization(): void {
        // 添加触摸反馈
        const addTouchFeedback = (element: HTMLElement) => {
            element.addEventListener('touchstart', () => {
                element.classList.add('touch-active');
            });

            element.addEventListener('touchend', () => {
                setTimeout(() => {
                    element.classList.remove('touch-active');
                }, 150);
            });

            element.addEventListener('touchcancel', () => {
                element.classList.remove('touch-active');
            });
        };

        // 为按钮和链接添加触摸反馈
        document.addEventListener('DOMContentLoaded', () => {
            const touchElements = document.querySelectorAll('button, a, .touchable');
            touchElements.forEach(el => addTouchFeedback(el as HTMLElement));
        });

        // 添加CSS样式
        if (!document.getElementById('mobile-touch-styles')) {
            const style = document.createElement('style');
            style.id = 'mobile-touch-styles';
            style.textContent = `
                .touch-active {
                    opacity: 0.7 !important;
                    transform: scale(0.98) !important;
                    transition: all 0.1s ease !important;
                }
                
                /* 移除默认的触摸高亮 */
                * {
                    -webkit-tap-highlight-color: transparent;
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    user-select: none;
                }
                
                /* 输入框和文本可选择 */
                input, textarea, [contenteditable] {
                    -webkit-user-select: text;
                    user-select: text;
                }
                
                /* 滚动优化 */
                .scrollable {
                    -webkit-overflow-scrolling: touch;
                    overflow-scrolling: touch;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * 处理虚拟键盘
     */
    private setupKeyboardHandling(): void {
        let originalViewportHeight = window.innerHeight;

        // 检测虚拟键盘显示/隐藏
        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            const heightDifference = originalViewportHeight - currentHeight;
            
            if (heightDifference > 150) { // 键盘显示
                document.body.classList.add('keyboard-visible');
                this.adjustForKeyboard(true);
            } else { // 键盘隐藏
                document.body.classList.remove('keyboard-visible');
                this.adjustForKeyboard(false);
            }
        });

        // 输入框聚焦时的处理
        document.addEventListener('focusin', (e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                setTimeout(() => {
                    target.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 300);
            }
        });
    }

    /**
     * 调整键盘显示时的布局
     */
    private adjustForKeyboard(visible: boolean): void {
        const footer = document.getElementById('footer');
        const fixedElements = document.querySelectorAll('.fixed-bottom');

        if (visible) {
            // 隐藏底部固定元素
            if (footer) footer.style.display = 'none';
            fixedElements.forEach(el => {
                (el as HTMLElement).style.display = 'none';
            });
        } else {
            // 恢复底部固定元素
            if (footer) footer.style.display = '';
            fixedElements.forEach(el => {
                (el as HTMLElement).style.display = '';
            });
        }
    }

    /**
     * 优化滚动行为
     */
    private setupScrollBehavior(): void {
        // 平滑滚动
        if (!document.documentElement.style.scrollBehavior) {
            document.documentElement.style.scrollBehavior = 'smooth';
        }

        // 回到顶部按钮
        this.addBackToTopButton();

        // 滚动阴影效果
        this.addScrollShadow();
    }

    /**
     * 添加回到顶部按钮
     */
    private addBackToTopButton(): void {
        if (document.getElementById('back-to-top')) return;

        const backToTop = document.createElement('button');
        backToTop.id = 'back-to-top';
        backToTop.innerHTML = '<i class="fas fa-chevron-up"></i>';
        backToTop.className = 'fixed bottom-20 right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform translate-y-16 opacity-0 z-50';
        
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        document.body.appendChild(backToTop);

        // 显示/隐藏逻辑
        let isVisible = false;
        window.addEventListener('scroll', () => {
            const shouldShow = window.scrollY > 300;
            
            if (shouldShow && !isVisible) {
                backToTop.classList.remove('translate-y-16', 'opacity-0');
                backToTop.classList.add('translate-y-0', 'opacity-100');
                isVisible = true;
            } else if (!shouldShow && isVisible) {
                backToTop.classList.add('translate-y-16', 'opacity-0');
                backToTop.classList.remove('translate-y-0', 'opacity-100');
                isVisible = false;
            }
        });
    }

    /**
     * 添加滚动阴影效果
     */
    private addScrollShadow(): void {
        const header = document.getElementById('header');
        if (!header) return;

        let hasScrolled = false;
        window.addEventListener('scroll', () => {
            const shouldHaveShadow = window.scrollY > 10;
            
            if (shouldHaveShadow && !hasScrolled) {
                header.classList.add('shadow-md');
                hasScrolled = true;
            } else if (!shouldHaveShadow && hasScrolled) {
                header.classList.remove('shadow-md');
                hasScrolled = false;
            }
        });
    }

    /**
     * 性能优化
     */
    private setupPerformanceOptimization(): void {
        // 懒加载图片
        this.setupLazyLoading();

        // 预加载关键资源
        this.preloadCriticalResources();

        // 优化动画
        this.optimizeAnimations();
    }

    /**
     * 懒加载图片
     */
    private setupLazyLoading(): void {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target as HTMLImageElement;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.add('loaded');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            // 观察所有懒加载图片
            document.addEventListener('DOMContentLoaded', () => {
                const lazyImages = document.querySelectorAll('img[data-src]');
                lazyImages.forEach(img => imageObserver.observe(img));
            });
        }
    }

    /**
     * 预加载关键资源
     */
    private preloadCriticalResources(): void {
        const criticalPages = [
            '/pages/service/service.html',
            '/pages/management/admin.html',
            '/pages/auth/login.html'
        ];

        // 预加载关键页面
        criticalPages.forEach(page => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = page;
            document.head.appendChild(link);
        });
    }

    /**
     * 优化动画性能
     */
    private optimizeAnimations(): void {
        // 减少动画（如果用户偏好）
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const style = document.createElement('style');
            style.textContent = `
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            `;
            document.head.appendChild(style);
        }

        // 使用 requestAnimationFrame 优化动画
        let rafId: number;
        const optimizedAnimations = new Set<() => void>();

        window.addEventListener('scroll', () => {
            if (rafId) cancelAnimationFrame(rafId);
            
            rafId = requestAnimationFrame(() => {
                // 执行优化的滚动动画
                optimizedAnimations.forEach((callback) => {
                    callback();
                });
            });
        });
    }

    /**
     * 添加页面加载指示器
     */
    public showPageLoader(): void {
        if (document.getElementById('page-loader')) return;

        const loader = document.createElement('div');
        loader.id = 'page-loader';
        loader.className = 'fixed inset-0 bg-white z-50 flex items-center justify-center';
        loader.innerHTML = `
            <div class="text-center">
                <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p class="text-gray-600">加载中...</p>
            </div>
        `;
        document.body.appendChild(loader);
    }

    /**
     * 隐藏页面加载指示器
     */
    public hidePageLoader(): void {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.remove();
            }, 300);
        }
    }

    /**
     * 获取设备信息
     */
    public getDeviceInfo(): object {
        return {
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
            isAndroid: /Android/.test(navigator.userAgent),
            isTouchDevice: 'ontouchstart' in window,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1
        };
    }
}

// 自动初始化
const mobileLayoutManager = new MobileLayoutManager();

// 导出实例
export default mobileLayoutManager;
