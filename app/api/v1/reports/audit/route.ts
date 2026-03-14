// @ts-nocheck
import { apiError, apiOk } from "@/lib/domain/http";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoListAuditLogs } from "@/lib/domain/repository";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orgId = url.searchParams.get("org_id");
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("page_size") ?? "20");
  const action = url.searchParams.get("action") ?? undefined;
  const entityType = url.searchParams.get("entity_type") ?? undefined;

  if (!orgId) return apiError("Query param 'org_id' is required.", 400);

  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const forbidden = await requireOrgAccess(auth.user.id, orgId);
  if (forbidden) return forbidden;

  const result = await repoListAuditLogs({
    org_id: orgId,
    page: Number.isFinite(page) ? page : 1,
    page_size: Number.isFinite(pageSize) ? pageSize : 20,
    action,
    entity_type: entityType
  });

  return apiOk(result);
}
