document.addEventListener('DOMContentLoaded', () => {
    // ✅ 白名单登录校验
    const whitelist = [
        "/pages/auth/login.html",
        "/pages/service/service.html",
        "/index.html",
    ];
    const currentPath = window.location.pathname;

    console.log("当前路径:", currentPath);

    if (!whitelist.includes(currentPath)) {
        checkLogin(true); // 调用已有的登录检查
        console.log("用户已登录");
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
    const match = document.cookie.match('(^|;)\s*' + name + '\s*=\s*([^;]+)');
    return match ? match.pop() : '';
}

function setCookie(name, value, days = 1) {
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

function checkLogin(redirect = true) {
    const email = getCookie("user_email");
    if (!email && redirect) {
        window.location.href = "/pages/auth/login.html";
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