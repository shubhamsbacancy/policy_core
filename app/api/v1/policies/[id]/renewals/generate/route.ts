// @ts-nocheck
import { GenerateRenewalRequestSchema } from "@/lib/contracts";
import { apiOk, parseJsonBody, withZodError } from "@/lib/domain/http";
import { getActorUserId } from "@/lib/domain/request";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoAddAuditEvent, repoCreateRenewalOffer } from "@/lib/domain/repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { id } = await context.params;
    const payload = await parseJsonBody(request, GenerateRenewalRequestSchema);
    const forbidden = await requireOrgAccess(auth.user.id, payload.org_id);
    if (forbidden) return forbidden;
    const renewalOffer = await repoCreateRenewalOffer(id, payload);
    if (!renewalOffer.data) {
      throw renewalOffer.error ?? new Error("Failed to create renewal offer");
    }

    await repoAddAuditEvent({
      org_id: payload.org_id,
      actor_user_id: getActorUserId(request),
      action: "policy.renewal_offer_generated",
      entity_type: "renewal_offer",
      entity_id: renewalOffer.data.id,
      before_state: null,
      after_state: renewalOffer.data
    });

    return apiOk(renewalOffer.data, 201);
  } catch (error) {
    return withZodError(error);
  }
}
