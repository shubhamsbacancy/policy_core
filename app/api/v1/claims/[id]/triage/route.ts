import { TriageClaimRequestSchema, type ClaimCreateRequest } from "@/lib/contracts";
import { apiError, apiOk, parseJsonBody, withZodError } from "@/lib/domain/http";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoAddAuditEvent, repoGetClaim, repoSetClaimTriage } from "@/lib/domain/repository";
import { generateClaimTriage } from "@/lib/openai/triage";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const payload = await parseJsonBody(request, TriageClaimRequestSchema);
    const claim = await repoGetClaim(id);

    if (!claim) {
      return apiError("Claim not found.", 404);
    }

    if (claim.org_id !== payload.org_id) {
      return apiError("Claim org mismatch.", 403);
    }
    const forbidden = await requireOrgAccess(auth.user.id, claim.org_id);
    if (forbidden) return forbidden;

    const aiInputs = claim.ai_inputs as Partial<ClaimCreateRequest> | null;
    const triageInput: ClaimCreateRequest = {
      org_id: claim.org_id,
      policy_id: claim.policy_id,
      reported_by: aiInputs?.reported_by ?? "agent",
      incident_date: claim.incident_date,
      description: [claim.description, payload.adjuster_notes ?? ""].filter(Boolean).join("\n").trim(),
      estimated_loss_amount: claim.estimated_loss_amount,
      document_refs: []
    };

    const triage = await generateClaimTriage(triageInput);
    const updated = await repoSetClaimTriage(claim.id, triage);
    if (!updated.data) {
      return apiError("Claim triage update failed.", 500);
    }

    await repoAddAuditEvent({
      org_id: payload.org_id,
      actor_user_id: auth.user.id,
      action: "claim.triage_generated",
      entity_type: "claim",
      entity_id: claim.id,
      before_state: claim,
      after_state: updated.data
    });

    return apiOk(updated.data);
  } catch (error) {
    return withZodError(error);
  }
}
