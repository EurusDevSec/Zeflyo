# 🔄 Hướng Dẫn Khởi Động Lại Hệ Thống Zeflyo (Local Restart Guide)

Tài liệu này hướng dẫn quy trình khởi động lại toàn bộ các dịch vụ của dự án Zeflyo sau khi tắt máy, đồng thời hướng dẫn cấu hình Webhook URL từ Meta Developers sử dụng Localtunnel với tên miền cố định.

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

> ⚠️ **LƯU Ý QUAN TRỌNG VỀ ĐỊA CHỈ TRUY CẬP:**
> Mặc dù Next.js khởi chạy ở cổng `3000`, bạn **luôn luôn phải truy cập** thông qua cổng 80 của Nginx: **`http://localhost`** (hoặc `http://127.0.0.1`).
> **Tại sao?** Nginx đóng vai trò là cổng định tuyến hợp nhất. Truy cập trực tiếp qua cổng 3000 sẽ gây ra lỗi **CORS** và lỗi **404** khi xác thực kênh truyền WebSocket riêng tư (`POST /broadcasting/auth`).

---

### Bước 3: Mở cổng kết nối Localtunnel (Với tên miền cố định)
Mở một cửa sổ Terminal thứ ba tại thư mục dự án và khởi chạy Localtunnel để tạo cổng kết nối HTTPS công khai cho Webhook của Meta. 

Để giữ **cố định URL** và không phải cập nhật lại trên Meta Developers mỗi lần tắt/bật lại, hãy dùng tham số `--subdomain`:

```bash
npx localtunnel --port 80 --subdomain zeflyo-dev
```

> 💡 **Giải thích:** Câu lệnh này sẽ yêu cầu tên miền cố định là **`https://zeflyo-dev.loca.lt`**. Nếu tên miền này trùng hoặc chưa khả dụng, bạn có thể thay `zeflyo-dev` bằng một chuỗi duy nhất bất kỳ (ví dụ: `zeflyo-shop-hoang`).

---

### Bước 4: Cấu hình Webhook URL trên Meta Developers
Do chúng ta đã cố định tên miền thông qua Localtunnel, bạn chỉ cần cấu hình trên Facebook **một lần duy nhất**:

1.  Đăng nhập vào [Meta Developers Console](https://developers.facebook.com/).
2.  Chọn ứng dụng của bạn $\rightarrow$ Trong danh mục menu bên trái, tìm đến **Webhooks**.
3.  Chọn loại Event là **Page** $\rightarrow$ Bấm nút **Edit Subscription**.
4.  Cấu hình chi tiết:
    *   **Callback URL:** `https://zeflyo-dev.loca.lt/api/webhook/facebook`  
        *(Hoặc thay bằng subdomain bạn đã chọn ở Bước 3)*
    *   **Verify Token:** `zeflyo_webhook_token_2026` *(Mã xác thực đã cấu hình trong file `.env` của backend).*
5.  Bấm **Verify and Save** để xác thực kết nối.

---

## ⚠️ Lưu ý quan trọng khi kiểm thử (Local Testing Tips)

*   **API Base URL trên UI:** Khi truy cập trang đăng nhập tại `http://localhost`, tại bảng cấu hình API (biểu tượng bánh răng ⚙️), hãy nhập **`http://localhost`** làm địa chỉ API. Tuyệt đối không điền cổng `3000` hay địa chỉ localtunnel tại đây (trừ khi bạn đang truy cập từ xa).
*   **Vận hành & Xuất bản bài đăng đã lên lịch (Post Scheduler):**
    Để quét và xuất bản các bài viết đã đến giờ hẹn lịch từ hàng đợi lên các Fanpage Facebook, hãy chạy lệnh Artisan sau tại thư mục gốc của dự án:
    ```bash
    docker compose exec app php artisan posts:publish
    ```
    *Mẹo:* Trong môi trường sản xuất (Production), lệnh này được Laravel Scheduler tự động kích hoạt mỗi phút qua cronjob. Trên môi trường phát triển cục bộ (Local), bạn có thể chạy lệnh thủ công ở trên bất kỳ lúc nào để kích hoạt xuất bản bài viết ngay khi vừa đến giờ hẹn.
*   **Kiểm tra Logs Docker:** Nếu xảy ra lỗi không nhận được tin nhắn hoặc gửi bài viết thất bại, bạn có thể kiểm tra logs của Queue Worker, Web server và Soketi bằng các lệnh:
    ```bash
    # Xem logs của Laravel Queue worker
    docker logs worker_zeflyo --tail=50 -f
    
    # Xem logs của WebSocket server
    docker logs soketi_zeflyo --tail=50 -f
    
    # Xem logs của Laravel Octane app
    docker logs app_zeflyo --tail=50 -f
    ```
