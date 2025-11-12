const productModal = new bootstrap.Modal(document.getElementById('editProductModal'), {});
let productPage = 0;
let productSize = 5;

function loadProducts(search="") {
    contentArea.html("<h4>Loading products...</h4>");
    $.ajax({
        url: `${API_BASE}/products?page=${productPage}&size=${productSize}&search=${search}`,
        type: "GET",
        headers: getAuthHeader(),
        success: function(data){
            const products = data.content || data;
            let html = `<h4>Sản phẩm</h4>
                <button class="btn btn-success btn-sm mb-2" id="btnAddProduct">+ Thêm sản phẩm</button>
                <div class="form-inline mb-2">
                    <input type="text" id="searchProduct" placeholder="Tìm kiếm sản phẩm">
                    <button id="btnSearchProduct" class="btn btn-primary btn-sm">Search</button>
                </div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th><th>Tên</th><th>Giá</th><th>Kho</th><th>Mô tả</th><th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>`;
            products.forEach(p=>{
                html += `<tr>
                    <td>${p.id}</td>
                    <td>${p.name}</td>
                    <td>${p.price}</td>
                    <td>${p.stock}</td>
                    <td>${p.description || ''}</td>
                    <td>`;
                if(currentUserRole==="ROLE_ADMIN"){
                    html += `<button class="btn btn-warning btn-sm" onclick="editProduct(${p.id})">Sửa</button>
                             <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Xóa</button>`;
                }
                html += `</td></tr>`;
            });
            html += `</tbody></table>
                <div class="mb-3">
                    <button id="prevProd" class="btn btn-secondary btn-sm">Prev</button>
                    <button id="nextProd" class="btn btn-secondary btn-sm">Next</button>
                </div>`;
            contentArea.html(html);

            $("#btnSearchProduct").click(()=>{ productPage=0; loadProducts($("#searchProduct").val().trim()); });
            $("#prevProd").click(()=>{ if(productPage>0){ productPage--; loadProducts($("#searchProduct").val().trim()); }});
            $("#nextProd").click(()=>{ if(data.totalPages && productPage < data.totalPages-1){ productPage++; loadProducts($("#searchProduct").val().trim()); }});

            $("#btnAddProduct").click(()=> {
                $("#productId").val('');
                $("#productName").val('');
                $("#productPrice").val('');
                $("#productStock").val('');
                $("#productDescription").val('');
                productModal.show();
            });
        },
        error:function(xhr){ alert(xhr.responseText); }
    });
}

window.deleteProduct = function(id){
    if(confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
        $.ajax({
            url:`${API_BASE}/products/${id}`,
            type:"DELETE",
            headers:getAuthHeader(),
            success:function(){ alert("Xóa thành công"); loadProducts(); },
            error:function(xhr){ alert(xhr.responseText); }
        });
    }
};

window.editProduct = function(id){
    $.ajax({
        url:`${API_BASE}/products/${id}`,
        type:"GET",
        headers:getAuthHeader(),
        success:function(p){
            $("#productId").val(p.id);
            $("#productName").val(p.name);
            $("#productPrice").val(p.price);
            $("#productStock").val(p.stock);
            $("#productDescription").val(p.description || '');
            productModal.show();
        },
        error:function(xhr){ alert(xhr.responseText); }
    });
};

// Submit form
$("#editProductForm").submit(function(e){
    e.preventDefault();
    const prod = {
        id: $("#productId").val(),
        name: $("#productName").val(),
        price: $("#productPrice").val(),
        stock: $("#productStock").val(),
        description: $("#productDescription").val()
    };
    const type = prod.id ? "PUT" : "POST";
    const url = prod.id ? `${API_BASE}/products/${prod.id}` : `${API_BASE}/products`;
    $.ajax({
        url: url,
        type: type,
        headers: getAuthHeader(),
        contentType: "application/json",
        data: JSON.stringify(prod),
        success:function(){
            alert("Lưu thành công");
            productModal.hide();
            loadProducts();
        },
        error:function(xhr){ alert(xhr.responseText); }
    });
});
