# 🎫 Jira Ticket: ZEF-602 (Khoa - Security / Backend)
## Phase 6 — Ngôn Ngữ, Gửi Phản Hồi & Pentest Toàn Bộ Module Cài Đặt

* **Ticket ID:** ZEF-602
* **Summary:** Xây dựng trang Ngôn ngữ, trang Gửi phản hồi và thực hiện pentest toàn diện module Settings
* **Assignee:** Khoa (Security Lead / Core Backend)
* **Phase:** Phase 6 — Settings
* **Story Point:** 10
* **Priority:** High
* **Labels:** `security`, `backend`, `i18n`, `pentest`, `phase-6`

---

### 📖 Mô tả (Description)

Khoa đảm nhận 2 trang còn lại của module Settings (**Ngôn ngữ** và **Gửi phản hồi**) cùng toàn bộ công việc **pentest bảo mật** cho module Settings Phase 6. Đây là vị trí quan trọng: đảm bảo không có lỗ hổng nào lọt qua trước khi Phase 6 được merge vào `staging`.

---

### 🛠️ Phần 1 — Trang Ngôn ngữ (`/settings/language`)

#### Backend

* Thêm cột `language` vào bảng `users` (migration phối hợp với Tiến nếu chung file):
  ```php
  $table->string('language', 5)->default('vi')->after('timezone');
  ```
* API endpoint:
  ```
  PUT /api/user/language   Body: { "language": "en" }
  ```
  * Validate: `in:vi,en,zh,ja,ko`.
  * Lưu vào `users.language`, trả về `{ message: "Language updated", language: "en" }`.

#### Frontend `src/app/settings/language/page.tsx`

* Tích hợp **next-intl** (hoặc **i18next + react-i18next** nếu phù hợp kiến trúc hiện tại):
  ```bash
  npm install next-intl
  ```
* Tạo 5 file locale tại `src/locales/`:
  ```
  vi.json  →  Tiếng Việt (tất cả label UI hiện tại)
  en.json  →  English
  zh.json  →  中文 (Simplified)
  ja.json  →  日本語
  ko.json  →  한국어
  ```
  > Dịch ít nhất các key dùng trên trang Settings: tiêu đề, label form, nút bấm, thông báo toast.

* Tạo component `src/components/settings/LanguageCard.tsx`:
  * Grid 2 hoặc 3 cột — mỗi card là một ngôn ngữ:
    ```
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │    🇻🇳    │  │    🇬🇧    │  │    🇨🇳    │
    │ Tiếng    │  │ English  │  │  中文     │
    │  Việt    │  │          │  │          │
    │[✓ Đang   │  │          │  │          │
    │  dùng]   │  │          │  │          │
    └──────────┘  └──────────┘  └──────────┘

    ┌──────────┐  ┌──────────┐
    │    🇯🇵    │  │    🇰🇷    │
    │ 日本語    │  │  한국어   │
    └──────────┘  └──────────┘
    ```
  * Click card → highlight border `#6C63FF` + icon ✓ + gọi `PUT /api/user/language`.
  * Chuyển ngôn ngữ **áp dụng ngay lập tức** (không reload trang).
  * Lưu vào `localStorage` để giữ sau khi refresh.
  * Hiển thị toast: "Đã chuyển sang English ✓".

---

### 🛠️ Phần 2 — Trang Gửi phản hồi (`/settings/feedback`)

#### Backend

* **Migration** bảng `feedbacks`:
  ```php
  Schema::create('feedbacks', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
      $table->enum('type', ['bug', 'suggestion', 'feature_request', 'other']);
      $table->string('title', 255);
      $table->text('content');
      $table->json('image_urls')->nullable();
      $table->string('contact_email', 255)->nullable();
      $table->enum('status', ['new', 'seen', 'resolved'])->default('new');
      $table->timestamps();
  });
  ```

* **FeedbackController** (`app/Http/Controllers/FeedbackController.php`):
  * `POST /api/feedback` — validate:
    ```php
    'type'          => 'required|in:bug,suggestion,feature_request,other',
    'title'         => 'required|string|max:255',
    'content'       => 'required|string|max:1000',
    'image_urls'    => 'nullable|array|max:3',
    'image_urls.*'  => 'url',
    'contact_email' => 'nullable|email',
    ```
  * Lưu vào DB, gửi mail nội bộ (Laravel `Mail::to('team@zeflyo.com')->send(...)`).
  * Rate limit: `throttle:5,1` (5 lần/phút/IP) để chống spam.

