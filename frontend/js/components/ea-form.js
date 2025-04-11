// 通用 LocalStorage 表单自动保存功能（自动跳过 type=file）
document.addEventListener('DOMContentLoaded', () => {
    const FORM_KEY = 'ea-autosave-form';
    const form = document.querySelector('form');
    if (!form) return;

    // 恢复保存内容
    const saved = localStorage.getItem(FORM_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            for (const [name, value] of Object.entries(data)) {
                const elements = document.querySelectorAll(`[name="${name}"]`);
                elements.forEach((el, idx) => {
                    if (el.type === 'radio' || el.type === 'checkbox') {
                        el.checked = value === el.value;
                    } else if (el.tagName === 'SELECT') {
                        el.value = value;
                    } else if (el.type !== 'file') {
                        // 不恢复 file 类型字段
                        el.value = Array.isArray(value) ? value[idx] || '' : value;
                    }
                });
            }
        } catch (e) {
            console.warn('恢复失败:', e);
        }
    }

    // 保存函数
    let timeout;

    function saveForm() {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const data = {};
            const fields = form.querySelectorAll('input, textarea, select');
            fields.forEach(el => {
                if (!el.name || el.disabled || el.type === 'file') return;
                if (el.type === 'radio' || el.type === 'checkbox') {
                    if (el.checked) data[el.name] = el.value;
                } else if (el.name.endsWith('[]')) {
                    if (!data[el.name]) data[el.name] = [];
                    data[el.name].push(el.value);
                } else {
                    data[el.name] = el.value;
                }
            });
            localStorage.setItem(FORM_KEY, JSON.stringify(data));
        }, 300);
    }

    // 监听变化
    form.querySelectorAll('input, textarea, select').forEach(el => {
        if (el.type !== 'file') {
            el.addEventListener('input', saveForm);
            el.addEventListener('change', saveForm);
        }
    });

    // 提交后清空
    form.addEventListener('submit', () => {
        localStorage.removeItem(FORM_KEY);
    });
});

// 提交表单
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('standardForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '提交中...';
        }

        const formData = new FormData(form);
        const actionUrl = form.getAttribute('action') || window.location.pathname;
        const successUrl = form.dataset.success;
        const failUrl = form.dataset.fail;

        try {
            const res = await fetch(actionUrl, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                localStorage.removeItem('ea-autosave-form'); // 可选
                if (successUrl) {
                    window.location.href = successUrl;
                } else {
                    alert('✅ 提交成功');
                }
                form.reset();
            } else {
                if (failUrl) {
                    window.location.href = failUrl;
                } else {
                    const err = await res.text();
                    alert('❌ 提交失败：' + err);
                }
            }
        } catch (error) {
            console.error('提交出错:', error);
            if (failUrl) {
                window.location.href = failUrl;
            } else {
                alert('❌ 网络异常，请稍后再试');
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '提交';
            }
        }
    });
});

// 补充逻辑: 动态插入 email 字段
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("standardForm");

  if (form) {
    // 提交前动态插入 email 字段
    form.addEventListener("submit", () => {
      const existing = form.querySelector("input[name='email']");
      if (!existing) {
        const email = getCookie("user_email");
        if (email) {
          const hidden = document.createElement("input");
          hidden.type = "hidden";
          hidden.name = "email";
          hidden.value = email;
          form.appendChild(hidden);
        }
      }
    });
  }
});
