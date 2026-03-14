// @ts-nocheck
import { CreateQuoteRequestSchema, QuoteSummarySchema } from "@/lib/contracts";
import { apiError, apiOk, parseJsonBody, withZodError } from "@/lib/domain/http";
import { getActorUserId } from "@/lib/domain/request";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { calculateDeterministicPremium } from "@/lib/domain/rating";
import { repoAddAuditEvent, repoCreateQuote, repoGetApplication, repoListQuotes } from "@/lib/domain/repository";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const payload = await parseJsonBody(request, CreateQuoteRequestSchema);
    const forbidden = await requireOrgAccess(auth.user.id, payload.org_id);
    if (forbidden) return forbidden;

    const application = await repoGetApplication(payload.application_id);
    if (!application) {
      return apiError("Application not found.", 404);
    }

    const rating = calculateDeterministicPremium(application.data as any);
    const quoteResult = await repoCreateQuote({
      application_id: application.id,
      org_id: payload.org_id,
      rating_breakdown: rating.breakdown,
      total_premium: rating.totalPremium,
      premium: rating.premium,
      taxes: rating.taxes,
      fees: rating.fees,
      currency: "USD"
    });
    if (!quoteResult.data) {
      throw quoteResult.error ?? new Error("Failed to create quote");
    }

    const validated = QuoteSummarySchema.parse(quoteResult.data);
    await repoAddAuditEvent({
      org_id: payload.org_id,
      actor_user_id: getActorUserId(request),
      action: "quote.created",
      entity_type: "quote",
      entity_id: validated.quote_id,
      before_state: null,
      after_state: validated
    });

    return apiOk(validated, 201);
  } catch (error) {
    return withZodError(error);
  }
}

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const orgId = url.searchParams.get("org_id");
  if (!orgId) return apiOk([]);

  const forbidden = await requireOrgAccess(auth.user.id, orgId);
  if (forbidden) return forbidden;

  const quotes = await repoListQuotes(orgId);
  return apiOk(quotes);
}
