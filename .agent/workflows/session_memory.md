# 💾 SESSION MEMORY — Zeflyo Project
> *Last Checkpoint: 2026-06-15 | Status: 2-Week Plan Optimized & Infrastructure Boundaries Established*

---

## ⚡ Active Tasks Completed in this Session
- **[Project Plan & Roadmap]:**
    - Overwrote [plan.md](file:///r:/_Projects/Eurus_Workspace/Zeflyo/docs/plan.md) with a high-speed **2-week roadmap (14 days)** from scratch.
    - Tailored the roadmap to a team of 3 interns, maximizing learning and CV value.
- **[Roles & Risk Management]:**
    - Defined a structured workflow to ensure high collaboration and prevent regression. Modular tasks (Post Scheduler and configuration forms) are assigned to the Fullstack Developer (Tiến), while the core real-time webhook/broadcasting pipeline is owned by you (Hoàng) and the Security Lead (Khoa).
    - Assigned Pentesting and SOC logging responsibilities to Khoa.
- **[Containerization Strategy]:**
    - Established that Docker containers are run at local for all services (Laravel app, queue worker, Nginx, PostgreSQL, Redis, Soketi) to simplify local onboarding.
    - Set up a production cloud strategy: containerize only `zeflyo-api` and `zeflyo-worker` on AWS ECS Fargate, while using AWS Managed Services (RDS, ElastiCache, S3, CloudFront) for other services to optimize cost and maintainability.
- **[Agent Persistence Setup]:**
    - Updated agent rules: [CONTEXT.md](file:///r:/_Projects/Eurus_Workspace/Zeflyo/.agent/rules/CONTEXT.md) and [PLAN.md](file:///r:/_Projects/Eurus_Workspace/Zeflyo/.agent/rules/PLAN.md) to clean out the old EurusDevSec blog configuration and align with the Zeflyo project.

---

## 🧠 Semantic Context Essence (Crucial Architecture Decisions)
*   **Next.js local vs production:** Leave Next.js as raw code local (developers run `npm run dev` directly on host to bypass WSL2 Docker file-watching latency). Deploy to AWS S3 + CloudFront CDN as a Static HTML Export to eliminate node server runtime costs.
*   **Facebook Webhook constraints:** Responses must return `200 OK` in < 3s, which is why Laravel queues (via Redis/Horizon) are mandatory to handle parsing asynchronously.
*   **Modular code boundary:** Pre-define DB schema and endpoint interfaces for the Post Scheduler. The Fullstack Developer (Tiến) implements this console command and UI form, completely isolating feature edits from the real-time websocket and webhook receiver controllers.

---

## 🔜 Next Steps (Top 3 Direct Technical Actions)
- [ ] **Step 1:** Create the base backend `backend/` folder and setup `docker-compose.yml` defining the services (Laravel Octane, Queue Worker, PostgreSQL, Redis, Nginx).
- [ ] **Step 2:** Create the base frontend `frontend/` Next.js template with Tailwind CSS and Shadcn/ui.
- [ ] **Step 3:** Implement Facebook Login OAuth 2.0 flow via Laravel Socialite and design the Fanpage selector interface.