* **Tạo `FeedbackMail` Mailable** (`app/Mail/FeedbackMail.php`):
  * Subject: `[Zeflyo Feedback] {type}: {title}`
  * Body: type, title, content, contact_email, user_id.

#### Frontend `src/app/settings/feedback/page.tsx`

* Tạo component `src/components/settings/FeedbackForm.tsx`:

  **Type selector** (Toggle button group — chọn 1):
  ```
  [ 🐛 Lỗi ]  [ 💡 Góp ý ]  [ ✨ Yêu cầu tính năng ]  [ 📝 Khác ]
  ```

  **Form fields:**
  | Field | Type | Validation |
  |---|---|---|
  | Tiêu đề | Text input | Bắt buộc, max 255 ký tự |
  | Nội dung | Textarea (auto-resize) | Bắt buộc, max 1000 ký tự, counter |
  | Đính kèm ảnh | Upload tối đa 3 ảnh, < 5MB | Optional |
  | Email liên hệ | Email input (tự điền từ profile) | Optional, validate format |

  **Submit flow:**
  1. Nút **"Gửi phản hồi →"** — loading spinner.
  2. Thành công → ẩn form, hiện card cảm ơn + **animation confetti nhỏ** (dùng `canvas-confetti`).
  3. Card cảm ơn: "🎉 Cảm ơn bạn! Chúng tôi sẽ phản hồi trong 24 giờ."
  4. Nút "Gửi phản hồi khác" để reset về form.

---

### 🔐 Phần 3 — Pentest & Security Review Module Settings

> Đây là phần cốt lõi của Khoa. **Phải hoàn thành pentest trước khi Tiến merge PR vào `staging`.**

---

#### 3.1 — Authentication & Authorization

| # | Kịch bản | Phương pháp | Kết quả cần đạt |
|---|---|---|---|
| A-01 | Truy cập `/api/user/profile` không có Bearer token | `curl` không header `Authorization` | 401 Unauthorized |
| A-02 | Dùng token của User A gọi `PUT /api/user/profile` sửa User B | Thay `user_id` trong payload | 403 hoặc chỉ cập nhật User A |
| A-03 | Dùng token hết hạn / bị thu hồi | Blacklist token, gọi lại API | 401 Unauthorized |
| A-04 | Truy cập route `/settings/*` không đăng nhập | Điều hướng thẳng URL | Redirect về `/login` |

---

#### 3.2 — IDOR (Insecure Direct Object Reference)

| # | Kịch bản | Phương pháp | Kết quả cần đạt |
|---|---|---|---|
| I-01 | `PUT /api/user/password` — thay `user_id` trong body | Gửi `{ "user_id": 2, ... }` với token của User 1 | Chỉ đổi mật khẩu User 1, ignore `user_id` trong body |
| I-02 | `PUT /api/user/language` — inject user_id khác | Tương tự I-01 | Cập nhật đúng user của token |
| I-03 | Xem feedback của user khác qua ID tuần tự | `GET /api/feedback/1`, `GET /api/feedback/2` | 403 nếu không phải owner |

---

#### 3.3 — Input Validation & Injection

| # | Kịch bản | Payload | Kết quả cần đạt |
|---|---|---|---|
| V-01 | XSS trong `display_name` | `<script>alert(1)</script>` | Sanitize hoặc encode khi render |
| V-02 | SQL Injection trong `title` của feedback | `'; DROP TABLE feedbacks; --` | Eloquent ORM chặn — không ảnh hưởng DB |
| V-03 | HTML Injection trong `content` | `<img src=x onerror=alert(1)>` | Encode khi hiển thị, không render HTML |
| V-04 | Quá dài `content` (> 1000 ký tự) | Gửi 5000 ký tự | 422 Validation Error |
| V-05 | `language` không hợp lệ | `"language": "ru"` | 422: `in:vi,en,zh,ja,ko` |
| V-06 | Upload avatar sai định dạng | `.exe` file rename thành `.jpg` | 422: validate MIME type thực sự, không chỉ extension |
| V-07 | Upload avatar vượt dung lượng | File > 5MB | 422: max file size error |

---

#### 3.4 — Rate Limiting & Spam Prevention

