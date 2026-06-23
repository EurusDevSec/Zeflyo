# Phase 6: Module Cài Đặt (Settings)

## 🎯 Mục tiêu
Xây dựng module **Cài đặt** hoàn chỉnh cho Zeflyo — nơi người dùng cấu hình tài khoản, kết nối Facebook, lựa chọn gói dịch vụ, liên hệ hỗ trợ và tùy chỉnh trải nghiệm. Toàn bộ module nằm trong **Sidebar → Cài đặt** với điều hướng phụ bên trái (sub-sidebar), giao diện cao cấp, đồng nhất với phong cách Zeflyo.

---

## 📋 Phạm vi Phase 6

| Trang | Đường dẫn | Trạng thái |
|---|---|---|
| Tổng quan & Facebook | `/settings/general` | ⬜ Chưa làm |
| Bảng giá | `/settings/pricing` | ⬜ Chưa làm |
| Hỗ trợ | `/settings/support` | ⬜ Chưa làm |
| Hướng dẫn sử dụng | `/settings/guide` | ⬜ Chưa làm |
| Chính sách & Điều khoản | `/settings/policy` | ⬜ Chưa làm |
| Ngôn ngữ | `/settings/language` | ⬜ Chưa làm |
| Gửi phản hồi | `/settings/feedback` | ⬜ Chưa làm |

---

## 🗂️ Cấu trúc Điều hướng

```
Sidebar chính
└── ⚙️ Cài đặt  →  /settings
    ├── 📋 Tổng quan & Facebook  →  /settings/general
    ├── 💎 Bảng giá              →  /settings/pricing
    ├── 🎧 Hỗ trợ               →  /settings/support
    ├── 📖 Hướng dẫn sử dụng    →  /settings/guide
    ├── 📜 Chính sách & Điều khoản → /settings/policy
    ├── 🌐 Ngôn ngữ             →  /settings/language
    └── 💬 Gửi phản hồi         →  /settings/feedback
```

**Layout shared**: Tất cả các trang dùng chung `SettingsLayout` gồm **Sidebar chính** + **Sub-sidebar Cài đặt** (thanh điều hướng dọc bên trái) + **vùng nội dung chính**.

---

## 🎨 Thiết kế UI/UX

### Nguyên tắc chung
- Màu nền: `#0A0A0F` (dark premium) với accent `#6C63FF` (tím Zeflyo)
- Glassmorphism cards: `backdrop-filter: blur(20px)`, `background: rgba(255,255,255,0.04)`
- Radius: `1.25rem`, Shadow: `0 8px 32px rgba(108,99,255,0.15)`
- Font: **Inter** — headings `700`, body `400`
- Micro-animation: hover scale `1.02`, transition `0.2s ease`

### Sub-Sidebar Cài đặt
```
┌─────────────────────┐
│  ⚙️  Cài đặt        │
├─────────────────────┤
│ 📋 Tổng quan        │  ← active: border-left 3px #6C63FF
│ 💎 Bảng giá         │
│ 🎧 Hỗ trợ           │
│ 📖 Hướng dẫn        │
│ 📜 Chính sách       │
│ 🌐 Ngôn ngữ         │
│ 💬 Phản hồi         │
└─────────────────────┘
```

---

## 📄 Chi tiết từng trang

---

### 1. Tổng quan & Facebook (`/settings/general`)

Chia làm **2 section** trên cùng một trang:

#### Section A — Thông tin tổng quan (Hồ sơ tài khoản)
| Trường | Loại | Ghi chú |
|---|---|---|
| Avatar | Upload ảnh | Preview tròn, crop tự động |
| Tên hiển thị | Text input | |
| Email | Text (readonly) | Lấy từ OAuth |
| Mật khẩu | Password + Confirm | Có icon hiện/ẩn |
| Múi giờ | Select dropdown | Mặc định: `Asia/Ho_Chi_Minh` |
| Nút lưu | Button Primary | Loading spinner khi submit |

