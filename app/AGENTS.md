# App Layer Instructions

- Keep UI focused on hackathon demo clarity over breadth.
- Route handlers under `app/api/v1/*` are the system boundary for mutations.
- Use contracts from `src/lib/contracts` for request/response validation.
- Never call Supabase service-role client from browser components.
- Any endpoint that changes lifecycle state must create an audit event.
- Keep portal endpoints persona-scoped (`agent`, `customer`, `ops_admin`).
