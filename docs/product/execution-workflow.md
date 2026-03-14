# PolicyCore Execution Workflow (Task-by-Task)

## 1) Working Model (How we execute every task)
- `Step A`: lock acceptance criteria (inputs, outputs, API/table impact).
- `Step B`: implement backend/data contracts first.
- `Step C`: wire UI/portal usage.
- `Step D`: add tests + demo data updates.
- `Step E`: run `typecheck`, `lint`, `test`, `build`.
- `Step F`: update docs + changelog note.

## 2) Milestones
- `M1 Foundation Complete`: Supabase persistence + auth/RLS wired.
- `M2 Core Ops Complete`: application -> quote -> bind/issue -> billing baseline.
- `M3 Lifecycle Complete`: endorsements, renewals, cancellations, claims + triage.
- `M4 Portal + Demo Complete`: agent/customer portals, reporting, documents, seed story.
- `M5 Deploy Complete`: Vercel envs + production checklist.

## 3) Task Queue (Execution Order)

### Phase A: Foundation (must do first)
1. `T1` Replace in-memory store with Supabase repository layer.
   - Done when all `/api/v1` routes read/write real tables.
2. `T2` Auth + membership + persona authorization middleware.
   - Done when org/persona scoping is enforced server-side.
3. `T3` RLS validation suite.
   - Done when cross-org access is blocked in test scenarios.

### Phase B: Core Insurance Ops
4. `T4` Application intake persistence (`applications`, `policyholders`, `insured_properties`, `application_documents`).
5. `T5` Deterministic rating + quote versioning (`quotes`, `quote_versions`, `rating_breakdown`).
6. `T6` Underwriting AI risk assessment persistence (`risk_assessments`, `underwriting_reviews`).
7. `T7` Bind/issue policy flow (`policies`, `policy_terms`) + first invoice generation.

### Phase C: Lifecycle + Claims
8. `T8` Endorsements, renewal offers, cancellations.
9. `T9` Billing and payment records with payment adapter abstraction.
10. `T10` FNOL claims + AI triage + claim events/reserves.
11. `T11` Audit logging hard enforcement for every mutation route.

### Phase D: Portals + Reporting + Docs
12. `T12` Agent portal APIs (`/agent/quotes`, service actions).
13. `T13` Customer portal APIs (`/customer/policies`, invoices, claims, docs).
14. `T14` Dashboard/reporting endpoints with org-scoped aggregates.
15. `T15` Signed upload/document workflow (Supabase Storage).

### Phase E: Demo + Deployment
16. `T16` Seed data + scripted end-to-end demo path.
17. `T17` Vercel env wiring (Dev/Preview/Prod) + secret policy.
18. `T18` Final hardening pass (tests, build, smoke API runbook).

## 4) PDF Feature Mapping

### v1 Hackathon (implemented now)
- Multi-tenant architecture (single seeded org demo).
- API-first integration layer.
- Role-based access control (ops/admin, agent, customer).
- Quote generation + policy lifecycle management.
- Billing/payment records.
- Claims workflow (FNOL + triage).
- Agent portal + customer portal.
- Document management metadata.
- Audit trail + reporting.
- Underwriting workbench baseline.
- Policy renewal and cancellation baseline.
- Simplified compliance engine (Texas-only baseline).
- AI-powered risk assessment and digital claim triage (structured outputs).

### v1.1 / post-hackathon
- Workflow automation builder.
- Commission management depth.
- Batch processing engine.
- Data import/export tooling.
- Mobile-first/offline enhancements.

### v2+ / advanced backlog
- Reinsurance management.
- Multi-currency.
- IoT integration.
- Predictive analytics / catastrophe integrations.
- Embedded insurance SDK.
- Regulatory intelligence automation.
- Other innovative ideas from the PDF list.

## 5) Immediate Next Task
- Start with `T1` now (Supabase repository integration), because every other feature depends on persistent data and real org scoping.
