document.addEventListener('DOMContentLoaded', () => {
    // 入口：统一拉取用户信息
    UserAuth.getUserOrFetch().then(user => {
        Promise.all([
            loadHeader(),
            loadFooter(),
            loadBackButton()
        ]).then(() => {
            applyUserPermissions(user); // 等所有组件加载完成后统一处理权限
            updateHeaderStatus(user); // 添加这一行
        });
    });

    // 加载 Header
    function loadHeader() {
        return fetch('/components/header.html')
            .then(res => res.text())
            .then(html => {
                document.getElementById('header').innerHTML = html;
                registerHeaderMenu(); // 加载完成后注册功能
            });
    }

    function registerHeaderMenu() {
        // User menu toggle for desktop view
        window.toggleUserMenu = function () {
            const user = UserAuth.getCurrentUser();
            if (!user) return;

            const menu = document.getElementById('userMenuLoggedIn');
            const avatar = document.getElementById('userAvatarSection');
            if (!menu || !avatar) return;

            // Update email display
            const emailDiv = menu.querySelector('.text-sm');
            if (emailDiv) {
                emailDiv.innerHTML = `
                <div class="block px-4 py-2 text-gray-600 font-medium">
                    <span class="text-blue-600">${user.email}</span>
                </div>`;
            }

            // Toggle menu visibility
            menu.classList.toggle('hidden');

            // Close menu when clicking outside
            const closeMenu = (e) => {
                if (!menu.contains(e.target) && !avatar.contains(e.target)) {
                    menu.classList.add('hidden');
                    document.removeEventListener('click', closeMenu);
                }
            };

            document.removeEventListener('click', closeMenu);
            setTimeout(() => document.addEventListener('click', closeMenu), 0);
        };

        // Mobile menu toggle and content update
        window.toggleMobileMenu = function () {
            const mobileMenu = document.getElementById('mobileMenu');
            const mobileUserSection = document.getElementById('mobileUserSection');
            const user = UserAuth.getCurrentUser();

            if (!mobileMenu || !mobileUserSection) return;

            mobileMenu.classList.toggle('hidden');
            document.body.classList.toggle('overflow-hidden');

            if (user) {
                mobileUserSection.innerHTML = `
                <div class="border-t border-blue-500 pt-4 mt-4">
                    <div class="block px-4 py-2 text-sm text-white font-medium border-b border-blue-500">
                        ${user.email}
                    </div>
                    <a href="/pages/management/profile.html" 
                       class="block px-4 py-3 text-white hover:bg-blue-500 transition-colors">
                        个人中心
                    </a>
                    <a href="#" 
                       onclick="UserAuth.logout()" 
                       class="block px-4 py-3 text-white hover:bg-blue-500 transition-colors">
                        退出登录
                    </a>
                </div>`;
            } else {
                mobileUserSection.innerHTML = `
                <div class="border-t border-blue-500 pt-4 mt-4">
                    <a href="/pages/auth/login.html" 
                       class="block px-4 py-3 text-white hover:bg-blue-500 transition-colors">
                        登录账号
                    </a>
                </div>`;
            }
        };
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
        return fetch('/components/back-button.html')
            .then(res => res.text())
            .then(html => {
                const backBtnContainer = document.getElementById("back-button");
                if (backBtnContainer) {
                    backBtnContainer.innerHTML = html;

                    // 获取返回按钮并添加事件监听器
                    const backBtn = backBtnContainer.querySelector('button');
                    if (backBtn) {
                        backBtn.onclick = () => {
                            if (document.referrer) {
                                window.history.back();
                            } else {
                                window.location.href = '/index.html';
                            }
                        };
                    }
                }
            });
    }

    function updateHeaderStatus(user) {
        const avatarSection = document.getElementById('userAvatarSection');
        const loginButton = document.getElementById('loginButton');

        if (!avatarSection || !loginButton) return;

        if (user) {
            avatarSection.classList.remove('hidden');
            loginButton.classList.add('hidden');
        } else {
            avatarSection.classList.add('hidden');
            loginButton.classList.remove('hidden');
        }
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
        // 权限配置
    const AUTH_CONFIG = {
            ROUTES: {
                PUBLIC: [
                    '/index.html',
                    '/pages/service/service.html',
                    '/pages/service/airport-pickup.html',
                    '/',
                ],
                LOGIN: '/pages/auth/login.html',
                FORBIDDEN: '/index.html'
            },
            MESSAGES: {
                LOGIN_REQUIRED: '请先登录以访问本页面',
                ACCESS_DENIED: '无权限访问本页'
            }
        };

    function applyUserPermissions(user) {
        // 基础配置
        const body = document.querySelector("body");
        const requiredRole = body?.dataset.requiredRole;
        const currentPath = window.location.pathname.toLowerCase();

        // 权限检查
        try {
            checkRouteAccess(user, currentPath);
            checkRoleAccess(user, requiredRole);
            updateElementVisibility(user);
        } catch (error) {
            handleAuthError(error);
        }
    }

    // 路由访问检查
    function checkRouteAccess(user, currentPath) {
        const isPublicRoute = AUTH_CONFIG.ROUTES.PUBLIC.some(route =>
            currentPath.endsWith(route)
        );

        if (!isPublicRoute && !user) {
            throw {type: 'login', redirect: AUTH_CONFIG.ROUTES.LOGIN};
        }
    }

    // 角色权限检查
    function checkRoleAccess(user, requiredRole) {
        if (requiredRole && user && !user.roles.includes(requiredRole)) {
            throw {type: 'role', redirect: AUTH_CONFIG.ROUTES.FORBIDDEN};
        }
    }

    // 元素可见性控制
    function updateElementVisibility(user) {
        document.querySelectorAll(".role-required").forEach(el => {
            const role = el.dataset.role;
            el.style.display = user?.roles.includes(role) ? "" : "none";
        });
    }

    // 错误处理
    function handleAuthError(error) {
        const message = error.type === 'login'
            ? AUTH_CONFIG.MESSAGES.LOGIN_REQUIRED
            : AUTH_CONFIG.MESSAGES.ACCESS_DENIED;

        alert(message);
        window.location.href = error.redirect;
    }
});
