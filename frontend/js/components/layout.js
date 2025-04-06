document.addEventListener('DOMContentLoaded', () => {
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
