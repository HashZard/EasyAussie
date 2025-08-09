/**
 * Result Pages JavaScript Handler
 * 处理成功和失败页面的交互逻辑
 */

class ResultPageHandler {
    constructor() {
        this.initializeAnimation();
        this.setupErrorHandling();
        this.initializeTooltips();
        this.bindEvents();
    }

    /**
     * 初始化页面动画
     */
    initializeAnimation() {
        // 延迟显示主要内容，创建更好的用户体验
        setTimeout(() => {
            const container = document.querySelector('.ea-result-container');
            if (container) {
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            }
        }, 100);

        // 为按钮添加点击动画
        this.addButtonAnimations();
    }

    /**
     * 添加按钮点击动画效果
     */
    addButtonAnimations() {
        const buttons = document.querySelectorAll('.ea-result-btn');
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                // 创建波纹效果
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ea-ripple-effect');
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    /**
     * 设置错误处理
     */
    setupErrorHandling() {
        // 监听页面错误
        window.addEventListener('error', (e) => {
            console.error('页面错误:', e.error);
            this.showTechnicalError(e.error.message);
        });

        // 监听未处理的Promise拒绝
        window.addEventListener('unhandledrejection', (e) => {
            console.error('未处理的Promise拒绝:', e.reason);
            this.showTechnicalError(e.reason);
        });
    }

    /**
     * 显示技术错误信息
     */
    showTechnicalError(error) {
        const errorDetails = document.getElementById('error-details');
        const errorCode = document.getElementById('error-code');
        
        if (errorDetails && errorCode) {
            errorCode.textContent = error;
            errorDetails.classList.remove('hidden');
        }
    }

    /**
     * 初始化工具提示
     */
    initializeTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', this.showTooltip.bind(this));
            element.addEventListener('mouseleave', this.hideTooltip.bind(this));
        });
    }

    /**
     * 显示工具提示
     */
    showTooltip(e) {
        const element = e.target;
        const tooltipText = element.getAttribute('data-tooltip');
        
        if (!tooltipText) return;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'ea-tooltip';
        tooltip.textContent = tooltipText;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
        
        element._tooltip = tooltip;
    }

    /**
     * 隐藏工具提示
     */
    hideTooltip(e) {
        const element = e.target;
        if (element._tooltip) {
            element._tooltip.remove();
            delete element._tooltip;
        }
    }

    /**
     * 添加键盘导航支持
     */
    initializeKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'Enter':
                case ' ':
                    // 回车或空格键激活焦点元素
                    const focusedElement = document.activeElement;
                    if (focusedElement && focusedElement.tagName === 'BUTTON') {
                        focusedElement.click();
                    }
                    break;
                case 'Escape':
                    // ESC键返回主页
                    goHome();
                    break;
                case '1':
                    // 数字键1：主要操作
                    const primaryBtn = document.querySelector('.ea-result-btn-primary');
                    if (primaryBtn) primaryBtn.click();
                    break;
                case '2':
                    // 数字键2：次要操作
                    const secondaryBtn = document.querySelector('.ea-result-btn-secondary');
                    if (secondaryBtn) secondaryBtn.click();
                    break;
            }
        });
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 为页面添加全局函数
        window.goHome = goHome;
        window.goToOrders = goToOrders;
        window.goToForm = goToForm;
        window.goBack = goBack;
        window.contactSupport = contactSupport;
        
        // 添加键盘导航
        this.initializeKeyboardNavigation();
    }
}

// 页面导航功能
function goHome() {
    // 添加离开动画
    const container = document.querySelector('.ea-result-container');
    if (container) {
        container.style.transform = 'translateY(-20px)';
        container.style.opacity = '0';
    }
    
    setTimeout(() => {
        window.location.href = '/';
    }, 300);
}

function goToOrders() {
    // 检查用户是否已登录
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        // 未登录，跳转到登录页面
        window.location.href = '/pages/auth/login.html?redirect=orders';
        return;
    }
    
    // 已登录，跳转到订单页面
    window.location.href = '/pages/user/orders.html';
}

function goToForm() {
    // 智能返回到对应的表单页面
    const referrer = document.referrer;
    let targetUrl = '/pages/service/service.html'; // 默认服务页面
    
    if (referrer) {
        if (referrer.includes('inspection')) {
            targetUrl = '/pages/service/inspection.html';
        } else if (referrer.includes('application')) {
            targetUrl = '/pages/service/application.html';
        } else if (referrer.includes('coverletter')) {
            targetUrl = '/pages/service/coverletter.html';
        } else if (referrer.includes('airport-pickup')) {
            targetUrl = '/pages/service/airport-pickup.html';
        }
    }
    
    window.location.href = targetUrl;
}

function goBack() {
    // 尝试返回上一页，如果没有历史记录则去主页
    if (window.history.length > 1) {
        window.history.back();
    } else {
        goHome();
    }
}

function contactSupport() {
    const subject = '提交失败求助 - Easy Aussie';
    const body = encodeURIComponent(`
我在提交申请时遇到了问题，需要您的协助。

问题详情：
- 时间：${new Date().toLocaleString('zh-CN')}
- 页面：${window.location.href}
- 浏览器：${navigator.userAgent}

请协助处理，谢谢！
    `);
    
    window.location.href = `mailto:support@easyaussie.com?subject=${subject}&body=${body}`;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化结果页面处理器
    const resultHandler = new ResultPageHandler();
    
    // 检查URL参数中的错误信息（仅限错误页面）
    const isErrorPage = document.body.classList.contains('ea-error-page');
    if (isErrorPage) {
        displayErrorInfo();
    }
});

// 显示错误信息函数
function displayErrorInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const errorMsg = urlParams.get('error');
    const errorCode = urlParams.get('code');
    
    if (errorMsg) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = decodeURIComponent(errorMsg);
        }
    }
    
    if (errorCode) {
        const errorCodeElement = document.getElementById('error-code');
        const errorDetailsElement = document.getElementById('error-details');
        
        if (errorCodeElement && errorDetailsElement) {
            errorCodeElement.textContent = errorCode;
            errorDetailsElement.classList.remove('hidden');
        }
    }
}

// 导出函数以供全局使用
window.ResultPageHandler = ResultPageHandler;
window.goHome = goHome;
window.goToOrders = goToOrders;
window.goToForm = goToForm;
window.goBack = goBack;
window.contactSupport = contactSupport;
