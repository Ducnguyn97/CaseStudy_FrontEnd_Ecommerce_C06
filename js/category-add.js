// BASE_URL
const BASE_URL = (typeof window.API_BASE_URL !== 'undefined' && window.API_BASE_URL)
    ? window.API_BASE_URL
    : 'http://localhost:8080/api';

const CATEGORIES_URL = `${BASE_URL}/categories`;

// Helper UI
function setSubmitting(isSubmitting) {
    const $btn = $('#btnSubmit');
    if (!$btn.length) return;
    if (isSubmitting) {
        if (!$btn.data('label')) $btn.data('label', $btn.text());
        $btn.prop('disabled', true).text('Đang lưu...');
    } else {
        $btn.prop('disabled', false).text($btn.data('label') || 'Thêm danh mục');
    }
}

function validate(name, description) {
    const n = (name || '').trim();
    if (!n) throw new Error('Vui lòng nhập tên danh mục.');
    if (n.length > 150) throw new Error('Tên danh mục tối đa 150 ký tự.');
    if (description && description.length > 1000) throw new Error('Mô tả tối đa 1000 ký tự.');
}

// List + Delete
function showListLoading(show) {
    $('#categoryListLoading').toggle(!!show);
}

function setEmptyState(isEmpty) {
    $('#categoryListEmpty').toggle(!!isEmpty);
    $('#categoryTable').toggle(!isEmpty);
}

function renderCategoryTable(items) {
    const $tbody = $('#categoryTableBody');
    $tbody.empty();

    if (!Array.isArray(items) || items.length === 0) {
        setEmptyState(true);
        return;
    }

    items.forEach(item => {
        const id = item?.id ?? '';
        const name = item?.name ?? '';
        const description = item?.description ?? '';

        const $tr = $('<tr></tr>');
        $tr.append($('<td></td>').text(id));
        $tr.append($('<td></td>').text(name));
        $tr.append($('<td></td>').text(description));
        $tr.append(
            $('<td class="text-center"></td>').append(
                $('<button type="button" class="btn btn-sm btn-outline-danger btn-delete-category">Xóa</button>')
                    .attr('data-id', id)
            )
        );
        $tbody.append($tr);
    });

    setEmptyState(false);
}

function loadCategoryList() {
    showListLoading(true);
    setEmptyState(false);

    $.ajax({
        url: CATEGORIES_URL,
        method: 'GET',
        dataType: 'json',
        success: function (categories) {
            renderCategoryTable(categories);
        },
        error: function (xhr) {
            const msg = xhr.responseJSON?.message || xhr.responseJSON?.error || 'Không thể tải danh mục';
            alert('✗ Lỗi: ' + msg);
            setEmptyState(true);
        },
        complete: function () {
            showListLoading(false);
        }
    });
}

function deleteCategory(id, $btn) {
    if (!id) return;
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;

    const $row = $btn.closest('tr');
    const original = $btn.text();

    $btn.prop('disabled', true).text('Đang xóa...');

    $.ajax({
        url: `${CATEGORIES_URL}/${encodeURIComponent(id)}`,
        method: 'DELETE',
        success: function () {
            $row.remove();
            const hasRows = $('#categoryTableBody tr').length > 0;
            setEmptyState(!hasRows);
            alert('✓ Đã xóa danh mục');
        },
        error: function (xhr) {
            const msg = xhr.responseJSON?.message || xhr.responseJSON?.error || 'Không thể xóa danh mục';
            alert('✗ Lỗi: ' + msg);
            $btn.prop('disabled', false).text(original);
        }
    });
}

// Init
$(document).ready(function () {
    // Submit tạo danh mục
    $('#categoryForm').on('submit', function (e) {
        e.preventDefault();

        const name = $('#categoryName').val();
        const description = $('#categoryDescription').val() || '';

        try {
            validate(name, description);
        } catch (err) {
            alert('✗ ' + (err.message || 'Dữ liệu không hợp lệ'));
            return;
        }

        setSubmitting(true);

        $.ajax({
            url: CATEGORIES_URL,
            method: 'POST',
            contentType: 'application/json; charset=UTF-8',
            dataType: 'json',
            data: JSON.stringify({
                name: String(name).trim(),
                description: String(description)
            }),
            success: function (created) {
                alert('✓ Thêm danh mục thành công' + (created?.name ? `: ${created.name}` : '!'));
                $('#categoryForm')[0].reset();
            },
            error: function (xhr) {
                const status = xhr.status;
                let errorMsg = 'Không thể thêm danh mục';
                if (xhr.responseJSON?.message || xhr.responseJSON?.error) {
                    errorMsg = xhr.responseJSON.message || xhr.responseJSON.error;
                } else if (xhr.responseText) {
                    errorMsg = xhr.responseText;
                }
               // console.error('[category-add] POST error', { status, error: errorMsg });
                //alert(`✗ Lỗi (${status || 'n/a'}): ${errorMsg}`);
            },
            complete: function () {
                setSubmitting(false);
            }
        });
    });

    // Khi modal mở hoàn toàn thì mới load danh sách (tránh trường hợp DOM chưa sẵn sàng)
    $('#categoryModal').on('shown.bs.modal', function () {
        // Reset trạng thái trước khi load
        $('#categoryTableBody').empty();
        $('#categoryTable').hide();
        $('#categoryListEmpty').hide();
        loadCategoryList();
    });

    // Xóa danh mục (ủy quyền sự kiện)
    $(document).on('click', '.btn-delete-category', function () {
        const $btn = $(this);
        const id = $btn.data('id');
        deleteCategory(id, $btn);
    });
});