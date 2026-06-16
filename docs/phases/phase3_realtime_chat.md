# Phase 3: Live Chat Hub & WebSockets Real-Time (Ngày 7 - 9)

## 🎯 Mục tiêu
*   Thiết lập kênh truyền thông tin thời gian thực (WebSockets) để tự động đẩy tin nhắn mới về màn hình của Admin.
*   Xây dựng giao diện Hộp thư tập trung (Live Chat Hub) mượt mà hỗ trợ xem tin nhắn/bình luận và gửi phản hồi thủ công.

---

## 👥 Phân công nhiệm vụ chi tiết

### 1. Hoàng (PM & DevOps)
*   **Công việc 1: Khởi chạy WebSocket Server (Soketi/Pusher)**
    *   *Phương án 1 (Soketi):* Thêm container `soketi` vào file `docker-compose.yml` (Port 6001). Cấu hình Nginx reverse proxy định tuyến `/socket` về container Soketi.
    *   *Phương án 2 (Pusher - Dự phòng tốc chiến):* Đăng ký tài khoản Pusher Free Tier, cung cấp bộ key cấu hình (`PUSHER_APP_ID`, `KEY`, `SECRET`, `CLUSTER`) cho Khoa và Tiến.
*   **Công việc 2: Cấu hình CORS & Security**
    *   Thiết lập Nginx và Laravel Broadcasting config để cho phép kết nối WebSocket từ domain Next.js ở local.

### 2. Khoa
*   **Công việc 1: Laravel Broadcasting (Redis Pub/Sub)**
    *   Bật tính năng Broadcast trong Laravel (`BROADCAST_CONNECTION=redis` hoặc `pusher`).
    *   Tạo sự kiện broadcast: `MessageReceivedEvent` (phát đi khi có tin nhắn/comment mới từ webhook) và `MessageSentEvent` (phát đi khi admin phản hồi).
*   **Công việc 2: API Chat History & Send Message**
    *   Tạo API `GET /api/conversations`: Lấy danh sách khách hàng tương tác mới nhất (sắp xếp giảm dần theo thời gian tin nhắn cuối).
    *   Tạo API `GET /api/conversations/{customerId}/messages`: Lấy lịch sử tin nhắn của một khách hàng (phân trang).
    *   Tạo API `POST /api/conversations/{customerId}/messages`: Nhận tin nhắn phản hồi của Admin $\rightarrow$ Gọi API Facebook `/me/messages` (hoặc `/comments` nếu là comment) sử dụng **Page Access Token** để gửi phản hồi $\rightarrow$ Lưu phản hồi đó vào PostgreSQL $\rightarrow$ Phát sự kiện Broadcast.

### 3. Tiến (Fullstack Developer)
*   **Công việc 1: Xây dựng Giao diện Live Chat Hub (Next.js)**
    *   Thiết kế layout Dashboard 3 cột dạng Pancake/Sapo:
        *   *Cột 1 (Sidebar hội thoại):* Hiển thị danh sách khách hàng, avatar, tên và tin nhắn cuối cùng kèm badge đếm tin chưa đọc.
        *   *Cột 2 (Khung chat chính):* Hiển thị bong bóng chat (tin nhắn của khách nằm bên trái màu xám, tin nhắn của shop nằm bên phải màu xanh/thương hiệu). Hỗ trợ tự động cuộn xuống dưới cùng khi có tin mới.
        *   *Cột 3 (Thông tin phụ):* Hiển thị thông tin Fanpage đang tương tác, lịch sử, nhãn dán.
*   **Công việc 2: Tích hợp Laravel Echo & WebSocket client**
    *   Cài đặt `laravel-echo` và `pusher-js` trên Next.js.
    *   Kết nối WebSocket khi Admin đăng nhập thành công.
    *   Lắng nghe kênh sự kiện của Fanpage (ví dụ: `private-page.{pageId}`). Khi có tin nhắn mới đẩy về, tự động cập nhật mảng tin nhắn trong **Zustand store** để hiển thị lập tức lên UI mà không cần F5.

---

## 🔌 Đặc Tả Giao Diện API & Events

### API `GET /api/conversations` (Lấy danh sách chat)
*   **Response JSON:**
```json
[
  {
    "customer_id": 12,
    "customer_name": "Nguyen Van A",
    "customer_avatar": "https://...",
    "last_interaction": {
      "type": "message",
      "content": "Giá sản phẩm này bao nhiêu ạ?",
      "created_at": "2026-06-16T16:30:00Z",
      "is_from_customer": true
    }
  }
]
```

### API `POST /api/conversations/{customerId}/messages` (Gửi tin nhắn)
*   **Request JSON:**
```json
{
  "content": "Chào bạn, sản phẩm này giá 150k ạ!"
}
```

---

## 🧪 Kiểm định & Verify ở cuối Phase
1.  **Kết nối WebSocket:** F12 trên Next.js Client, tab Network/WS báo trạng thái `101 Switching Protocols` (kết nối WebSocket mở thành công).
2.  **Đồng bộ real-time:** Mở 2 màn hình cạnh nhau: 1 bên là Messenger Facebook thật của Khách hàng, 1 bên là Dashboard Next.js của Admin:
    *   Khách nhắn tin bên Facebook $\rightarrow$ Giao diện Admin lập tức vẽ tin nhắn mới không cần F5.
    *   Admin gõ tin nhắn phản hồi trên Next.js $\rightarrow$ Messenger của Khách hàng nhận được tin trả lời sau < 1 giây.
    *   Hàng đợi Horizon không báo lỗi.
