/**
 * 移动端优化的服务卡片组件
 * 响应式布局，适配手机屏幕
 */

export interface ServiceCard {
    id: string;
    title: string;
    description: string;
    price: string;
    icon: string;
    link: string;
    popular?: boolean;
}

export class MobileServiceCardComponent {
    private container: HTMLElement;
    private services: ServiceCard[] = [
        {
            id: 'inspection',
            title: '预约看房',
            description: '专业代看房服务，实地拍摄视频，详细反馈房屋情况',
            price: 'From $25',
            icon: 'fas fa-home',
            link: '/pages/service/inspection.html',
            popular: true
        },
        {
            id: 'coverletter',
            title: 'CoverLetter',
            description: '量身定制英文求租信，提升申请成功率',
            price: '$3/封',
            icon: 'fas fa-file-alt',
            link: '/pages/service/coverletter.html'
        },
        {
            id: 'application',
            title: '租房申请',
            description: '全程代办申请流程，材料准备，提高成功率',
            price: '$5/封',
            icon: 'fas fa-file-signature',
            link: '/pages/service/application.html'
        },
        {
            id: 'pickup',
            title: '接机服务',
            description: '安全便捷的接机安排，让您落地无忧',
            price: '$50/次',
            icon: 'fas fa-plane',
            link: '/pages/service/airport-pickup.html'
        }
    ];

    constructor(containerId: string) {
        this.container = document.getElementById(containerId) || document.body;
        this.render();
        this.attachEventListeners();
    }

    private render(): void {
        const servicesHtml = this.services.map(service => `
            <div class="service-card bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${service.popular ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}" data-service="${service.id}">
                ${service.popular ? `
                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center py-2 text-sm font-medium">
                        <i class="fas fa-star mr-1"></i>热门服务
                    </div>
                ` : ''}
                
                <div class="p-4 sm:p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center">
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                                <i class="${service.icon} text-blue-600 text-lg"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-semibold text-gray-800">${service.title}</h3>
                                <p class="text-blue-600 font-medium">${service.price}</p>
                            </div>
                        </div>
                        <button class="service-action-btn bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium" data-link="${service.link}">
                            立即预约
                        </button>
                    </div>
                    
                    <p class="text-gray-600 leading-relaxed mb-4">${service.description}</p>
                    
                    <!-- 移动端专用快速操作 -->
                    <div class="flex space-x-2 sm:hidden">
                        <button class="flex-1 bg-green-100 text-green-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors" onclick="window.location.href='tel:+61xxxxxxxxx'">
                            <i class="fas fa-phone mr-1"></i>电话咨询
                        </button>
                        <button class="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors" data-link="${service.link}">
                            <i class="fas fa-calendar mr-1"></i>在线预约
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        this.container.innerHTML = `
            <div class="space-y-4 sm:space-y-6">
                ${servicesHtml}
            </div>
        `;
    }

    private attachEventListeners(): void {
        // 服务卡片点击事件
        const serviceCards = this.container.querySelectorAll('.service-card');
        serviceCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // 如果点击的是按钮，不触发卡片的点击事件
                if ((e.target as HTMLElement).closest('button')) {
                    return;
                }
                
                const link = card.querySelector('.service-action-btn')?.getAttribute('data-link');
                if (link) {
                    window.location.href = link;
                }
            });
        });

        // 预约按钮点击事件
        const actionButtons = this.container.querySelectorAll('.service-action-btn, [data-link]');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const link = button.getAttribute('data-link');
                if (link) {
                    window.location.href = link;
                }
            });
        });
    }

    // 公共方法：添加服务
    public addService(service: ServiceCard): void {
        this.services.push(service);
        this.render();
        this.attachEventListeners();
    }

    // 公共方法：更新服务
    public updateService(id: string, updates: Partial<ServiceCard>): void {
        const index = this.services.findIndex(s => s.id === id);
        if (index !== -1) {
            this.services[index] = { ...this.services[index], ...updates };
            this.render();
            this.attachEventListeners();
        }
    }
}
