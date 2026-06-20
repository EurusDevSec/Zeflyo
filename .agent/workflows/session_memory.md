# 💾 SESSION MEMORY — Zeflyo Project
> Last Checkpoint: 2026-06-19 | Status: Phase 3 (Chat Hub Refactored), Phase 4 (Scheduler & Rules), Multilingual Support — 100% COMPLETE

---

## ⚡ Active Task Completed (Những việc ĐÃ HOÀN THÀNH trong session)
*   **[Phase 4] Automation - Scheduler & Auto-Reply Rules:**
    *   Tạo thành công migration và model cho `ScheduledPost` và `AutoReplyRule` kèm theo các quan hệ và casts Eloquent.
    *   Xây dựng đầy đủ các API CRUD bảo mật trong middleware `auth:sanctum` cho cả Scheduled Posts và Auto-Reply Rules.
    *   Viết command `PublishScheduledPosts` (`php artisan posts:publish`) hỗ trợ tự động đăng trạng thái hoặc ảnh đính kèm lên Graph API của nhiều Fanpage song song.
    *   Đăng ký cron job chạy command `posts:publish` mỗi phút trong `routes/console.php`.
    *   Tích hợp bộ đối khớp từ khóa thông minh (keyword containment) trực tiếp vào webhook handler `ProcessFacebookWebhookJob` để phản hồi tức thì cho cả bình luận và tin nhắn Messenger, tự lưu tương tác và phát Echo socket cập nhật UI Live Chat.
    *   Thiết kế giao diện soạn thảo Scheduler Next.js `/scheduler` dạng Split Pane có Facebook mockup preview thời gian thực và danh sách bài đăng lịch sử.
    *   Thiết kế giao diện quản lý rules Next.js `/rules` sử dụng layout Cards tinh gọn, badges từ khóa màu sắc, nút Switch Toggle trạng thái hoạt động tức thì với micro-animations và modal CRUD.
    *   Xác thực biên dịch build Next.js thành công 100% không phát sinh lỗi typescript, và viết feature test **[AutomationTest.php](file:///d:/ThucTapDN/Zeflyo/backend/tests/Feature/AutomationTest.php)** chạy thành công trên PHPUnit/Docker.

*   **[Phase 3] Live Chat Hub Refactoring & WebSockets:**
    *   Tái cấu trúc giao diện `chat/page.tsx` thành thiết kế Premium 3 cột Pancake Glassmorphism.
    *   Tích hợp bộ xương tải trang (Skeleton Loaders) khi chuyển đổi và nạp cuộc hội thoại mới.
    *   Tách biệt và tối ưu hiệu năng render bong bóng chat bằng `React.memo` (component `MessageBubble`).
    *   Cải tiến ô nhập liệu sang dạng `<textarea>` hỗ trợ phím tắt gửi tin bằng `Enter` (không nhảy dòng) và `Shift + Enter` để xuống dòng.
    *   Thiết kế nút gạt "AI Auto-Reply" cao cấp, hiển thị loader nhỏ xoay tròn ngay bên trong switch dot khi trạng thái đang đồng bộ với Backend.
    *   Nâng cấp cơ chế Responsive: Tự động ẩn cột 3 ở màn hình di động, hiển thị cột 1 (sidebar) và cột 2 (khung chat) dưới dạng trượt slide kèm nút Back quay lại danh sách cuộc trò chuyện.
    *   Bổ sung hiệu ứng viền trái nổi bật (`border-blue-600`) cho đoạn hội thoại đang chọn và chấm tròn thông báo tin nhắn chưa đọc nhấp nháy cam (`animate-pulse shadow-orange-500/20`).
    *   Refine trạng thái kết nối WebSocket Indicator trên Header bằng hiệu ứng màu sắc và glow tương ứng.

*   **[Phase 1] Multilingual & UX Improvements:**
    *   Tích hợp bộ chuyển đổi ngôn ngữ **Anh / Việt (Language Switcher)** ở góc tiêu đề của Trang chủ (`page.tsx`) giúp chuyển đổi toàn bộ nhãn từ tiếng Anh sang tiếng Việt cực kỳ mượt mà.
    *   Đồng bộ lựa chọn ngôn ngữ xuống `localStorage` để giữ nguyên trạng thái khi người dùng tải lại trang.
    *   Tắt các thông báo lỗi Hydration phiền toái bằng thuộc tính `suppressHydrationWarning` trên thẻ `<body>` trong `layout.tsx` (khắc phục việc các extensions tự ý thay đổi DOM trước khi hydrate).

## 🧠 Semantic Context Essence (Tinh túy kiến thức & Quyết định thiết kế)
*   *Fallback Mock Token:* Khi sử dụng `mock_page_token_123` làm access token cho các fanpage, backend sẽ bỏ qua việc gọi API Facebook thật để tránh lỗi xác thực token, thay vào đó giả lập thành công trong nhật ký log của container.
*   *Instant State Toggle:* Để tăng trải nghiệm cao cấp, switch toggle trên giao diện `/rules` thực hiện cập nhật tức thời trên React state và gửi request ngầm cập nhật database, tự động revert state nếu request backend thất bại.
*   *Textarea Keyboard Shortcuts:* Sử dụng `<textarea>` thay cho `<input type="text">` cho phép hỗ trợ đa dòng hoàn chỉnh và tối ưu trải nghiệm gõ phản hồi nhanh từ bàn phím.
*   *Mobile Column Sliding:* Sử dụng state `mobileView` giúp chuyển đổi hiển thị trượt giữa các cột giúp giao diện gọn gàng trên thiết bị di động.

## 🔜 Next Steps (3 hành động kỹ thuật trực tiếp kế tiếp)
- [ ] **Step 1:** Thiết lập API Key Google Gemini 1.5 Flash trong file cấu hình `.env` và `config/services.php`.
- [ ] **Step 2:** Viết lớp `GeminiService` để phân tích ngữ cảnh và trả lời tự động cho khách hàng khi không khớp từ khóa cố định nào.
- [ ] **Step 3:** Tiến hành review bảo mật toàn diện (Security Review) và mã hóa các access token trong database.
