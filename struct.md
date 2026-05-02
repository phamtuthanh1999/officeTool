

Tạo một project Node.js sẵn sàng cho production có thể xử lý ít nhất 1000 người dùng đồng thời.

Yêu cầu:

1. Công nghệ sử dụng:
- Node.js với Express.js hoặc Fastify
- Sử dụng MYSQL
- rate limiting

1. Kiến trúc:
- Áp dụng clean architecture hoặc cấu trúc module
- Tách các layer: controller, service, repository
- Sử dụng file cấu hình môi trường (.env)
- Xử lý lỗi tập trung (centralized error handling)
- Logging (Winston hoặc Pino)

1. Hiệu năng & khả năng mở rộng:
- Bật clustering (Node.js cluster hoặc PM2)
- Sử dụng connection pooling cho database
- Thêm rate limiting và middleware bảo mật
- Tối ưu cho xử lý đồng thời cao (best practices async/await)

1. Tính năng:
- Xác thực cơ bản (JWT)
- Ví dụ CRUD API (user hoặc task)
- Endpoint health check
- Validate dữ liệu (Joi hoặc Zod)

1. DevOps:
- Ví dụ CI/CD (GitHub Actions)

1. Chất lượng code:
- ESLint + Prettier
- Có comment và README
- Áp dụng best practices cho cấu trúc thư mục

1. Kết quả đầu ra:
- Cấu trúc project đầy đủ
- Các file code quan trọng
- Hướng dẫn chạy local và production