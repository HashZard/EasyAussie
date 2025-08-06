/**
 * 移动端优化的底部组件
 * 包含快速操作按钮和联系方式
 */

export class MobileFooterComponent {
    private container: HTMLElement;

    constructor(containerId: string = 'footer') {
        this.container = document.getElementById(containerId) || document.body;
        this.render();
        this.attachEventListeners();
    }

    private render(): void {
        this.container.innerHTML = `
            <!-- 桌面端底部 -->
            <footer class="bg-gray-800 text-white py-12 pb-16 lg:pb-12">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <!-- 公司信息 -->
                        <div>
                            <h3 class="text-lg font-semibold mb-4">Easy Aussie</h3>
                            <p class="text-gray-300 mb-4 leading-relaxed">
                                专业的珀斯房屋代看服务平台，致力于为海外租房者提供便捷、可靠的租房解决方案。
                            </p>
                            <div class="flex space-x-4">
                                <button class="text-gray-300 hover:text-white transition-colors">
                                    <i class="fab fa-weixin text-xl"></i>
                                </button>
                                <button class="text-gray-300 hover:text-white transition-colors">
                                    <i class="fab fa-whatsapp text-xl"></i>
                                </button>
                            </div>
                        </div>

                        <!-- 服务项目 -->
                        <div>
                            <h3 class="text-lg font-semibold mb-4">服务项目</h3>
                            <ul class="space-y-2 text-gray-300">
                                <li><a href="/pages/service/inspection.html" class="hover:text-white transition-colors">房源代看</a></li>
                                <li><a href="/pages/service/coverletter.html" class="hover:text-white transition-colors">CoverLetter</a></li>
                                <li><a href="/pages/service/application.html" class="hover:text-white transition-colors">租房申请</a></li>
                                <li><a href="/pages/service/airport-pickup.html" class="hover:text-white transition-colors">接机服务</a></li>
                            </ul>
                        </div>

                        <!-- 联系方式 -->
                        <div>
                            <h3 class="text-lg font-semibold mb-4">联系方式</h3>
                            <div class="space-y-3 text-gray-300">
                                <div class="flex items-center">
                                    <i class="fab fa-weixin w-5 mr-3"></i>
                                    <span>EasyAussie</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-envelope w-5 mr-3"></i>
                                    <span>easyaussie.info@gmail.com</span>
                                </div>
                                <div class="flex items-center">
                                    <i class="fas fa-map-marker-alt w-5 mr-3"></i>
                                    <span>Perth, Western Australia</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2025 Easy Aussie. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            <!-- 微信二维码弹窗 -->
            <div id="wechat-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-xl p-6 max-w-sm w-full text-center">
                    <h3 class="text-lg font-semibold mb-4">扫码添加微信</h3>
                    <div class="bg-gray-100 w-48 h-48 mx-auto mb-4 rounded-lg flex items-center justify-center">
                        <i class="fab fa-weixin text-6xl text-green-500"></i>
                    </div>
                    <p class="text-gray-600 mb-4">微信号: EasyAussie</p>
                    <button id="close-wechat-modal" class="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                        关闭
                    </button>
                </div>
            </div>
        `;
    }

    private attachEventListeners(): void {
        // 微信咨询按钮（桌面端）
        const wechatModal = this.container.querySelector('#wechat-modal');
        const closeWechatModal = this.container.querySelector('#close-wechat-modal');

        // 桌面端微信按钮
        const desktopWechatBtns = this.container.querySelectorAll('.fab.fa-weixin');
        desktopWechatBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (wechatModal) {
                    wechatModal.classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        if (closeWechatModal && wechatModal) {
            closeWechatModal.addEventListener('click', () => {
                wechatModal.classList.add('hidden');
                document.body.style.overflow = '';
            });

            // 点击背景关闭
            wechatModal.addEventListener('click', (e) => {
                if (e.target === wechatModal) {
                    wechatModal.classList.add('hidden');
                    document.body.style.overflow = '';
                }
            });
        }
    }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    new MobileFooterComponent();
});
