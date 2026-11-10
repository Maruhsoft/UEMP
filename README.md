# University Education Management Portal (UEMP)

A Cloudflare Workers + D1 + KV MVP for student course registration, lecturer result entry, and departmental result approval.

## Live deployment

- Application: https://uemp-mvp.maruhsoft.workers.dev
- Health endpoint: https://uemp-mvp.maruhsoft.workers.dev/api/health
- Repository: https://github.com/Maruhsoft/UEMP

## Implemented workflows

1. **Student** — secure sign-in, semester course catalogue, level validation, duplicate-safe registration, course-count safety limit, credit-unit summary, published result view, print-friendly page.
2. **Lecturer** — assigned-course list, registered-student roster, CA (0–30) and exam (0–70) score entry, server-calculated totals and grades, draft save, submit for review, submitted-result lock.
3. **Department administrator / administrator** — department-scoped submission queue, score-sheet review, approve, reject with feedback, reopen, and publication to student result endpoints.
4. **Administration** — system administrator can configure grading bands with complete 0–100 coverage, no gaps/overlaps, grade-point validation and protection against deleting grades used by existing results. Department administrators can view the active scale.
5. **Shared** — PBKDF2-SHA256 password verification (100,000 iterations; maximum supported by Workers Web Crypto), HttpOnly/Secure/SameSite session cookie, KV-backed 8-hour sessions, backend role checks, same-origin checks on state-changing API requests, parameterized D1 queries, escaped dynamic table content, API error boundary, audit log writes, and five-point weighted CGPA calculation. The sign-in form now uses POST as a no-JavaScript fallback; credentials are not submitted in the URL.

## Cloudflare resources

| Resource | Name / ID |
|---|---|
| Worker | `uemp-mvp` |
| D1 | `uemp-mvp-db` · `7d396818-69bd-4cea-9f49-35bc5cd51a1a` |
| KV | `UEMP_MVP_KV` · `c14027f2e7ad45c6aab0454e41bb9bdc` |
| R2 | `uemp-mvp-files` |
| Queue | `uemp-mvp-jobs` |

The current MVP does not yet use the R2 bucket or Queue. They are provisioned for later document uploads and asynchronous tasks.

## Database setup

Migrations are in `migrations/` and should be applied in numeric order:

1. `0001_initial_schema.sql` — core tables, constraints, indexes and academic structure.
2. `0002_demo_seed.sql` — initial Computer Science department, programme, semester, role accounts, courses and registrations.
3. `0003_worker_compatible_demo_passwords.sql` — optional manual update of existing demo password hashes; the Worker also upgrades legacy seeded demo hashes during sign-in.
4. `0004_expanded_demo_cohort.sql` — seven additional students, four additional courses and varied course registrations.

The initial schema and original demo seed have been applied to the live D1 database. The expanded cohort migration is committed but still needs to be applied to live D1 before the additional seven student accounts and four courses appear in the portal. The Worker automatically upgrades the four original demo password hashes during sign-in. Verified original live counts: 4 users, 1 student, 1 lecturer, 4 courses, 4 course offerings and 3 course registrations. The seed uses a shared demo-only password and must never be reused in production.

### Guided demonstration

Follow [`docs/demo-guide.md`](docs/demo-guide.md) for the complete student registration → lecturer result entry → departmental approval/rejection → student publication walkthrough, sample score sheets and validation checklist.

### Demo accounts

All four demo accounts use the demo-only password:

`UEMP-Demo-2026!`

| Role | Email |
|---|---|
| System administrator | `admin@uemp.demo` |
| Department administrator | `hod@uemp.demo` |
| Lecturer | `lecturer@uemp.demo` |
| Student | `student@uemp.demo` |

These are fictitious test identities. Do not use them for real student or staff records.

## Architecture

See [docs/architecture.md](docs/architecture.md) and [docs/erd.md](docs/erd.md).

- Worker serves the responsive portal, its same-origin `src/app.js` frontend asset, and the JSON API.
- D1 stores users, academic structure, registrations, result submissions, results, grading rules and audit events.
- KV stores opaque, expiring session records.
- R2 and Queues are reserved for subsequent file and asynchronous features.

## Local development and deployment

This project is intentionally dependency-free and uses the Workers runtime APIs.

1. Install Wrangler locally if you want a local development workflow.
2. Bind D1 as `DB` and KV as `KV` in your local Worker configuration.
3. Run the SQL migrations against the local D1 database in numeric order.
4. Run the Worker locally and test the API.
5. Deploy the Worker using your authorized Cloudflare account.

The currently deployed Worker was uploaded through the Cloudflare API; no Wrangler configuration or local toolchain is required to inspect or use the live MVP.

## API outline

| Method | Endpoint | Role |
|---|---|---|
| POST | `/api/auth/login` | Public (JSON) |
| POST | `/login` | Public (HTML form fallback) |
| POST | `/api/auth/logout` | Authenticated session |
| GET | `/api/me` | Authenticated |
| GET | `/api/student/courses` | Student |
| POST | `/api/student/register` | Student |
| GET | `/api/student/registrations` | Student |
| GET | `/api/student/results` | Student |
| GET | `/api/lecturer/courses` | Lecturer |
| GET | `/api/lecturer/roster?offering=...` | Assigned lecturer |
| POST | `/api/lecturer/results/save` | Assigned lecturer |
| GET | `/api/admin/overview` | Department admin / admin |
| GET | `/api/admin/grading-scale` | Department admin / admin |
| POST | `/api/admin/grading-scale` | System administrator |
| GET | `/api/admin/submissions` | Department admin / admin |
| GET | `/api/admin/submission?id=...` | Department admin / admin |
| POST | `/api/admin/review` | Department admin / admin |

## Grading and CGPA

Default scale is configurable in `grading_scales`: A 70–100 (5), B 60–69 (4), C 50–59 (3), D 45–49 (2), E 40–44 (1), F 0–39 (0). A student's CGPA is computed from approved results only:

`CGPA = Σ(credit units × grade point) / Σ(credit units)`

## Important MVP limitations

- This is a demo MVP, not yet a production university deployment.
- Course and academic setup is seeded; full admin CRUD for departments, programmes, sessions, courses, enrolments and user provisioning is not yet part of this first slice.
- Turnstile, password reset/email delivery, MFA, robust login rate limiting, CSRF tokens, R2 document upload, queue consumers, PDF transcript generation and automated CI/CD deployment remain follow-up hardening tasks.
- The live `/api/health` endpoint has returned HTTP 200 from Cloudflare Browser Rendering. The sign-in and role-by-role workflow checks remain in the manual smoke-test queue; deployment and database verification alone do not establish that every browser workflow passes.
- Review the security checklist before onboarding real users.

## Security notes

Never commit real user data, production passwords, API tokens or private keys. Replace demo credentials, configure a strong production session policy, add rate limiting and Turnstile, and perform an independent security review before production use.