| # | Endpoint | Test | Kết quả cần đạt |
|---|---|---|---|
| R-01 | `POST /api/feedback` | Gửi 10 request/phút liên tiếp | Sau 5 request: 429 Too Many Requests |
| R-02 | `PUT /api/user/password` | Brute force 20 lần/phút | Laravel throttle chặn, trả 429 |
| R-03 | `PUT /api/user/language` | 100 request/phút | Throttle hoặc DB transaction không chết |

---

#### 3.5 — Sensitive Data Exposure

| # | Kịch bản | Kiểm tra | Kết quả cần đạt |
|---|---|---|---|
| S-01 | Response `GET /api/user/profile` lộ mật khẩu | Xem JSON response | Không có field `password` / `remember_token` |
| S-02 | Response lộ Facebook Page Access Token | Xem tất cả API response Settings | Token chỉ dùng server-side, không expose về FE |
| S-03 | Log file lộ thông tin nhạy cảm | Xem `storage/logs/laravel.log` sau khi test | Token / API key không được log plaintext |
| S-04 | Header server fingerprint | Xem response headers | Không expose `X-Powered-By: PHP`, `Server: nginx/1.x` |

---

#### 3.6 — CSRF & Clickjacking

| # | Kịch bản | Phương pháp | Kết quả cần đạt |
|---|---|---|---|
| C-01 | CSRF trên form cập nhật profile | Gửi request từ domain khác không có token | Laravel CSRF middleware chặn (API dùng Sanctum Bearer — kiểm tra header `Origin`) |
| C-02 | Clickjacking trên trang `/settings` | Nhúng trang trong `<iframe>` từ domain khác | Header `X-Frame-Options: DENY` chặn |

---

#### 3.7 — File Upload Security

| # | Kịch bản | Phương pháp | Kết quả cần đạt |
|---|---|---|---|
| F-01 | Upload file PHP shell | `shell.php` rename thành `avatar.jpg` | Reject bởi MIME check; không lưu vào thư mục public |
| F-02 | Path traversal trong tên file | `../../etc/passwd` | Slug tên file tự động, không dùng filename gốc |
| F-03 | Upload 20 ảnh cùng lúc vào feedback | Vượt giới hạn `max:3` | 422 Validation Error |

---

#### 3.8 — Business Logic

| # | Kịch bản | Test | Kết quả cần đạt |
|---|---|---|---|
| B-01 | User Free cố ý gọi API Pro feature | Gọi API với plan `free` | 403 nếu feature bị giới hạn theo plan |
| B-02 | Gửi feedback với ảnh URL giả | `image_urls: ["http://evil.com/track.gif"]` | Validate URL hợp lệ hoặc chỉ chấp nhận URL từ domain tin cậy |

---

### 📋 Báo cáo Pentest

Sau khi thực hiện pentest, Khoa tạo file `docs/security/pentest_phase6_settings.md` ghi lại:
- ✅ / 🔴 Kết quả từng test case
- Mô tả lỗ hổng phát hiện (nếu có)
- Bằng chứng (curl command / screenshot)
- Khuyến nghị fix
- Trạng thái sau khi fix (retest)

---

### ✅ Tiêu chí hoàn thành (DoD — Definition of Done)

**Ngôn ngữ:**
* [ ] `PUT /api/user/language` validate `in:vi,en,zh,ja,ko`, lưu DB thành công.
* [ ] 5 file locale đầy đủ key cho trang Settings.
* [ ] Click card ngôn ngữ → UI chuyển ngay lập tức, lưu `localStorage`, toast confirm.
* [ ] Refresh trang → ngôn ngữ được giữ từ localStorage.

**Gửi phản hồi:**
* [ ] Migration `feedbacks` chạy thành công `php artisan migrate`.
* [ ] `POST /api/feedback` validate đúng tất cả rule, lưu DB, gửi mail nội bộ.
* [ ] Rate limit 429 khi gửi > 5 lần/phút.
* [ ] Frontend: confetti animation sau khi gửi thành công, nút reset về form.
* [ ] Upload ảnh feedback: preview thumbnail, xóa từng ảnh trước khi submit.

**Pentest:**
* [ ] **Tất cả 25 test case (A-01 → B-02) đều PASS** — không còn lỗ hổng critical/high.
* [ ] File `docs/security/pentest_phase6_settings.md` được tạo với đầy đủ kết quả.
* [ ] Mọi lỗ hổng phát hiện được **fix và retest** trước khi tạo PR vào `staging`.
* [ ] Header bảo mật bổ sung: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.
* [ ] Không có thông tin nhạy cảm (token, password, API key) lộ trong response hay log.