#### Section B — Kết nối Facebook
| Thành phần | Mô tả |
|---|---|
| Trạng thái kết nối | Badge xanh "Đã kết nối" / đỏ "Chưa kết nối" |
| Thông tin tài khoản FB | Avatar FB, tên, email, thời gian kết nối |
| Danh sách Fanpage | Card mỗi page: tên, ảnh, toggle bật/tắt |
| Nút Kết nối lại | Khi token hết hạn, mở lại flow OAuth |
| Nút Ngắt kết nối | Xóa token, yêu cầu confirm dialog |

**API liên quan:**
```
GET  /api/user/profile         → Thông tin người dùng
PUT  /api/user/profile         → Cập nhật profile
PUT  /api/user/password        → Đổi mật khẩu
GET  /api/fanpages             → Danh sách fanpage (đã có)
POST /api/auth/facebook        → OAuth lại
DELETE /api/auth/facebook      → Ngắt kết nối Facebook
```

---

### 2. Bảng giá (`/settings/pricing`)

#### Layout: So sánh gói dịch vụ (Pricing Comparison)

Giao diện **3 cột so sánh** (FREE / PRO / BUSINESS) với hiệu ứng nổi bật gói **PRO** (recommended) bằng gradient border và badge "Phổ biến nhất".

```
┌──────────┐  ┌──────────────────┐  ┌──────────┐
│  FREE    │  │   ⭐ PRO          │  │ BUSINESS │
│          │  │  [Phổ biến nhất] │  │          │
│  0đ/th   │  │   299.000đ/th    │  │  Liên hệ │
│          │  │                  │  │          │
│ ✅ 3 Page│  │ ✅ 20 Page       │  │ ✅ ∞ Page│
│ ❌ AI    │  │ ✅ AI (5000 lần) │  │ ✅ AI ∞  │
│ ❌ Auto  │  │ ✅ Auto Post     │  │ ✅ ...   │
│ ❌ Sched │  │ ✅ Scheduler     │  │ ✅ ...   │
│          │  │                  │  │          │
│[Dùng miễn│  │  [Nâng cấp ngay] │  │[Liên hệ] │
│  phí]    │  │                  │  │          │
└──────────┘  └──────────────────┘  └──────────┘
```

**Tính năng bảng so sánh chi tiết** phía dưới (accordion hoặc table dạng checklist) liệt kê đầy đủ:
- Số lượng fanpage
- Lượt AI/tháng
- Auto Post & Scheduler
- Live Chat Hub
- Keyword Rules
- Ưu tiên hỗ trợ
- Xuất báo cáo

**Trạng thái hiện tại**: Highlight gói người dùng đang dùng bằng border active, hiển thị ngày hết hạn.

**Thanh toán**: Nút "Nâng cấp" mở modal thanh toán (tích hợp sau — Phase 7+).

---

### 3. Hỗ trợ (`/settings/support`)

Giao diện **đa kênh hỗ trợ** với card layout đẹp, có icon lớn và hover animation.

#### Grid kênh liên hệ (2×2 hoặc 3 cột)

| Card | Icon | Nội dung | Action |
|---|---|---|---|
| 📞 Điện thoại | Phone icon | `0901 234 567` (giờ hành chính) | `tel:` link |
| 📘 Fanpage | Facebook icon | `facebook.com/zeflyo` | Mở tab mới |
| 🎬 YouTube | YouTube icon | Kênh hướng dẫn Zeflyo | Mở tab mới |
| 💬 Zalo | Zalo icon | `0901 234 567` / Zalo OA | `zalo.me/` link |

**Design card hỗ trợ:**
```
┌─────────────────────────┐
│   [Icon lớn 48px]       │
│   Zalo                  │
│   Nhắn tin trực tiếp   │
│   Phản hồi trong 15 phút│
│                         │
│     [Chat ngay →]       │
└─────────────────────────┘
```
Hover: card nổi lên, icon pulse animation, màu nền chuyển gradient.

