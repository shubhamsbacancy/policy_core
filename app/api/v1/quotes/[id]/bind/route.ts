// @ts-nocheck
import { BindQuoteRequestSchema } from "@/lib/contracts";
import { apiError, apiOk, parseJsonBody, withZodError } from "@/lib/domain/http";
import { getActorUserId } from "@/lib/domain/request";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoAddAuditEvent, repoBindQuote, repoGetQuote } from "@/lib/domain/repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { id } = await context.params;
    const payload = await parseJsonBody(request, BindQuoteRequestSchema);
    const forbidden = await requireOrgAccess(auth.user.id, payload.org_id);
    if (forbidden) return forbidden;
    const quote = await repoGetQuote(id);

    if (!quote) {
      return apiError("Quote not found.", 404);
    }
    if (quote.status !== "quoted") {
      return apiError("Only quoted policies can be bound.", 409);
    }

    const result = await repoBindQuote(quote, payload);
    if (!result.data) {
      throw result.error ?? new Error("Failed to bind quote");
    }

    await repoAddAuditEvent({
      org_id: payload.org_id,
      actor_user_id: getActorUserId(request),
      action: "quote.bound",
      entity_type: "quote",
      entity_id: quote.quote_id,
      before_state: quote,
      after_state: result.data
    });

    return apiOk(result.data, 201);
  } catch (error) {
    return withZodError(error);
  }
}
