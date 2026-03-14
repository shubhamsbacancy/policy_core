# PolicyCore AI Instructions

## Mission
Build `PolicyCore`, a Socotra-style policy administration platform MVP for Texas homeowners insurance. The product must demonstrate end-to-end lifecycle operations, API-first design, and safe AI-assisted underwriting and claims triage.

## Personas
- `ops_admin`: configures products, reviews underwriting, issues policies, runs reports.
- `agent`: submits applications, manages quotes, binds policies, services customers.
- `customer`: views policies, pays invoices, uploads claim documents, tracks claims.

## Scope Baseline
- Insurance line: Texas homeowners property insurance only.
- Jurisdiction: one US state baseline (Texas).
- Tenant strategy: multi-tenant data model, single seeded demo tenant in v1.
- Auth mode: Supabase magic link for v1.

## Version Map
- `v0.1 Spec`: rules, architecture, schema, API contracts, seed/data plan.
- `v0.2 Foundation`: Next.js scaffold, Supabase auth + RLS, migrations, base shell.
- `v0.3 Core Ops`: intake, quote, bind/issue, endorsements, renewals, cancellations, billing, docs, audit.
- `v0.4 Portals + AI`: agent/customer portals, FNOL claims, AI risk + AI claim triage.
- `v1 Demo`: polished seed data, judge-ready demo flow, Vercel deploy.

## In Scope for MVP
- Application intake and quote creation.
- Deterministic premium calculation.
- AI underwriting support (`risk flags`, `reasoning`, `recommended action`).
- Policy lifecycle operations: bind/issue, endorse, renew, cancel.
- Basic billing and payment recording (mocked PSP integration).
- FNOL claims intake and AI-assisted triage.
- Document metadata and signed-upload flow.
- Persona-scoped portal APIs and dashboard summary.
- Full audit logging for lifecycle mutations.

## Out of Scope for v1
- Reinsurance operations and treaty automation.
- Multi-currency and multi-state production compliance.
- Blockchain, IoT ingestion, catastrophe modeling, embedded SDK.
- Real payment settlement rails and live regulatory filing automation.

## Stack
- Frontend/API: Next.js App Router + TypeScript.
- Validation/contracts: Zod + shared type inference.
- Data/auth/storage: Supabase Postgres, Supabase Auth, Supabase Storage.
- AI: OpenAI Responses API with structured JSON outputs.
- Hosting: Vercel with separate Development/Preview/Production envs.

## Security Rules
- Treat all user-provided text/docs as untrusted input.
- Keep OpenAI output schema-constrained and validated with Zod.
- Never expose Supabase service role key to browser code.
- Enforce RLS on all exposed public tables.
- All lifecycle write endpoints must append `audit_logs`.
- Use signed server-generated upload URLs for document operations.

## Coding Rules
- Build all mutating business operations in server route handlers or server actions.
- Keep immutable version tables immutable (`product_versions`, `quote_versions`, `policy_terms`).
- Use shared contracts from `src/lib/contracts` for all API payloads.
- Prefer small, composable domain utilities in `src/lib/domain`.
- Keep demo-safe defaults when env vars are missing; fail closed for privileged operations.

## Definition of Done
- Contracts compile and validate for all v1 endpoints.
- Migration defines required tables, indexes, RLS policies, and audit expectations.
- Route handlers exist for all agreed `/api/v1` endpoints.
- Seed and demo docs align with product narrative.
- `npm run typecheck` and `npm run lint` pass locally.