#### Banner giờ hỗ trợ
```
🕐 Thứ 2 – Thứ 6: 8:00 – 18:00
🕐 Thứ 7: 8:00 – 12:00
🔴 Chủ nhật: Nghỉ
```

---

### 4. Hướng dẫn sử dụng (`/settings/guide`)

#### Layout: Documentation UI / Wiki style

**Sidebar phụ trái** (trong vùng content) liệt kê các chương:
```
📚 Hướng dẫn sử dụng
├── 🚀 Bắt đầu nhanh
├── 📘 Kết nối Fanpage
├── 💬 Live Chat Hub
├── 🤖 Quy tắc tự động
├── ✍️ Tạo bài bằng AI
├── 📅 Lịch đăng bài
├── 🔄 Đăng bài tự động
└── ⚙️ Cài đặt & Tài khoản
```

**Vùng nội dung phải**: Render markdown-style với:
- Heading hierarchy rõ ràng (H2/H3)
- Code blocks cho lệnh terminal
- Image screenshots với caption
- Step-by-step numbered lists
- **Tip / Warning callout boxes** (giống GitHub alerts)
- Video embed YouTube iframe cho bước phức tạp

**Search bar** trên đầu: tìm kiếm theo từ khóa trong toàn bộ hướng dẫn.

---

### 5. Chính sách & Điều khoản (`/settings/policy`)

#### Tabs nội bộ
```
[ Chính sách bảo mật ] [ Điều khoản dịch vụ ] [ Chính sách hoàn tiền ]
```

Mỗi tab chứa nội dung văn bản pháp lý:
- **Chính sách bảo mật**: Thu thập dữ liệu, lưu trữ, chia sẻ, quyền người dùng
- **Điều khoản dịch vụ**: Phạm vi sử dụng, giới hạn trách nhiệm, IP, tranh chấp
- **Chính sách hoàn tiền**: Điều kiện hoàn tiền, thời hạn, quy trình

**Design**: Background card trắng/tối, font serif nhỏ `14px`, dễ đọc, có **mục lục nhanh** (anchor links) bên phải.

**Cuối trang**: Ngày cập nhật gần nhất + Nút "Tải PDF" (optional).

---

### 6. Ngôn ngữ (`/settings/language`)

#### Layout: Grid ngôn ngữ chọn lựa

```
Chọn ngôn ngữ hiển thị

┌──────────┐  ┌──────────┐  ┌──────────┐
│  🇻🇳      │  │  🇬🇧      │  │  🇨🇳      │
│ Tiếng    │  │ English  │  │ 中文      │
│ Việt     │  │          │  │          │
│ [✓ Đang  │  │          │  │          │
│  dùng]   │  │          │  │          │
└──────────┘  └──────────┘  └──────────┘

┌──────────┐  ┌──────────┐
│  🇯🇵      │  │  🇰🇷      │
│ 日本語    │  │ 한국어    │
│          │  │          │
└──────────┘  └──────────┘
```

**Hành vi:**
- Click card → Highlight border tím + checkmark
- Áp dụng ngay lập tức (không cần reload) qua `i18n context`
- Lưu vào `localStorage` + `PUT /api/user/language`

**Supported locales**: `vi`, `en`, `zh`, `ja`, `ko`

---

### 7. Gửi phản hồi (`/settings/feedback`)

#### Form phản hồi cao cấp

```
📬 Gửi phản hồi đến đội ngũ Zeflyo

Loại phản hồi: [Lỗi] [Góp ý] [Yêu cầu tính năng] [Khác]
                ↑ Toggle buttons, chọn 1

Tiêu đề:       [________________________________]

Nội dung:      [________________________________]
               [________________________________]
               [________________________________]
               [ 0 / 1000 ký tự              ]

Đính kèm ảnh: [📎 Tải ảnh lên] (tối đa 3 ảnh, < 5MB)
               [Preview thumbnails]

Email nhận phản hồi: [user@email.com (tự điền)]

              [     Gửi phản hồi →     ]
```

