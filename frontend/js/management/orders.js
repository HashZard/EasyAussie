console.log('✅ orders.js script loaded');

export function initOrdersView() {
    console.log('🔄 initOrdersView called');

    const searchForm = document.getElementById('searchForm');
    const refreshBtn = document.getElementById('refreshBtn');
    const ordersList = document.getElementById('ordersList');

    // 表单类型映射
    const formTypeMap = {
        'inspection': '预约看房',
        'coverletter': '求职信',
        'rentalApplication': '租房申请',
        'airportPickup': '接机服务'
    };

    // 状态映射
    const statusMap = {
        'pending': '处理中',
        'completed': '已完成',
        'cancelled': '已取消'
    };

    // 状态样式映射
    const statusStyleMap = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'completed': 'bg-green-100 text-green-800',
        'cancelled': 'bg-gray-100 text-gray-800'
    };

    // 为不同表单类型定义展示字段
    const formFieldsMap = {
        'inspection': {
            'wxid': '微信名称',
            'address': '房产地址',
            'appointmentDate': '预约时间',
            'name': '预约姓名',
            'email': '预约 Email',
            'phone': '预约电话',
            'checklist': '重点检查事项'
        }
    };

    // 查询表单数据
    async function queryForms(params = {}) {
        try {
            console.log('Fetching forms with params:', params);
            const queryString = new URLSearchParams(params).toString();
            const response = await UserAuth.authFetch(`/api/form-query?${queryString}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error fetching forms:', error);
            return [];
        }
    }

    // 渲染表单数据
    function renderForms(forms) {
        ordersList.innerHTML = forms.map(form => `
            <tr>
                <td class="px-6 py-4 text-sm">${form.id}</td>
                <td class="px-6 py-4 text-sm">${formTypeMap[form.formType] || form.formType}</td>
                <td class="px-6 py-4 text-sm">${new Date(form.createTime).toLocaleString()}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-medium rounded-full ${statusStyleMap[form.status] || ''}">
                        ${statusMap[form.status] || form.status}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <button class="text-blue-600 hover:text-blue-800 text-sm"
                            onclick="viewDetails('${form.id}')">
                        查看详情
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // 加载表单数据
    async function loadForms(params = {}) {
        const forms = await queryForms(params);
        renderForms(forms);
    }

    // 创建模态框 HTML
    function createModal() {
        const modal = document.createElement('div');
        modal.id = 'detailsModal';
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center hidden';
        modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">表单详情</h3>
                <button id="closeModal" class="text-gray-500 hover:text-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div id="modalContent" class="space-y-4"></div>
        </div>
    `;
        document.body.appendChild(modal);
    }

// 显示模态框
    function showModal() {
        const modal = document.getElementById('detailsModal');
        modal.classList.remove('hidden');
    }

// 隐藏模态框
    function hideModal() {
        const modal = document.getElementById('detailsModal');
        modal.classList.add('hidden');
    }

// 格式化日期时间
    function formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

// 渲染表单详情
    function renderFormDetails(formData) {
        const content = document.getElementById('modalContent');
        const fields = formFieldsMap[formData.formType];

        if (!fields) {
            content.innerHTML = '<p class="text-gray-500">暂不支持查看该类型表单详情</p>';
            return;
        }

        let html = '';
        const data = typeof formData.formData === 'string' ? JSON.parse(formData.formData) : formData.formData;

        for (const [key, label] of Object.entries(fields)) {
            let value = data[key];

            if (key === 'appointmentDate') {
                value = formatDateTime(value);
            } else if (key === 'checklist' && Array.isArray(value)) {
                value = value.join('<br>');
            }

            if (value) {
                html += `
                <div class="border-b pb-2">
                    <div class="text-sm text-gray-600">${label}</div>
                    <div class="mt-1">${value}</div>
                </div>
            `;
            }
        }

        content.innerHTML = html;
    }

    // 查看详情（待实现）
    window.viewDetails = async (formId) => {
        console.log('Viewing details for form:', formId);
        try {
            const response = await UserAuth.authFetch(`/api/form-query?id=${formId}`, {
                method: 'GET'
            });

            if (!response.ok) throw new Error('Failed to fetch form details');

            const result = await response.json();
            const form = result.data[0];

            if (!form) {
                console.error('Form not found');
                return;
            }

            // 确保模态框存在
            if (!document.getElementById('detailsModal')) {
                createModal();
                // 添加关闭按钮事件监听
                document.getElementById('closeModal').addEventListener('click', hideModal);
            }

            // 渲染详情并显示模态框
            renderFormDetails(form);
            showModal();

        } catch (error) {
            console.error('Error fetching form details:', error);
        }
    };

    // 搜索表单提交处理
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(searchForm);
        const params = {};

        for (let [key, value] of formData.entries()) {
            if (value) params[key] = value;
        }

        await loadForms(params);
    });

    // 重置按钮处理
    searchForm.addEventListener('reset', () => {
        setTimeout(() => loadForms(), 0);
    });

    // 刷新按钮处理
    refreshBtn.addEventListener('click', () => {
        searchForm.reset();
        loadForms();
    });

    // 初始加载
    loadForms();
}

document.addEventListener('viewLoaded', (e) => {
    console.log('📦 viewLoaded captured in orders.js', e.detail);
    if (e.detail.view === 'orders') {
        console.log('✅ Orders view loaded → calling init');
        initOrdersView();
    }
});