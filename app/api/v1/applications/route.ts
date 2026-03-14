import { ApplicationDraftSchema } from "@/lib/contracts";
import { apiOk, parseJsonBody, withZodError } from "@/lib/domain/http";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoAddAuditEvent, repoCreateApplication, repoListApplications } from "@/lib/domain/repository";

export async function POST(request: Request) {
  try {
    const payload = await parseJsonBody(request, ApplicationDraftSchema);

    const auth = await requireAuth();
    if ("error" in auth) return auth.error;
    const forbidden = await requireOrgAccess(auth.user.id, payload.org_id);
    if (forbidden) return forbidden;

    const created = await repoCreateApplication(payload);

    await repoAddAuditEvent({
      org_id: payload.org_id,
      actor_user_id: auth.user.id,
      action: "application.created",
      entity_type: "application",
      entity_id: created.id,
      before_state: null,
      after_state: payload
    });

    return apiOk({ id: created.id }, 201);
  } catch (error) {
    return withZodError(error);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orgId = url.searchParams.get("org_id");

  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  if (!orgId) return apiOk([]);
  const forbidden = await requireOrgAccess(auth.user.id, orgId);
  if (forbidden) return forbidden;

  const rows = await repoListApplications(orgId);
  return apiOk(rows);
}
