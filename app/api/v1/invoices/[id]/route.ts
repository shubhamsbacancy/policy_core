import { apiError, apiOk, withZodError } from "@/lib/domain/http";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoGetInvoice } from "@/lib/domain/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const invoice = await repoGetInvoice(id);
    if (!invoice) return apiError("Invoice not found.", 404);

    const forbidden = await requireOrgAccess(auth.user.id, invoice.org_id);
    if (forbidden) return forbidden;

    return apiOk(invoice);
  } catch (error) {
    return withZodError(error);
  }
}
