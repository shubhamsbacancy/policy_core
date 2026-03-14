# Supabase Layer Instructions

- Keep schema multi-tenant aware even for single-tenant demo seed data.
- Enable RLS on all exposed public tables.
- Use helper policies tied to `org_memberships`.
- Preserve immutability in version tables and public business numbers.
- Add indexes for org-scoped lookup and frequently filtered lifecycle fields.
- Never assume service-role usage from browser clients.
