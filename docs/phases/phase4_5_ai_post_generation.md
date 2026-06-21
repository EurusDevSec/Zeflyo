# Phase 4.5: Tự Động Tạo Nội Dung Bài Đăng Bằng Gemini AI (Ngày 5.5)

## 🎯 Mục tiêu
* Tích hợp dịch vụ gọi Gemini AI sinh bài viết tự động theo chủ đề và giọng điệu (Tone of voice) tùy chọn.
* Cho phép người dùng tạo nhanh bài viết chất lượng cao từ giao diện lập lịch (`/scheduler`) và tự động đồng bộ vào khung xem trước thời gian thực trước khi lưu lịch đăng.

---

## 🛠️ Yêu cầu triển khai chi tiết

### 1. Backend (Laravel API)
* **API Endpoint:** `POST /api/posts/generate-ai` bảo mật bằng middleware `auth:sanctum`.
* **Cấu hình Prompt Copywriter:**
  * AI đóng vai trò là một chuyên gia marketing / viết bài quảng cáo thương mại điện tử chuyên nghiệp trên Facebook.
  * Nội dung sinh ra phải hấp dẫn, có bố cục chia đoạn rõ ràng, sử dụng các emoji sinh động phù hợp, có lời kêu gọi hành động (CTA) thân thiện và danh sách các hashtag phổ biến ở cuối.
* **Xử lý Ngoại lệ:**
  * Validate các tham số đầu vào: `topic` (string, required) và `tone` (string, optional).
  * Gọi `GeminiService` để tạo văn bản.
  * Nếu gọi API thất bại hoặc bị lỗi, trả về thông báo lỗi chi tiết cùng mã lỗi thích hợp (ví dụ: `500` hoặc `422`).

### 2. Frontend (Next.js `/scheduler`)
* **Trình viết bài bằng AI (AI Writer Panel):**
  * Tích hợp ô nhập chủ đề/ý tưởng (Topic Input) dạng một dòng văn bản.
  * Thêm bộ chọn giọng điệu (Tone selector): Lịch sự, Thân thiện, Khuyến mãi, Hài hước.
  * Thêm nút bấm **"Tạo bằng AI (Generate with AI)"** có hiệu ứng lấp lánh (Sparkles).
* **Trải nghiệm Người dùng (UX/UI):**
  * Khi đang gọi API, hiển thị hiệu ứng Loading và tắt tạm thời (disabled) các nút tương tác để tránh gửi yêu cầu liên tục.
  * Khi nhận được kết quả, tự động gán văn bản vào ô soạn thảo nội dung bài đăng chính, giúp kích hoạt ngay bản xem trước trực quan (Facebook Live Preview) ở màn hình bên phải.

---

## 🧪 Quy trình kiểm định (Verify)
1. **Kiểm thử tự động:** Viết test case tự động gửi request đến `/api/posts/generate-ai` để đảm bảo API hoạt động đúng logic và phản hồi dữ liệu JSON hợp lệ.
2. **Kiểm thử giao diện:** Nhập chủ đề thử nghiệm, nhấn nút sinh và xác nhận nội dung sinh ra xuất hiện đầy đủ trong phần soạn thảo và khu vực preview trực quan.
