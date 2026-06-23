# 🎫 Jira Ticket: ZEF-601 (Tiến - Fullstack / Frontend)
## Phase 6 — Xây Dựng Module Cài Đặt: Tổng Quan, Facebook, Bảng Giá, Hỗ Trợ, Hướng Dẫn, Chính Sách

* **Ticket ID:** ZEF-601
* **Summary:** Xây dựng 5 trang cài đặt: Tổng quan & Facebook, Bảng giá, Hỗ trợ, Hướng dẫn sử dụng, Chính sách & Điều khoản
* **Assignee:** Tiến (Fullstack / Frontend Lead)
* **Phase:** Phase 6 — Settings
* **Story Point:** 13
* **Priority:** High
* **Labels:** `frontend`, `backend`, `settings`, `phase-6`

---

### 📖 Mô tả (Description)

Xây dựng module **Cài đặt** của Zeflyo với 5 trang chính. Toàn bộ các trang nằm dưới route `/settings/` và dùng chung `SettingsLayout` gồm Sidebar chính + Sub-sidebar Cài đặt + vùng nội dung. Phong cách UI theo chuẩn Zeflyo: dark premium, glassmorphism, accent tím `#6C63FF`, Inter font, micro-animation.

---

### 🛠️ Yêu cầu triển khai (Implementation Requirements)

---

#### 🔧 Phần 0 — SettingsLayout & Sub-Sidebar (Dùng chung cho cả 7 trang)

> Tiến làm phần này trước để Khoa có thể đặt 2 trang còn lại vào.

* **Tạo `src/app/settings/layout.tsx`:**
  * Shared layout bao gồm: Sidebar chính (dùng component `<Sidebar>` hiện có) + `<SettingsSidebar>` + `{children}`.
  * `src/app/settings/page.tsx` → redirect tự động sang `/settings/general`.

* **Tạo `src/components/settings/SettingsSidebar.tsx`:**
  * Danh sách 7 mục điều hướng dọc bên trái, highlight active bằng border-left `3px solid #6C63FF`.
  * Icon + label cho từng mục: Tổng quan, Bảng giá, Hỗ trợ, Hướng dẫn, Chính sách, Ngôn ngữ, Gửi phản hồi.
  * Responsive: collapse thành icon-only trên mobile.

* **Thêm mục "Cài đặt" vào `Sidebar.tsx` chính:**
  * Icon ⚙️, route `/settings`, highlight khi `currentPath` bắt đầu bằng `/settings`.

---

#### 1️⃣ Trang Tổng quan & Facebook (`/settings/general`)

**Backend:**
* Thêm cột vào bảng `users` (migration mới):
  ```php
  $table->string('display_name')->nullable()->after('name');
  $table->string('avatar_url')->nullable()->after('display_name');
  $table->string('timezone')->default('Asia/Ho_Chi_Minh')->after('avatar_url');
  ```
* API endpoints:
  ```
  GET  /api/user/profile    → trả về { id, name, display_name, email, avatar_url, timezone }
  PUT  /api/user/profile    → cập nhật display_name, timezone, avatar_url
  PUT  /api/user/password   → { current_password, password, password_confirmation }
  ```
* Validation `PUT /api/user/password`: kiểm tra `current_password` bằng `Hash::check()`, trả về 422 nếu sai.
* Upload avatar: tích hợp endpoint `POST /api/upload` đang có, lưu URL vào `avatar_url`.

**Frontend `src/app/settings/general/page.tsx`:**

*Section A — Hồ sơ tài khoản:*
  * Avatar tròn 96px — click để upload, preview ngay trước khi lưu.
  * Input: Tên hiển thị, Email (readonly, badge "Từ Facebook").
  * Select timezone: danh sách đầy đủ múi giờ, mặc định `Asia/Ho_Chi_Minh`.
  * Accordion "Đổi mật khẩu": Mật khẩu hiện tại / Mới / Xác nhận — icon 👁 hiện/ẩn.
  * Nút **Lưu thay đổi** — loading spinner, toast success/error.

