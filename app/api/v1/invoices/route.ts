import { CreateInvoiceRequestSchema } from "@/lib/contracts";
import { apiError, apiOk, parseJsonBody, withZodError } from "@/lib/domain/http";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoAddAuditEvent, repoCreateInvoice, repoListInvoices } from "@/lib/domain/repository";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("org_id");
    if (!orgId) return apiError("Missing org_id query parameter.", 400);

    const forbidden = await requireOrgAccess(auth.user.id, orgId);
    if (forbidden) return forbidden;

    const invoices = await repoListInvoices(orgId);
    return apiOk({ invoices });
  } catch (error) {
    return withZodError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const payload = await parseJsonBody(request, CreateInvoiceRequestSchema);
    const forbidden = await requireOrgAccess(auth.user.id, payload.org_id);
    if (forbidden) return forbidden;
    const invoice = await repoCreateInvoice(payload);
    if (!invoice.data) {
      throw invoice.error ?? new Error("Failed to create invoice");
    }

    await repoAddAuditEvent({
      org_id: payload.org_id,
      actor_user_id: auth.user.id,
      action: "billing.invoice_created",
      entity_type: "invoice",
      entity_id: (invoice.data as { invoice_id: string }).invoice_id,
      before_state: null,
      after_state: invoice.data
    });

    return apiOk(invoice.data, 201);
  } catch (error) {
    return withZodError(error);
  }
}
