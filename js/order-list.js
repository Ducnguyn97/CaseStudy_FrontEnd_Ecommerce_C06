const API_BASE_URL = 'http://localhost:8080/api';
const CURRENT_USER_ID = 1; // Lấy từ session/localStorage

$(document).ready(function() {
    $('#userInfo').attr('title', 'User #' + CURRENT_USER_ID);
    loadOrders();
});

function loadOrders() {
    $('#loading').show();
    $('#orderContainer').empty();
    $('#emptyState').hide();

    $.ajax({
        url: `${API_BASE_URL}/orders/users/${CURRENT_USER_ID}`,
        method: 'GET',
        success: function(orders) {
            $('#loading').hide();

            if (orders.length === 0) {
                $('#emptyState').show();
                return;
            }

            // Sắp xếp đơn hàng mới nhất trước
            orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

            orders.forEach(order => {
                $('#orderContainer').append(createOrderCard(order));
            });
        },
        error: function(xhr) {
            $('#loading').hide();
            showError('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.');
        }
    });
}

function createOrderCard(order) {
    const statusText = getStatusText(order.status);
    const orderDate = formatDate(order.orderDate);
    const canCancel = ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status);

    return `
        <div class="order-card">
            <div class="order-header">
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <strong>ĐƠN HÀNG #${order.id}</strong>
                        <br><small class="text-muted">${orderDate}</small>
                    </div>
                    <div class="col-md-4 text-center">
                        <span class="status-badge status-${order.status}">${statusText}</span>
                    </div>
                    <div class="col-md-4 text-end">
                        <strong class="text-danger" style="font-size: 1.5em;">${formatCurrency(order.totalAmount)}</strong>
                    </div>
                </div>
            </div>
            <div class="order-body">
                <div class="row">
                    <div class="col-md-8">
                        <h6>Sản phẩm đã đặt</h6>
                        <div id="orderItems-${order.id}">
                            <small class="text-muted">Đang tải thông tin sản phẩm...</small>
                        </div>
                    </div>
                    <div class="col-md-4 text-end order-actions">
                        <button class="btn btn-small btn-outline-dark" onclick="viewOrderDetail(${order.id})">
                            Chi tiết
                        </button>
                        ${canCancel ? `
                            <button class="btn btn-small btn-outline-accent" onclick="confirmCancelOrder(${order.id})">
                                Hủy đơn
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function viewOrderDetail(orderId) {
    const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
    modal.show();

    $('#orderDetailContent').html(`
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3 text-muted">Đang tải thông tin...</p>
        </div>
    `);

    $.ajax({
        url: `${API_BASE_URL}/orders/${orderId}`,
        method: 'GET',
        success: function(order) {
            const orderDate = formatDate(order.orderDate);
            const statusText = getStatusText(order.status);

            let html = `
                <div class="order-summary-info">
                    <div class="row">
                        <div class="col-6">
                            <strong>Mã đơn hàng:</strong>
                        </div>
                        <div class="col-6 text-end">
                            #${order.id}
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-6">
                            <strong>Ngày đặt:</strong>
                        </div>
                        <div class="col-6 text-end">
                            ${orderDate}
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-6">
                            <strong>Trạng thái:</strong>
                        </div>
                        <div class="col-6 text-end">
                            <span class="status-badge status-${order.status}">${statusText}</span>
                        </div>
                    </div>
                </div>
                
                <h6>Sản phẩm đã đặt:</h6>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th class="text-center">Số lượng</th>
                            <th class="text-end">Đơn giá</th>
                            <th class="text-end">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            order.orderDetails.forEach(detail => {
                const subtotal = detail.price * detail.quantity;
                html += `
                    <tr>
                        <td>
                            <strong>${detail.product.name}</strong>
                        </td>
                        <td class="text-center">${detail.quantity}</td>
                        <td class="text-end">${formatCurrency(detail.price)}</td>
                        <td class="text-end"><strong>${formatCurrency(subtotal)}</strong></td>
                    </tr>
                `;
            });

            html += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colspan="3" class="text-end text-uppercase">Tổng cộng:</th>
                            <th class="text-end">
                                <span class="text-danger" style="font-size: 1.3em;">${formatCurrency(order.totalAmount)}</span>
                            </th>
                        </tr>
                    </tfoot>
                </table>
            `;

            $('#orderDetailContent').html(html);
        },
        error: function(xhr) {
            $('#orderDetailContent').html(`
                <div class="alert alert-danger">
                    <strong>Lỗi!</strong> Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.
                </div>
            `);
        }
    });
}

function confirmCancelOrder(orderId) {
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?\n\nLưu ý: Sau khi hủy, bạn sẽ không thể khôi phục lại đơn hàng.')) {
        cancelOrder(orderId);
    }
}

function cancelOrder(orderId) {
    // Hiển thị loading
    $('button[onclick="confirmCancelOrder(' + orderId + ')"]').prop('disabled', true).text('Đang xử lý...');

    $.ajax({
        url: `${API_BASE_URL}/orders/${orderId}/cancel`,
        method: 'PUT',
        success: function(order) {
            showSuccess('Đơn hàng đã được hủy thành công!');
            // Reload lại danh sách đơn hàng
            setTimeout(() => {
                loadOrders();
            }, 1000);
        },
        error: function(xhr) {
            const error = xhr.responseJSON?.message || 'Không thể hủy đơn hàng. Vui lòng thử lại sau.';
            showError(error);
            $('button[onclick="confirmCancelOrder(' + orderId + ')"]').prop('disabled', false).text('Hủy đơn');
        }
    });
}

function getStatusText(status) {
    const statusMap = {
        'PENDING': 'Chờ xác nhận',
        'CONFIRMED': 'Đã xác nhận',
        'PROCESSING': 'Đang xử lý',
        'SHIPPED': 'Đang giao hàng',
        'DELIVERED': 'Đã giao hàng',
        'CANCELLED': 'Đã hủy'
    };
    return statusMap[status] || status;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function showSuccess(message) {
    alert('✓ ' + message);
}

function showError(message) {
    alert('✗ ' + message);
}