*Section B — Kết nối Facebook:*
  * Badge trạng thái: 🟢 "Đã kết nối" / 🔴 "Token hết hạn" / ⚫ "Chưa kết nối".
  * Card thông tin tài khoản FB: Avatar + tên + email + thời gian kết nối.
  * Danh sách Fanpage dạng list card: ảnh page, tên, toggle bật/tắt (gọi API `/api/fanpages/{id}/toggle`).
  * Nút **Kết nối lại** (màu tím) — mở OAuth Facebook flow.
  * Nút **Ngắt kết nối** (màu đỏ outline) — hiện confirm dialog trước khi xóa token.

---

#### 2️⃣ Trang Bảng giá (`/settings/pricing`)

**Backend:**
* API `GET /api/plans` trả về static JSON mô tả 3 gói:
  ```json
  [
    { "id": "free",     "name": "Free",     "price": 0,       "currency": "VND", "period": "month" },
    { "id": "pro",      "name": "Pro",      "price": 299000,  "currency": "VND", "period": "month", "recommended": true },
    { "id": "business", "name": "Business", "price": null,    "currency": null,  "contact": true }
  ]
  ```
* API `GET /api/user/subscription` → `{ plan: "free", expires_at: null }`.

**Frontend `src/app/settings/pricing/page.tsx`:**
* **Layout 3 cột so sánh** (responsive: stack dọc trên mobile):

  | Free | ⭐ Pro (Recommended) | Business |
  |---|---|---|
  | Border thường | **Gradient border tím + glow** + Badge "Phổ biến nhất" | Border thường |
  | 0đ/tháng | 299.000đ/tháng | Liên hệ |

* Tạo component `src/components/settings/PricingCard.tsx` nhận prop `plan`, render:
  * Header: tên gói, giá, badge recommended (nếu có).
  * Danh sách tính năng với ✅ / ❌ icon.
  * Nút CTA: "Dùng miễn phí" / "Nâng cấp ngay" / "Liên hệ".
  * Gói đang dùng: highlight bằng text "Gói hiện tại" + ngày hết hạn.

* **Bảng so sánh chi tiết** phía dưới 3 card (accordion mở/đóng):

  | Tính năng | Free | Pro | Business |
  |---|---|---|---|
  | Fanpage | 3 | 20 | Không giới hạn |
  | Lượt AI/tháng | — | 5.000 | Không giới hạn |
  | Auto Post & Scheduler | ❌ | ✅ | ✅ |
  | Live Chat Hub | ✅ (1 page) | ✅ | ✅ |
  | Keyword Rules | 5 luật | 100 luật | Không giới hạn |
  | Ưu tiên hỗ trợ | Email | Email + Chat | Dedicated |
  | Xuất báo cáo | ❌ | ✅ | ✅ |

* Nút "Nâng cấp" → hiện modal `ComingSoon` (tích hợp thanh toán ở Phase sau).

---

#### 3️⃣ Trang Hỗ trợ (`/settings/support`)

**Frontend `src/app/settings/support/page.tsx`:**
* Tạo component `src/components/settings/SupportCard.tsx`.
* **Grid 2×2** (desktop), stack dọc (mobile) — 4 card kênh hỗ trợ:

  | Card | Icon SVG | Tiêu đề | Mô tả | Link |
  |---|---|---|---|---|
  | Điện thoại | Phone | `0901 234 567` | T2–T6: 8:00–18:00 | `tel:0901234567` |
  | Fanpage | Facebook | `Zeflyo Official` | Inbox trực tiếp fanpage | `https://facebook.com/zeflyo` |
  | YouTube | YouTube | `Kênh Zeflyo` | Video hướng dẫn chi tiết | `https://youtube.com/@zeflyo` |
  | Zalo | Zalo | `0901 234 567` | Phản hồi trong 15 phút | `https://zalo.me/0901234567` |

* Design card: glassmorphism, icon 48px, hover: nổi lên `translateY(-4px)` + icon pulse animation + gradient background.
* Nút "Liên hệ ngay →" dưới mỗi card.
* **Banner giờ làm việc** phía dưới grid (card full-width):
  ```
  🕐 Thứ 2 – Thứ 6: 8:00 – 18:00   |   🕐 Thứ 7: 8:00 – 12:00   |   🔴 Chủ nhật: Nghỉ
  ```

---

