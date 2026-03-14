import { apiOk } from "@/lib/domain/http";
import { requireAuth } from "@/lib/auth/api-auth";
import { listUserOrgs } from "@/lib/auth/session";

/**
 * GET /api/v1/me/orgs — List orgs the current user belongs to (for org switcher).
 */
export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const orgs = await listUserOrgs(auth.user.id);
  return apiOk({ orgs });
}
