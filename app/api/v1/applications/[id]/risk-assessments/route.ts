// @ts-nocheck
import { z } from "zod";

import { ApplicationDraftSchema } from "@/lib/contracts";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { apiError, apiOk, parseJsonBody, withZodError } from "@/lib/domain/http";
import { getActorUserId } from "@/lib/domain/request";
import { repoAddAuditEvent, repoCreateRiskAssessment, repoGetApplication } from "@/lib/domain/repository";
import { generateRiskAssessment } from "@/lib/openai/risk";

const RiskAssessmentRequestSchema = z.object({
  application: ApplicationDraftSchema.optional()
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { id } = await context.params;
    const existing = await repoGetApplication(id);
    const body = await parseJsonBody(request, RiskAssessmentRequestSchema);

    const payload = existing?.data ?? body.application;
    if (!payload) {
      return apiError("Application payload is required when application id does not exist.", 400);
    }

    const orgId = existing?.org_id ?? payload.org_id;
    const forbidden = await requireOrgAccess(auth.user.id, orgId);
    if (forbidden) return forbidden;

    const result = await generateRiskAssessment(payload);
    const assessment = await repoCreateRiskAssessment(existing?.id ?? id, payload.org_id, result);
    if (!assessment.data) {
      throw assessment.error ?? new Error("Failed to create risk assessment");
    }

    await repoAddAuditEvent({
      org_id: payload.org_id,
      actor_user_id: getActorUserId(request),
      action: "underwriting.risk_assessment_generated",
      entity_type: "risk_assessment",
      entity_id: assessment.data.id,
      before_state: null,
      after_state: assessment.data
    });

    return apiOk(assessment.data, 201);
  } catch (error) {
    return withZodError(error);
  }
}
