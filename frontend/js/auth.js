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
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "devuser@example.com"; // 自动跳过登录
  }

  const email = getCookie("user_email");
  if (!email && redirect) {
    window.location.href = "/pages/auth/login.html";

  }
  return email;
}

function logout() {
  setCookie("user_email", "", -1); // 清除 cookie
  window.location.href = "/pages/auth/login.html";
}
