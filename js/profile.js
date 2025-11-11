$.ajax({
    url: "http://localhost:8080/api/user/profile",
    method: "GET",
    headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
    },
    success: function(res){
        console.log("Thông tin người dùng:", res);
    },
    error: function() {
        alert("Bạn cần đăng nhập lại");
        window.location.href = "login.html";
    }
});
