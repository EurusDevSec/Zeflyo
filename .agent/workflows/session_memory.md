# 💾 SESSION MEMORY — Zeflyo Project
> Last Checkpoint: 2026-06-17 | Status: Phase 3 (Live Chat Hub & WebSockets) — 100% COMPLETE

---

## ⚡ Active Task Completed (Những việc ĐÃ HOÀN THÀNH trong session)
*   **[Phase 1] Base Setup & Auth:**
    *   Sửa lỗi Facebook Login HTTP local bằng cách thêm cơ chế **Dev Login (Real Backend)** gọi `/api/auth/demo` đăng nhập trực tiếp tài khoản Demo.
*   **[Phase 2] Webhooks & Queue Setup:**
    *   Khắc phục lỗi 500 khi lưu Fanpage bằng cách thay đổi kiểu dữ liệu cột `access_token` và `avatar_url` trong bảng `fanpages` thành `TEXT` thông qua migration [2026_06_17_085000_alter_fanpages_columns_to_text.php](file:///r:/_Projects/Eurus_Workspace/Zeflyo/backend/database/migrations/2026_06_17_085000_alter_fanpages_columns_to_text.php).
*   **[Phase 3] Live Chat Hub & WebSockets:**
    *   Tích hợp thành công Pusher SDK gọi phát sự kiện thời gian thực qua Soketi Server (Port 6001).
    *   Tạo các API: danh sách chat (`GET /api/conversations`), lịch sử chat (`GET /api/conversations/{customer}/messages`), gửi tin nhắn phản hồi (`POST /api/conversations/{customer}/messages`), và bật/tắt AI cho khách hàng (`POST /customers/{customer}/toggle-ai`).
    *   Thiết kế giao diện chat 3 cột Next.js (`src/app/chat/page.tsx`) kết nối với Echo client nhận sự kiện real-time tự động thêm tin nhắn mà không cần F5.
    *   Kiểm thử hoàn tất việc gửi tin nhắn thật từ tài khoản Facebook cá nhân và các gói tin webhook giả lập thành công ✅.

## 🧠 Semantic Context Essence (Tinh túy kiến thức & Quyết định thiết kế)
*   *Laravel Octane Worker Cache:* Khi thêm route mới hoặc thay đổi file config, cần chạy `route:clear`, `config:clear`, và `octane:reload` để Octane xóa bộ nhớ RAM cũ và nạp code mới.
*   *Database Column Limits:* Kiểu dữ liệu `access_token` và `avatar_url` của Facebook Fanpage bắt buộc phải dùng `TEXT` do token mã hóa Laravel Sanctum và link ảnh CDN Facebook rất dài.
*   *Dev Login (Bypass HTTPS):* Cung cấp nút Dev Login chạy trực tiếp trên cổng HTTP (`localhost:3000`) mà không cần HTTPS Facebook Login.

## 🔜 Next Steps (3 hành động kỹ thuật trực tiếp kế tiếp)
- [ ] **Step 1:** Thiết lập API Key Google Gemini 1.5 Flash trong file `.env` và file cấu hình `config/services.php`.
- [ ] **Step 2:** Viết lớp `GeminiService` gọi API Google AI Studio để phân tích và sinh câu trả lời tự động.
- [ ] **Step 3:** Thiết kế màn hình CRUD Keyword Rules và tích hợp logic tự động phản hồi vào `ProcessFacebookWebhookJob` (Phase 4).
