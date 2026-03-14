import { QuoteSummarySchema } from "@/lib/contracts";
import { apiError, apiOk } from "@/lib/domain/http";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoGetQuote } from "@/lib/domain/repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const quote = await repoGetQuote(id);
  if (!quote) {
    return apiError("Quote not found.", 404);
  }

  const forbidden = await requireOrgAccess(auth.user.id, quote.org_id);
  if (forbidden) return forbidden;

  const validated = QuoteSummarySchema.parse(quote);
  return apiOk(validated);
}
