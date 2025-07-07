document.addEventListener('DOMContentLoaded', () => {
    // 初始化变量
    let currentPage = 1;
    const pageSize = 10;

    // 获取DOM元素
    const searchForm = document.getElementById('searchForm');
    const formDataTable = document.getElementById('formDataTable');
    const totalCountSpan = document.getElementById('totalCount');
    const paginationDiv = document.getElementById('pagination');
    const exportBtn = document.getElementById('exportBtn');
    const refreshBtn = document.getElementById('refreshBtn');

    // 加载表单数据
    async function loadFormData(params = {}) {
        try {
            const queryParams = new URLSearchParams({
                email: params.email || '',
                form_type: params.form_type || '',
                date: params.date || ''
            });

            const response = await fetch(`/admin/forms?${queryParams}`);
            if (!response.ok) throw new Error('加载数据失败');

            const data = await response.json();
            renderTable(data.results);
            updatePagination(data.total);
            totalCountSpan.textContent = data.results.length;
        } catch (error) {
            console.error('Error:', error);
            alert('加载数据失败，请稍后重试');
        }
    }

    // 渲染表格
    function renderTable(forms) {
        formDataTable.innerHTML = forms.map(form => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">${form.id}</td>
                <td class="px-6 py-4">${form.email}</td>
                <td class="px-6 py-4">${getFormTypeLabel(form.form_type)}</td>
                <td class="px-6 py-4">${formatDate(form.created_gmt)}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs rounded-full ${getStatusStyle(form.status)}">
                        ${getStatusLabel(form.status)}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <button onclick="viewDetail(${form.id})" 
                            class="text-blue-600 hover:text-blue-800">
                        查看详情
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // 表单搜索处理
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(searchForm);
        loadFormData({
            email: formData.get('email'),
            form_type: formData.get('form_type'),
            date: formData.get('date')
        });
    });

    // 重置按钮处理
    searchForm.addEventListener('reset', () => {
        setTimeout(() => loadFormData(), 0);
    });

    // 刷新按钮处理
    refreshBtn.addEventListener('click', () => loadFormData());

    // 导出按钮处理
    exportBtn.addEventListener('click', async () => {
        // 实现导出功能
        alert('导出功能开发中...');
    });

    // 工具函数
    function getFormTypeLabel(type) {
        const types = {
            'inspection': '预约看房',
            'coverletter': '求职信',
            'rentalApplication': '租房申请',
            'airportPickup': '接机服务'
        };
        return types[type] || type;
    }

    function formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getStatusStyle(status) {
        return status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
    }

    function getStatusLabel(status) {
        return status === 'pending' ? '待处理' : '已处理';
    }

    // 查看详情
    window.viewDetail = async (id) => {
        try {
            const response = await fetch(`/admin/forms/${id}`);
            if (!response.ok) throw new Error('获取详情失败');
            const detail = await response.json();
            // 显示详情弹窗
            alert(JSON.stringify(detail, null, 2));
        } catch (error) {
            console.error('Error:', error);
            alert('获取详情失败，请稍后重试');
        }
    };

    // 初始加载
    loadFormData();
});