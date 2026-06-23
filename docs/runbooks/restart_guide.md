# 🔄 Hướng Dẫn Khởi Động & Demo Đầy Đủ Hệ Thống Zeflyo (Local Restart Guide)

Tài liệu này hướng dẫn **toàn bộ quy trình**: khởi động lại dịch vụ, chạy test tự động, demo từng tính năng hoàn chỉnh (Phase 1 → 5.5) và xử lý sự cố thường gặp.

---

## 🏃 Quy Trình 4 Bước Khởi Động Nhanh

### Bước 1: Khởi động cụm Docker (Backend & Services)
Mở một cửa sổ Terminal (PowerShell hoặc Command Prompt) tại thư mục gốc của dự án (`r:\_Projects\Eurus_Workspace\Zeflyo`) và chạy lệnh:

```bash
docker compose up -d
```

> **Các dịch vụ tự động chạy ngầm bao gồm:**
> - `postgres_zeflyo` — PostgreSQL Database
> - `redis_zeflyo` — Redis Cache, Queue & WebSocket Pub/Sub
> - `nginx_zeflyo` — Web Server điều hướng cổng 80
> - `app_zeflyo` — Laravel Octane API
> - `worker_zeflyo` — Laravel Queue Worker (xử lý tin nhắn & webhook ngầm)
> - `soketi_zeflyo` — Soketi WebSocket Server phát tin nhắn real-time (cổng 6001)

---

### Bước 2: Khởi động Client Frontend (Next.js)
Mở một cửa sổ Terminal mới tại thư mục `frontend` và chạy lệnh:

```bash
npm run dev
```

> ⚠️ **LƯU Ý QUAN TRỌNG VỀ ĐỊA CHỈ TRUY CẬP:**
> Mặc dù Next.js khởi chạy ở cổng `3000`, bạn **luôn luôn phải truy cập** thông qua cổng 80 của Nginx: **`http://localhost`**.
> Truy cập trực tiếp qua cổng 3000 sẽ gây lỗi **CORS** và lỗi **404** khi xác thực WebSocket (`POST /broadcasting/auth`).

---

### Bước 3: Mở cổng kết nối Localtunnel (Tên miền cố định)
Mở Terminal thứ ba tại thư mục gốc dự án:

```bash
npx localtunnel --port 80 --subdomain zeflyo-dev
```

> 💡 URL cố định sau khi chạy: **`https://zeflyo-dev.loca.lt`**
> Nếu tên miền bị trùng, thay `zeflyo-dev` bằng chuỗi khác (ví dụ: `zeflyo-shop-hoang`).

---

### Bước 4: Cấu hình Webhook URL trên Meta Developers
Chỉ cần làm **một lần duy nhất**:

