Bạn hãy xây dựng chức năng “Đăng nhập bằng Google (Google Login)” cho một web app.

## 🎯 Mục tiêu

* Cho phép người dùng đăng nhập bằng tài khoản Google
* Sau khi đăng nhập thành công → trả về thông tin user cơ bản

---

## 🔁 Luồng xử lý

1. User bấm nút “Đăng nhập với Google”
2. Redirect user đến trang đăng nhập Google
3. User xác nhận quyền truy cập
4. Google trả về:

   * access_token / id_token
5. Xác thực token với Google
6. Lấy thông tin user:

   * email
   * name
   * avatar
7. Trả thông tin user về client

---

## ⚙️ Yêu cầu

* Viết đầy đủ logic:

  * tạo URL đăng nhập Google
  * xử lý callback
  * verify token
  * lấy thông tin user
* Code rõ ràng, có comment
* Có xử lý lỗi:

  * user hủy đăng nhập
  * token không hợp lệ
  * lỗi từ Google API

---

## 📤 Output

* Hàm hoặc API:

  * tạo link login Google
  * xử lý callback
  * trả user info
* Ví dụ response:
  {
  "email": "[user@gmail.com](mailto:user@gmail.com)",
  "name": "Nguyen Van A",
  "avatar": "https://..."
  }

---

## ⚡ Tối ưu (nếu có thể)

* Tách riêng phần:

  * auth service
  * token verify
* Có thể dùng JWT để trả về session cho client

---

## ❗ Lưu ý


Hãy viết code đơn giản nhưng thực tế, có thể chạy được.
