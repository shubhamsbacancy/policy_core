# System Architecture

## High-Level Components
- `Next.js App Router` for UI and API route handlers.
- `Supabase Auth` for magic-link sign-in and session handling.
- `Supabase Postgres` for multi-tenant operational data.
- `Supabase Storage` for policy/claim document objects.
- `OpenAI Responses API` for structured underwriting and claim triage outputs.
- `Vercel` for environment-aware deployment (Development/Preview/Production).

## Request Flow
1. Browser hits Next.js route or API endpoint.
2. Middleware refreshes/propagates Supabase auth cookies.
3. API handlers validate payload with Zod contracts.
4. Domain service computes deterministic outputs and persistence intents.
5. Optional AI service returns schema-constrained JSON.
6. Supabase writes data under RLS and appends audit log.
7. API returns typed response.

## Multi-Tenant Strategy
- `org_id` is the principal data partition key.
- Auth users map to org access via `org_memberships`.
- RLS policies use membership checks to enforce isolation.
- Seed data ships with one org/carrier/product for demo simplicity.

## Security Model
- Server-only keys in server runtime.
- Browser uses anon key only.
- Service-role key remains backend-only.
- AI outputs validated before storage.
- Lifecycle operations always log actor, action, entity, and before/after snapshots.

## Deployment Model
- One Vercel project.
- Environments:
  - Development: local/dev Supabase project.
  - Preview: non-production Supabase project.
  - Production: production Supabase project with locked secrets.
