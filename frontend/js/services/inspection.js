// 添加/移除检查项
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("checklist-container");
    const addBtn = document.getElementById("add-checklist");

    addBtn.addEventListener("click", () => {
        const count = container.querySelectorAll("input[name='checklist[]']").length;
        if (count < 5) {
            const item = document.createElement("div");
            item.className = "flex items-center mb-2";

            const input = document.createElement("input");
            input.type = "text";
            input.name = "checklist[]";
            input.className = "flex-grow ea-input";
            input.placeholder = "输入重点检查事项";

            const remove = document.createElement("button");
            remove.textContent = "移除";
            remove.className = "ml-2 px-3 py-1 text-sm rounded bg-red-100 text-red-600 hover:bg-red-200 transition whitespace-nowrap";
            remove.addEventListener("click", () => item.remove());

            item.appendChild(input);
            item.appendChild(remove);
            container.appendChild(item);
        } else {
            alert("最多只能添加 5 个检查项");
        }
    });

    preloadLatestInspectionData();
});

// 自动填充历史数据
async function preloadLatestInspectionData() {
    const email = getCookie?.("user_email");
    if (!email) return;

    try {
        const res = await fetch("/inspect/latest");
        if (res.ok) {
            const data = await res.json();
            if (data.name) document.getElementById("name").value = data.name;
            if (data.email) document.getElementById("email").value = data.email;
            if (data.phone) document.getElementById("phone").value = data.phone;

            if (Array.isArray(data.checklist)) {
                const container = document.getElementById("checklist-container");
                container.innerHTML = '';
                data.checklist.slice(0, 5).forEach(text => {
                    const div = document.createElement("div");
                    div.className = "flex items-center mb-2";
                    const input = document.createElement("input");
                    input.type = "text";
                    input.name = "checklist[]";
                    input.className = "flex-grow ea-input";
                    input.value = text;
                    div.appendChild(input);
                    container.appendChild(div);
                });
            }
        }
    } catch (err) {
        console.error("预加载失败：", err);
    }
}
