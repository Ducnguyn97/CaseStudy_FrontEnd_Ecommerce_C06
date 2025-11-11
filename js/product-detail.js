const API_BASE_URL = 'http://localhost:8080/api';
const CURRENT_USER_ID = 1;

let currentProduct = null;
let editModal;

$(document).ready(function() {
    $('#userInfo').attr('title', 'User #' + CURRENT_USER_ID);

    // Initialize Bootstrap modal
    editModal = new bootstrap.Modal(document.getElementById('editModal'));

    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        showError();
        return;
    }

    loadProductDetail(productId);

    // Edit button
    $('#btnEdit').on('click', function() {
        openEditModal();
    });

    // Save edit button
    $('#btnSaveEdit').on('click', function() {
        saveProductEdit();
    });

    // Delete button
    $('#btnDelete').on('click', function() {
        deleteProduct();
    });

    // Thumbnail click
    $(document).on('click', '.thumbnail-item', function() {
        const imageUrl = $(this).data('image');
        $('#mainImage').attr('src', imageUrl);
        $('.thumbnail-item').removeClass('active');
        $(this).addClass('active');
    });
});

function loadProductDetail(productId) {
    $('#loading').show();
    $('#productDetail').hide();

    $.ajax({
        url: `${API_BASE_URL}/products/${productId}`,
        method: 'GET',
        success: function(product) {
            $('#loading').hide();
            currentProduct = product;
            displayProductDetail(product);
        },
        error: function(xhr) {
            $('#loading').hide();
            showError();
        }
    });
}

function displayProductDetail(product) {
    // Category
    $('#categoryName').text(product.category ? product.category.name : 'Chưa phân loại');

    // Product name
    $('#productName').text(product.name);

    // Price
    $('#productPrice').text(formatCurrency(product.price));

    // Stock status
    const stockStatus = getStockStatus(product.stock);
    $('#stockStatus')
        .removeClass('in-stock low-stock out-of-stock')
        .addClass(stockStatus.class)
        .html(`<strong>${product.stock}</strong> sản phẩm - ${stockStatus.text}`);

    // Images
    displayProductImages(product);

    $('#productDetail').show();
}

function displayProductImages(product) {
    let images = [];

    // Get all images
    if (product.images && product.images.length > 0) {
        images = product.images.map(img => img.url);
    } else if (product.imageUrl) {
        images = [product.imageUrl];
    } else {
        images = ['../images/product-placeholder.jpg'];
    }

    // Set main image
    $('#mainImage').attr('src', images[0]).attr('alt', product.name);

    // Display thumbnails
    if (images.length > 1) {
        let thumbnailHtml = '';
        images.forEach((imageUrl, index) => {
            const activeClass = index === 0 ? 'active' : '';
            thumbnailHtml += `
                <div class="thumbnail-item ${activeClass}" data-image="${imageUrl}">
                    <img src="${imageUrl}" alt="${product.name} - Ảnh ${index + 1}"
                         onerror="this.src='../images/product-placeholder.jpg'">
                </div>
            `;
        });
        $('#thumbnailImages').html(thumbnailHtml);
    } else {
        $('#thumbnailImages').empty();
    }
}

function openEditModal() {
    if (!currentProduct) return;

    $('#editName').val(currentProduct.name);
    $('#editPrice').val(currentProduct.price);
    $('#editStock').val(currentProduct.stock);

    editModal.show();
}

function saveProductEdit() {
    // Validate form
    const form = $('#editForm')[0];
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const updatedProduct = {
        ...currentProduct,
        name: $('#editName').val(),
        price: parseFloat($('#editPrice').val()),
        stock: parseInt($('#editStock').val())
    };

    $('#btnSaveEdit').prop('disabled', true).text('Đang xử lý...');

    $.ajax({
        url: `${API_BASE_URL}/products/${currentProduct.id}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(updatedProduct),
        success: function(product) {
            editModal.hide();
            alert('✓ Cập nhật sản phẩm thành công!');
            currentProduct = product;
            displayProductDetail(product);
            $('#btnSaveEdit').prop('disabled', false).text('Lưu thay đổi');
        },
        error: function(xhr) {
            const error = xhr.responseJSON?.message || 'Không thể cập nhật sản phẩm';
            alert('✗ Lỗi: ' + error);
            $('#btnSaveEdit').prop('disabled', false).text('Lưu thay đổi');
        }
    });
}

function deleteProduct() {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
        return;
    }

    $('#btnDelete').prop('disabled', true).text('Đang xử lý...');

    $.ajax({
        url: `${API_BASE_URL}/products/${currentProduct.id}`,
        method: 'DELETE',
        success: function() {
            alert('✓ Xóa sản phẩm thành công!');
            window.location.href = 'product-list.html';
        },
        error: function(xhr) {
            const error = xhr.responseJSON?.message || 'Không thể xóa sản phẩm';
            alert('✗ Lỗi: ' + error);
            $('#btnDelete').prop('disabled', false).text('Xóa sản phẩm');
        }
    });
}

function getStockStatus(stock) {
    if (stock === 0) {
        return { class: 'out-of-stock', text: 'Hết hàng' };
    } else if (stock <= 5) {
        return { class: 'low-stock', text: 'Sắp hết hàng' };
    } else {
        return { class: 'in-stock', text: 'Còn hàng' };
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function showError() {
    $('#loading').hide();
    $('#productDetail').html(`
        <div class="error-state text-center py-5">
            <h4 class="text-uppercase">Không tìm thấy sản phẩm</h4>
            <p class="text-muted">Sản phẩm không tồn tại hoặc đã bị xóa</p>
            <a href="product-list.html" class="btn btn-dark btn-medium text-uppercase mt-3">
                Về danh sách sản phẩm
            </a>
        </div>
    `).show();
}