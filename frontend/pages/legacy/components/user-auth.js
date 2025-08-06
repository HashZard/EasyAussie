// user-auth.js

const UserAuth = (() => {
    const STORAGE_KEY = "currentUser";

    // 缓存中获取email
    function getCurrentEmail() {
        const user = getCurrentUser();
        return user ? user.email : null;
    }

    // 获取缓存中的用户
    function getCurrentUser() {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    }

    // 判断是否有某个角色
    function hasRole(role) {
        const user = getCurrentUser();
        return user && Array.isArray(user.roles) && user.roles.includes(role);
    }

    // 带 token 的 fetch，并自动处理未登录状态
    async function authFetch(url, options = {}, allowAnonymous = false) {
        const token = localStorage.getItem("auth_token");

        const headers = {
            ...options.headers,
            Authorization: token ? `Bearer ${token}` : undefined,
            // "Content-Type": "application/json",
        };

        const fetchOptions = {
            ...options,
            headers,
            credentials: "include",
        };

        const res = await fetch(url, fetchOptions);

        if ((res.status === 401 || res.status === 403) && !allowAnonymous) {
            const current = encodeURIComponent(location.pathname);
            location.href = `/pages/auth/login.html?next=${current}`;
            throw new Error("未登录或无权限");
        }

        return res;
    }

    // 拉取用户信息，并缓存
    async function fetchAndCacheUser() {
        try {
            const res = await authFetch("/api/profile", {}, true); // 允许匿名
            if (res.status === 401 || res.status === 403) {
                clearUser();
                return null;
            }

            const user = await res.json();
            // 防止错误结构被当成正常 user
            if (!user || typeof user !== "object" || !Array.isArray(user.roles)) {
                clearUser();
                return null;
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            return user;
        } catch (err) {
            console.warn("❌ 获取用户信息失败", err);
            clearUser();
            return null;
        }
    }

    // 优先使用缓存，后台刷新
    async function getUserOrFetch() {
        const cached = getCurrentUser();
        if (cached) {
            fetchAndCacheUser().catch(() => {
            });
            return cached;
        } else {
            return await fetchAndCacheUser();
        }
    }

    function logout() {
        authFetch("/api/logout", {
            method: "POST"
        }).then(() => {
            UserAuth.clearUser();
            window.location.href = "/index.html";
        }).catch(err => {
            console.error("登出失败", err);
            alert("登出失败，请重试");
        });
    }

    // 清除缓存（登出时用）
    function clearUser() {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("auth_token");
    }

    // 页面访问权限控制：不满足则跳转
    async function enforceRole(requiredRole) {
        const user = await getUserOrFetch();
        if (!user || !hasRole(requiredRole)) {
            alert("无权限访问本页");
            location.href = "/index.html";
        }
    }

    return {
        getCurrentUser,
        getCurrentEmail,
        authFetch,
        hasRole,
        fetchAndCacheUser,
        getUserOrFetch,
        clearUser,
        enforceRole,
        logout
    };
})();
