# Auth & RBAC Setup

## Authentication flow (email + password)

PolicyCore uses **email and password** authentication (no magic links) to avoid email rate limits.

- **Default route:** `/` redirects to `/login` if not signed in, or to `/app` if signed in.
- **Login:** `/login` — Email + password → `signInWithPassword`. On success → redirect to `/app`.
- **Register:** `/register` — Email + password + confirm password → `signUp`. If Supabase does not require email confirmation, the user is signed in and redirected to `/app`. If email confirmation is required, the user sees “Check your email” and can go to `/login` after confirming.
- **Callback:** `/auth/callback` — Used for email confirmation links (e.g. `?code=...`). Exchanges the code for a session and redirects to `/app`, or shows a link to sign in if the link is invalid.

## First sign-in (automatic RBAC)

When a user **signs in** (or completes registration) for the **first time**:

1. **Profile** — A row is created in `profiles` (id = auth user id, status = active, full_name from email or metadata).
2. **Org membership** — If the user has no org membership, they are added to the **demo org** (Lone Star MGA) with an active `org_memberships` row and a `role_assignments` row with role `ops_admin`.

So any new user gets access to the seeded demo org without manual setup. For production you would replace this with an invite flow or admin-assigned memberships.

## Supabase Auth settings

In **Supabase Dashboard → Authentication → Providers → Email**:

- **Enable Email provider** and use **Email + Password** (not “Magic Link” only).
- Optionally enable **Confirm email** if you want users to verify their email before signing in. If enabled, set **Redirect URL** to your app’s `/auth/callback` (e.g. `https://your-app.com/auth/callback`).
- Disable or limit **Magic Link** if you want to avoid rate limits and use only password sign-in.

## Multi-tenant org context

- **Current org** is stored in a cookie (`policycore_org_id`) so the app and API scope all data to one organization.
- **Layout** resolves the current org with `getCurrentOrgIdFromCookie()` and `getOrgAndPersona(userId, preferredOrgId)` so the selected org is used everywhere (dashboard, nav, etc.).
- **Org switcher:** If the user belongs to more than one org, the sidebar shows a dropdown to switch. Changing org calls `POST /api/v1/me/org` with `{ org_id }`, sets the cookie, and refreshes the page.
- **APIs:** `GET /api/v1/me/orgs` returns the list of orgs the user belongs to. Mutating APIs continue to use `requireOrgAccess(userId, org_id)` with the `org_id` from the request body (forms and UI should send the current org from context/cookie).

## Demo org

- **ID:** `8f54f0b2-1376-4273-b2d5-df6088018f5b` (Lone Star MGA), or set `NEXT_PUBLIC_DEMO_ORG_ID` in env.
- **Seed:** Ensure `supabase/migrations/20260314131000_seed_demo.sql` has been applied so this org, carrier, and product exist.

## Adding specific demo users (optional)

To pre-create **specific** users (e.g. `agent.demo@policycore.local`, `ops.demo@policycore.local`) with different roles:

1. Create those users in **Supabase Dashboard → Authentication → Users** (e.g. “Add user” with email and password), or have them register via `/register`.
2. Copy their **User UIDs** from the Users table.
3. Run SQL (e.g. in SQL Editor or a one-off migration) to add memberships and roles:

```sql
-- Replace the UUIDs with the actual auth user IDs from Supabase Auth.
INSERT INTO public.org_memberships (org_id, user_id, membership_type, status)
VALUES
  ('8f54f0b2-1376-4273-b2d5-df6088018f5b', '<OPS_USER_UID>', 'member', 'active'),
  ('8f54f0b2-1376-4273-b2d5-df6088018f5b', '<AGENT_USER_UID>', 'member', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_assignments (org_id, user_id, role_key, status)
VALUES
  ('8f54f0b2-1376-4273-b2d5-df6088018f5b', '<OPS_USER_UID>', 'ops_admin', 'active'),
  ('8f54f0b2-1376-4273-b2d5-df6088018f5b', '<AGENT_USER_UID>', 'agent', 'active')
ON CONFLICT (org_id, user_id, role_key) DO NOTHING;
```

4. Profiles are created automatically on first sign-in; no need to insert manually.

## API authorization

Protected API routes should:

1. Call `requireAuth()` — returns `{ user }` or `{ error: Response }`. If `error`, return it (401).
2. For routes that take `org_id` in the body or params, call `requireOrgAccess(user.id, orgId)` — returns `Response` (403) or `null`. If non-null, return it.

See `app/api/v1/applications/route.ts` for the pattern.

## Personas

- **ops_admin** — Full access; config, underwriting, issue, reports.
- **agent** — Submit applications, manage quotes, bind policies, service customers.
- **customer** — View own policies, pay invoices, file claims.

Nav and API scope by persona can be added in later iterations (e.g. hide “Reports” for agent/customer, or enforce persona in `/api/v1/agent/*` and `/api/v1/customer/*`).
