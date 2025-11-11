const API_BASE_URL = 'http://localhost:8080/api';
const CURRENT_USER_ID = 1;

let selectedFiles = [];

$(document).ready(function() {
    $('#userInfo').attr('title', 'User #' + CURRENT_USER_ID);

    loadCategories();

    // Handle file selection
    $('#productImages').on('change', function(e) {
        handleFileSelect(e.target.files);
    });

    // Form submission
    $('#productForm').on('submit', function(e) {
        e.preventDefault();
        submitProduct();
    });
});

function loadCategories() {
    $.ajax({
        url: `${API_BASE_URL}/categories`,
        method: 'GET',
        success: function(categories) {
            let options = '<option value="">-- Chọn danh mục --</option>';
            categories.forEach(category => {
                options += `<option value="${category.id}">${category.name}</option>`;
            });
            $('#productCategory').html(options);
        },
        error: function(xhr) {
            alert('✗ Không thể tải danh mục sản phẩm');
        }
    });
}

function handleFileSelect(files) {
    // Limit to 5 images
    if (files.length > 5) {
        alert('Chỉ được chọn tối đa 5 ảnh');
        $('#productImages').val('');
        return;
    }

    selectedFiles = Array.from(files);
    displayImagePreview();
}

function displayImagePreview() {
    const container = $('#imagePreview');
    container.empty();

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();

        reader.onload = function(e) {
            const previewHtml = `
                <div class="image-preview-item">
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <button type="button" class="remove-image" onclick="removeImage(${index})">
                        ×
                    </button>
                </div>
            `;
            container.append(previewHtml);
        };

        reader.readAsDataURL(file);
    });
}

function removeImage(index) {
    selectedFiles.splice(index, 1);

    // Update file input
    const dt = new DataTransfer();
    selectedFiles.forEach(file => dt.items.add(file));
    $('#productImages')[0].files = dt.files;

    displayImagePreview();
}

function submitProduct() {
    // Validate form
    const form = $('#productForm')[0];
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const formData = new FormData();

    // Add basic fields
    formData.append('name', $('#productName').val());
    formData.append('price', $('#productPrice').val());
    formData.append('stock', $('#productStock').val());
    formData.append('categoryId', $('#productCategory').val());

    // Add images
    selectedFiles.forEach(file => {
        formData.append('images', file);
    });

    // Disable submit button
    $('#btnSubmit').prop('disabled', true).text('Đang xử lý...');

    $.ajax({
        url: `${API_BASE_URL}/products`,
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(product) {
            alert('✓ Thêm sản phẩm thành công!');
            window.location.href = 'product-detail.html?id=' + product.id;
        },
        error: function(xhr) {
            let errorMsg = 'Không thể thêm sản phẩm';

            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMsg = xhr.responseJSON.message;
            }

            alert('✗ Lỗi: ' + errorMsg);
            $('#btnSubmit').prop('disabled', false).text('Thêm sản phẩm');
        }
    });
}