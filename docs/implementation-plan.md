# PolicyCore Feature-Wise Implementation Plan

This plan aligns the **Socotra blueprint** (socotra_blueprint_20260310_140115.pdf) with PolicyCore’s v1 scope. We build **feature by feature**, starting with **Auth**, using **full Supabase** (Auth, Postgres, RLS, Storage) and a clear **page inventory** with UI/UX.

---

## 1. Feature Order (Build Sequence)

| Phase | # | Feature | Blueprint ref | Supabase usage | Priority |
|-------|---|---------|----------------|----------------|----------|
| **A** | 1 | **Authentication & RBAC** | #16 Role-Based Access Control | Auth (magic link), `profiles`, `org_memberships`, `role_assignments`, RLS | Start here |
| A | 2 | **Multi-tenant + Org context** | #13 Multi-tenant | `orgs`, RLS `user_has_org_access`, org switcher / scope in UI | Must |
| B | 3 | **Application intake** | #3 Quote + #11 Underwriting | `applications`, `policyholders`, `insured_properties`, `application_documents` | Must |
| B | 4 | **Dynamic rating + Quote** | #2 Rating, #3 Quote | `quotes`, `quote_versions`, deterministic rating in domain | Must |
| B | 5 | **AI risk / Underwriting workbench** | #11 Underwriting | `risk_assessments`, `underwriting_reviews`, OpenAI + heuristic | Must |
| B | 6 | **Policy lifecycle (bind, issue)** | #4 Policy lifecycle | `policies`, `policy_terms`, bind flow + first invoice | Must |
| C | 7 | **Endorsements, renewals, cancellations** | #4 Policy lifecycle, #17 Renewal | `endorsements`, `renewal_offers`, `cancellations` | Must |
| C | 8 | **Billing & payments** | #5 Billing | `invoices`, `payments`, mock PSP | Must |
| C | 9 | **Claims workflow + AI triage** | #6 Claims | `claims`, `claim_events`, `claim_reserves`, FNOL + triage | Must |
| D | 10 | **Document management** | #10 Document management | Supabase Storage, `application_documents`, signed URLs | Must |
| D | 11 | **Agent portal** | #8 Agent portal | Agent-scoped APIs + agent pages (quotes, bind) | Must |
| D | 12 | **Customer portal** | #9 Customer self-service | Customer-scoped APIs + customer pages (policies, pay, claims) | Must |
| D | 13 | **Audit trail & reporting** | #15 Audit & reporting | `audit_logs`, dashboard/reports APIs + Reports UI | Must |
| E | 14 | **Settings & profile** | — | `profiles`, org/role display, theme | Nice |

