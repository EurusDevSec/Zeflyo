# 🚀 ZEFLYO — Hệ Thống Chăm Sóc Fanpage & Tự Động Hóa AI

**Zeflyo** (Zephyrus, Speed light, Automation, Workflow) là nền tảng quản lý tập trung Fanpage Facebook, tích hợp trợ lý ảo thông minh (Google Gemini AI), WebSocket cập nhật thời gian thực, và bộ lập lịch đăng bài viết hàng loạt.

Dự án được thiết kế dưới cấu trúc **Micro-services local** (Docker Compose) ở Backend và chạy **Single-Node Host** ở Frontend Next.js để tối ưu hóa hiệu năng phát triển.

---

## 🏗️ Kiến Trúc Hệ Thống (Architecture Blueprint)

*   **Frontend:** Next.js v16+ (App Router, TS, Tailwind CSS v4) - chạy trực tiếp trên Host (Port `3000`).
*   **Backend API:** Laravel 11 + Laravel Octane (RoadRunner) - chạy trong Docker (Port `80` qua Nginx Reverse Proxy).
*   **Database:** PostgreSQL 16 (Port `5432`).
*   **Cache & Queue:** Redis (Port `6379`).
*   **WebSocket Broadcast:** Soketi Server (Pusher compatible) (Port `6001`).


![HighLevel Architect](image.png)
---

## ⚡ Quick Start — Khởi Chạy Tự Động (Khuyên Dùng)

Để hỗ trợ các thành viên trong nhóm setup dự án nhanh nhất có thể, chúng ta đã đóng gói toàn bộ quy trình cấu hình vào file shell script `setup.sh`.

### Cách chạy:
1. Mở terminal (Git Bash, WSL, Linux hoặc macOS) ở thư mục gốc của dự án.
2. Chạy lệnh setup tự động:
   ```bash
   ./setup.sh
   ```
3. Lệnh này sẽ tự động:
   - Tạo file `.env` nếu chưa có.
   - Dừng lại yêu cầu bạn điền các thông tin bảo mật tối thiểu như App ID/Secret (nếu cần dùng real mode).
   - Khởi động Docker containers (Nginx, Postgres, Redis, Soketi, App).
   - Tự động chạy `composer install`, sinh App key và chạy database migration.
   - Tự động cài đặt các dependencies ở thư mục `frontend/`.

---

## 🛠️ Cách Chạy Thủ Công (Nếu không dùng Script)

Nếu bạn muốn cấu hình từng bước thủ công:

### Bước 1: Sao chép file môi trường
* **Linux/macOS:** `cp backend/.env.example backend/.env`
* **Windows:** `copy backend/.env.example backend/.env`

### Bước 2: Khởi động Docker
```bash
docker compose up -d --build
```

### Bước 3: Thiết lập Backend Laravel
```bash
docker compose exec app composer install
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate
```

---

### Bước 4: Khởi động Frontend (Next.js)
Mở một cửa sổ terminal mới trên máy cá nhân (không chạy trong Docker để tránh lag WSL2 watch-file):
```bash
cd frontend
npm install
npm run dev
```

Truy cập ngay trình duyệt tại địa chỉ: **`http://localhost:3000`** 🚀

---

## 🧪 Quy Trình Thử Nghiệm & Demo (Testing)

Hệ thống hỗ trợ 2 chế độ thử nghiệm linh hoạt giúp team phát triển nhanh nhất có thể:

### 1. Mock Dev Mode (Không cần Token/API Thật)
1. Tại màn hình Login, bấm nút **"Mock Dev Mode (Demo Sandbox)"**.
2. Hệ thống sẽ cấp một token ảo, giả lập 3 Fanpage và đưa bạn vào Dashboard.
3. Thử nghiệm bật/tắt nút Switch (**Active/Deactivated**) của từng trang và quan sát logs hiển thị ngay lập tức tại **Live Activity Feeds** bên góc phải.
4. Chế độ này lưu trạng thái trực tiếp vào `localStorage`, không gọi API thực tế của backend, hoàn toàn offline.

### 2. Real Integration Mode (Meta Developer Console)
1. Bạn cần đăng ký một app thuộc loại **Business** hoặc **Consumer** trên [Meta Developers](https://developers.facebook.com).
2. Lấy **App ID (Client ID)** và **App Secret (Client Secret)** điền vào file [backend/.env](file:///r:/_Projects/Eurus_Workspace/Zeflyo/backend/.env):
   ```env
   FACEBOOK_CLIENT_ID=nhap_app_id
   FACEBOOK_CLIENT_SECRET=nhap_app_secret
   FACEBOOK_REDIRECT_URI="http://localhost/api/auth/facebook/callback"
   ```
3. Mở rộng phần **"Server Connection Settings"** trên giao diện Next.js, nhập **Facebook App ID** của bạn và bấm **Save**.
4. Bấm **"Continue with Facebook"** để tiến hành đăng nhập và phân quyền quản lý các Fanpage thực tế.

---

## 📁 Cấu Trúc Mã Nguồn Quan Trọng

```
Zeflyo/
├── docker-compose.yaml          # Quản lý 5 containers local
├── docker/                      # Cấu hình Dockerfiles cho PHP và Nginx
├── docs/                        # Tài liệu đặc tả theo từng Phase và Runbooks
│   ├── phases/                  # Thiết kế chi tiết Phase 1 - 5
│   └── runbooks/                # Hướng dẫn test API và sửa lỗi tích hợp
├── backend/                     # Mã nguồn Laravel API (Port 80)
│   ├── app/Http/Controllers/    # FacebookAuthController & FanpageController
│   ├── app/Models/              # User.php & Fanpage.php (Auto-encrypted access token)
│   └── routes/api.php           # Các API Endpoint đồng bộ & bật/tắt fanpage
└── frontend/                    # Mã nguồn Next.js Client (Port 3000)
    ├── src/app/globals.css      # CSS styles (Theme dark, ambient glows, glassmorphism)
    └── src/app/page.tsx         # Dashboard chính (Xử lý Mock & Real Auth, Event feeds)
```

---

## 💡 Các Lệnh Tiện Ích Thường Dùng (Cheat Sheet)

*   **Kiểm tra trạng thái các container:**
    ```bash
    docker compose ps
    ```
*   **Xem logs Nginx/App real-time:**
    ```bash
    docker compose logs -f nginx
    docker compose logs -f app
    ```
*   **Reload Laravel Octane (BẮT BUỘC chạy sau khi sửa code/routes backend):**
    ```bash
    docker compose exec app php artisan octane:reload
    ```
*   **Xóa sạch database và chạy lại migrations từ đầu:**
    ```bash
    docker compose exec app php artisan migrate:fresh
    ```
*   **Mở cửa sổ dòng lệnh Postgres (Database CLI):**
    ```bash
    docker compose exec postgres psql -U zeflyo_user -d zeflyo
    ```
*   **Chạy các Job ngầm (Queue Worker):**
    ```bash
    docker compose exec app php artisan queue:work
    ```
