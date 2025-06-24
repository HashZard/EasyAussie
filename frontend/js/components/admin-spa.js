function loadAdminPage(view) {
    fetch(`/pages/management/${view}.html`)
        .then(res => res.text())
        .then(html => {
            document.getElementById("admin-content").innerHTML = html;
            // if (view === "form-list") fetchFormData?.();
            // if (view === "user-management") loadUserData?.();
        });
}

function bindSidebarNavigation() {
    document.querySelectorAll("#admin-sidebar a").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const href = link.getAttribute("href");
            const view = href.split("/").pop().replace(".html", "");
            loadAdminPage(view);
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    bindSidebarNavigation();
    loadAdminPage("form-list"); // 默认加载第一页
});
