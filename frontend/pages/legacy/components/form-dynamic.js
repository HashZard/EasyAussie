document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".ea-add-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const container = document.querySelector(btn.dataset.target);
      if (!container) return;

      const wrapper = container.querySelector(".form-clone-wrapper");
      const entries = wrapper.querySelectorAll(".form-entry");
      const limit = parseInt(container.dataset.limit) || 3;

      if (entries.length >= limit) {
        alert("最多添加 " + limit + " 条记录");
        return;
      }

      const clone = entries[0].cloneNode(true);
      clone.querySelectorAll("input, select, textarea").forEach((el) => {
        if (el.type === "radio" || el.type === "checkbox") {
          el.checked = false;
        } else {
          el.value = "";
        }
        el.disabled = false;
      });

      // 更新 radio 的 name 防止冲突（仅限居住历史）
      clone.querySelectorAll("input[type='radio']").forEach((el) => {
        const baseName = el.name.replace(/\d+$/, "");
        el.name = baseName + Date.now(); // 唯一 name
      });

      // 处理 other 输入框
      clone.querySelectorAll("input[id^='otherType']").forEach((el) => el.classList.add("hidden"));

      // 添加删除按钮（首条不添加）
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "×";
      deleteBtn.className = "absolute top-0 right-4 text-red-500 hover:text-red-700 text-xl font-bold";
      deleteBtn.type = "button";
      deleteBtn.onclick = () => clone.remove();
      clone.appendChild(deleteBtn);

      wrapper.appendChild(clone);
    });
  });
});
