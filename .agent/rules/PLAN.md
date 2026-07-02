# 🎯 PLAN.md — Zeflyo 2-Week Tốc Chiến Roadmap
> *Last updated: 2026-06-26 | Duration: 14 Days (Local Dev -> Staging -> Production)*

---

## 👥 Team Roles & Risks Management

- **Tiến (Feature PM & Fullstack Developer)**: Quản lý kế hoạch tiến độ các feature, theo dõi backlog, nhắc nhở (reminder) tiến độ thành viên, phát triển standalone features.
- **Hoàng (DevOps Lead & Technical Gatekeeper / Owner)**: Giám sát tối cao hệ thống, quản lý hạ tầng Cloud/DevOps (Terraform, CI/CD, Docker-compose), kiểm soát chất lượng kỹ thuật cuối cùng (chặn Git-gatekeeping, phê duyệt PR staging/main, điều chỉnh kế hoạch nếu không hợp lý).
- **Khoa (Security Lead & Pentest/SOC)**: Phát triển Core Live Chat Hub backend & Next.js frontend UI, Google Gemini API integrations, secure coding, OWASP API pentesting, và CloudWatch security audit logging.
  - *Integration Strategy*: Feature code is isolated in separate folders/routes, kept independent from the core webhook and broadcasting pipelines. All PRs require double approval từ Hoàng (DevOps/Arch) và Khoa (Security).

---

## 📅 IMPLEMENTATION STATUS & ROADMAP

