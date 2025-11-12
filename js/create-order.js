const API_BASE_URL = 'http://localhost:8080/api';
const CURRENT_USER_ID = 1;

let products = [];//danh sach san pham tu API
let cart = {};//gio hang tam

$(document).ready(function() {
    $('#userInfo').attr('title', 'User #' + CURRENT_USER_ID);
    loadProducts();// Tải danh sách sản phẩm từ backend
    $('#searchProduct').on('input', function() {
        const keyword = $(this).val();
        filterProducts(keyword);
    });

    $('#btnCreateOrder').click(createOrder);
});

function loadProducts() {
    $.ajax({
        url: `${API_BASE_URL}/products`,
        method: 'GET',
        success: function(data) {
            products = data;
            displayProducts(products);
        },
        error: function(xhr) {
            $('#productList').html(`
                <div class="alert alert-danger">
                    <strong>Lỗi!</strong> Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.
                </div>
            `);
        }
    });
}

function displayProducts(productList) {
    if (productList.length === 0) {
        $('#productList').html(`
            <div class="text-center py-4">
                <p class="text-muted">Không tìm thấy sản phẩm nào</p>
            </div>
        `);
        return;
    }

    let html = '';
    productList.forEach(product => {
        const isSelected = cart[product.id] !== undefined;
        const stockStatus = product.stock > 0 ? `Còn lại: ${product.stock}` : 'Hết hàng';
        const stockClass = product.stock > 0 ? 'text-success' : 'text-danger';

        html += `
            <div class="product-select-card ${isSelected ? 'selected' : ''}" 
                 data-id="${product.id}" 
                 onclick="${product.stock > 0 ? 'toggleProduct(' + product.id + ')' : ''}">
                <div class="row align-items-center">
                    <div class="col-3">
                        <img src="${product.imageUrl || 'images/product-placeholder.jpg'}" 
                             class="img-fluid" alt="${product.name}">
                    </div>
                    <div class="col-6">
                        <h6>${product.name}</h6>
                        <p class="product-stock ${stockClass} mb-1">${stockStatus}</p>
                        <span class="product-price">${formatCurrency(product.price)}</span>
                    </div>
                    <div class="col-3 text-end">
                        ${product.stock > 0 ?
            (isSelected ?
                    '<svg class="product-select-icon text-primary" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>' :
                    '<svg class="product-select-icon text-muted" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/></svg>'
            ) :
            '<span class="text-danger">✗</span>'
        }
                    </div>
                </div>
            </div>
        `;
    });
    $('#productList').html(html);
}

function filterProducts(keyword) {
    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(keyword.toLowerCase())
    );
    displayProducts(filtered);
}

function toggleProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock === 0) return;

    if (cart[productId]) {
        // Nếu đã có trong giỏ → xóa
        delete cart[productId];
    } else {
        // Thêm mới vào giỏ
        cart[productId] = {
            product: product,
            quantity: 1//mac dinh so luong bang 1
        };
    }

    updateCartDisplay();//Cập nhật UI giỏ hàng
    displayProducts(products.filter(p =>
        p.name.toLowerCase().includes($('#searchProduct').val().toLowerCase())
    ));
}

