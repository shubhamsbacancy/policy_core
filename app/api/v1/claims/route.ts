import { ClaimCreateRequestSchema } from "@/lib/contracts";
import { apiError, apiOk, parseJsonBody, withZodError } from "@/lib/domain/http";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoAddAuditEvent, repoCreateClaim, repoListClaims } from "@/lib/domain/repository";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("org_id");
    if (!orgId) return apiError("Missing org_id query parameter.", 400);

    const forbidden = await requireOrgAccess(auth.user.id, orgId);
    if (forbidden) return forbidden;

    const claims = await repoListClaims(orgId);
    return apiOk({ claims });
  } catch (error) {
    return withZodError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const payload = await parseJsonBody(request, ClaimCreateRequestSchema);
    const forbidden = await requireOrgAccess(auth.user.id, payload.org_id);
    if (forbidden) return forbidden;
    const claim = await repoCreateClaim(payload);
    if (!claim.data) {
      throw claim.error ?? new Error("Failed to create claim");
    }

    await repoAddAuditEvent({
      org_id: payload.org_id,
      actor_user_id: auth.user.id,
      action: "claim.created",
      entity_type: "claim",
      entity_id: (claim.data as { id: string }).id,
      before_state: null,
      after_state: claim.data
    });

    return apiOk(claim.data, 201);
  } catch (error) {
    return withZodError(error);
  }
}
