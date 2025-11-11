const API_BASE_URL = 'http://localhost:8080/api';
const CURRENT_USER_ID = 1;

let allProducts = [];
let allCategories = [];
let filteredProducts = [];

$(document).ready(function() {
    $('#userInfo').attr('title', 'User #' + CURRENT_USER_ID);

    loadCategories();
    loadProducts();

    // Search functionality
    $('#searchInput').on('input', function() {
        const keyword = $(this).val().toLowerCase();
        filterProducts(keyword);
    });

    // Category filter
    $(document).on('click', '.category-filter', function(e) {
        e.preventDefault();
        $('.category-filter').removeClass('active');
        $(this).addClass('active');

        const categoryId = $(this).data('category');
        filterByCategory(categoryId);
    });

    // Price filter
    $(document).on('click', '.price-filter', function(e) {
        e.preventDefault();
        $('.price-filter').removeClass('active');
        $(this).addClass('active');

        const priceRange = $(this).data('price');
        filterByPrice(priceRange);
    });
});

function loadCategories() {
    $.ajax({
        url: `${API_BASE_URL}/categories`,
        method: 'GET',
        success: function(categories) {
            allCategories = categories;
            displayCategories(categories);
        },
        error: function(xhr) {
            console.error('Không thể tải danh mục');
        }
    });
}

function displayCategories(categories) {
    let html = '<li><a href="#" data-category="all" class="category-filter active">Tất cả</a></li>';

    categories.forEach(category => {
        html += `
            <li>
                <a href="#" data-category="${category.id}" class="category-filter">
                    ${category.name}
                </a>
            </li>
        `;
    });

    $('#categoryList').html(html);
}

function loadProducts() {
    $('#loading').show();
    $('#productGrid').empty();
    $('#emptyState').hide();

    $.ajax({
        url: `${API_BASE_URL}/products`,
        method: 'GET',
        success: function(products) {
            $('#loading').hide();

            if (products.length === 0) {
                $('#emptyState').show();
                return;
            }

            allProducts = products;
            filteredProducts = products;
            displayProducts(products);
        },
        error: function(xhr) {
            $('#loading').hide();
            alert('✗ Không thể tải danh sách sản phẩm');
        }
    });
}

function displayProducts(products) {
    if (products.length === 0) {
        $('#productGrid').empty();
        $('#emptyState').show();
        return;
    }

    $('#emptyState').hide();
    let html = '';

    products.forEach(product => {
        const stockStatus = getStockStatus(product.stock);
        const imageUrl = product.imageUrl || (product.images && product.images.length > 0 ? product.images[0].url : '../images/product-placeholder.jpg');

        html += `
            <div class="col-lg-4 col-md-6">
                <div class="product-card">
                    <div class="image-holder">
                        <img src="${imageUrl}" alt="${product.name}" 
                             onerror="this.src='../images/product-placeholder.jpg'">
                        <span class="stock-badge ${stockStatus.class}">${stockStatus.text}</span>
                    </div>
                    <div class="card-detail">
                        <p class="category-name">${product.category ? product.category.name : 'Chưa phân loại'}</p>
                        <h3 class="card-title">
                            <a href="product-detail.html?id=${product.id}">${product.name}</a>
                        </h3>
                        <p class="item-price">${formatCurrency(product.price)}</p>
                        <div class="product-actions">
                            <a href="product-detail.html?id=${product.id}" class="btn btn-outline-dark">
                                Chi tiết
                            </a>
                            <button class="btn btn-outline-accent" onclick="deleteProduct(${product.id})">
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    $('#productGrid').html(html);
}

function filterProducts(keyword) {
    let filtered = allProducts;

    if (keyword) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(keyword)
        );
    }

    filteredProducts = filtered;
    displayProducts(filtered);
}

function filterByCategory(categoryId) {
    let filtered = allProducts;

    if (categoryId !== 'all') {
        filtered = filtered.filter(p =>
            p.category && p.category.id == categoryId
        );
    }

    const keyword = $('#searchInput').val().toLowerCase();
    if (keyword) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(keyword)
        );
    }

    filteredProducts = filtered;
    displayProducts(filtered);
}

function filterByPrice(priceRange) {
    let filtered = allProducts;

    if (priceRange !== 'all') {
        const [min, max] = priceRange.split('-').map(Number);
        filtered = filtered.filter(p =>
            p.price >= min && p.price <= max
        );
    }

    const keyword = $('#searchInput').val().toLowerCase();
    if (keyword) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(keyword)
        );
    }

    // Apply category filter
    const activeCategoryId = $('.category-filter.active').data('category');
    if (activeCategoryId !== 'all') {
        filtered = filtered.filter(p =>
            p.category && p.category.id == activeCategoryId
        );
    }

    filteredProducts = filtered;
    displayProducts(filtered);
}

function deleteProduct(productId) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
        return;
    }

    $.ajax({
        url: `${API_BASE_URL}/products/${productId}`,
        method: 'DELETE',
        success: function() {
            alert('✓ Xóa sản phẩm thành công!');
            loadProducts();
        },
        error: function(xhr) {
            const error = xhr.responseJSON?.message || 'Không thể xóa sản phẩm';
            alert('✗ Lỗi: ' + error);
        }
    });
}

function getStockStatus(stock) {
    if (stock === 0) {
        return { class: 'out-of-stock', text: 'Hết hàng' };
    } else if (stock <= 5) {
        return { class: 'low-stock', text: 'Sắp hết' };
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