function updateCartDisplay() {
    if (Object.keys(cart).length === 0) {
        $('#cartItems').html(`
            <div class="empty-cart text-center py-5">
                <svg width="80" height="80" fill="currentColor" class="text-muted mb-3" viewBox="0 0 16 16">
                    <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>
                <p class="text-muted">Chưa có sản phẩm nào trong giỏ hàng</p>
            </div>
        `);
        $('#btnCreateOrder').prop('disabled', true);
    } else {
        let html = '';
        let totalAmount = 0;
        let totalQuantity = 0;

        Object.values(cart).forEach(item => {
            const subtotal = item.product.price * item.quantity;
            totalAmount += subtotal;
            totalQuantity += item.quantity;

            html += `
                <div class="cart-item">
                    <div class="row align-items-center">
                        <div class="col-3">
                            <img src="${item.product.imageUrl || 'images/product-placeholder.jpg'}" 
                                 class="img-fluid" alt="${item.product.name}">
                        </div>
                        <div class="col-5">
                            <h6>${item.product.name}</h6>
                            <p class="item-price mb-1">${formatCurrency(item.product.price)}</p>
                            <small class="item-stock">Kho: ${item.product.stock}</small>
                        </div>
                        <div class="col-3">
                            <div class="quantity-control">
                                <button class="btn" onclick="updateQuantity(${item.product.id}, -1)">
                                    −
                                </button>
                                <input type="number" value="${item.quantity}" 
                                       min="1" max="${item.product.stock}"
                                       onchange="setQuantity(${item.product.id}, this.value)">
                                <button class="btn" onclick="updateQuantity(${item.product.id}, 1)">
                                    +
                                </button>
                            </div>
                        </div>
                        <div class="col-1 text-end">
                            <button class="btn btn-sm btn-outline-danger btn-remove" 
                                    onclick="removeFromCart(${item.product.id})">
                                ✗
                            </button>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col text-end">
                            <span class="text-muted">Thành tiền: </span>
                            <span class="item-subtotal">${formatCurrency(subtotal)}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        $('#cartItems').html(html);
        $('#totalItems').text(Object.keys(cart).length);
        $('#totalQuantity').text(totalQuantity);
        $('#totalAmount').text(formatCurrency(totalAmount));
        $('#btnCreateOrder').prop('disabled', false);
    }
}

function updateQuantity(productId, delta) {
    if (!cart[productId]) return;

    const newQuantity = cart[productId].quantity + delta;
    const maxStock = cart[productId].product.stock;

    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }

    if (newQuantity > maxStock) {
        alert(`Số lượng không được vượt quá ${maxStock} sản phẩm`);
        return;
    }

    cart[productId].quantity = newQuantity;
    updateCartDisplay();
}

function setQuantity(productId, value) {
    if (!cart[productId]) return;

    const quantity = parseInt(value);
    const maxStock = cart[productId].product.stock;

    if (isNaN(quantity) || quantity < 1) {
        removeFromCart(productId);
        return;
    }

    if (quantity > maxStock) {
        alert(`Số lượng không được vượt quá ${maxStock} sản phẩm`);
        cart[productId].quantity = maxStock;
    } else {
        cart[productId].quantity = quantity;
    }

    updateCartDisplay();
}

function removeFromCart(productId) {
    delete cart[productId];
    updateCartDisplay();
    displayProducts(products.filter(p =>
        p.name.toLowerCase().includes($('#searchProduct').val().toLowerCase())
    ));
}

function createOrder() {
    if (Object.keys(cart).length === 0) {
        alert('Vui lòng thêm sản phẩm vào giỏ hàng');
        return;
    }

    if (!confirm('Xác nhận đặt hàng?')) {
        return;
    }

    const orderItems = Object.values(cart).map(item => ({
        productId: item.product.id,
        quantity: item.quantity
    }));

    console.log('Sending order data:', orderItems);

    $('#btnCreateOrder').prop('disabled', true).text('Đang xử lý...');

    $.ajax({
        url: `${API_BASE_URL}/orders/users/${CURRENT_USER_ID}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(orderItems),
        success: function(order) {
            console.log('Order created successfully:', order);
            alert('✓ Đặt hàng thành công!\n\nMã đơn hàng: #' + order.id + '\nTổng tiền: ' + formatCurrency(order.totalAmount));

            cart = {};
            updateCartDisplay();
            loadProducts();
            $('#btnCreateOrder').prop('disabled', false).text('Đặt hàng');

            setTimeout(() => {
                window.location.href = 'order-list.html';
            }, 1500);
        },
        error: function(xhr, status, error) {
            // 🔥 HIỂN THỊ CHI TIẾT ERROR
            console.log('=== FULL ERROR DETAILS ===');
            console.log('Status:', xhr.status);
            console.log('Status Text:', xhr.statusText);
            console.log('Response Text:', xhr.responseText);
            console.log('Ready State:', xhr.readyState);
            console.log('Full XHR object:', xhr);

            let errorMsg = 'Không thể tạo đơn hàng. Vui lòng thử lại sau.';

            try {
                if (xhr.responseJSON) {
                    if (xhr.responseJSON.message) {
                        errorMsg = xhr.responseJSON.message;
                    } else if (xhr.responseJSON.error) {
                        errorMsg = xhr.responseJSON.error;
                    } else if (xhr.responseJSON.errors) {
                        const errors = xhr.responseJSON.errors;
                        errorMsg = Object.values(errors).join('\n');
                    }
                } else if (xhr.responseText) {
                    errorMsg = xhr.responseText;
                }
            } catch (e) {
                console.log('Error parsing response:', e);
            }

            console.log('Final error message:', errorMsg);
            alert('✗ Lỗi: ' + errorMsg);
            $('#btnCreateOrder').prop('disabled', false).text('Đặt hàng');
        }
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}