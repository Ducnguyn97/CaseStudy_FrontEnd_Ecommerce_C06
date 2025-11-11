// Lấy token từ localStorage
function getToken() {
    const user = localStorage.getItem("user");
    if (!user) return null;
    return JSON.parse(user).token;
}

// Hàm gọi API có token
async function api(url, method = "GET", body = null) {
    const token = getToken();

    const headers = { "Content-Type": "application/json" };
    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });

    if (res.status === 401) {
        alert("Phiên đăng nhập hết hạn!");
        localStorage.removeItem("user");
        window.location.href = "login.html";
        return;
    }

    return await res.json();
}
