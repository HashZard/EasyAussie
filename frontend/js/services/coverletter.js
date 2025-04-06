// 读取 Cookie 中的邮箱
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

// 自动填入邮箱
window.addEventListener('DOMContentLoaded', () => {
    const email = checkLogin?.();
    const emailInput = document.querySelector('input[name="email"]');
    if (email && emailInput) {
        emailInput.value = email;
    }
});

// 切换“学生 / 工作”
function switchApplicantType(type) {
    const tabStudent = document.getElementById('tabStudent');
    const tabWorker = document.getElementById('tabWorker');

    const studiedInAusField = document.getElementById('studiedInAusField');
    const workExperienceContainer = document.getElementById('workExperienceContainer');
    const visaType = document.getElementById('visaType');

    if (type === 'student') {
        // 选中“学生”
        tabStudent.classList.add('bg-blue-600', 'text-white');
        tabStudent.classList.remove('bg-white', 'text-gray-700');
        tabWorker.classList.add('bg-white', 'text-gray-700');
        tabWorker.classList.remove('bg-blue-600', 'text-white');

        // 隐藏工作字段
        studiedInAusField.classList.add('hidden');
        workExperienceContainer.classList.add('hidden');
        visaType.classList.add('hidden');
    } else {
        // 选中“工作”
        tabWorker.classList.add('bg-blue-600', 'text-white');
        tabWorker.classList.remove('bg-white', 'text-gray-700');
        tabStudent.classList.add('bg-white', 'text-gray-700');
        tabStudent.classList.remove('bg-blue-600', 'text-white');

        // 显示工作字段
        studiedInAusField.classList.remove('hidden');
        workExperienceContainer.classList.remove('hidden');
        visaType.classList.remove('hidden');
    }
}

// 是否显示某一栏
function toggleInlineSection(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('opacity-0', !show);
    el.classList.toggle('pointer-events-none', !show);
}

// 是否可选选项,false禁用and重置
function toggleSelectBox(enable, selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  if (enable) {
    select.removeAttribute('disabled');
    select.classList.remove('ea-select-disabled');
  } else {
    select.value = '';
    select.setAttribute('disabled', true);
    select.classList.add('ea-select-disabled');
  }
}

function toggleSelectByNames(enable, names) {
  if (!Array.isArray(names)) return;

  names.forEach(name => {
    const elements = document.querySelectorAll(`[name="${name}"]`);
    elements.forEach(el => {
      if (enable) {
        el.removeAttribute('disabled');
        el.classList.remove('ea-select-disabled');
      } else {
        el.value = '';
        el.setAttribute('disabled', true);
        el.classList.add('ea-select-disabled');
      }
    });
  });
}

// 初始化：默认选择“学生”
document.addEventListener("DOMContentLoaded", () => {
    switchApplicantType('student');
});
