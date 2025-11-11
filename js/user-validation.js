function handleEditUserForm() {
    $("#editUserForm").submit(function (e) {
        e.preventDefault();
        $("#editErrorMsg").html("");
        $("#editSuccessMsg").html("");

        const id = $("#userId").val();
        const username = $("#username").val().trim();
        const email = $("#email").val().trim();
        const password = $("#password").val();
        const phoneNumber = $("#phoneNumber").val().trim();
        const address = $("#address").val().trim();

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{6,12}$/;
        const phoneRegex = /^0\d{9}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            $("#editErrorMsg").html("Email không hợp lệ");
            return;
        }
        if (!passwordRegex.test(password)) {
            $("#editErrorMsg").html("Mật khẩu phải 6-12 ký tự, có chữ, số và ký tự đặc biệt");
            return;
        }
        if (!phoneRegex.test(phoneNumber)) {
            $("#editErrorMsg").html("Số điện thoại phải đủ 10 số và bắt đầu bằng 0");
            return;
        }
        if (address.length === 0) {
            $("#editErrorMsg").html("Địa chỉ không được để trống");
            return;
        }

        const token = localStorage.getItem("token");

        $.ajax({
            url: `http://localhost:8080/api/users/${id}`,
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`, // 👈 Gửi token ở đây
                "Content-Type": "application/json"
            },
            data: JSON.stringify({
                username,
                email,
                password,
                phoneNumber,
                address
            }),
            success: function () {
                $("#editSuccessMsg").html("Cập nhật thành công!");
                setTimeout(() => {
                    $("#editUserModal").modal("hide");
                    if (typeof loadUsers === "function") loadUsers();
                }, 1000);
            },
            error: function (xhr) {
                if (xhr.status === 403) {
                    $("#editErrorMsg").html("Bạn không có quyền hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                } else {
                    $("#editErrorMsg").html(xhr.responseText || "Lỗi cập nhật, vui lòng thử lại");
                }
            }
        });
    });
}
