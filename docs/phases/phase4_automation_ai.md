# Phase 4: Gemini AI Integration & Module Độc Lập (Ngày 10 - 11)

## 🎯 Mục tiêu
*   Tích hợp Google Gemini API để tự động sinh bài viết và tự động phản hồi khách hàng theo ngữ cảnh.
*   Xây dựng module **Post Scheduler (Lên lịch đăng bài)** và **Cấu hình Luật Auto-reply** chạy độc lập.

---

## 👥 Phân công nhiệm vụ chi tiết

### 1. Hoàng (PM & DevOps)
*   **Công việc 1: Quản lý API Key an toàn**
    *   Đăng ký Google Gemini API Key tại Google AI Studio.
    *   Lưu trữ API Key này vào `.env` ở local (và AWS Secrets Manager khi lên production).
    *   *Sản phẩm:* Cấu hình `GEMINI_API_KEY` hoạt động qua Laravel service container.

### 2. Khoa
*   **Công việc 1: Xây dựng `GeminiService`**
    *   Viết Service gọi API Gemini (`Gemini 1.5 Flash`) để sinh câu trả lời dựa trên:
        1. Nội dung tin nhắn của khách hàng.
        2. Nội dung prompt cấu hình (Thông tin doanh nghiệp, giọng điệu, quy định trả lời).
*   **Công việc 2: Kích hoạt Auto-Reply Engine**
    *   Cập nhật logic xử lý của `ProcessFacebookWebhookJob` (ở Phase 2):
        *   Khi nhận tin nhắn mới $\rightarrow$ Kiểm tra cấu hình của Fanpage.
        *   Nếu bật tự động trả lời bằng từ khóa: Duyệt danh sách Keyword Rules của trang đó để khớp từ khóa $\rightarrow$ Lấy câu trả lời tĩnh $\rightarrow$ Trả lời ngay.
        *   Nếu không khớp từ khóa nhưng bật chế độ AI: Gọi `GeminiService` lấy câu trả lời $\rightarrow$ Gọi API Facebook phản hồi khách.

### 3. Tiến (Fullstack Developer - Phát triển Module Độc lập)
Để Tiến tự do phát huy năng lực viết code nhanh mà không làm hỏng luồng Webhook/Socket cốt lõi, Tiến sẽ chịu trách nhiệm chính ở 2 module độc lập sau:

*   **Công việc 1: Phát triển Module Lên lịch đăng bài (Post Scheduler)**
    *   *Database:* Tạo bảng `scheduled_posts` (Lưu thông tin bài đăng, ảnh, trang cần đăng, giờ đăng, trạng thái).
    *   *Frontend (Next.js):*
        *   Giao diện Form nhập văn bản bài viết, chọn ảnh tải lên, chọn ngày giờ và tích chọn các Fanpage muốn đăng.
    *   *Backend (Laravel):*
        *   API `POST /api/posts/schedule` để lưu thông tin bài đăng.
        *   Tạo lệnh Console Command: `php artisan posts:publish`.
        *   Cơ chế hoạt động của command: Quét DB mỗi phút tìm các bài có `scheduled_at <= NOW()` và `status = 'pending'` $\rightarrow$ Gọi FB Graph API `/v20.0/{page-id}/feed` đăng bài $\rightarrow$ Cập nhật trạng thái thành `'published'` hoặc `'failed'` kèm log lỗi.
        *   Cấu hình lệnh này chạy tự động hàng phút trong `routes/console.php`.
*   **Công việc 2: Giao diện cấu hình Luật Auto-Reply**
    *   *Database:* Tạo bảng `auto_reply_rules` (Lưu từ khóa, loại tương tác, nội dung phản hồi).
    *   *Frontend (Next.js):* Màn hình CRUD danh sách các luật tự động (ví dụ: tạo rule cho từ khóa "giá" $\rightarrow$ tự trả lời "Sản phẩm giá 100k").

---

## 🗄️ Thiết kế Cơ sở dữ liệu (Database Schema)

Tiến khởi tạo migrations cho 2 bảng:

### Bảng `auto_reply_rules`
```php
Schema::create('auto_reply_rules', function (Blueprint $table) {
    $table->id();
    $table->foreignId('fanpage_id')->constrained()->onDelete('cascade');
    $table->string('keyword'); // Từ khóa khớp (ví dụ: "giá", "ib", "inbox")
    $table->text('reply_content'); // Nội dung tự động trả lời
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});
```

### Bảng `scheduled_posts`
```php
Schema::create('scheduled_posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->json('fanpage_ids'); // Mảng ID các trang muốn đăng bài lên
    $table->text('content'); // Nội dung bài viết
    $table->string('image_url')->nullable(); // Đường dẫn ảnh
    $table->timestamp('scheduled_at'); // Thời gian hẹn giờ đăng bài
    $table->enum('status', ['draft', 'pending', 'published', 'failed'])->default('pending');
    $table->text('error_log')->nullable(); // Log lỗi nếu đăng bài thất bại
    $table->timestamps();
});
```

---

## 🧪 Kiểm định & Verify ở cuối Phase
1.  **Verify AI Chat:** Khách hàng nhắn tin hỏi han linh tinh trên Fanpage $\rightarrow$ Kiểm tra DB và Messenger xem có nhận được câu trả lời thông minh sinh ra từ Gemini API sau vài giây không.
2.  **Verify Lên lịch đăng bài:** Tạo một bài viết hẹn giờ đăng sau 2 phút. Đảm bảo:
    *   Đúng 2 phút sau, cron job/scheduler tự động chạy lệnh `posts:publish`.
    *   Bài viết xuất hiện thành công trên tường Fanpage thật.
    *   Trạng thái bài đăng chuyển sang `published` trong database.
    *   Nếu có lỗi (sai token, thiếu quyền), trạng thái chuyển sang `failed` và ghi nhận rõ lý do ở `error_log`.
