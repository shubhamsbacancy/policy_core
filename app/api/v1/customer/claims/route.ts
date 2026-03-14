// @ts-nocheck
import { apiOk } from "@/lib/domain/http";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoListClaims } from "@/lib/domain/repository";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orgId = url.searchParams.get("org_id") ?? undefined;
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  if (!orgId) return apiOk([]);
  const forbidden = await requireOrgAccess(auth.user.id, orgId);
  if (forbidden) return forbidden;
  const claims = await repoListClaims(orgId);
  return apiOk(claims);
}
