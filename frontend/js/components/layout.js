document.addEventListener('DOMContentLoaded', () => {
    // 入口：统一拉取用户信息
    UserAuth.getUserOrFetch().then(user => {
        Promise.all([
            loadHeader(),
            loadFooter(),
            loadBackButton()
        ]).then(() => {
            applyUserPermissions(user); // 等所有组件加载完成后统一处理权限
        });
    });

    // 加载 Header
    function loadHeader() {
        return fetch('/components/header.html')
            .then(res => res.text())
            .then(html => {
                document.getElementById('header').innerHTML = html;
            });
    }

    // 加载 Footer
    function loadFooter() {
        fetch('/components/footer.html')
            .then(res => res.text())
            .then(html => {
                document.getElementById('footer').innerHTML = html;
            });
    }

    // 加载返回按钮
    function loadBackButton() {
        fetch('/components/back-button.html')
            .then(res => res.text())
            .then(html => {
                const backBtnContainer = document.getElementById("back-button");
                if (backBtnContainer) {
                    backBtnContainer.innerHTML = html;
                }
            });
    }

    /**
     * 🔐 applyUserPermissions(user)
     * 统一执行页面权限控制与组件可见性管理。
     *
     * 使用场景：
     * 1️⃣ 页面整体访问控制：
     *    HTML 中设置 <body data-required-role="admin"> 表示此页面仅管理员可见，
     *    如果当前用户不具备该角色，将自动弹窗并跳转回主页。
     *
     * 2️⃣ 页面元素控制（如按钮、模块）：
     *    对需要特定角色可见的元素加类名和属性：
     *    <div class="role-required" data-role="admin">仅管理员可见内容</div>
     *    普通用户访问时会自动隐藏该元素。
     *
     * 3️⃣ 自动展示当前用户信息（如邮箱）：
     *    页面中添加 <span class="user-email"></span>
     *    登录后自动显示用户 email，未登录显示“游客”。
     *
     * 参数：
     * @param {Object|null} user - 当前用户对象（通过 getUserOrFetch() 获取），未登录时为 null。
     */
    function applyUserPermissions(user) {
        // 页面访问权限控制
        const body = document.querySelector("body");
        const requiredRole = body?.dataset.requiredRole;

        // 1 登录校验
        if (!user) {
            if (requiredRole) {
                alert("请先登录以访问本页面");
                window.location.href = "/pages/auth/login.html";
            }
            // 如果页面不要求权限，则允许继续显示
            return;
        }

        // 2 页面访问权限控制（按角色）
        if (requiredRole && !user.roles.includes(requiredRole)) {
            alert("无权限访问本页");
            window.location.href = "/index.html";
            return;
        }

        // 3 元素级别权限控制（控制显示/隐藏）
        document.querySelectorAll(".role-required").forEach(el => {
            const role = el.dataset.role;
            if (!user.roles.includes(role)) {
                el.style.display = "none";
            } else {
                el.style.display = ""; // 确保显示出来
            }
        });

        // 4 自动填充用户信息
        document.querySelectorAll(".user-email").forEach(el => {
            el.textContent = user?.email || "游客";
        });
    }
});

function toggleUserMenu() {
    const dropdown = document.getElementById("userDropdown");
    if (dropdown) {
        dropdown.classList.toggle("hidden");
    }
}