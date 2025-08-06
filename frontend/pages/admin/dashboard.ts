/**
 * 管理中心仪表盘页面内容 - TypeScript版本
 */

export interface DashboardStats {
    totalUsers: number;
    totalForms: number;
    pendingTasks: number;
    monthlyGrowth: string;
}

export interface QuickAction {
    id: string;
    label: string;
    icon: string;
    colorClass: string;
    onClick?: () => void;
}

export interface ActivityItem {
    id: string;
    type: 'user' | 'form' | 'system';
    message: string;
    time: string;
    icon: string;
    colorClass: string;
}

/**
 * 获取仪表盘统计数据
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    // 实际应用中这里会调用API
    return {
        totalUsers: 1234,
        totalForms: 567,
        pendingTasks: 89,
        monthlyGrowth: '+12%'
    };
}

/**
 * 获取快速操作配置
 */
export function getQuickActions(): QuickAction[] {
    return [
        {
            id: 'add-user',
            label: '添加用户',
            icon: 'fas fa-user-plus',
            colorClass: 'blue',
            onClick: () => console.log('添加用户')
        },
        {
            id: 'new-form',
            label: '新建表单',
            icon: 'fas fa-file-plus',
            colorClass: 'green',
            onClick: () => console.log('新建表单')
        },
        {
            id: 'settings',
            label: '系统设置',
            icon: 'fas fa-cog',
            colorClass: 'yellow',
            onClick: () => console.log('系统设置')
        },
        {
            id: 'analytics',
            label: '数据分析',
            icon: 'fas fa-chart-bar',
            colorClass: 'purple',
            onClick: () => console.log('数据分析')
        },
        {
            id: 'monitoring',
            label: '系统监控',
            icon: 'fas fa-exclamation-triangle',
            colorClass: 'red',
            onClick: () => console.log('系统监控')
        },
        {
            id: 'export',
            label: '数据导出',
            icon: 'fas fa-download',
            colorClass: 'gray',
            onClick: () => console.log('数据导出')
        }
    ];
}

/**
 * 获取最近活动数据
 */
export async function getRecentActivities(): Promise<ActivityItem[]> {
    // 实际应用中这里会调用API
    return [
        {
            id: '1',
            type: 'user',
            message: '新用户注册',
            time: '5分钟前',
            icon: 'fas fa-user',
            colorClass: 'blue'
        },
        {
            id: '2',
            type: 'form',
            message: '表单提交',
            time: '10分钟前',
            icon: 'fas fa-file-alt',
            colorClass: 'green'
        },
        {
            id: '3',
            type: 'system',
            message: '系统更新',
            time: '30分钟前',
            icon: 'fas fa-cog',
            colorClass: 'yellow'
        }
    ];
}

/**
 * 生成统计卡片HTML
 */
function generateStatsCard(label: string, value: string | number, icon: string, colorClass: string): string {
    return `
        <div class="card">
            <div class="card-body">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-${colorClass}-500 rounded-md flex items-center justify-center">
                            <i class="${icon} text-white text-sm"></i>
                        </div>
                    </div>
                    <div class="ml-3 lg:ml-5 w-0 flex-1">
                        <div class="text-xs lg:text-sm font-medium text-gray-500 truncate">${label}</div>
                        <div class="text-lg lg:text-2xl font-semibold text-gray-900">${value}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 生成快速操作按钮HTML
 */
function generateQuickActionButton(action: QuickAction): string {
    return `
        <button class="flex flex-col items-center p-3 lg:p-4 bg-${action.colorClass}-50 hover:bg-${action.colorClass}-100 rounded-lg transition-colors" 
                data-action="${action.id}">
            <i class="${action.icon} text-${action.colorClass}-600 text-lg lg:text-xl mb-2"></i>
            <span class="text-xs lg:text-sm font-medium text-${action.colorClass}-600">${action.label}</span>
        </button>
    `;
}

/**
 * 生成活动项HTML
 */
function generateActivityItem(activity: ActivityItem): string {
    return `
        <div class="flex items-center p-3 bg-gray-50 rounded-lg">
            <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-${activity.colorClass}-500 rounded-full flex items-center justify-center">
                    <i class="${activity.icon} text-white text-xs"></i>
                </div>
            </div>
            <div class="ml-3 flex-1">
                <p class="text-sm text-gray-900">${activity.message}</p>
                <p class="text-xs text-gray-500">${activity.time}</p>
            </div>
        </div>
    `;
}

/**
 * 获取仪表盘页面内容
 */
export async function getDashboardPageContent(): Promise<string> {
    const stats = await getDashboardStats();
    const quickActions = getQuickActions();
    const activities = await getRecentActivities();

    return `
        <div class="space-y-4 lg:space-y-6 fade-in">
            <!-- 统计卡片 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                ${generateStatsCard('总用户数', stats.totalUsers, 'fas fa-users', 'blue')}
                ${generateStatsCard('总表单数', stats.totalForms, 'fas fa-file-alt', 'green')}
                ${generateStatsCard('待处理', stats.pendingTasks, 'fas fa-clock', 'yellow')}
                ${generateStatsCard('本月增长', stats.monthlyGrowth, 'fas fa-chart-line', 'purple')}
            </div>

            <!-- 快速操作 -->
            <div class="card">
                <div class="card-header">
                    <h2 class="text-lg font-semibold text-gray-900">快速操作</h2>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4" id="quick-actions">
                        ${quickActions.map(action => generateQuickActionButton(action)).join('')}
                    </div>
                </div>
            </div>

            <!-- 最近活动 -->
            <div class="card">
                <div class="card-header">
                    <h2 class="text-lg font-semibold text-gray-900">最近活动</h2>
                </div>
                <div class="card-body">
                    <div class="space-y-3 lg:space-y-4" id="recent-activities">
                        ${activities.map(activity => generateActivityItem(activity)).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 初始化仪表盘页面
 */
export async function initializeDashboardPage(): Promise<void> {
    try {
        // 设置快速操作点击事件
        const quickActionsContainer = document.getElementById('quick-actions');
        if (quickActionsContainer) {
            quickActionsContainer.addEventListener('click', handleQuickActionClick);
        }

        // 可以添加其他初始化逻辑
        console.log('Dashboard page initialized with TypeScript');
        
        // 启动实时数据更新（可选）
        startRealTimeUpdates();
    } catch (error) {
        console.error('Error initializing dashboard page:', error);
    }
}

/**
 * 处理快速操作点击事件
 */
function handleQuickActionClick(event: Event): void {
    const target = event.target as HTMLElement;
    const button = target.closest('[data-action]') as HTMLElement;
    
    if (button) {
        const actionId = button.dataset.action;
        const quickActions = getQuickActions();
        const action = quickActions.find(a => a.id === actionId);
        
        if (action && action.onClick) {
            action.onClick();
        }
    }
}

/**
 * 启动实时数据更新
 */
function startRealTimeUpdates(): void {
    // 每30秒更新一次统计数据
    setInterval(async () => {
        try {
            const stats = await getDashboardStats();
            updateStatsDisplay(stats);
        } catch (error) {
            console.error('Error updating dashboard stats:', error);
        }
    }, 30000);
}

/**
 * 更新统计数据显示
 */
function updateStatsDisplay(stats: DashboardStats): void {
    // 实现统计数据的动态更新
    // 这里可以添加平滑的数字变化动画
}
