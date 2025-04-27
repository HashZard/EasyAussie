document.addEventListener('DOMContentLoaded', () => {
    // 白名单登录校验
    const whitelist = [
        "/pages/auth/login.html",
        "/pages/service/service.html",
        "/index.html",
    ];
    const currentPath = window.location.pathname;

    // 页面是否需要权限
    const permissionMeta = document.querySelector('meta[name="permission"]');
    const needsPermission = permissionMeta && permissionMeta.getAttribute('content') === 'required';

    console.log("当前路径:", currentPath);

    if (!whitelist.includes(currentPath)) {
        checkLogin(true); // 调用已有的登录检查
        if (needsPermission) {
            checkPermission(); // 只有需要权限的页面才调用
            console.log("Meta标记了需要鉴权，正在校验权限");
        } else {
            console.log("Meta未标记，不校验权限");
        }
        console.log("用户已登录，执行权限校验");
    }

    fetch('/components/header.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('header').innerHTML = html;
        });

    fetch('/components/footer.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('footer').innerHTML = html;
        });

    // 动态插入返回按钮组件
    fetch('/components/back-button.html')
        .then(res => res.text())
        .then(html => {
            const backBtnContainer = document.getElementById("back-button");
            if (backBtnContainer) {
                backBtnContainer.innerHTML = html;
            }
        });
});

// js/auth.js

function getCookie(name) {
    const cookies = document.cookie.split(";").map(c => c.trim());
    for (let c of cookies) {
        if (c.startsWith(name + "=")) {
            return decodeURIComponent(c.split("=")[1]);
        }
    }
    return "";
}

function setCookie(name, value, days = 1) {
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

function checkLogin(redirect = true) {
    const email = getCookie("user_email");
    if (!email && redirect) {
        const currentPath = window.location.pathname + window.location.search + window.location.hash;
        const loginUrl = "/pages/auth/login.html?next=" + encodeURIComponent(currentPath);
        window.location.href = loginUrl;
    }
    return email;
}

function logout() {
    setCookie("user_email", "", -1); // 清除 cookie
    alert("退出成功");
    // window.location.href = "/pages/auth/login.html";
}

function toggleUserMenu() {
    const dropdown = document.getElementById("userDropdown");
    dropdown.classList.toggle("hidden");
}

document.addEventListener("click", function (e) {
    const dropdown = document.getElementById("userDropdown");
    const avatar = e.target.closest(".relative");
    if (!avatar) {
        dropdown?.classList.add("hidden");
    }
});

// 校验用户对页面的访问权限
function checkPermission() {
    fetch('/api/permissions')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data.allowed_pages)) {
                const allowedPages = data.allowed_pages;
                const currentPath = window.location.pathname;

                console.log("当前路径:", currentPath);
                console.log("允许访问的页面:", allowedPages);

                if (!allowedPages.includes(currentPath)) {
                    alert("您没有权限访问此页面！");
                    window.location.href = "/pages/error/403.html";  // 假设有403错误页
                } else {
                    console.log("权限校验通过 ✅");
                }
            } else {
                console.error("check_permission接口返回异常", data);
            }
        })
        .catch(err => {
            console.error("权限检查异常:", err);
        });
}
