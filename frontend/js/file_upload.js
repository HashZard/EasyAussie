document.addEventListener('DOMContentLoaded', () => {
    const fileInputs = document.querySelectorAll('input[type="file"][multiple][data-preview]');

    fileInputs.forEach(input => {
        const previewId = input.dataset.preview;
        const previewList = document.getElementById(previewId);

        // 存储所有上传的文件
        let filesArray = [];

        input.addEventListener('change', () => {
            // 追加新选择的文件，而不是替换
            const newFiles = Array.from(input.files);
            filesArray = filesArray.concat(newFiles);

            // 重新构建 input.files
            const dt = new DataTransfer();
            filesArray.forEach(file => dt.items.add(file));
            input.files = dt.files;

            updatePreview();
        });

        function updatePreview() {
            previewList.innerHTML = '';
            filesArray.forEach((file, index) => {
                const li = document.createElement('li');
                li.className = "flex justify-between items-center bg-gray-100 px-2 py-1 rounded";
                li.innerHTML = `
          <span class="truncate w-4/5">${file.name}</span>
          <button type="button" class="text-red-500 hover:underline text-sm" data-index="${index}">删除</button>
        `;
                previewList.appendChild(li);
            });
        }

        previewList.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const index = parseInt(e.target.dataset.index);
                filesArray.splice(index, 1);

                const dt = new DataTransfer();
                filesArray.forEach(f => dt.items.add(f));
                input.files = dt.files;

                updatePreview();
            }
        });
    });
});

