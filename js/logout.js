$("#btnLogout").click(function() {
    if(confirm("Bạn có chắc muốn đăng xuất?")) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "login.html"; // quay về trang login
    }
});
