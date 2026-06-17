# 🔄 Hướng Dẫn Khởi Động Lại Hệ Thống Zeflyo (Local Restart Guide)

Tài liệu này hướng dẫn quy trình khởi động lại toàn bộ các dịch vụ của dự án Zeflyo sau khi tắt máy, đồng thời hướng dẫn cập nhật cấu hình Webhook URL từ Meta Developers khi Ngrok cấp IP/Domain mới.

---

## 🏃 Quy Trình 4 Bước Khởi Động Nhanh

### Bước 1: Khởi động cụm Docker (Backend & Services)
Mở một cửa sổ Terminal (PowerShell hoặc Command Prompt) tại thư mục gốc của dự án (`r:\_Projects\Eurus_Workspace\Zeflyo`) và chạy lệnh:

```bash
docker compose up -d
```

> **Các dịch vụ tự động chạy ngầm bao gồm:**
> *   `postgres_zeflyo` (PostgreSQL Database)
> *   `redis_zeflyo` (Redis Cache, Queue & WebSocket Pub/Sub)
> *   `nginx_zeflyo` (Web Server điều hướng cổng 80 & 443)
> *   `app_zeflyo` (Laravel Octane API)
> *   `worker_zeflyo` (Laravel Queue Worker - xử lý tin nhắn & webhook ngầm)
> *   `soketi_zeflyo` (Soketi WebSocket Server phát tin nhắn real-time ở cổng 6001)

---

### Bước 2: Khởi động Client Frontend (Next.js)
Mở một cửa sổ Terminal mới tại thư mục frontend (`r:\_Projects\Eurus_Workspace\Zeflyo\frontend`) và chạy lệnh:

```bash
npm run dev
```

*   **URL truy cập local:** [http://localhost:3000](http://localhost:3000)

---

### Bước 3: Mở cổng kết nối Ngrok
Mở một cửa sổ Terminal thứ ba tại thư mục dự án và khởi chạy Ngrok để tạo cổng kết nối HTTPS công khai cho Webhook của Meta:

```bash
ngrok http 80
```

> 💡 **Mẹo nhỏ:** Nếu bạn không muốn URL Ngrok bị thay đổi ngẫu nhiên mỗi lần khởi động, bạn có thể đăng ký 1 Static Domain hoàn toàn miễn phí trên Dashboard của trang chủ [ngrok.com](https://ngrok.com/), sau đó khởi chạy với lệnh:
> ```bash
> ngrok http --url=YOUR_DOMAIN.ngrok-free.app 80
> ```

---

### Bước 4: Cập nhật Webhook URL trên Meta Developers
Do mỗi lần chạy Ngrok (bản Free) sẽ nhận được một địa chỉ HTTPS ngẫu nhiên mới (ví dụ: `https://abcd-12-34.ngrok-free.app`), bạn cần cập nhật địa chỉ này với Facebook:

1.  Copy địa chỉ HTTPS mới từ màn hình Terminal chạy Ngrok.
2.  Đăng nhập vào [Meta Developers Console](https://developers.facebook.com/).
3.  Chọn ứng dụng của bạn $\rightarrow$ Trong danh mục menu bên trái, tìm đến **Webhooks**.
4.  Chọn loại Event là **Page** $\rightarrow$ Bấm nút **Edit Subscription**.
5.  Cập nhật cấu hình:
    *   **Callback URL:** `<Địa chỉ HTTPS mới của Ngrok>/api/webhook/facebook`  
        *(Ví dụ: `https://abcd-12-34.ngrok-free.app/api/webhook/facebook`)*
    *   **Verify Token:** `zeflyo_webhook_token_2026` (Mã xác thực đã cấu hình trong `.env`).
6.  Bấm **Verify and Save** để lưu lại cấu hình bắt tay mới.

---

## ⚠️ Lưu ý quan trọng khi kiểm thử (Local Testing Tips)

*   **API Base URL trên UI:** Khi truy cập giao diện Next.js tại `http://localhost:3000`, trong phần cài đặt kết nối server (biểu tượng bánh răng ⚙️ ở trang đăng nhập), hãy giữ nguyên địa chỉ API là `http://localhost`. Không cần sửa thành địa chỉ Ngrok, vì trình duyệt của bạn có thể kết nối trực tiếp đến Nginx local qua mạng máy tính giúp tăng tốc độ truyền tải tối đa.
*   **Kiểm tra Logs Docker:** Nếu xảy ra lỗi không nhận được tin nhắn, bạn có thể kiểm tra logs của Queue Worker và Soketi bằng các lệnh:
    ```bash
    # Xem logs của Laravel Queue worker
    docker logs worker_zeflyo --tail=50 -f
    
    # Xem logs của WebSocket server
    docker logs soketi_zeflyo --tail=50 -f
    ```