**Sau khi gửi**: Animation confetti nhỏ + card "Cảm ơn! Chúng tôi sẽ phản hồi trong 24h."

**API:**
```
POST /api/feedback   { type, title, content, images[], contact_email }
```
> Lưu vào bảng `feedbacks` + gửi email nội bộ (Laravel Mail).

---

## 🗄️ Database

### Bảng `feedbacks`
```php
Schema::create('feedbacks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
    $table->enum('type', ['bug', 'suggestion', 'feature_request', 'other']);
    $table->string('title');
    $table->text('content');
    $table->json('image_urls')->nullable();
    $table->string('contact_email')->nullable();
    $table->enum('status', ['new', 'seen', 'resolved'])->default('new');
    $table->timestamps();
});
```

### Cột bổ sung bảng `users`
```php
$table->string('display_name')->nullable()->after('name');
$table->string('avatar_url')->nullable()->after('display_name');
$table->string('timezone')->default('Asia/Ho_Chi_Minh')->after('avatar_url');
$table->string('language', 5)->default('vi')->after('timezone');
$table->string('subscription_plan', 20)->default('free')->after('language');
$table->timestamp('subscription_expires_at')->nullable()->after('subscription_plan');
```

---

## 🔌 API Endpoints

### Profile
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/user/profile` | Lấy thông tin người dùng |
| PUT | `/api/user/profile` | Cập nhật tên, múi giờ, avatar |
| PUT | `/api/user/password` | Đổi mật khẩu |
| PUT | `/api/user/language` | Cập nhật ngôn ngữ |

### Settings misc
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/plans` | Danh sách gói dịch vụ & giá |
| GET | `/api/user/subscription` | Gói hiện tại của user |
| POST | `/api/feedback` | Gửi phản hồi |

---

## ⚙️ Frontend Structure

```
src/app/settings/
├── layout.tsx           ← SettingsLayout (sub-sidebar + content area)
├── page.tsx             ← Redirect → /settings/general
├── general/
│   └── page.tsx         ← Tổng quan & Facebook
├── pricing/
│   └── page.tsx         ← Bảng giá
├── support/
│   └── page.tsx         ← Hỗ trợ
├── guide/
│   └── page.tsx         ← Hướng dẫn sử dụng
├── policy/
│   └── page.tsx         ← Chính sách & Điều khoản
├── language/
│   └── page.tsx         ← Ngôn ngữ
└── feedback/
    └── page.tsx         ← Gửi phản hồi

src/components/settings/
├── SettingsSidebar.tsx  ← Sub-sidebar điều hướng
├── PricingCard.tsx      ← Card gói giá
├── SupportCard.tsx      ← Card kênh hỗ trợ
├── LanguageCard.tsx     ← Card ngôn ngữ
└── FeedbackForm.tsx     ← Form phản hồi
```

---

## 🌐 i18n — Đa ngôn ngữ

Sử dụng **next-intl** hoặc **i18next** với các file locale:
```
src/locales/
├── vi.json   ← Tiếng Việt (mặc định)
├── en.json   ← English
├── zh.json   ← 中文
├── ja.json   ← 日本語
└── ko.json   ← 한국어
```

---

## 🧪 Kiểm định

| Hạng mục | Phương pháp |
|---|---|
| Migration | `php artisan migrate` — 0 lỗi |
| API Profile | `PUT /api/user/profile` — trả về 200 + updated data |
| Gửi phản hồi | `POST /api/feedback` — lưu DB + gửi mail |
| Bảng giá UI | Kiểm tra responsive 3 gói trên mobile/tablet/desktop |
| Chuyển ngôn ngữ | Click EN → toàn bộ UI chuyển sang English (không reload) |
| Điều hướng Settings | Click từng mục sub-sidebar → đúng trang |
| TypeScript build | `npx tsc --noEmit` — 0 errors |
| Next.js build | `npm run build` — 0 errors |
