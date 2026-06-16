# 🧱 CONTEXT.md — Zeflyo Project Architecture
> *Last updated: 2026-06-15 | Env: Docker-compose (Local Dev) & AWS ECS + S3/CloudFront (Production)*

---

## 🛠️ Core Tech Stack & Infrastructure

| Layer | Technology | Deployment Strategy (AWS) |
|---|---|---|
| **Frontend** | Next.js 14/15, Tailwind CSS, Shadcn/ui, Zustand, TanStack Query | Static HTML Export (`output: 'export'`) deployed to **AWS S3** + **CloudFront CDN** (Serverless, cheap, high-scale). |
| **Backend API** | Laravel 11 (PHP 8.3) with **Laravel Octane** (RoadRunner/Swoole) | Containerized on **AWS ECS Fargate** (Serverless Container), balanced by **Application Load Balancer (ALB)**. |
| **Database** | PostgreSQL 16 | **AWS RDS PostgreSQL** (Multi-AZ in secure database subnets, no public access). |
| **Queue & Cache** | Redis | **AWS ElastiCache Redis** (Managed service for Laravel Horizon queue and session caching). |
| **WebSockets** | Pusher (Client/Broadcaster) or Soketi | Pusher Free Tier (to avoid self-hosting overhead) or Soketi container in Private Subnet. |
| **DevOps & IaC** | Terraform, Docker-compose, GitHub Actions | 100% Infrastructure as Code (IaC) via **Terraform**. Pipeline builds Docker, runs Pest tests, runs Trivy security scan, and triggers ECS Rolling Update. |

---

## 📁 Repository Directory Structure

```
Zeflyo/
├── .agent/                      # AI Agent session persistence & instructions
│   ├── rules/                   # Project rules (CONTEXT.md, PLAN.md)
│   ├── skills/                  # Domain-specific skill guides (save_checkpoint.md)
│   └── workflows/               # Session memory (session_memory.md)
├── docs/                        # Project documentation (plan.md, implementation_plan.md)
├── backend/                     # Laravel 11 Backend API codebase
│   ├── app/                     # Laravel core logic (Jobs, Console, Http)
│   ├── config/                  # Laravel config
│   ├── routes/                  # API routes (api.php, webhooks, console.php)
│   ├── Dockerfile               # Multi-stage production build for Laravel Octane
│   └── docker-compose.yml       # Local dev environment definition
└── frontend/                    # Next.js SPA codebase
    ├── app/                     # Next.js pages & dashboard layout
    ├── components/              # Reusable UI components (Shadcn/ui)
    └── package.json             # Next.js dependencies (output: 'export' config)
```

---

## 📏 System Rules & Security Guidelines

- **Decoupled Architecture**: Frontend and Backend communicate strictly via RESTful APIs. Frontend must be buildable as static files (Static SPA).
- **Facebook Webhook Queue Principle**: Webhook receiver must respond with `200 OK` in < 3 seconds. It must push payloads into the **Redis queue** (`Laravel Job`) for asynchronous processing to prevent timeout retries from Facebook.
- **Environment Isolation**:
  - **Local Dev**: Runs via Docker-compose. Webhooks are tunneled from Facebook using **Ngrok** or Cloudflare Tunnel to the Nginx local container port.
  - **Staging**: Pushed to `staging` branch, auto-deployed to staging AWS cluster for QA testing and Security Pentesting.
  - **Production**: Pushed to `main` branch, auto-deployed to AWS Production ECS and S3 + CloudFront CDN.
- **Security & SOC Rules (Khoa)**:
  - All Facebook tokens must be encrypted in PostgreSQL using Laravel Eloquent Encrypted Casts.
  - Periodic penetration testing (Pentest) on Staging APIs to prevent SQLi, CSRF, IDOR, and session hijacking.
  - Application audit log tracking of critical actions (e.g., changes to Auto-reply rules) linked to AWS CloudWatch alarms.

---

## 🚦 Engineering Discipline & Workflows
To avoid quality degradation, you must adhere to the engineering workflows defined in:
1.  **[Anti-Rationalization Guardrails](file:///r:/_Projects/Eurus_Workspace/Zeflyo/.agent/skills/anti_rationalization.md)**: Strictly counters common AI agent shortcuts regarding lack of testing, bypassing Terraform, and weak code reviews for team members.
2.  **[Slash Commands Lifecycle](file:///r:/_Projects/Eurus_Workspace/Zeflyo/.agent/skills/addy_commands.md)**: Operates under command-driven gates (`/spec`, `/plan`, `/build`, `/test`, `/review`, `/ship`) to enforce step-by-step SDLC compliance.
