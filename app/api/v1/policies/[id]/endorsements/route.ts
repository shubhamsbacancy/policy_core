// @ts-nocheck
import { EndorsementRequestSchema } from "@/lib/contracts";
import { apiOk, parseJsonBody, withZodError } from "@/lib/domain/http";
import { getActorUserId } from "@/lib/domain/request";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoAddAuditEvent, repoCreateEndorsement } from "@/lib/domain/repository";

const EndorsementBodySchema = EndorsementRequestSchema.omit({ policy_id: true });

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { id } = await context.params;
    const body = await parseJsonBody(request, EndorsementBodySchema);
    const payload = { ...body, policy_id: id };
    const forbidden = await requireOrgAccess(auth.user.id, payload.org_id);
    if (forbidden) return forbidden;
    const endorsement = await repoCreateEndorsement(payload);

    await repoAddAuditEvent({
      org_id: payload.org_id,
      actor_user_id: getActorUserId(request),
      action: "policy.endorsement_created",
      entity_type: "endorsement",
      entity_id: endorsement.endorsement_id,
      before_state: null,
      after_state: endorsement
    });

    return apiOk(endorsement, 201);
  } catch (error) {
    return withZodError(error);
  }
}
