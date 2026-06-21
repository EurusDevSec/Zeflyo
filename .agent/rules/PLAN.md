# 🎯 PLAN.md — Zeflyo 2-Week Tốc Chiến Roadmap
> *Last updated: 2026-06-15 | Duration: 14 Days (Local Dev -> Staging -> Production)*

---

## 👥 Team Roles & Risks Management

- **Hoàng (PM & DevOps/Cloud)**: 100% DevOps pipeline, Docker-compose local, Ngrok tunnels, Terraform AWS setup, GitHub Actions CI/CD (lint, test, Trivy scan, deploy), and Git-gatekeeping.
- **Khoa (Fullstack & Security Lead/Pentest/SOC)**: Core Live Chat Hub backend & Next.js frontend UI, Google Gemini API integrations, secure coding, OWASP API pentesting, and CloudWatch security audit logging.
- **Tiến (Fullstack Developer)**: Standalone features: **Post Scheduler** (CRUD + console schedule publisher) and **Auto-reply configuration settings panel**.
  - *Integration Strategy*: Feature code is isolated in separate folders/routes, kept independent from the core webhook and broadcasting pipelines. All PRs require double approval from PM (Hoàng) and Security Lead (Khoa).

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