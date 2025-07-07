document.addEventListener('DOMContentLoaded', () => {
    // 初始化变量
    let currentPage = 1;
    const pageSize = 10;

    // 获取DOM元素
    const searchForm = document.getElementById('searchForm');
    const userList = document.getElementById('userList');
    const totalCountSpan = document.getElementById('totalCount');
    const refreshBtn = document.getElementById('refreshBtn');

    // 加载用户数据
    async function loadUserData(params = {}) {
        try {
            const queryParams = new URLSearchParams({
                email: params.email || '',
                role: params.role || '',
                status: params.status || ''
            });

            const response = await fetch(`/admin/users?${queryParams}`);
            if (!response.ok) throw new Error('加载数据失败');

            const data = await response.json();
            renderTable(data.users);
            totalCountSpan.textContent = data.users.length;
        } catch (error) {
            console.error('Error:', error);
            alert('加载数据失败，请稍后重试');
        }
    }

    // 渲染用户表格
    function renderTable(users) {
        userList.innerHTML = users.map(user => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">${user.email}</td>
                <td class="px-6 py-4">${formatRoles(user.roles)}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs rounded-full ${getStatusStyle(user.active)}">
                        ${user.active ? '正常' : '禁用'}
                    </span>
                </td>
                <td class="px-6 py-4">${formatDate(user.created_at)}</td>
                <td class="px-6 py-4">
                    <div class="flex gap-2">
                        <button onclick="toggleUserStatus(${user.id}, ${!user.active})" 
                                class="text-blue-600 hover:text-blue-800">
                            ${user.active ? '禁用' : '启用'}
                        </button>
                        <button onclick="resetPassword(${user.id})"
                                class="text-blue-600 hover:text-blue-800">
                            重置密码
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // 表单搜索处理
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(searchForm);
        loadUserData({
            email: formData.get('email'),
            role: formData.get('role'),
            status: formData.get('status')
        });
    });

    // 重置按钮处理
    searchForm.addEventListener('reset', () => {
        setTimeout(() => loadUserData(), 0);
    });

    // 刷新按钮处理
    refreshBtn.addEventListener('click', () => loadUserData());

    // 工具函数
    function formatRoles(roles) {
        return roles.map(role => `
            <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                ${role}
            </span>
        `).join(' ');
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

    function getStatusStyle(active) {
        return active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    }

    // 用户状态切换
    window.toggleUserStatus = async (userId, active) => {
        if (!confirm(`确定要${active ? '启用' : '禁用'}该用户吗？`)) return;

        try {
            const response = await fetch('/admin/toggle-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: userId,
                    active: active
                })
            });

            if (!response.ok) throw new Error('操作失败');
            await loadUserData(); // 刷新数据
        } catch (error) {
            console.error('Error:', error);
            alert('操作失败，请稍后重试');
        }
    };

    // 重置密码
    window.resetPassword = async (userId) => {
        const newPassword = prompt('请输入新密码：');
        if (!newPassword) return;

        try {
            const response = await fetch('/admin/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: userId,
                    new_password: newPassword
                })
            });

            if (!response.ok) throw new Error('重置密码失败');
            alert('密码重置成功');
        } catch (error) {
            console.error('Error:', error);
            alert('重置密码失败，请稍后重试');
        }
    };

    // 初始加载
    loadUserData();
});