1. Đăng nhập vào [Meta Developers Console](https://developers.facebook.com/).
2. Chọn ứng dụng → Menu bên trái → **Webhooks**.
3. Chọn Event **Page** → Bấm **Edit Subscription**.
4. Cấu hình:
   - **Callback URL:** `https://zeflyo-dev.loca.lt/api/webhook/facebook`
   - **Verify Token:** `zeflyo_webhook_token_2026`
5. Bấm **Verify and Save**.

---

## 🧪 Chạy Test Tự Động (Automated Tests)

Chạy toàn bộ test suite backend:

```bash
docker compose exec app php artisan test
```

Kết quả mong đợi: **Tất cả tests PASS, 0 failures**.

Chạy riêng theo phase:

```bash
# Phase 1 — Authentication
docker compose exec app php artisan test --filter=AuthTest

# Phase 2 — Webhook & Queue
docker compose exec app php artisan test --filter=WebhookTest

# Phase 4 — AI Auto-Reply
docker compose exec app php artisan test --filter=AutomationTest

# Phase 5 — Post Scheduler
docker compose exec app php artisan test --filter=SchedulerTest

# Phase 5.5 — AutoPost AI
docker compose exec app php artisan test --filter=AutoPostTest
```

---

## 🎯 Demo Từng Tính Năng (Feature Demo Flows)

### 1. 🔐 Đăng nhập & Đồng bộ Fanpage (Phase 1)

**URL:** `http://localhost`

**Cách demo:**
1. Mở `http://localhost` → Trang login Zeflyo xuất hiện.
2. Nhấn **"Đăng nhập bằng Facebook"** → Redirect OAuth Facebook.
3. Sau khi xác thực → Về Dashboard, danh sách Fanpage hiển thị.
4. Bật/tắt toggle trên từng Fanpage để bật/tắt tự động hóa.

**Mock Mode (không cần Facebook thật):**
- Nhấn **"Mock Dev Mode (Demo Sandbox)"** trên trang login.
- Hệ thống đăng nhập với token giả, đủ để demo toàn bộ UI.

---

### 2. 💬 Live Chat Hub (Phase 3)

**URL:** `http://localhost/chat`

**Cách demo:**
1. Đăng nhập → Vào `/chat`.
2. Chọn một Fanpage từ sidebar trái.
3. Danh sách hội thoại khách hàng xuất hiện.
4. Click vào một hội thoại → Khung chat mở ra, tin nhắn real-time.
5. Gõ tin nhắn → Send → Tin nhắn gửi đến Facebook thật (nếu dùng token thật).

**Kiểm tra nhận tin nhắn qua Webhook:**
```bash
docker logs worker_zeflyo --tail=20 -f
```
Gửi tin nhắn từ Facebook Messenger đến Page → Log worker hiện job xử lý, tin nhắn xuất hiện ngay trên UI không cần reload.

---

### 3. 🤖 Auto-Reply AI & Keyword Rules (Phase 4)

**URL:** `http://localhost/rules`

**Cách demo:**
1. Vào `/rules` → Nhấn **"Thêm luật mới"**.
2. Nhập từ khóa: `giá` / nội dung: `Giá chỉ từ 199.000đ, inbox để được tư vấn!`
3. Lưu → Toggle bật luật.
4. Gửi tin nhắn chứa "giá" từ Facebook → Bot tự trả lời đúng nội dung.
5. Gửi tin nhắn khác (không trùng từ khóa) → Gemini AI sinh câu trả lời thông minh.

```bash
# Xem AI reply trong log
docker logs worker_zeflyo --tail=50 -f
# Xem dòng: "GeminiService: generating reply for message..."
```

---

### 4. ✍️ AI Post Content Generator (Phase 4.5)

**URL:** `http://localhost/scheduler`

**Cách demo:**
1. Vào `/scheduler` → Tab **"Thiết lập lịch đăng"**.
2. Mục **"Trình viết bài bằng AI"**:
   - Chủ đề: *"Khuyến mãi bùng nổ cuối tuần giảm giá 30%"*
   - Giọng điệu: *"Khuyến mãi"*
   - Nhấn ✨ **"Tạo bằng AI"**
3. Nội dung tự động điền vào khung soạn thảo.
4. **Facebook Live Preview** hiển thị bài đăng (avatar page, tên, nội dung, ảnh) giống giao diện Facebook thật.

---

### 5. 📅 Post Scheduler (Phase 5)

**URL:** `http://localhost/scheduler`

**Cách demo:**
1. Vào `/scheduler` → Tab **"Thiết lập lịch đăng"**.
2. Điền nội dung → Chọn ngày giờ → Chọn Fanpage.
3. Nhấn **"Lên lịch đăng"** → Bài xuất hiện ở Tab **"Quản lý lịch đăng"** với trạng thái `pending`.
4. Chạy lệnh xuất bản thủ công:
   ```bash
   docker compose exec app php artisan posts:publish
   ```
5. Trạng thái bài chuyển sang `published`.

**Chạy tự động liên tục (foreground):**
```bash
docker compose exec app php artisan schedule:work
```

---

### 6. 🔄 AutoPost AI — Đăng từ Chủ đề (Phase 5.5)

**URL:** `http://localhost/autopost`

**Demo chế độ Đăng ngay:**
1. Vào `/autopost` → Tab **"Thiết lập từ chủ đề"**.
2. Điền tên chiến dịch, chọn Fanpage, ngôn ngữ, phong cách viết.
3. Nhập prompt → Nhấn **"Tạo chủ đề"** → AI sinh danh sách chủ đề.
4. Nhấn **"Kích hoạt thiết lập"**.
5. Chạy lệnh:
   ```bash
   docker compose exec app php artisan autosetups:run
   ```
6. Tab **"Quản lý lịch đăng"** → Expand → Chủ đề chuyển sang `published`.
7. Kiểm tra Facebook Page → Bài đã đăng thật!

**Demo chế độ Duyệt trước:**
- Chọn chế độ **"Duyệt trước"** khi tạo thiết lập.
- Sau `autosetups:run` → Chủ đề ở trạng thái `generated`.
- Vào UI → Nhấn **"Duyệt & Đăng"** để đăng thủ công sau khi đọc nội dung AI viết.

**Mẫu chiến dịch sẵn để test nhanh:**
- Xem: `docs/runbooks/autopost_test_templates.md`

---

### 7. 📦 AutoPost AI — Đăng từ Sản phẩm (Phase 5.5)

**URL:** `http://localhost/autopost`

**Cách demo:**
1. Tab **"Thêm sản phẩm"** → Thêm sản phẩm (tên, mô tả, URL ảnh).
2. Tab **"Danh sách sản phẩm"** → Kiểm tra sản phẩm và toggle trạng thái.
3. Tab **"Thiết lập từ chủ đề"** → Tạo thiết lập mới, chọn **source_type = Sản phẩm**.
4. Kích hoạt → Chạy lệnh:
   ```bash
   docker compose exec app php artisan autosetups:run
   ```
5. Mỗi lần chạy → 1 sản phẩm tiếp theo trong queue được xử lý và đăng bài lên Facebook.

---

## 🔧 Các Lệnh Artisan Hữu Ích

```bash
# ── Database ──────────────────────────────────────────────────────────
# Chạy migration (sau khi pull code mới hoặc fresh install)
docker compose exec app php artisan migrate

# Reset toàn bộ DB và migrate lại từ đầu ⚠️ XÓA HẾT DỮ LIỆU
docker compose exec app php artisan migrate:fresh

# Xem trạng thái từng migration
docker compose exec app php artisan migrate:status

# ── Cache & Queue ─────────────────────────────────────────────────────
# Xóa cache ứng dụng
docker compose exec app php artisan cache:clear

# Xóa toàn bộ queue job đang chờ (dùng khi queue bị stuck)
docker compose exec app php artisan queue:flush

# Khởi động lại queue worker sau khi deploy code mới
docker compose exec app php artisan queue:restart

# ── Feature Commands ──────────────────────────────────────────────────
# Đăng bài đã lên lịch từ Post Scheduler (Phase 5)
docker compose exec app php artisan posts:publish

# Xử lý 1 chu kỳ AutoPost AI (Phase 5.5)
docker compose exec app php artisan autosetups:run

# Chạy Laravel Scheduler liên tục foreground (local dev)
docker compose exec app php artisan schedule:work

# Xem danh sách tất cả scheduled commands đã đăng ký
docker compose exec app php artisan schedule:list

# ── Testing ───────────────────────────────────────────────────────────
# Chạy toàn bộ test suite
docker compose exec app php artisan test

# Chạy test verbose (xem chi tiết từng test)
docker compose exec app php artisan test --verbose
```

---

## ⚠️ Lưu ý quan trọng khi kiểm thử

- **API Base URL trên UI:** Nhập **`http://localhost`** ở mục cấu hình API (biểu tượng ⚙️). **Không** dùng cổng 3000 hay địa chỉ localtunnel (trừ khi truy cập từ xa).

- **Truy cập từ xa / thiết bị khác (điện thoại, máy khác):**
  - Thay `http://localhost` bằng `https://zeflyo-dev.loca.lt` ở API Base URL.
  - Localtunnel yêu cầu bypass trang "tunnel warning" — nhập IP máy chủ vào form.

- **Kiểm tra GEMINI_API_KEY đang hoạt động:**
  ```bash
  docker compose exec app php artisan tinker --execute="echo config('services.gemini.key');"
  ```

---

## 📋 Xử Lý Sự Cố Thường Gặp

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| Trang trắng / 502 Bad Gateway | Docker chưa chạy hoặc app crash | `docker compose ps` → `docker compose restart app` |
| CORS error khi truy cập cổng 3000 | Truy cập trực tiếp cổng Next.js | Dùng `http://localhost` (cổng 80) |
| WebSocket không kết nối | Soketi chưa chạy | `docker compose restart soketi_zeflyo` |
| Tin nhắn không đến real-time | Worker bị dừng | `docker compose restart worker_zeflyo` |
| Webhook không xác thực | Localtunnel chưa chạy | `npx localtunnel --port 80 --subdomain zeflyo-dev` |
| "No active auto-setups found" | Setup chưa được kích hoạt | Vào UI → Toggle bật setup |
| AI không sinh nội dung | Thiếu `GEMINI_API_KEY` hoặc hết quota | Kiểm tra `backend/.env` → `GEMINI_API_KEY` |
| Bài không đăng được Facebook | Token fanpage hết hạn | Đăng nhập lại Facebook → cấp quyền lại |
| Topic stuck ở `generated` | Chế độ Duyệt trước | Vào UI → Nhấn "Duyệt & Đăng" |
| Queue bị stuck | Job lỗi không retry | `queue:flush` → `queue:restart` |
| Migration lỗi | Conflict version | `php artisan migrate:status` → xem file pending |

---

## 📊 Kiểm Tra Logs Docker

```bash
# Laravel Queue Worker — xem job đang xử lý
docker logs worker_zeflyo --tail=50 -f

# WebSocket Server — xem kết nối real-time
docker logs soketi_zeflyo --tail=50 -f

# Laravel Octane App — xem API request/response
docker logs app_zeflyo --tail=50 -f

# Nginx — xem HTTP access log
docker logs nginx_zeflyo --tail=50 -f

# PostgreSQL — xem query log
docker logs postgres_zeflyo --tail=20 -f
```

---

## 📂 Tổng Hợp URL & Tài Nguyên

| Tài nguyên | URL / Đường dẫn |
|---|---|
| **App Frontend** | `http://localhost` |
| **API Backend** | `http://localhost/api` |
| **WebSocket** | `ws://localhost:6001` |
| **Localtunnel Public HTTPS** | `https://zeflyo-dev.loca.lt` |
| **Meta Developers Console** | https://developers.facebook.com/ |
| **Webhook Callback URL** | `https://zeflyo-dev.loca.lt/api/webhook/facebook` |
| **Verify Token** | `zeflyo_webhook_token_2026` (xem `backend/.env`) |
| **Runbook AutoPost AI** | `docs/runbooks/phase5_5_autopost_runbook.md` |
| **Test Templates AutoPost** | `docs/runbooks/autopost_test_templates.md` |
| **Runbook AI Post Generator** | `docs/runbooks/phase4_5_ai_post_generation_runbook.md` |
| **Runbook Webhook & Queue** | `docs/runbooks/phase2_webhook_and_queue.md` |
| **Runbook Auth & Setup** | `docs/runbooks/phase1_migration_and_api_test.md` |
