// @ts-nocheck
import { CancellationRequestSchema } from "@/lib/contracts";
import { apiOk, parseJsonBody, withZodError } from "@/lib/domain/http";
import { getActorUserId } from "@/lib/domain/request";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoAddAuditEvent, repoCreateCancellation } from "@/lib/domain/repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { id } = await context.params;
    const payload = await parseJsonBody(request, CancellationRequestSchema);
    const forbidden = await requireOrgAccess(auth.user.id, payload.org_id);
    if (forbidden) return forbidden;
    const cancellation = await repoCreateCancellation(id, payload);
    if (!cancellation.data) {
      throw cancellation.error ?? new Error("Failed to create cancellation");
    }

    await repoAddAuditEvent({
      org_id: payload.org_id,
      actor_user_id: getActorUserId(request),
      action: "policy.cancellation_requested",
      entity_type: "cancellation",
      entity_id: cancellation.data.id,
      before_state: null,
      after_state: cancellation.data
    });

    return apiOk(cancellation.data, 201);
  } catch (error) {
    return withZodError(error);
  }
}
