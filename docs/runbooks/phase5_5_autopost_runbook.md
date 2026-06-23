# Hướng Dẫn Chạy Phase 5.5: Hệ Thống Đăng Bài Tự Động AI

> Tài liệu này mô tả **2 cách** để vận hành hệ thống đăng bài tự động AI. Tùy vào giai đoạn phát triển, bạn chọn cách phù hợp.

---

## 📋 Điều kiện tiên quyết

1. Docker containers đang chạy (`docker compose up -d`)
2. Database đã migrate (`docker compose exec app php artisan migrate`)
3. Ngrok tunnel đã mở (cho Facebook Graph API callback)
4. `GEMINI_API_KEY` đã được cấu hình trong `backend/.env`
5. Frontend dev server đang chạy (`npm run dev` trong `frontend/`)

---

## 🔑 Cách 1: Chạy thủ công bằng Artisan Command (Khuyến nghị khi phát triển)

### Tại sao chọn cách này?
- **Kiểm soát tuyệt đối**: Bạn chủ động quyết định khi nào hệ thống xử lý, không lo bị chạy ngoài ý muốn.
- **Dễ debug**: Nhìn thấy output log ngay trên terminal, dễ truy vết lỗi.
- **Tiết kiệm tài nguyên**: Không cần chạy daemon/cron liên tục trên máy local.
- **An toàn**: Tránh việc vô tình đăng bài lên fanpage thật trong quá trình phát triển.

### Các bước thực hiện

#### Bước 1: Tạo thiết lập trên giao diện
1. Mở trình duyệt tại `http://localhost:3000/autopost`
2. Vào tab **"Thiết lập từ chủ đề"**
3. Điền tên thiết lập, cài đặt nội dung, chọn fanpage, chọn lịch trình
4. Nhấn **"Tạo thiết lập mới"**
5. Nhập prompt và nhấn **"Tạo chủ đề"** để AI sinh danh sách chủ đề
6. Nhấn **"Kích hoạt thiết lập"** để chuyển sang trạng thái `active`

#### Bước 2: Chạy lệnh xử lý
```bash
# Quét và dispatch jobs cho các thiết lập đã đến giờ
docker compose exec app php artisan autosetups:run

# Hoặc chạy lệnh đăng bài đã lên lịch (từ Phase cũ)
docker compose exec app php artisan posts:publish
```

#### Bước 3: Kiểm tra kết quả
- Vào tab **"Quản lý lịch đăng"** trên giao diện
- Expand thiết lập → Xem trạng thái từng chủ đề:
  - `pending`: Chờ xử lý
  - `generated`: AI đã viết xong, chờ duyệt (nếu chế độ "Duyệt trước")
  - `published`: Đã đăng thành công
  - `failed`: Lỗi (xem error_log)

#### Bước 4: Duyệt bài (nếu chọn chế độ "Duyệt trước")
- Trong tab "Quản lý lịch đăng" → Expand setup → Với topic có trạng thái `generated`
- Đọc nội dung AI đã viết → Nhấn **"Duyệt & Đăng"**
- Bài sẽ được đăng lên Facebook ngay lập tức

---

## 🔑 Cách 2: Chạy tự động bằng Laravel Scheduler (Dùng cho Production / Staging)

### Tại sao chọn cách này?
- **Hoàn toàn tự động**: Hệ thống tự quét và đăng bài theo đúng lịch trình đã cấu hình, không cần can thiệp thủ công.
- **Chạy liên tục 24/7**: Phù hợp cho môi trường production khi cần đăng bài xuyên suốt cả ngày.
- **Scale tốt**: Xử lý hàng trăm thiết lập đồng thời nhờ Redis queue + Laravel Horizon.
- **Giảm effort vận hành**: Chỉ cần cấu hình 1 lần, hệ thống tự chạy mãi mãi.

### Cách cấu hình

