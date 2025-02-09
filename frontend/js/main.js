document.getElementById('bookingForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const data = Object.fromEntries(formData);

  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    alert('提交成功: ' + result.message);
  } catch (error) {
    console.error('提交失败:', error);
    alert('提交失败');
  }
});
