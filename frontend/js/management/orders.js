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

    // 查看详情（待实现）
    window.viewDetails = (formId) => {
        console.log('View details for form:', formId);
        // TODO: 实现查看详情功能
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