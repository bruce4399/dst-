// 在文件开头添加加载保存的分类名称的函数
function loadSavedCategories() {
    const savedCategories = JSON.parse(localStorage.getItem('categories') || '{}');
    document.querySelectorAll('.custom-category').forEach(link => {
        const id = link.getAttribute('href').substring(1); // 移除 # 符号
        if (savedCategories[id]) {
            link.textContent = savedCategories[id];
        }
    });
}

// 修改编辑分类函数
function editCategory(event) {
    event.preventDefault();
    const link = event.target;
    const categoryId = link.getAttribute('href').substring(1);
    const newText = prompt('请输入分类名称：', link.textContent);
    
    if (newText !== null && newText.trim() !== '') {
        link.textContent = newText.trim();
        
        // 保存到 localStorage
        const savedCategories = JSON.parse(localStorage.getItem('categories') || '{}');
        savedCategories[categoryId] = newText.trim();
        localStorage.setItem('categories', JSON.stringify(savedCategories));
        
        showSaveNotification();
    }
}

// 添加显示保存提示的函数
function showSaveNotification() {
    // 创建提示元素
    const notification = document.createElement('div');
    notification.className = 'save-notification';
    notification.textContent = '已保存';
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 2秒后移除提示
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

document.addEventListener('DOMContentLoaded', function() {
    // 加载保存的分类名称
    loadSavedCategories();
    loadSavedPhotos(); // 加载保存的照片

    const addCard = document.querySelector('.add-card');
    const photoInput = document.getElementById('photoInput');
    const gallery = document.querySelector('.gallery');

    // 点击添加按钮时触发文件选择
    addCard.addEventListener('click', () => {
        photoInput.click();
    });

    // 当选择文件后创建新的照片卡片
    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            compressImage(file, function(compressedImageUrl) {
                const newCard = createPhotoCard(compressedImageUrl);
                gallery.insertBefore(newCard, addCard);
                
                // 保存新添加的照片
                savePhoto(compressedImageUrl);
                showSaveNotification();
            });
        }
    });

    // 添加图片压缩功能
    function compressImage(file, callback) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // 减小最大尺寸
                const maxWidth = 600;  // 从800改为600
                const maxHeight = 600; // 从800改为600

                let width = img.width;
                let height = img.height;

                // 计算压缩比例
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // 绘制压缩后的图片
                ctx.drawImage(img, 0, 0, width, height);

                // 降低JPEG质量
                const compressedImageUrl = canvas.toDataURL('image/jpeg', 0.4); // 从0.6改为0.4
                callback(compressedImageUrl);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // 创建新的照片卡片
    function createPhotoCard(imageUrl) {
        const card = document.createElement('div');
        card.className = 'photo-card';
        
        card.innerHTML = `
            <div class="photo-container">
                <div class="photo" style="background-image: url('${imageUrl}')"></div>
                <button class="delete-btn">×</button>
            </div>
        `;

        // 添加删除功能
        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('确定要删除这张照片吗？')) {
                card.remove();
                // 从存储中删除照片
                removePhoto(imageUrl);
                showSaveNotification();
            }
        });

        return card;
    }

    // 修改保存照片函数
    function savePhoto(imageUrl) {
        try {
            // 检查图片大小
            const approximateSize = Math.round((imageUrl.length * 3) / 4);
            const maxSize = 2 * 1024 * 1024; // 2MB限制

            if (approximateSize > maxSize) {
                throw new Error('图片太大，无法保存');
            }

            let savedPhotos = [];
            try {
                // 尝试获取现有照片
                savedPhotos = JSON.parse(localStorage.getItem('photos')) || [];
            } catch (e) {
                console.log('没有找到已保存的照片，创建新的数组');
                savedPhotos = [];
            }

            // 限制保存的照片数量
            const maxPhotos = 50;
            if (savedPhotos.length >= maxPhotos) {
                alert(`最多只能保存${maxPhotos}张照片，请先删除一些再添加。`);
                return;
            }

            // 添加新照片
            savedPhotos.push(imageUrl);

            // 保存到localStorage
            try {
                localStorage.setItem('photos', JSON.stringify(savedPhotos));
                console.log('照片保存成功，大小约: ' + (approximateSize / 1024 / 1024).toFixed(2) + 'MB');
                console.log('当前保存的照片数量:', savedPhotos.length);
            } catch (e) {
                throw new Error('存储空间不足，无法保存更多照片');
            }
        } catch (error) {
            console.error('保存照片失败:', error);
            alert('照片无法保存: ' + error.message);
        }
    }

    // 修改加载照片函数
    function loadSavedPhotos() {
        try {
            let savedPhotos = [];
            const storedPhotos = localStorage.getItem('photos');
            
            if (storedPhotos) {
                savedPhotos = JSON.parse(storedPhotos);
                console.log('找到已保存的照片:', savedPhotos.length, '张');
            }

            if (Array.isArray(savedPhotos) && savedPhotos.length > 0) {
                savedPhotos.forEach((imageUrl, index) => {
                    try {
                        const newCard = createPhotoCard(imageUrl);
                        gallery.insertBefore(newCard, addCard);
                        console.log(`成功加载第 ${index + 1} 张照片`);
                    } catch (e) {
                        console.error(`加载第 ${index + 1} 张照片失败:`, e);
                    }
                });
            } else {
                console.log('没有找到已保存的照片');
            }
        } catch (error) {
            console.error('加载照片失败:', error);
        }
    }

    // 修改删除照片函数
    function removePhoto(imageUrl) {
        try {
            let savedPhotos = JSON.parse(localStorage.getItem('photos')) || [];
            savedPhotos = savedPhotos.filter(url => url !== imageUrl);
            localStorage.setItem('photos', JSON.stringify(savedPhotos));
            console.log('照片删除成功，剩余照片数量:', savedPhotos.length);
        } catch (error) {
            console.error('删除照片失败:', error);
        }
    }
}); 