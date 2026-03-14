// @ts-nocheck
import { PortalDashboardResponseSchema } from "@/lib/contracts";
import { apiError, apiOk } from "@/lib/domain/http";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoBuildDashboard } from "@/lib/domain/repository";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orgId = url.searchParams.get("org_id");

  if (!orgId) {
    return apiError("Query param 'org_id' is required.", 400);
  }

  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const forbidden = await requireOrgAccess(auth.user.id, orgId);
  if (forbidden) return forbidden;

  const dashboard = await repoBuildDashboard(orgId);
  const validated = PortalDashboardResponseSchema.parse(dashboard);
  return apiOk(validated);
}
