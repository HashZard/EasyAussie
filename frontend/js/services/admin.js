// admin.js - 公共 Admin 页面逻辑（权限校验 + sidebar 加载）
document.addEventListener("DOMContentLoaded", () => {
  // 权限校验
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  /*const role = getCookie("user_role");
  if (role !== "admin") {
    alert("⛔ 你没有权限访问该页面");
    window.location.href = "/login.html";
    return;
  }*/

  // ✅ 动态加载 sidebar HTML 文件
  const sidebarContainer = document.getElementById("admin-sidebar");
  if (sidebarContainer) {
    fetch("/components/admin_sidebar.html")
      .then(res => res.text())
      .then(html => {
        sidebarContainer.innerHTML = html;
      });
  }
});
