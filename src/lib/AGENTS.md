# Library Layer Instructions

- `src/lib/contracts`: source of truth for API wire shapes.
- `src/lib/domain`: deterministic insurance logic and pure business helpers.
- `src/lib/openai`: Responses API wrappers returning validated typed JSON.
- `src/lib/supabase`: server/browser/middleware clients and auth glue.
- Keep framework-independent logic in `domain` where possible.
- Prefer explicit types and Zod parse boundaries over implicit casts.
