/**
 * 统一分页fetch请求[GET]
 * @param {string} baseUrl - 基础url（比如 '/admin/permissions'）
 * @param {object} extraParams - 额外附加参数（比如 { email: 'xxx' }）
 * @param {number} page - 当前页，默认1
 * @param {number} perPage - 每页条数，默认10
 * @returns {Promise<object>} - 返回服务器返回的JSON数据
 */
export async function fetchWithPagination(baseUrl, extraParams = {}, page = 1, perPage = 10) {
    const params = new URLSearchParams(extraParams);
    params.append("page", page);
    params.append("per_page", perPage);

    const finalUrl = `${baseUrl}?${params.toString()}`;

    const response = await fetch(finalUrl);
    if (!response.ok) {
        throw new Error('网络请求失败');
    }
    return await response.json();
}

export async function fetchPost(url, data = {}) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error('网络请求失败');
    }
    return await response.json();
}

/**
 * 统一分页控件渲染
 * @param {HTMLElement} navContainer - 容器元素，比如一个<div>用来放分页按钮
 * @param {number} currentPage - 当前页
 * @param {number} totalPages - 总页数
 * @param {function} onPageChange - 点击页码按钮时调用，参数是新页码
 */
export function renderPagination(navContainer, currentPage, totalPages, onPageChange) {
    navContainer.innerHTML = "";

    if (totalPages <= 1) return; // 只有1页就不渲染分页

    if (currentPage > 1) {
        const prevBtn = document.createElement("button");
        prevBtn.className = "ea-button-small";
        prevBtn.textContent = "上一页";
        prevBtn.onclick = () => {
            onPageChange(currentPage - 1);
        };
        navContainer.appendChild(prevBtn);
    }

    if (currentPage < totalPages) {
        const nextBtn = document.createElement("button");
        nextBtn.className = "ea-button-small";
        nextBtn.textContent = "下一页";
        nextBtn.onclick = () => {
            onPageChange(currentPage + 1);
        };
        navContainer.appendChild(nextBtn);
    }
}