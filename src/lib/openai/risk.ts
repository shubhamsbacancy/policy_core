import { ApplicationDraftSchema, RiskAssessmentResultSchema, type ApplicationDraft, type RiskAssessmentResult } from "@/lib/contracts";

import { getOpenAIClient, getOpenAIModel } from "./client";

function heuristicRiskAssessment(application: ApplicationDraft): RiskAssessmentResult {
  const roofPenalty = application.property.roof_age_years > 12 ? 16 : application.property.roof_age_years > 6 ? 8 : 3;
  const occupancyPenalty = application.property.occupancy === "vacant" ? 18 : application.property.occupancy === "tenant_occupied" ? 10 : 4;
  const claimsPenalty = application.property.prior_claims_count * 7;
  const agePenalty = application.property.year_built < 1980 ? 14 : application.property.year_built < 2000 ? 8 : 3;
  const score = Math.min(100, roofPenalty + occupancyPenalty + claimsPenalty + agePenalty + 18);
  const tier = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  const action = score >= 75 ? "decline" : score >= 50 ? "refer" : "approve";
  const flags = [
    application.property.roof_age_years > 12 ? "roof_age_high" : null,
    application.property.occupancy === "vacant" ? "occupancy_vacant" : null,
    application.property.prior_claims_count >= 2 ? "claims_frequency" : null,
    application.property.year_built < 1980 ? "older_structure" : null
  ].filter(Boolean) as string[];

  return {
    risk_score: score,
    risk_tier: tier,
    flags,
    explanation: "Heuristic risk fallback used because AI output was unavailable.",
    recommended_action: action,
    provider: "heuristic",
    model: "fallback-v1",
    generated_at: new Date().toISOString()
  };
}

export async function generateRiskAssessment(application: ApplicationDraft): Promise<RiskAssessmentResult> {
  const validInput = ApplicationDraftSchema.parse(application);
  const client = getOpenAIClient();
  const model = getOpenAIModel();

  if (!client) {
    return heuristicRiskAssessment(validInput);
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["risk_score", "risk_tier", "flags", "explanation", "recommended_action"],
    properties: {
      risk_score: { type: "integer", minimum: 0, maximum: 100 },
      risk_tier: { type: "string", enum: ["low", "medium", "high"] },
      flags: { type: "array", items: { type: "string" } },
      explanation: { type: "string", minLength: 1 },
      recommended_action: { type: "string", enum: ["approve", "refer", "decline"] }
    }
  } as const;

  try {
    const response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are an underwriting assistant for Texas homeowners insurance. Return only the requested structured object."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(validInput)
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "risk_assessment",
          schema,
          strict: true
        }
      }
    } as never);

    const payload = JSON.parse(response.output_text);
    return RiskAssessmentResultSchema.parse({
      ...payload,
      provider: "openai",
      model,
      generated_at: new Date().toISOString()
    });
  } catch {
    return heuristicRiskAssessment(validInput);
  }
}
