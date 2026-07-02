# 🎫 Jira Task: JZ-7 — [Testing & Integration] Viết Feature Test cho API Stream, cơ chế Abort Token-saving và kiểm định Marketing Formulas

*   **Assignee:** Tien Pho Duc (Feature PM & Fullstack Developer)
*   **Status:** TO DO
*   **Priority:** High
*   **Due Date:** 2026-07-02
*   **Epic Link:** Phase 7: AI Optimization
*   **Reference Spec:** [phase7_ai_optimization.md](file:///d:/ThucTapDN/Zeflyo/docs/phases/phase7_ai_optimization.md)

---

## 📖 Mô tả (Description)

Viết các bài kiểm thử tự động (Feature Tests) kiểm định tính đúng đắn cho luồng SSE stream `/api/posts/generate-ai-stream` (SSE), kiểm tra cơ chế ngắt kết nối tiết kiệm token (Abort Token-saving), và xác nhận chất lượng nội dung sinh ra bám sát các công thức Marketing AIDA, PAS, BAB. Đồng thời hỗ trợ điều phối tiến độ và kiểm thử tích hợp toàn diện.

---

## 🛠️ Yêu cầu triển khai chi tiết (Implementation Requirements)

### 🧪 1. Viết Test cho Luồng Stream SSE (`tests/Feature/GeminiStreamTest.php`)

*   **Test Case 1: `test_stream_endpoint_returns_correct_sse_headers`**
    *   *Asserts*:
        *   Mã phản hồi HTTP `200`.
        *   Header `Content-Type` là `text/event-stream`.
        *   Header `Cache-Control` là `no-cache`.
        *   Header `Connection` là `keep-alive`.
*   **Test Case 2: `test_stream_endpoint_validates_required_parameters`**
    *   *Asserts*:
        *   Gửi request thiếu `topic` hoặc `framework` trả về mã lỗi `422` với thông báo lỗi rõ ràng.

---

### 🧪 2. Kiểm thử Cơ chế Hủy kết nối (Abort Token-saving)

*   **Test Case 3: `test_abort_stream_behavior`**
    *   *Mục tiêu*: Xác minh rằng Backend thực sự nhận biết khi kết nối bị hủy và dừng gọi Gemini.
    *   *Kỹ thuật thực hiện*:
        *   Viết test mock `GeminiService` để phát ra nhiều chunk dữ liệu.
        *   Sử dụng cơ chế mock hàm toàn cục của PHP hoặc kiểm soát cờ trong Pest để kích hoạt `connection_aborted() === true` sau chunk đầu tiên.
        *   Assert rằng luồng lặp chỉ chạy 1 lần và dừng ngay lập tức (không chạy tiếp các chunk tiếp theo).

---

### 🧪 3. Kiểm định chất lượng nội dung theo Công thức Marketing

*   **Test Case 4: `test_generated_content_follows_aida_framework`**
    *   *Kỹ thuật*: Mock response từ Gemini API trả về cấu trúc AIDA chuẩn.
    *   *Asserts*:
        *   Nội dung phản hồi có chứa câu CTA hành động rõ ràng ở cuối bài viết (chiếm khoảng 30%).
        *   Có phần tặng voucher/quà tặng ở phần Desire (chiếm 70%).
*   **Test Case 5: `test_generated_content_follows_pas_framework`**
    *   *Asserts*:
        *   Bài viết có phần xoáy sâu vào nỗi đau/vấn đề (Problem/Agitate).
*   **Test Case 6: `test_generated_content_follows_bab_framework`**
    *   *Asserts*:
        *   Bài viết có sự biến chuyển Before - After - Bridge cụ thể.

---

### 🤝 4. Kiểm thử Tích hợp & Đảm bảo biên dịch (Integration Gate)

*   **Hỗ trợ kiểm định hạ tầng (Nginx Buffer Fix)**:
    *   Kiểm tra cấu hình Nginx trong Docker-compose xem đã bật `proxy_buffering off;` chưa, hoặc đảm bảo header `X-Accel-Buffering: no` được nhận diện chính xác ở client. Nếu không, trình duyệt sẽ gom hết chunk lại rồi hiển thị một lượt, làm mất hiệu ứng typing.
*   **TypeScript & Build Verification**:
    *   Chạy `npx tsc --noEmit` ở thư mục frontend đảm bảo không có bất kỳ lỗi kiểu dữ liệu (types) nào phát sinh sau khi tích hợp.
    *   Chạy `npm run build` để kiểm tra kết quả đóng gói SPA Next.js tĩnh.

---

## ✅ Tiêu chí hoàn thành (DoD - Definition of Done)

*   [ ] File `tests/Feature/GeminiStreamTest.php` được tạo mới và viết đầy đủ 6 test cases.
*   [ ] Chạy `php artisan test` đạt tỷ lệ PASS 100% cho các test cases mới và cũ.
*   [ ] Đảm bảo không xảy ra hiện tượng rò rỉ bộ nhớ hoặc treo transaction DB khi connection bị abort.
*   [ ] Không phát sinh lỗi static analysis (Larastan) hay TypeScript error nào trên nhánh làm việc.
