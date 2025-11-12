// -------------------- CẤU HÌNH API VÀ NGƯỜI DÙNG --------------------

// URL gốc của API backend
const API_BASE_URL = 'http://localhost:8080/api';

// Giả định ID người dùng hiện tại (lấy từ session/localStorage thực tế sau này)
const CURRENT_USER_ID = 1;

// Khi trang được load xong
$(document).ready(function() {
    // Gắn tooltip hiển thị ID người dùng
    $('#userInfo').attr('title', 'User #' + CURRENT_USER_ID);

    // Gọi hàm load danh sách đơn hàng
    loadOrders();
});


// -------------------- HÀM CHÍNH: LOAD DANH SÁCH ĐƠN HÀNG --------------------

function loadOrders() {
    $('#loading').show();               // Hiện biểu tượng loading
    $('#orderContainer').empty();       // Xóa danh sách cũ
    $('#emptyState').hide();            // Ẩn thông báo trống

    console.log('Loading orders for user:', CURRENT_USER_ID);
    console.log('URL:', `${API_BASE_URL}/orders/users/${CURRENT_USER_ID}`);

    $.ajax({
        url: `${API_BASE_URL}/orders/users/${CURRENT_USER_ID}`, // Gọi API lấy danh sách đơn theo user
        method: 'GET',
        success: function(orders) {
            $('#loading').hide();

            // Nếu không có đơn nào, hiển thị trạng thái trống
            if (orders.length === 0) {
                $('#emptyState').show();
                return;
            }

            // Sắp xếp đơn hàng mới nhất lên đầu
            orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

            // Tạo và hiển thị từng thẻ đơn hàng
            orders.forEach(order => {
                $('#orderContainer').append(createOrderCard(order));
            });
        },
    });
}


// -------------------- HÀM TẠO THẺ HIỂN THỊ ĐƠN HÀNG --------------------

function createOrderCard(order) {
    const statusText = getStatusText(order.status); // Trạng thái tiếng Việt
    const orderDate = formatDate(order.orderDate);  // Định dạng ngày
    const canCancel = ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status); // Có thể hủy hay không

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


// -------------------- HÀM HIỂN THỊ CHI TIẾT ĐƠN HÀNG --------------------

function viewOrderDetail(orderId) {
    const modal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
    modal.show(); // Mở modal xem chi tiết đơn

    // Hiển thị trạng thái đang tải
    $('#orderDetailContent').html(`
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3 text-muted">Đang tải thông tin...</p>
        </div>
    `);

    // Gọi API lấy chi tiết đơn hàng
    $.ajax({
        url: `${API_BASE_URL}/orders/${orderId}`,
        method: 'GET',
        success: function(order) {
            const orderDate = formatDate(order.orderDate);
            const statusText = getStatusText(order.status);

            // Dựng HTML thông tin đơn
            let html = `
                <div class="order-summary-info">
                    <div class="row"><div class="col-6"><strong>Mã đơn hàng:</strong></div><div class="col-6 text-end">#${order.id}</div></div>
                    <div class="row"><div class="col-6"><strong>Ngày đặt:</strong></div><div class="col-6 text-end">${orderDate}</div></div>
                    <div class="row"><div class="col-6"><strong>Trạng thái:</strong></div><div class="col-6 text-end"><span class="status-badge status-${order.status}">${statusText}</span></div></div>
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

            // Duyệt qua danh sách sản phẩm trong đơn
            order.orderDetails.forEach(detail => {
                const subtotal = detail.price * detail.quantity;
                html += `
                    <tr>
                        <td><strong>${detail.product.name}</strong></td>
                        <td class="text-center">${detail.quantity}</td>
                        <td class="text-end">${formatCurrency(detail.price)}</td>
                        <td class="text-end"><strong>${formatCurrency(subtotal)}</strong></td>
                    </tr>
                `;
            });

            // Tổng cộng
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

            // Gắn vào modal
            $('#orderDetailContent').html(html);
        },
        error: function() {
            $('#orderDetailContent').html(`
                <div class="alert alert-danger">
                    <strong>Lỗi!</strong> Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.
                </div>
            `);
        }
    });
}


// -------------------- HÀM XÁC NHẬN VÀ HỦY ĐƠN HÀNG --------------------

function confirmCancelOrder(orderId) {
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?\n\nLưu ý: Sau khi hủy, bạn sẽ không thể khôi phục lại đơn hàng.')) {
        cancelOrder(orderId);
    }
}

function cancelOrder(orderId) {
    // Đổi trạng thái nút để tránh nhấn lại
    $('button[onclick="confirmCancelOrder(' + orderId + ')"]').prop('disabled', true).text('Đang xử lý...');

    // Gọi API hủy đơn
    $.ajax({
        url: `${API_BASE_URL}/orders/${orderId}/cancel`,
        method: 'PUT',
        success: function() {
            showSuccess('Đơn hàng đã được hủy thành công!');
            // Tải lại danh sách sau 1s
            setTimeout(() => loadOrders(), 1000);
        },
    });
}


// -------------------- CÁC HÀM HỖ TRỢ --------------------

// Chuyển trạng thái đơn hàng từ mã sang tiếng Việt
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

// Định dạng tiền tệ sang VND
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Định dạng thời gian kiểu DD/MM/YYYY HH:mm
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Hiển thị thông báo thành công
function showSuccess(message) {
    alert('✓ ' + message);
}

// Hiển thị thông báo lỗi
function showError(message) {
    alert('✗ ' + message);
}
