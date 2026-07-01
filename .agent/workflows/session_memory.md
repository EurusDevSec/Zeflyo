# 💾 SESSION MEMORY — Zeflyo Project
> Last Checkpoint: 2026-06-26 | Status: **FULL UI/UX PREMIUM OVERHAUL + SIDEBAR UNIFICATION — 100% COMPLETE & VERIFIED**

---

## ⚡ Active Task Completed (Những việc ĐÃ HOÀN THÀNH trong session)

### 🎨 UI/UX Premium Overhaul — Toàn bộ Frontend

*   **Global Design System ([`globals.css`](file:///r:/_Projects/Eurus_Workspace/Zeflyo/frontend/src/app/globals.css)):**
    *   Xóa bỏ class hijacking nguy hiểm (`.text-white`, `.text-zinc-100` bị override bằng `!important` làm hỏng button màu).
    *   Đổi `--font-heading` sang `'Plus Jakarta Sans'` để hiển thị tiếng Việt có dấu đúng chuẩn (trước đó fallback ra Times New Roman xấu).
    *   Thêm CSS override riêng cho light mode sidebar: background trắng, border nhạt, text slate — premium như Linear/Vercel.
    *   Thêm logo text gradient indigo-purple đẹp trong light mode.

*   **Theme Flash Fix ([`layout.tsx`](file:///r:/_Projects/Eurus_Workspace/Zeflyo/frontend/src/app/layout.tsx)):**
    *   Thêm **blocking inline `<script>` trong `<head>`** đọc `localStorage.zeflyo_theme` và gán class `.light` đồng bộ ngay khi parse HTML, **loại bỏ hoàn toàn hiện tượng nháy đen** khi reload trang ở light mode.

*   **Sidebar Major Refactor ([`Sidebar.tsx`](file:///r:/_Projects/Eurus_Workspace/Zeflyo/frontend/src/components/Sidebar.tsx)):**
    *   Thay **toàn bộ `<a>` tag và `window.location.href`** bằng Next.js `<Link>` và `router.push()` — loại bỏ hoàn toàn hiện tượng nháy màu đen khi chuyển trang.
    *   Tất cả submenu (Cài đặt, Đăng bài) **có thể collapse/expand độc lập** — trước đó bị cố định, không toggle được.
    *   Sidebar **sticky scroll đúng chuẩn**: root container `h-screen overflow-hidden`, chỉ nội dung bên trong mới `overflow-y-auto`.
    *   Theme light mode sidebar **đồng bộ toàn bộ** — trước đó sidebar vẫn đen dù đã chuyển sang light theme.
    *   Auto-expand submenu khi navigate đến `/scheduler` hoặc `/autopost`.

*   **Language Sync Fix ([`autopost/page.tsx`](file:///r:/_Projects/Eurus_Workspace/Zeflyo/frontend/src/app/autopost/page.tsx)):**
    *   Sửa lỗi key `"lang"` → **`"zeflyo_lang"`** trong localStorage. Lý do: tất cả pages dùng `zeflyo_lang` nhưng autopost dùng key khác nên ngôn ngữ bị reset mỗi lần chuyển trang.

*   **Tab URL Sync ([`scheduler/page.tsx`](file:///r:/_Projects/Eurus_Workspace/Zeflyo/frontend/src/app/scheduler/page.tsx) & [`autopost/page.tsx`](file:///r:/_Projects/Eurus_Workspace/Zeflyo/frontend/src/app/autopost/page.tsx)):**
    *   Thêm `useEffect` đọc `?tab=...` query param khi mount để đồng bộ active tab với URL — cho phép sidebar navigate trực tiếp đến đúng sub-tab.

*   **Settings Theme Sync ([`settings/layout.tsx`](file:///r:/_Projects/Eurus_Workspace/Zeflyo/frontend/src/app/settings/layout.tsx)):**
    *   Truyền `theme` và `toggleTheme` props xuống `<Sidebar>` từ layout settings — trước đó sidebar trong settings page không nhận được theme state nên luôn tối.

### 🗂️ Unified "Đăng & Tự Động Hóa" Menu — Sidebar Restructuring

*   **Vấn đề**: Hai mục sidebar "Lên lịch đăng bài" (`/scheduler`) và "Đăng bài tự động AI" (`/autopost`) gây nhầm lẫn vì chức năng na ná nhau, thậm chí cùng tên sub-tab "Quản lý lịch đăng".
*   **Giải pháp**: Gộp thành **1 menu duy nhất "Đăng & Tự Động Hóa"** với 4 section rõ ràng bên trong:
    *   📅 **Lên lịch** → `/scheduler?tab=setup` / `/scheduler?tab=list`
    *   🤖 **Tạo bài AI** → `/autopost?tab=setup` / `/autopost?tab=list`
    *   📦 **Sản phẩm** → `/autopost?tab=automation` / `/autopost?tab=product_list`
    *   ⚡ **Tự động hóa** → `/scheduler?tab=automation`
*   **State**: Thay 2 state `isSchedulerOpen`/`isAutopostOpen` bằng 1 state `isPublishOpen`.
*   **Type fix**: Mở rộng `activeTab` prop type để include `topic_setup`, `manage`, `product_setup` — fix 3 TypeScript errors.
*   **Verified**: `npx tsc --noEmit` → **0 errors** ✅

---

## 🧠 Semantic Context Essence (Tinh túy kiến thức & Quyết định thiết kế)

*   **KHÔNG dùng `window.location.href`** trong Sidebar: Dùng Next.js `router.push()` và `<Link>`. Việc dùng anchor tag gốc gây full page reload → hiện tượng nháy đen → UX xấu.
*   **Theme injection phải blocking**: Script gán theme class **phải nằm trong `<head>` và không có `async/defer`** để chạy trước khi browser render bất kỳ DOM nào. Nếu dùng `useEffect` (client-side) sẽ luôn bị nháy đen vì render trắng/tối trước rồi mới đổi.
*   **localStorage keys chuẩn của dự án**:
    *   `zeflyo_theme` → `"dark"` | `"light"` (default: `"light"`)
    *   `zeflyo_lang` → `"vi"` | `"en"` (default: `"vi"`)
    *   `zeflyo_user` → JSON object UserProfile
    *   `zeflyo_token` → JWT token (nếu bắt đầu bằng `"mock_token"` → mock mode)
    *   `zeflyo_read_notifications` → mảng ID thông báo đã đọc
*   **Admin identity**: Email cứng `admin@zeflyo.io` được check ở cả frontend (`isAdmin`) và backend middleware.
*   **Sidebar activeTab prop**: Sidebar nhận `activeTab` từ page để highlight đúng sub-tab. Khi navigate từ trang khác (không có `setActiveTab`), Sidebar dùng `router.push("/scheduler?tab=xxx")` để vừa chuyển trang vừa set tab qua URL.
*   **Mock Mode**: Token bắt đầu bằng `mock_token_` → frontend chạy hoàn toàn với dữ liệu giả không cần backend. Credits tự cộng +100/ngày cho plan free.
*   **Mô hình quản lý mới (PM transition)**: Tiến thử sức làm Feature PM & Coordinator (theo dõi tiến độ, backlog, reminder). Hoàng lùi về làm DevOps Lead & Technical Gatekeeper tối cao (quản lý hạ tầng AWS, CI/CD, có quyền phủ quyết/điều chỉnh kế hoạch nếu không hợp lý, duyệt PR staging/main cùng Khoa).

---

## 🔜 Next Steps (3 hành động kỹ thuật trực tiếp kế tiếp)

- [ ] **Step 1:** Đồng bộ hóa credits thực tế nhận được từ webhook SePay với hệ thống trừ điểm khi chạy AI Campaigns (backend: `POST /api/webhooks/sepay` → cộng credits vào `users.credits`).
- [ ] **Step 2:** Tích hợp DB encryption cho các Facebook token fanpage (`pages.access_token`) bằng Laravel Eloquent Encrypted Casts — yêu cầu security của Khoa chưa làm.
- [ ] **Step 3:** DevOps (Hoàng): Hoàn thiện Terraform scripts + GitHub Actions CI/CD cho Phase 5 (Pest test → Larastan → Trivy scan → ECR upload → ECS rolling deploy → S3+CloudFront Next.js deploy).
