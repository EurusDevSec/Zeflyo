# Runbook: AI Post Content Generator (Phase 4.5)

Runbook này hướng dẫn cách chạy thử nghiệm, kiểm tra và giải thích chi tiết kiến trúc của tính năng Tự động tạo nội dung bài đăng bằng Gemini AI.

---

## 💡 Tại sao lại thiết kế như vậy? (Design Decisions)

1. **Tái sử dụng dịch vụ GeminiService**:
   - Thay vì khởi tạo một lớp gọi HTTP mới tới Google Gemini API, tính năng này tận dụng trực tiếp lớp dịch vụ `App\Services\GeminiService` đã được xây dựng và kiểm định trong Phase 4 (Auto-Reply AI). Điều này đảm bảo tính nhất quán của cấu hình API Key và Model.
   
2. **Kiểm soát và Bảo mật API Route**:
   - API Route `POST /api/posts/generate-ai` được bảo vệ chặt chẽ bởi middleware `auth:sanctum`. Chỉ người dùng đã đăng nhập mới có quyền gọi AI sinh nội dung, điều này giúp ngăn chặn lạm dụng API (API Abuse) và kiểm soát chi phí sử dụng Google Gemini Token.
   
3. **Cấu hình prompt Copywriter chuyên nghiệp**:
   - System Prompt gửi cho Gemini được tối ưu đặc biệt cho việc viết bài đăng Facebook (có cấu trúc phân đoạn rõ ràng, tự động chèn Emoji sinh động, kêu gọi hành động CTA thân thiện và kèm Hashtag liên quan ở cuối). 
   - Hỗ trợ tham số hóa `tone` (Giọng điệu) để điều chỉnh phong cách viết của AI phù hợp với nhiều nhóm sản phẩm (Thân thiện, Lịch sự, Khuyến mãi, Hài hước).

4. **Trải nghiệm Mockup Live Preview thời gian thực**:
   - Khi AI phản hồi kết quả văn bản, nội dung được cập nhật ngay vào trạng thái bài viết đang soạn thảo ở Frontend. Cơ chế này lập tức kích hoạt khung xem trước **Facebook Live Preview** hiển thị bài đăng (gồm Avatar Fanpage, Tên Fanpage, Văn bản bài đăng, và Hình ảnh đính kèm) giống 100% giao diện bài viết thật trên Facebook.
   
5. **Cơ chế dự phòng Mock Mode**:
   - Khi chạy ở chế độ Demo/Sandbox (Token bắt đầu bằng `mock_`), Frontend sẽ tự động sử dụng bộ sinh nội dung giả lập (Mock Templates) theo từng giọng điệu khác nhau mà không cần gọi API thật. Giúp nhà phát triển kiểm tra UX/UI dễ dàng ngay cả khi không có mạng hoặc chưa cấu hình API Key.

---

## 🛠️ Các file đã được thay đổi/tạo mới

* **Backend Controller:** [`backend/app/Http/Controllers/PostSchedulerController.php`](file:///r:/_Projects/Eurus_Workspace/Zeflyo/backend/app/Http/Controllers/PostSchedulerController.php)
  * Bổ sung phương thức `generateAi(Request $request)` thực hiện validate tham số `topic` (required) và `tone` (optional), định hình prompt và gọi `GeminiService`.
* **Backend Routing:** [`backend/routes/api.php`](file:///r:/_Projects/Eurus_Workspace/Zeflyo/backend/routes/api.php)
  * Khai báo route `POST /api/posts/generate-ai` trong middleware group `auth:sanctum`.
* **Backend Testing:** [`backend/tests/Feature/AutomationTest.php`](file:///r:/_Projects/Eurus_Workspace/Zeflyo/backend/tests/Feature/AutomationTest.php)
  * Thêm hai ca kiểm thử tự động `test_generate_ai_post_content_returns_success` và `test_generate_ai_post_content_validation_error` để kiểm tra logic đầu vào, đầu ra của API bằng Http Mocking.
* **Frontend UI:** [`frontend/src/app/scheduler/page.tsx`](file:///r:/_Projects/Eurus_Workspace/Zeflyo/frontend/src/app/scheduler/page.tsx)
  * Tích hợp **AI Writer Panel** (ô nhập chủ đề + dropdown chọn giọng điệu + nút Sparkles tạo bài).
  * Tích hợp **Facebook Live Preview** hiển thị bài viết trực quan thời gian thực.
  * Tích hợp logic gọi API backend hoặc giả lập mock dữ liệu.
* **Tài liệu Roadmap:**
  * [`docs/plan.md`](file:///r:/_Projects/Eurus_Workspace/Zeflyo/docs/plan.md) và [`.agent/rules/PLAN.md`](file:///r:/_Projects/Eurus_Workspace/Zeflyo/.agent/rules/PLAN.md) được cập nhật để bổ sung Phase 4.5 và chuyển trạng thái sang `ĐÃ HOÀN THÀNH`.

---

## 🧪 Hướng dẫn chạy thử nghiệm & Xác minh (Verification Guide)

### Bước 1: Khởi động hệ thống Docker
Đảm bảo các container Docker của dự án đang chạy:
```bash
docker compose up -d
```

### Bước 2: Chạy kiểm thử tự động (Automated Tests)
Thực thi test suite để đảm bảo API hoạt động chính xác và không ảnh hưởng đến các tính năng khác:
```bash
docker compose exec app php artisan test
```
*Kết quả mong đợi:* Tất cả 11 tests đều vượt qua thành công.

### Bước 3: Khởi chạy và kiểm tra Giao diện (Frontend UI)
1. Di chuyển vào thư mục frontend và chạy môi trường phát triển:
   ```bash
   cd frontend
   npm run dev
   ```
2. Mở trình duyệt truy cập `http://localhost:3000/scheduler`.
3. Bấm vào nút đăng nhập demo **Mock Dev Mode (Demo Sandbox)**.
4. Tại tab **Thiết lập lịch đăng**:
   - Ở mục **Trình viết bài bằng AI**:
     - Nhập chủ đề: *"Khuyến mãi bùng nổ cuối tuần giảm giá 30% cho áo thun"*
     - Chọn giọng điệu: *"Khuyến mãi"*
     - Nhấn nút **Tạo bằng AI (Generate with AI)**.
   - *Kết quả mong đợi:* Hiệu ứng loading xuất hiện, sau đó nội dung bài đăng được tự động điền vào khung soạn thảo.
   - Quan sát mục **Bản xem trước trực quan (Facebook Live Preview)** bên dưới để kiểm tra hiển thị.
5. Tiến hành lưu lịch đăng và kiểm tra lịch đăng xuất hiện trong tab **Quản lý lịch đăng**.
