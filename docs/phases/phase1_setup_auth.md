# Phase 1: Setup Môi Trường & Core Authentication (Ngày 1 - 3)

## 🎯 Mục tiêu
*   Thiết lập môi trường Docker local đồng nhất cho toàn bộ team.
*   Khởi tạo dự án Laravel 11 và Next.js.
*   Tích hợp thành công đăng nhập Facebook Login (OAuth 2.0) lấy Long-lived Page Access Token.

---

## 👥 Phân công nhiệm vụ chi tiết

### 1. Hoàng (PM & DevOps)
*   **Công việc 1: Khởi tạo Docker-compose local**
    *   Tạo file `docker-compose.yml` bao gồm các service:
        *   `laravel-app`: Dockerfile sử dụng PHP 8.3-cli chạy Laravel Octane (RoadRunner).
        *   `nginx`: Port 80, reverse proxy trỏ về Laravel Octane (cổng 8000).
        *   `postgres`: Database chính (port 5432).
        *   `redis`: Cache và Queue driver (port 6379).
    *   *Sản phẩm:* File `docker-compose.yml` chạy thành công bằng lệnh `docker-compose up -d`.
*   **Công việc 2: Cấu hình repository & Gitflow**
    *   Thiết lập cấu trúc thư mục dự án (Monorepo hoặc 2 folder `backend/` và `frontend/`).
    *   Tạo nhánh `main` và `staging`, cấu hình khóa bảo vệ 2 nhánh này trên GitHub.

### 2. Khoa
*   **Công việc 1: Khởi tạo Laravel 11 Backend**
    *   Khởi tạo dự án Laravel 11 trong thư mục `backend/`.
    *   Cài đặt các gói: `laravel/sanctum` (cho API Token), `laravel/socialite` (cho Facebook OAuth), `laravel/octane`.
*   **Công việc 2: Facebook Login API & Token Security**
    *   Cấu hình Facebook Provider trong Socialite (`config/services.php`).
    *   Tạo API endpoint `/api/auth/facebook/callback` để:
        1. Nhận access token ngắn hạn từ client.
        2. Gọi API Facebook đổi lấy **Long-lived User Access Token** (hạn 60 ngày).
        3. Gọi API Facebook `/me/accounts` lấy danh sách Fanpages và đổi các short-lived token của page thành **Long-lived Page Access Token** (không hết hạn).
    *   Mã hóa toàn bộ Page Access Tokens trước khi lưu vào database (Sử dụng Laravel Eloquent Casts: `encrypted`).

### 3. Tiến (Fullstack Developer)
*   **Công việc 1: Khởi tạo Next.js Frontend**
    *   Khởi tạo dự án Next.js bằng TypeScript trong thư mục `frontend/`.
    *   Cài đặt Tailwind CSS và **Shadcn/ui** làm UI Framework. Thiết lập theme (hỗ trợ Dark/Light mode).
*   **Công việc 2: Giao diện Login & Sync Page**
    *   Thiết kế trang Đăng nhập (`/login`) với nút "Đăng nhập bằng Facebook".
    *   Xây dựng luồng gọi Facebook SDK ở Client, lấy User Access Token truyền về cho Backend (Khoa) qua API.
    *   Thiết kế giao diện quản lý trang (`/dashboard/pages`) hiển thị danh sách các Fanpage đồng bộ từ Backend về, có nút bật/tắt (Switch) kích hoạt chăm sóc tự động cho từng page.

---

## 🗄️ Thiết kế Cơ sở dữ liệu (Database Schema)

Tiến và Khoa phối hợp tạo migrations cho các bảng sau:

### Bảng `users`
```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->string('password')->nullable(); // Vì đăng nhập qua FB
    $table->string('avatar')->nullable();
    $table->rememberToken();
    $table->timestamps();
});
```

### Bảng `fanpages`
```php
Schema::create('fanpages', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('fb_page_id')->unique(); // ID page của Facebook
    $table->string('name');
    $table->text('access_token'); // Lưu ý: Bắt buộc mã hóa (encrypted)
    $table->string('avatar_url')->nullable();
    $table->boolean('is_active')->default(false); // Trạng thái bật tự động hóa
    $table->timestamps();
});
```

---

## 🧪 Kiểm định & Verify ở cuối Phase
1.  **Chạy local:** Cả team kéo code về, chạy `docker-compose up -d`, chạy các migrations thành công.
2.  **Đăng nhập thử nghiệm:** Click nút đăng nhập FB trên giao diện Next.js -> Login thành công -> Lưu thành công Page Access Token vào DB ở dạng mã hóa.
3.  **Verify Lệnh:** Chạy `php artisan test` kiểm tra luồng login không có lỗi HTTP.
