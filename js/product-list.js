// product-list.js
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

    // Open detail by clicking the whole card
    $(document).on('click', '.product-card', function(e) {
        // Ignore clicks on inner action buttons
        if ($(e.target).closest('.product-actions').length) {
            return;
        }
        const id = $(this).data('id');
        if (id != null) {
            window.location.href = 'product-detail.html?id=' + id;
        }
    });

    // Keyboard accessibility: Enter to open details
    $(document).on('keydown', '.product-card', function(e) {
        if (e.key === 'Enter') {
            const id = $(this).data('id');
            if (id != null) {
                window.location.href = 'product-detail.html?id=' + id;
            }
        }
    });

    // Add to cart (delegate)
    $(document).on('click', '.btn-add-to-cart', function(e) {
        e.stopPropagation();
        const id = Number($(this).data('id'));
        addToCart(id);
    });

    // Delete product (delegate)
    $(document).on('click', '.btn-delete-product', function(e) {
        e.stopPropagation();
        const id = Number($(this).data('id'));
        deleteProduct(id);
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
        error: function(xhr, status, error) {
            console.error('Category API Error:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText,
                error: error
            });

            // Hiển thị danh mục mặc định nếu API lỗi
            $('#categoryList').html('<li><a href="#" data-category="all" class="category-filter active">Tất cả</a></li>');
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
            console.log('Products loaded:', products); // Debug log

            if (!products || products.length === 0) {
                $('#emptyState').show();
                return;
            }

            allProducts = products;
            filteredProducts = products;
            displayProducts(products);
        },
        error: function(xhr, status, error) {
            $('#loading').hide();
            console.error('API Error:', {
                status: xhr.status,
                statusText: xhr.statusText,
                responseText: xhr.responseText,
                error: error
            });

            // Hiển thị thông báo lỗi chi tiết hơn
            let errorMsg = 'Không thể tải danh sách sản phẩm';
            if (xhr.status === 0) {
                errorMsg = 'Không thể kết nối đến server. Kiểm tra kết nối và CORS.';
            } else if (xhr.status === 404) {
                errorMsg = 'API endpoint không tồn tại. Kiểm tra URL.';
            } else if (xhr.status === 500) {
                errorMsg = 'Lỗi server. Kiểm tra console backend.';
            }

            $('#productGrid').html(`
                <div class="col-12">
                    <div class="alert alert-danger">
                        <strong>Lỗi:</strong> ${errorMsg}
                        <br><small>URL: ${API_BASE_URL}/products</small>
                    </div>
                </div>
            `);
        }
    });
}

function displayProducts(products) {
    if (!products || products.length === 0) {
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
                <div class="product-card" data-id="${product.id}" role="button" tabindex="0" aria-label="Xem chi tiết ${escapeHtml(product.name)}">
                    <div class="image-holder">
                        <img src="${imageUrl}" alt="${escapeHtml(product.name)}">
                        <span class="stock-badge ${stockStatus.class}">${stockStatus.text}</span>
                    </div>
                    <div class="card-detail">
                        <p class="category-name">${product.category ? escapeHtml(product.category.name) : 'Chưa phân loại'}</p>
                        <h3 class="card-title">${escapeHtml(product.name)}</h3>
                        <p class="item-price">${formatCurrency(product.price)}</p>
                        <div class="product-actions d-flex gap-2">
                            <button
                                class="btn btn-dark btn-add-to-cart"
                                data-id="${product.id}"
                                ${product.stock === 0 ? 'disabled' : ''}>
                                Thêm vào giỏ hàng
                            </button>
                            <button
                                class="btn btn-outline-accent btn-delete-product"
                                data-id="${product.id}">
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
            (p.name || '').toLowerCase().includes(keyword)
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

    const keyword = ($('#searchInput').val() || '').toLowerCase();
    if (keyword) {
        filtered = filtered.filter(p =>
            (p.name || '').toLowerCase().includes(keyword)
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

    const keyword = ($('#searchInput').val() || '').toLowerCase();
    if (keyword) {
        filtered = filtered.filter(p =>
            (p.name || '').toLowerCase().includes(keyword)
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
    if (!stock || stock === 0) {
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
    }).format(amount || 0);
}

/* =========================== Cart (localStorage) =========================== */
function getCartKey() {
    return `cart_${CURRENT_USER_ID}`;
}

function getCart() {
    try {
        const raw = localStorage.getItem(getCartKey());
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.warn('Cart parse error', e);
        return [];
    }
}

function saveCart(items) {
    try {
        localStorage.setItem(getCartKey(), JSON.stringify(items || []));
    } catch (e) {
        console.warn('Cart save error', e);
    }
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id == productId);
    if (!product) {
        alert('✗ Không tìm thấy sản phẩm.');
        return;
    }
    if (!product.stock || product.stock <= 0) {
        alert('✗ Sản phẩm đã hết hàng.');
        return;
    }

    const cart = getCart();
    const item = cart.find(i => i.productId == productId);

    if (item) {
        // Không vượt quá tồn kho hiện tại
        if (item.quantity < product.stock) {
            item.quantity += 1;
        } else {
            alert('✗ Số lượng trong giỏ đã đạt tồn kho tối đa.');
            return;
        }
    } else {
        cart.push({ productId: productId, quantity: 1 });
    }

    saveCart(cart);
    alert(`✓ Đã thêm "${product.name}" vào giỏ hàng`);
}

/* =========================== Utilities =========================== */
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}