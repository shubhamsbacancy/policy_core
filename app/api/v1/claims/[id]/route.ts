import { apiError, apiOk, withZodError } from "@/lib/domain/http";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoGetClaim } from "@/lib/domain/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const claim = await repoGetClaim(id);
    if (!claim) return apiError("Claim not found.", 404);

    const forbidden = await requireOrgAccess(auth.user.id, claim.org_id);
    if (forbidden) return forbidden;

    let policy_number: string | null = null;
    if (claim.policy_id) {
      const { createSupabaseServiceClient } = await import("@/lib/supabase/admin");
      const supabase = createSupabaseServiceClient();
      const { data: policy } = await supabase
        .from("policies")
        .select("policy_number")
        .eq("id", claim.policy_id)
        .single();
      policy_number = (policy as { policy_number?: string } | null)?.policy_number ?? null;
    }

    return apiOk({ ...claim, policy_number });
  } catch (error) {
    return withZodError(error);
  }
}