**Out of v1 scope (backlog):** Reinsurance (#12), multi-currency (#19), batch engine (#20), workflow builder (#22), commission depth (#18), regulatory intelligence, IoT/blockchain.

---

## 2. Supabase Usage by Feature

| Feature | Supabase Auth | Postgres tables | RLS | Storage |
|---------|----------------|-----------------|-----|---------|
| **1. Auth & RBAC** | Magic link, session refresh in middleware | `profiles`, `org_memberships`, `role_assignments` | All 3 tables by org/user | — |
| **2. Multi-tenant** | User → org via memberships | `orgs` | `user_has_org_access(org_id)` on all domain tables | — |
| **3. Applications** | Actor from session | `applications`, `policyholders`, `insured_properties`, `application_documents` | org_id on all | — |
| **4. Rating + Quote** | — | `quotes`, `quote_versions` | org_id | — |
| **5. Underwriting** | — | `risk_assessments`, `underwriting_reviews` | org_id | — |
| **6. Policy bind** | — | `policies`, `policy_terms`, `invoices` | org_id | — |
| **7. Endorsements / renewals / cancels** | — | `endorsements`, `renewal_offers`, `cancellations` | org_id | — |
| **8. Billing** | — | `invoices`, `payments` | org_id | — |
| **9. Claims** | — | `claims`, `claim_events`, `claim_reserves` | org_id | — |
| **10. Documents** | Signed URLs server-side | `application_documents` (metadata) | org_id | Bucket + signed upload/read URLs |
| **11–12. Portals** | Persona from `role_assignments` | Same tables, persona-scoped APIs | Same RLS | Same Storage |
| **13. Audit & reports** | Actor in audit | `audit_logs` + aggregates | org_id | — |

---

## 3. Page Inventory (Routes & UI/UX)

### 3.1 Public / Auth (no sidebar)

| Route | Page | Purpose | UI/UX notes |
|-------|------|---------|-------------|
| `/` | Landing | Marketing / product intro, CTA to Sign in | Clear value prop, single CTA |
| `/login` | Login | Magic-link sign-in | Email input, “Send magic link”, success/error states |
| `/auth/callback` | Auth callback | Exchange code for session, redirect to `/app` | Loading state, error + “Request new link” |

### 3.2 Protected app panel (`/app/*`) — shared layout: sidebar + topbar

**Layout:** `AppShell`: sidebar (nav + user chip + theme), topbar (title + primary action), main content.

| Route | Page | Purpose | UI/UX notes |
|-------|------|---------|-------------|
| `/app` | Dashboard | Org snapshot: counts, written/paid premium, workflow links | Stat tiles, two-column layout, links to Applications / Quotes / Claims / Billing |

### 3.3 Applications (Feature 3)

| Route | Page | Purpose | UI/UX notes |
|-------|------|---------|-------------|
| `/app/applications` | Application list | List applications for org (table/cards) | Filters: status, date; search; “New application” → `/app/applications/new` |
| `/app/applications/new` | New application | Multi-step or single form: policyholder + property + coverage (per ApplicationDraft) | Sections: Applicant, Property, Coverage; validate with Zod; submit → application created |
| `/app/applications/[id]` | Application detail | View application payload, status, linked quote/risk | Read-only summary; actions: “Get quote”, “Run risk assessment” |

### 3.4 Quotes (Feature 4) + Underwriting (Feature 5)

| Route | Page | Purpose | UI/UX notes |
|-------|------|---------|-------------|
| `/app/quotes` | Quote list | List quotes for org (from API) | Status (quoted/bound/expired), premium, link to application & policy |
| `/app/quotes/[id]` | Quote detail | Quote summary, rating breakdown, risk assessment card | Show risk tier, flags, recommended action; “Bind policy” CTA |
| `/app/quotes/[id]/bind` | Bind quote | Form: effective_date, expiration_date; submit bind | Confirmation step; success → policy + first invoice |

### 3.5 Policies (Feature 6 + 7)

| Route | Page | Purpose | UI/UX notes |
|-------|------|---------|-------------|
| `/app/policies` | Policy list | List policies for org | Status, dates, policy number, link to detail |
| `/app/policies/[id]` | Policy detail | Policy summary, term, endorsements, renewals, cancellations | Tabs or sections: Overview, Endorsements, Renewals, Cancellations, Invoices |
| `/app/policies/[id]/endorsements/new` | New endorsement | Form: reason, effective_date, changes (key/value or JSON) | Simple form; success → endorsement created |
| `/app/policies/[id]/renewals/new` | Generate renewal | Form: target_effective_date | Single field + submit |
| `/app/policies/[id]/cancellations/new` | Request cancellation | Form: reason, requested_cancel_date | Confirmation before submit |

### 3.6 Billing (Feature 8)

| Route | Page | Purpose | UI/UX notes |
|-------|------|---------|-------------|
| `/app/billing` | Billing overview | List invoices (open/paid), optional payment summary | Filters; link to policy; “Record payment” |
| `/app/billing/invoices/[id]` | Invoice detail | Invoice summary, due date, amount; record payment | “Record payment” → modal or inline form (amount, method, ref) |

### 3.7 Claims (Feature 9)

| Route | Page | Purpose | UI/UX notes |
|-------|------|---------|-------------|
| `/app/claims` | Claim list | List claims for org (FNOL list) | Status, claim #, policy, incident date; “New claim” |
| `/app/claims/new` | FNOL | Form: policy_id, incident_date, description, estimated_loss, document_refs | Submit → claim created |
| `/app/claims/[id]` | Claim detail | Claim info, AI triage result (severity, fraud signal, next_steps) | “Run triage” if not yet triaged; show triage summary |

### 3.8 Documents (Feature 10)

| Route | Page | Purpose | UI/UX notes |
|-------|------|---------|-------------|
| (Embedded) | Upload component | Used on application/claim flows | Signed upload URL from API; file input; store path in `application_documents` or claim metadata |

### 3.9 Agent portal (Feature 11)

| Route | Page | Purpose | UI/UX notes |
|-------|------|---------|-------------|
| `/app/agent/quotes` | Agent quote list | Agent-scoped quotes (API: `/api/v1/agent/quotes`) | Same list UX, filtered by agent context |
| (Reuse) | Bind flow | Agent binds quote | Reuse `/app/quotes/[id]/bind` with agent persona |

### 3.10 Customer portal (Feature 12)

| Route | Page | Purpose | UI/UX notes |
|-------|------|---------|-------------|
| `/app/customer` | Customer home | My policies, open invoices, claims | Simple dashboard: cards for policies, pay now, file claim |
| `/app/customer/policies` | My policies | List policies (API: `/api/v1/customer/policies`) | Policy number, status, dates |
| `/app/customer/invoices` | My invoices | List invoices, pay (mock) | Amount due, due date, “Pay” → record payment |
| `/app/customer/claims` | My claims | List claims, file new | List + “File a claim” → FNOL form |

### 3.11 Reports & audit (Feature 13)

| Route | Page | Purpose | UI/UX notes |
|-------|------|---------|-------------|
| `/app/reports` | Reports hub | Links to dashboard, audit, exports | Dashboard summary embed + “Audit log” link |
| `/app/reports/dashboard` | Dashboard report | Same data as `/app` (can reuse component) | Counts, written/paid premium |
| `/app/reports/audit` | Audit log | List audit_logs for org (entity_type, action, actor, date) | Table with filters, pagination |

### 3.12 Settings (Feature 14)

| Route | Page | Purpose | UI/UX notes |
|-------|------|---------|-------------|
| `/app/settings` | Settings | Profile (name, email), org/role display, theme | Read profile from Supabase; show org + role; theme toggle (existing) |

---

## 4. Auth & RBAC Deep Dive (Feature 1 — Start Here)

### 4.1 Current state

- **Auth:** Email + password (no magic link). **Login** at `/login`, **Register** at `/register`. Root `/` redirects to `/login` or `/app` by session. Callback at `/auth/callback` for email confirmation links; session refresh in middleware.
- **Protected layout:** `(app)/layout.tsx` uses `createSupabaseServerClient()` and redirects to `/login` if no user.
- **Gaps:** No `profiles` upsert on first sign-in; no `org_memberships` or `role_assignments` in UI; no persona/org resolution for API or nav.

### 4.2 Auth feature tasks (feature-wise)

1. **Profile on first sign-in**  
   - On `/auth/callback` (or via Supabase Auth hook / server action): if `profiles.id` missing for `auth.users.id`, insert row in `profiles` (id = user id, optional full_name, status = active).

2. **Org membership for demo**  
   - Ensure seed or migration adds demo user(s) to `org_memberships` and `role_assignments` for the seeded org (e.g. Lone Star MGA).  
   - Optional: “Invite user” flow (ops_admin only) that inserts into `org_memberships` + `role_assignments`.

3. **Resolve org + persona in app**  
   - Server: helper that loads user’s org(s) and role(s) from `org_memberships` + `role_assignments` (e.g. first org, or org from query/session).  
   - Pass **org_id** and **persona** (ops_admin | agent | customer) into layout or context so all app pages and API calls are org-scoped and persona-aware.

4. **API authorization**  
   - In API routes: resolve user from Supabase auth; check `user_has_org_access(org_id)` (via anon client + RLS or server-side lookup).  
   - For agent/customer endpoints, enforce persona (e.g. only agent can call agent-scoped APIs).

5. **UI: org switcher + role label**  
   - In AppShell: show current org name (and optional org switcher if multiple memberships).  
   - Show role (e.g. “ops_admin” / “agent” / “customer”) next to user email.  
   - Optionally hide or show nav items by persona (e.g. “Reports” only for ops_admin).

6. **Sign out**  
   - Sign out button in sidebar that calls `supabase.auth.signOut()` and redirects to `/login`.

### 4.3 Supabase (Auth feature)

- **Auth:** Existing magic link + callback; no change.  
- **Postgres:** `profiles`, `org_memberships`, `role_assignments` (already in migration).  
- **RLS:** Already in place; ensure API uses either anon key with RLS or service role with explicit org checks.  
- **Storage:** Not used for auth.

---

## 5. Execution Order (Feature-Wise)

1. **Feature 1: Auth & RBAC** — Profile upsert, org/role resolution, API auth, AppShell org + role + sign out.  
2. **Feature 2: Multi-tenant** — Org context in layout and API; optional org switcher.  
3. **Feature 3: Applications** — List, New, Detail pages; wire to existing `POST/GET /api/v1/applications`.  
4. **Feature 4–5: Quotes + Underwriting** — Quote list/detail, risk card, bind flow; wire to existing APIs.  
5. **Feature 6–7: Policies** — Policy list/detail, endorsements/renewals/cancellations pages; wire to existing APIs.  
6. **Feature 8: Billing** — Billing overview, invoice detail, record payment; wire to existing APIs.  
7. **Feature 9: Claims** — Claim list, FNOL, detail + triage; wire to existing APIs.  
8. **Feature 10: Documents** — Signed upload/read in application and claim flows; Supabase Storage.  
9. **Feature 11–12: Portals** — Agent/customer routes and persona-based nav/APIs.  
10. **Feature 13: Audit & reports** — Reports hub, dashboard, audit log page.  
11. **Feature 14: Settings** — Profile and org/role display.

---

## 6. UI/UX Principles

- **Consistency:** Same layout (AppShell), same patterns for list → detail → create across Applications, Quotes, Policies, Claims, Billing.  
- **Clarity:** One primary action per screen; breadcrumbs where helpful.  
- **Feedback:** Loading states, success toasts, inline validation (Zod).  
- **Accessibility:** Semantic HTML, labels, keyboard navigation.  
- **Responsive:** Sidebar collapses or drawer on small screens; tables stack or scroll.

---

## 7. Page Inventory Summary (Quick Reference)

| Area | Routes | Notes |
|------|--------|-------|
| **Public** | `/`, `/login`, `/auth/callback` | Landing, magic link, callback |
| **App shell** | `/app` (dashboard) | Sidebar: Dashboard, Applications, Quotes, Policies, Claims, Billing, Reports, Settings |
| **Applications** | `/app/applications`, `/app/applications/new`, `/app/applications/[id]` | List, create, detail |
| **Quotes** | `/app/quotes`, `/app/quotes/[id]`, `/app/quotes/[id]/bind` | List, detail, bind |
| **Policies** | `/app/policies`, `/app/policies/[id]`, `.../endorsements/new`, `.../renewals/new`, `.../cancellations/new` | List, detail, endorse, renew, cancel |
| **Billing** | `/app/billing`, `/app/billing/invoices/[id]` | Invoice list, invoice detail + record payment |
| **Claims** | `/app/claims`, `/app/claims/new`, `/app/claims/[id]` | List, FNOL, detail + triage |
| **Documents** | (Component in application/claim flows) | Signed upload to Supabase Storage |
| **Agent** | `/app/agent/quotes` + reuse bind | Agent-scoped quote list |
| **Customer** | `/app/customer`, `/app/customer/policies`, `.../invoices`, `.../claims` | Customer home, policies, invoices, claims |
| **Reports** | `/app/reports`, `/app/reports/dashboard`, `/app/reports/audit` | Hub, dashboard, audit log |
| **Settings** | `/app/settings` | Profile, org, role, theme |

**Pages to implement (not yet built):** All of the above except `/app`, `/login`, `/auth/callback`. Root `/` may be a redirect or simple landing.

---

## 8. Doc References

- **Blueprint:** `socotra_blueprint_20260310_140115.pdf` (Core Features, MVP scope, data model, API groups).  
- **Scope:** `docs/product/scope-v1-hackathon.md`, `docs/product/execution-workflow.md`.  
- **Schema:** `docs/database/schema.md`, `supabase/migrations/20260314120000_init_policycore.sql`.  
- **API:** `docs/api/contracts.md`, `src/lib/contracts/api.ts`.
