---
name: addy_commands
description: Enforce structured SDLC workflows via command triggers (/spec, /plan, /build, /test, /review, /ship) for the Antigravity agent.
---

# ⚡ Slash Commands Workflow (Addy Osmani style SDLC)

To ensure senior-level software engineering discipline, you (the Agent) will respond to and guide the user through the following slash commands during the 2-week Zeflyo development sprint:

---

## 🛠️ Command Catalog & Quality Gates

### 1. `/spec` (Specification Gate)
*   **Trigger**: When starting a new feature or phase (e.g., Facebook OAuth integration, Webhook handling, Post Scheduler).
*   **Action**: Create a specification document. Do NOT write code yet.
*   **Quality Gate**: The spec must explicitly list:
    - User Story / Acceptance Criteria.
    - Database migrations (schema adjustments).
    - API Request/Response JSON contracts (Payload specs).
    - Security requirements (e.g., token encryption, access control).

### 2. `/plan` (Planning Gate)
*   **Trigger**: Once the spec is approved.
*   **Action**: Update [PLAN.md](file:///r:/_Projects/Eurus_Workspace/Zeflyo/.agent/rules/PLAN.md) and break the feature down into small, atomic, and verifiable task lists.
*   **Quality Gate**: Each task should take less than 4 hours to build and must have a corresponding test/verification criteria.

### 3. `/build` (Implementation Gate)
*   **Trigger**: Once the plan is set.
*   **Action**: Write clean, modular, and well-commented code. 
*   **Quality Gate**: Adhere strictly to [CONTEXT.md](file:///r:/_Projects/Eurus_Workspace/Zeflyo/.agent/rules/CONTEXT.md) stack definitions (Laravel Octane, React/Next.js static export, decoupled API endpoints). Always reference active files in commits.

### 4. `/test` (Verification Gate)
*   **Trigger**: After coding is complete or during testing phases.
*   **Action**: Run automated test suites (`php artisan test`) and manually verify the feature locally (via Ngrok for Webhooks).
*   **Quality Gate**: 100% pass rate. Unit & Feature tests must cover edge cases, token encryption, and exception Handling.

### 5. `/review` (Review & Quality Gate)
*   **Trigger**: Before creating a Pull Request to `staging` or `main`.
*   **Action**: Perform a self-review of the code diff.
*   **Quality Gate**: Run static analysis (Larastan/PHPStan), code formatting (`php artisan pint`), and check for hardcoded secrets, database query loops (N+1 problems), and unhandled errors.

### 6. `/ship` (Release Gate)
*   **Trigger**: When deploying from local to `staging` or from `staging` to `production`.
*   **Action**: Create the Pull Request, run GitHub Actions CI/CD (Trivy Scan, ECR build, ECS deploy).
*   **Quality Gate**: Clean CI pipeline. Staging environment tested for performance, security (Pentested by Khoa), and logs validated in CloudWatch.

---

## 📋 Standard Reply Format
When a user inputs any of these commands, you must start your response by declaring the current SDLC gate, verifying its acceptance criteria, and detailing the outcomes before proceeding.
