import { CreatePaymentRequestSchema } from "@/lib/contracts";
import { apiOk, parseJsonBody, withZodError } from "@/lib/domain/http";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoAddAuditEvent, repoCreatePayment } from "@/lib/domain/repository";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const payload = await parseJsonBody(request, CreatePaymentRequestSchema);
    const forbidden = await requireOrgAccess(auth.user.id, payload.org_id);
    if (forbidden) return forbidden;
    const payment = await repoCreatePayment(payload);
    if (!payment.data) {
      throw payment.error ?? new Error("Failed to record payment");
    }

    await repoAddAuditEvent({
      org_id: payload.org_id,
      actor_user_id: auth.user.id,
      action: "billing.payment_recorded",
      entity_type: "payment",
      entity_id: (payment.data as { id: string }).id,
      before_state: null,
      after_state: payment.data
    });

    return apiOk(payment.data, 201);
  } catch (error) {
    return withZodError(error);
  }
}