#### Option A: Dùng `schedule:work` (Local Dev)
```bash
# Mở 1 terminal mới và chạy:
docker compose exec app php artisan schedule:work
```
Lệnh này sẽ liên tục kiểm tra và chạy các scheduled commands mỗi phút. Bao gồm:
- `posts:publish` — Đăng bài đã lên lịch từ Phase cũ
- `autosetups:run` — Quét và xử lý các thiết lập tự động

> **Lưu ý**: Lệnh `schedule:work` chạy foreground. Khi tắt terminal thì cũng tắt scheduler.

#### Option B: Dùng Cron Tab (Production Linux/AWS ECS)
Thêm vào crontab của server:
```cron
* * * * * cd /var/www/html && php artisan schedule:run >> /dev/null 2>&1
```
Hoặc nếu dùng Docker:
```cron
* * * * * docker compose exec -T app php artisan schedule:run >> /dev/null 2>&1
```

### Kiểm tra scheduler đang hoạt động
```bash
# Xem danh sách commands đã đăng ký
docker compose exec app php artisan schedule:list
```
Kết quả mong đợi:
```
  * * * * *  posts:publish .............. Next Due: 1 minute from now
  * * * * *  autosetups:run ............. Next Due: 1 minute from now
```

---

## 🧪 Test nhanh End-to-End

### Scenario 1: Đăng bài từ chủ đề (Chế độ Đăng ngay)
```bash
# 1. Tạo setup trên giao diện (publish_mode = instant)
# 2. AI sinh topics → Kích hoạt setup
# 3. Chạy lệnh:
docker compose exec app php artisan autosetups:run

# 4. Kiểm tra log output:
# "AutoSetup #1 'Chiến dịch tháng 7': processing..."
# "AutoSetup #1, Topic #1: published successfully."
```

### Scenario 2: Đăng bài từ chủ đề (Chế độ Duyệt trước)
```bash
# 1. Tạo setup trên giao diện (publish_mode = review)
# 2. AI sinh topics → Kích hoạt setup
# 3. Chạy lệnh:
docker compose exec app php artisan autosetups:run

# 4. Log sẽ hiện: "Topic #1: content generated, awaiting review."
# 5. Vào giao diện → Tab "Quản lý lịch đăng" → Expand → "Duyệt & Đăng"
```

### Scenario 3: Đăng bài từ sản phẩm
```bash
# 1. Vào tab "Thêm sản phẩm" → Thêm 3 sản phẩm
# 2. Vào tab "Thiết lập từ chủ đề" → Tạo setup source_type = product
# 3. Kích hoạt → Chạy:
docker compose exec app php artisan autosetups:run

# Mỗi lần chạy sẽ xử lý 1 sản phẩm tiếp theo trong queue
```

---

## ⚠️ Xử lý sự cố thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| "No active auto-setups found" | Chưa kích hoạt setup | Vào UI → Toggle bật setup |
| "AI content generation failed" | Thiếu GEMINI_API_KEY hoặc quota hết | Kiểm tra `.env` → `GEMINI_API_KEY` |
| "Fanpage not found" | Fanpage đã bị xóa | Cập nhật `fanpage_ids` trong setup |
| Topic stuck ở `generated` | Chế độ "Duyệt trước" | Vào UI → Nhấn "Duyệt & Đăng" |
| Bài không đăng lên Facebook | Token hết hạn hoặc mock mode | Kiểm tra `access_token` của fanpage |

---

## 📂 Files liên quan

| File | Mô tả |
|---|---|
| `backend/app/Console/Commands/RunAutoSetupsCommand.php` | Artisan command `autosetups:run` |
| `backend/app/Jobs/ProcessAutoSetupJob.php` | Queue job xử lý auto-post |
| `backend/app/Services/GeminiService.php` | AI engine sinh nội dung |
| `backend/app/Http/Controllers/AutoSetupController.php` | CRUD API thiết lập |
| `backend/app/Http/Controllers/ProductController.php` | CRUD API sản phẩm |
| `backend/app/Http/Controllers/TopicController.php` | API chủ đề + duyệt bài |
| `frontend/src/app/autopost/page.tsx` | Giao diện trang đăng bài tự động |
| `backend/routes/console.php` | Đăng ký cron jobs |