### Phase 1: Setup & Core Auth (Day 1 - 3) - [Specs](file:///r:/_Projects/Eurus_Workspace/Zeflyo/docs/phases/phase1_setup_auth.md)
- [x] Write project plan [plan.md](file:///r:/_Projects/Eurus_Workspace/Zeflyo/docs/plan.md) and [implementation_plan.md](file:///C:/Users/ACER/.gemini/antigravity-ide/brain/0db0bc85-e913-4c3e-af7a-005ff44c8899/implementation_plan.md).
- [x] Write detailed phase documents in [docs/phases/](file:///r:/_Projects/Eurus_Workspace/Zeflyo/docs/phases/).
- [x] DevOps (Hoàng): Setup local `docker-compose.yml` (Laravel, Nginx, PostgreSQL, Redis, Soketi) & local setup instructions.
- [ ] DevOps (Hoàng): Set up VPC and initial RDS/ECS placeholders using Terraform.
- [x] Backend (Khoa): Initialize Laravel 11. Implement Facebook Socialite Login OAuth & Fanpage Connection.
- [x] Frontend (Tiến): Initialize Next.js. Design basic layout, login UI, and Page Connection UI.

### Phase 2: Webhooks & Queue Processing (Day 4 - 6) - [Specs](file:///r:/_Projects/Eurus_Workspace/Zeflyo/docs/phases/phase2_webhooks_queue.md)
- [x] DevOps (Hoàng): Setup Ngrok/Tunnel for local Webhook callback testing.
- [x] Backend (Khoa): Webhook verification endpoint and API payload ingestion.
- [x] Backend (Khoa): Setup Laravel Horizon & Redis queues to parse incoming Facebook comments/messages asynchronously.
- [x] Frontend (Tiến): Build Switch toggle UI and API endpoints to activate automation for pages.

### Phase 3: Live Chat UI & Real-Time Sync (Day 7 - 9) - [Specs](file:///r:/_Projects/Eurus_Workspace/Zeflyo/docs/phases/phase3_realtime_chat.md)
- [x] DevOps (Hoàng): Setup WebSocket server (Soketi/Pusher).
- [x] Backend (Khoa): Implement Laravel Broadcasting events to trigger real-time messages. API load chat history.
- [x] Frontend (Tiến): Live Chat Hub UI (Next.js) displaying dynamic inbox and active conversation bubbles. Laravel Echo WebSockets integration.

### Phase 4: Automation & AI Engine (Day 10 - 11) - [Specs](file:///r:/_Projects/Eurus_Workspace/Zeflyo/docs/phases/phase4_automation_ai.md)
- [x] Backend (Khoa): Build keyword-based auto-reply rules engine.
- [x] Backend (Khoa): Integrate Google Gemini API for intelligent automated responses.
- [x] Fullstack (Tiến): Build Post Scheduler feature (Form UI + DB schema `scheduled_posts` + `php artisan posts:publish` task run every minute via Laravel scheduler).
- [x] Fullstack (Tiến): Build Keyword Auto-Reply Rule management UI/API.
- [ ] Security (Khoa): Security review, DB field encryption for tokens, and API pentesting on local.

### Phase 4.5: AI Post Content Generator (Day 11.5) - [Specs](file:///r:/_Projects/Eurus_Workspace/Zeflyo/docs/phases/phase4_5_ai_post_generation.md)
- [x] Backend (Khoa): Build API route /api/posts/generate-ai calling GeminiService.
- [x] Frontend (Tiến): Build AI Writer Panel and Facebook Live Mockup Preview on `/scheduler` page.
- [x] Testing: Write feature test suite verification for AI content generation API.

### Phase 5: CI/CD AWS Deploy & Monitoring (Day 12 - 14) - [Specs](file:///r:/_Projects/Eurus_Workspace/Zeflyo/docs/phases/phase5_cicd_aws.md)
- [ ] DevOps (Hoàng): Complete Terraform scripts. Set up GitHub Actions CI/CD (Pest test, Larastan, Trivy scan, ECR upload, ECS rolling update deploy).
- [ ] DevOps (Hoàng): Deploy Next.js to S3 + CloudFront CDN.
- [ ] DevOps/Security (Hoàng + Khoa): Setup CloudWatch log groups, alerting metric filters, and Dashboard.
- [ ] Team (Hoàng + Khoa + Tiến): Final QA, demo run, bug fixes, freeze code, and release project.

### Phase 6: UI/UX Premium Overhaul & Sidebar Optimization (2026-06-26) - [Walkthrough](file:///C:/Users/ACER/.gemini/antigravity-ide/brain/0db0bc85-e913-4c3e-af7a-005ff44c8899/walkthrough.md)
- [x] **Global CSS**: Xóa utility class hijacking, fix font tiếng Việt (`Plus Jakarta Sans`), design system light/dark mode premium.
- [x] **Layout root**: Thêm blocking inline script trong `<head>` để inject theme class đồng bộ — fix hoàn toàn hiện tượng nháy đen khi reload.
- [x] **Sidebar**: Refactor toàn bộ — replace `<a>` bằng Next.js `<Link>`/`router.push()`, collapsible submenus độc lập, sticky scroll đúng, light theme đồng bộ, auto-expand theo route.
- [x] **Language sync**: Fix localStorage key mismatch `"lang"` → `"zeflyo_lang"` trong `autopost/page.tsx`.
- [x] **Tab URL sync**: Thêm `useEffect` đọc `?tab=` query param khi mount cho scheduler & autopost.
- [x] **Settings layout**: Truyền `theme`/`toggleTheme` props từ settings layout xuống Sidebar để đồng bộ theme.
- [x] **Page UI overhaul**: Nâng cấp toàn bộ UI/UX cho `/scheduler`, `/autopost`, `/rules`, `/chat`, `/` (login).
- [x] **Unified "Đăng & Tự Động Hóa" sidebar menu**: Gộp 2 mục "Lên lịch đăng bài" + "Đăng bài tự động AI" thành 1 hub với 4 section rõ ràng (Lên lịch / Tạo bài AI / Sản phẩm / Tự động hóa).
- [x] **TypeScript**: `npx tsc --noEmit` → 0 errors. `npm run build` → all routes compiled successfully.

### Phase 7: Tối ưu hóa Trải nghiệm AI & Tích hợp Công thức Marketing (AIDA/PAS/BAB) + Streaming Token-Saving - [Specs](file:///r:/_Projects/Eurus_Workspace/Zeflyo/docs/phases/phase7_ai_optimization.md)
- [x] **Backend**: Nâng cấp `GeminiService` và triển khai API route `/api/posts/generate-ai-stream` hỗ trợ SSE streaming.
- [x] **Backend**: Thêm cơ chế ngắt kết nối stream bằng `connection_aborted()` khi client hủy yêu cầu để tiết kiệm token.
- [x] **Backend**: Xây dựng system prompts chuẩn hóa cho 3 công thức: AIDA, PAS, BAB theo hướng Value-First.
- [ ] **Frontend**: Tái thiết kế UI tab "Tạo bài AI": thẻ chọn công thức trực quan, Prompt Chips, ẩn nâng cao.
- [ ] **Frontend**: Kết nối SSE hiển thị chữ chạy (typing effect) thời gian thực và tích hợp `AbortController` cho nút "Hủy".
- [x] **Testing**: Kiểm định luồng stream kết nối, hủy kết nối, kiểm tra độ bám sát công thức marketing của bài viết.