#### 4️⃣ Trang Hướng dẫn sử dụng (`/settings/guide`)

**Frontend `src/app/settings/guide/page.tsx`:**
* Layout 2 cột: **Doc-nav sidebar trái** (fixed, 240px) + **vùng nội dung phải** (scrollable).
* **Search bar** nổi bật trên đầu: filter realtime theo từ khóa trong danh sách mục.
* **Doc-nav sidebar** (trong vùng content — không phải SettingsSidebar):
  ```
  📚 Hướng dẫn sử dụng
  ├── 🚀 Bắt đầu nhanh
  ├── 📘 Kết nối Fanpage
  ├── 💬 Live Chat Hub
  ├── 🤖 Quy tắc tự động
  ├── ✍️ Tạo bài bằng AI
  ├── 📅 Lịch đăng bài
  ├── 🔄 Đăng bài tự động AI
  └── ⚙️ Cài đặt & Tài khoản
  ```
* **Vùng nội dung**: Render nội dung từng chương dạng markdown-like:
  * Heading H2/H3 rõ ràng.
  * Step-by-step numbered list.
  * **Callout boxes**: `💡 Mẹo`, `⚠️ Lưu ý`, `🚨 Quan trọng`.
  * Screenshot placeholder (img với caption).
  * Nút "Xem video →" mở YouTube embed inline (iframe).
* Active chapter highlight trên sidebar khi scroll (Intersection Observer).
* Nút "Quay lại đầu trang" floating khi scroll xuống.

---

#### 5️⃣ Trang Chính sách & Điều khoản (`/settings/policy`)

**Frontend `src/app/settings/policy/page.tsx`:**
* **3 tabs nội bộ** (dạng pill tabs):
  ```
  [ Chính sách bảo mật ]  [ Điều khoản dịch vụ ]  [ Chính sách hoàn tiền ]
  ```
* Mỗi tab: card trắng/tối, font `14px` dễ đọc, line-height `1.8`.
* **Mục lục nhanh** (Table of Contents) anchor links bên phải (sticky, trên desktop).
* Nội dung soạn sẵn (static text — không cần API):
  * **Chính sách bảo mật**: Thu thập dữ liệu, lưu trữ, chia sẻ, quyền xóa dữ liệu.
  * **Điều khoản dịch vụ**: Phạm vi sử dụng, giới hạn trách nhiệm, sở hữu trí tuệ, tranh chấp.
  * **Chính sách hoàn tiền**: Điều kiện hoàn tiền, thời hạn 7 ngày, quy trình liên hệ.
* Footer mỗi tab: "Cập nhật lần cuối: 23/06/2026" + nút "Tải PDF" (window.print()).

---

### ✅ Tiêu chí hoàn thành (DoD — Definition of Done)

* [ ] **SettingsLayout** và **SettingsSidebar** hoạt động đúng — điều hướng giữa 7 trang mượt mà, active highlight chính xác.
* [ ] **Tổng quan**: PUT `/api/user/profile` lưu thành công, upload avatar preview trước khi lưu, đổi mật khẩu validate `current_password` đúng.
* [ ] **Kết nối Facebook**: Hiển thị đúng trạng thái token, toggle fanpage gọi API thành công, confirm dialog trước khi ngắt kết nối.
* [ ] **Bảng giá**: 3 cột hiển thị đúng trên mọi màn hình (desktop/tablet/mobile), gói Pro nổi bật bằng gradient border, bảng so sánh accordion mở/đóng mượt.
* [ ] **Hỗ trợ**: 4 card hiển thị đúng icon và link, hover animation `translateY(-4px)` hoạt động, banner giờ làm việc hiển thị đủ.
* [ ] **Hướng dẫn**: Search filter realtime theo từ khóa, active chapter thay đổi khi scroll, callout box và step list render đúng style.
* [ ] **Chính sách**: 3 tab chuyển đổi mượt, mục lục anchor link scroll đúng vị trí, nút Print hoạt động.
* [ ] `npx tsc --noEmit` — **0 TypeScript errors**.
* [ ] `npm run build` — **0 build errors**.
* [ ] Responsive: tất cả trang hiển thị đúng trên 375px / 768px / 1280px.
