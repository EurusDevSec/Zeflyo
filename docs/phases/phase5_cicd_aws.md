# Phase 5: Deploy AWS, CI/CD & Security Auditing (Ngày 12 - 14)

## 🎯 Mục tiêu
*   Triển khai dự án Zeflyo tự động lên đám mây AWS sử dụng hạ tầng dạng mã (Terraform) và CI/CD (GitHub Actions).
*   Thực hiện kiểm thử xâm nhập (Pentest) để vá các lỗ hổng bảo mật và cấu hình hệ thống giám sát an ninh (SOC/Logs).

---

## 👥 Phân công nhiệm vụ chi tiết

### 1. Hoàng (PM & DevOps)
*   **Công việc 1: Infrastructure as Code (Terraform)**
    *   Viết và chạy mã nguồn Terraform tạo hạ tầng AWS:
        *   **VPC**: Public Subnet (ALB), Private Subnet (ECS Fargate Laravel), Secure Subnet (RDS PostgreSQL & ElastiCache Redis).
        *   **ECS Fargate Cluster**: Khởi chạy API service và Horizon Worker service.
        *   **RDS & Redis**: Bản db.t3.micro và cache.t3.micro tiết kiệm.
        *   **S3 & CloudFront**: Nơi lưu và phân phối Static Next.js Frontend.
*   **Công việc 2: Thiết lập Pipeline GitHub Actions**
    *   Cài đặt workflow `.github/workflows/deploy.yml` tự động chạy khi merge code vào `staging` hoặc `main`:
        1.  *Stage Test:* Khởi tạo DB SQLite chạy test suite (Pest) và Larastan check.
        2.  *Stage Security:* Quét lỗ hổng dependencies bằng Trivy (Chặn deploy nếu có lỗi High/Critical).
        3.  *Stage Build & Push:* Build Docker multi-stage cho Laravel Octane, push lên ECR.
        4.  *Stage Deploy Backend:* Cập nhật Task Definition trên ECS Fargate để tự động kích hoạt Rolling Update (Zero Downtime).
        5.  *Stage Deploy Frontend:* Build static Next.js (`npm run build`), push toàn bộ file tĩnh lên AWS S3 và invalidate CloudFront cache.
*   **Công việc 3: Centralized Monitoring**
    *   Cấu hình AWS CloudWatch logs nhóm cho các Container ECS. Thiết lập Dashboard đo tải CPU/RAM và số lượng Job Horizon.

### 2. Khoa (Security Lead)
*   **Công việc 1: API Penetration Testing (Staging Pentest)**
    *   Khi Hoàng deploy bản chạy thử lên môi trường AWS Staging, Khoa dùng các công cụ (như OWASP ZAP, Postman) để thực hiện kiểm thử xâm nhập:
        *   Kiểm tra IDOR (đảm bảo User A không đọc hoặc gửi tin nhắn của Fanpage thuộc User B qua API).
        *   Kiểm tra SQL Injection, XSS trong ô chat và nhập liệu bài viết.
        *   Kiểm tra cấu hình CSRF & CORS của API.
    *   *Sản phẩm:* Vá các lỗ hổng phát hiện được trực tiếp trên nhánh bugfix trước khi lên Production.
*   **Công việc 2: Cấu hình SOC & Audit Logs**
    *   Tạo log ghi nhận (Audit Log) các hành vi nhạy cảm của người dùng (ví dụ: Thay đổi luật auto-reply, cập nhật access token, thay đổi mật khẩu).
    *   Cấu hình ghi log an ninh định dạng JSON đẩy về CloudWatch.

### 3. Tiến (Fullstack Developer)
*   **Công việc 1: Fix Bug, QA & Tối ưu hóa UI**
    *   Hỗ trợ Khoa và Hoàng kiểm thử chức năng của toàn bộ hệ thống trên Staging.
    *   Tối ưu hóa Lighthouse score cho Next.js Frontend (Đạt trên 90 điểm cho Performance, SEO và Accessibility).
    *   Sửa đổi các lỗi giao diện, căn chỉnh CSS trên thiết bị di động (Responsive UI).

---

## 🧪 Quy Trình Nghiệm Thu Dự Án (Release Gates)
1.  **CI/CD Pass:** Đẩy code lên GitHub $\rightarrow$ Toàn bộ pipeline Actions báo xanh $\rightarrow$ Tự động deploy không lỗi lên AWS.
2.  **Staging Pentest:** Khoa xác nhận không còn lỗ hổng bảo mật cấp độ High/Critical trên Staging.
3.  **End-to-End Test:** Cả nhóm cùng demo: Đăng nhập $\rightarrow$ Kết nối Page $\rightarrow$ Soạn lịch đăng bài $\rightarrow$ Chat trực tiếp và tự động phản hồi bằng Gemini AI thời gian thực trên môi trường AWS Production thành công 100%.
4.  **Tắt Staging:** Hoàng chạy kịch bản tắt hạ tầng staging ngoài giờ làm việc để tối ưu chi phí hóa đơn AWS cho nhóm.
