# Phase 2: Webhooks & Hàng Đợi Bất Đồng Bộ (Ngày 4 - 6)

## 🎯 Mục tiêu
*   Nhận thông báo bình luận/tin nhắn thời gian thực từ Facebook Developer Console về máy local.
*   Cấu hình Redis Queue và Laravel Horizon để lưu trữ và phân loại các payload thô từ Facebook một cách bất đồng bộ dưới 3 giây.

---

## 👥 Phân công nhiệm vụ chi tiết

### 1. Hoàng (PM & DevOps)
*   **Công việc 1: Cấu hình Tunnel (Ngrok/Cloudflare)**
    *   Setup dịch vụ Ngrok hoặc Cloudflare Tunnel để tạo public URL bảo mật (HTTPS) trỏ vào cổng Nginx local.
    *   Ví dụ: `https://zeflyo-dev.ngrok-free.app` -> `http://localhost:80` ở local.
    *   *Sản phẩm:* Cung cấp URL này cho Khoa cấu hình trên trang Facebook Developer Console.
*   **Công việc 2: Cài đặt Redis Queue & Laravel Horizon**
    *   Bật driver Redis cho Queue trong Laravel (`QUEUE_CONNECTION=redis`).
    *   Cài đặt và cấu hình **Laravel Horizon** để giám sát và trực quan hóa các Job, Queue trong DB ở local.
    *   *Sản phẩm:* Giao diện quản trị Horizon chạy tại `http://localhost:8000/horizon`.

### 2. Khoa
*   **Công việc 1: Verify Webhook Endpoint**
    *   Viết API endpoint `GET /api/webhook/facebook` để Facebook xác thực URL webhook (nhận `hub.challenge`, so khớp `hub.verify_token`).
*   **Công việc 2: Nhận Webhook & Dispatch Job**
    *   Viết API endpoint `POST /api/webhook/facebook` để nhận các sự kiện:
        *   `messages` (Messenger chats)
        *   `feed` (Bình luận dưới bài viết Fanpage)
    *   **Quy chuẩn bắt buộc:** Đọc JSON payload thô $\rightarrow$ Đẩy (dispatch) thẳng vào Job xử lý hàng đợi (ví dụ: `ProcessFacebookWebhookJob`) $\rightarrow$ Trả về phản hồi `200 OK` ngay lập tức cho Facebook trong < 3 giây. Không gọi database hay gọi API ngoài trong Controller này.
*   **Công việc 3: Viết logic xử lý ngầm (Laravel Job)**
    *   Viết logic xử lý trong `ProcessFacebookWebhookJob`: phân loại xem đó là bình luận hay tin nhắn inbox, bóc tách ID khách hàng, ID Fanpage, nội dung text, và lưu vào PostgreSQL.

### 3. Tiến (Fullstack Developer)
*   **Công việc 1: Schema Migrations cho Tin nhắn & Bình luận**
    *   Thiết kế các bảng database để lưu trữ lịch sử hội thoại (chi tiết bên dưới).
*   **Công việc 2: Tích hợp API Toggle Page**
    *   Xây dựng API `POST /api/pages/{id}/toggle` để cập nhật trạng thái bật/tắt tự động hóa của Page.
    *   Tích hợp Switch button trên giao diện Next.js gọi API này để kích hoạt/tắt việc nhận webhook của từng Page.

---

## 🗄️ Thiết kế Cơ sở dữ liệu (Database Schema)

Tiến tạo migrations cho các bảng lưu tương tác:

### Bảng `customers` (Khách hàng tương tác với Page)
```php
Schema::create('customers', function (Blueprint $table) {
    $table->id();
    $table->foreignId('fanpage_id')->constrained()->onDelete('cascade');
    $table->string('fb_customer_id'); // PSID (Page-Scoped ID) của khách hàng
    $table->string('name')->nullable();
    $table->string('avatar_url')->nullable();
    $table->timestamps();
    $table->unique(['fanpage_id', 'fb_customer_id']);
});
```

### Bảng `interactions` (Tin nhắn & Bình luận chung)
```php
Schema::create('interactions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('customer_id')->constrained()->onDelete('cascade');
    $table->foreignId('fanpage_id')->constrained()->onDelete('cascade');
    $table->enum('type', ['message', 'comment']); // Loại tương tác
    $table->string('fb_item_id'); // ID của comment hoặc message trên FB
    $table->string('fb_post_id')->nullable(); // Có giá trị nếu type = comment (để biết ở post nào)
    $table->text('content'); // Nội dung text
    $table->boolean('is_from_customer')->default(true); // true = khách gửi, false = page reply
    $table->timestamps();
});
```

---

## 🧪 Kiểm định & Verify ở cuối Phase
1.  **Verify Webhook Local:** Chạy Ngrok, nhập link webhook vào Facebook Developer Console và bấm verify thành công.
2.  **Verify Queue:** Dùng tài khoản Facebook phụ bình luận thử vào Fanpage đã kích hoạt. Mở màn hình terminal chạy `php artisan queue:work` hoặc giao diện Horizon để kiểm tra:
    *   Laravel controller trả về `200 OK` ngay lập tức.
    *   Hàng đợi Horizon báo xử lý thành công `ProcessFacebookWebhookJob`.
    *   Kiểm tra bảng `customers` và `interactions` xem dữ liệu tin nhắn đã được tự động thêm vào DB chưa.
