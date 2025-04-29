import {fetchWithPagination, fetchPost} from '/js/components/common.js';
import {renderPagination} from '/js/components/common.js';

let currentPage = 1;
let currentEmail = "";

document.addEventListener("DOMContentLoaded", () => {
    const searchForm = document.getElementById("searchPermissionForm");
    const addForm = document.getElementById("addPermissionForm");
    const permissionList = document.getElementById("permissionList");
    const resetBtn = document.getElementById("resetSearch");

    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        currentPage = 1;
        currentEmail = document.getElementById("searchEmail").value.trim();
        fetchPermissionList(currentPage);
    });

    resetBtn.addEventListener("click", () => {
        document.getElementById("searchEmail").value = "";
        currentEmail = "";
        currentPage = 1;
        permissionList.innerHTML = "<p>请先查询权限</p>";
        document.getElementById("paginationControls").innerHTML = "";
    });

    addForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value.trim();
        const pagePath = document.getElementById("page_path").value.trim();
        if (!email || !pagePath) {
            alert("请输入完整信息");
            return;
        }
        try {
            const data = await fetchPost("/admin/permissions", {
                email,
                page_path: pagePath,
                action: "grant"
            });
            if (data.success) {
                alert("添加成功！");
                addForm.reset();
                currentEmail = email;
                currentPage = 1;
                fetchPermissionList(currentPage);
            } else {
                alert("添加失败：" + (data.message || "未知错误"));
            }
        } catch (err) {
            console.error(err);
            alert("网络错误，添加失败！");
        }
    });
});

async function fetchPermissionList(page = 1) {
    currentPage = page;
    const permissionList = document.getElementById("permissionList");
    const nav = document.getElementById("paginationControls");

    permissionList.innerHTML = "<p>加载中...</p>";
    nav.innerHTML = "";

    try {
        const extraParams = {};
        if (currentEmail) {
            extraParams.email = currentEmail;
        }

        const result = await fetchWithPagination("/admin/permissions", extraParams, currentPage, 10);
        renderPermissionList(result.data || [], result.pagination.page, result.pagination.pages);
    } catch (err) {
        console.error(err);
        permissionList.innerHTML = "<p class='text-red-500'>加载失败</p>";
    }
}

function renderPermissionList(permissions, currentPage, totalPages) {
    const permissionList = document.getElementById("permissionList");
    const nav = document.getElementById("paginationControls");
    permissionList.innerHTML = "";
    nav.innerHTML = "";

    if (permissions.length === 0) {
        permissionList.innerHTML = "<p>无权限记录</p>";
        return;
    }

    permissions.forEach(item => {
        const div = document.createElement("div");
        div.className = "flex items-center justify-between bg-gray-100 p-3 rounded";
        div.innerHTML = `
            <div>
                <div><strong>邮箱：</strong>${item.email}</div>
                <div><strong>页面：</strong>${item.page_path}</div>
            </div>
            <button class="ea-button-small bg-red-500 hover:bg-red-600">撤销</button>
        `;
        const deleteBtn = div.querySelector('button');
        deleteBtn.addEventListener('click', () => {
            deletePermission(item.email, item.page_path);
        });
        permissionList.appendChild(div);
    });

    renderPagination(nav, currentPage, totalPages, (newPage) => {
        fetchPermissionList(newPage);
    });
}

async function deletePermission(email, pagePath) {
    if (!confirm(`确认撤销 ${email} 的权限？`)) return;

    try {
        const data = await fetchPost("/admin/permissions", {
            email,
            page_path: pagePath,
            action: "revoke"
        });
        if (data.success) {
            alert("撤销成功！");
            fetchPermissionList(currentPage);
        } else {
            alert("撤销失败：" + (data.message || "未知错误"));
        }
    } catch (err) {
        console.error(err);
        alert("网络错误，撤销失败！");
    }
}
