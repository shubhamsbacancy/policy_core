import { ClaimTriageResultSchema, type ClaimCreateRequest, type ClaimTriageResult } from "@/lib/contracts";

import { getOpenAIClient, getOpenAIModel } from "./client";

function heuristicTriage(input: ClaimCreateRequest): ClaimTriageResult {
  const amountFactor = input.estimated_loss_amount > 50000 ? "high" : input.estimated_loss_amount > 10000 ? "medium" : "low";
  const fraudFactor = input.description.toLowerCase().includes("unknown") ? "medium" : "low";

  return {
    severity: amountFactor,
    fraud_signal: fraudFactor,
    next_steps: [
      "Confirm policy coverage effective on incident date",
      "Collect repair estimate and supporting photos",
      "Assign adjuster based on severity level"
    ],
    summary: "Heuristic claim triage fallback used because AI output was unavailable.",
    provider: "heuristic",
    model: "fallback-v1",
    generated_at: new Date().toISOString()
  };
}

export async function generateClaimTriage(input: ClaimCreateRequest): Promise<ClaimTriageResult> {
  const client = getOpenAIClient();
  const model = getOpenAIModel();

  if (!client) {
    return heuristicTriage(input);
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["severity", "fraud_signal", "next_steps", "summary"],
    properties: {
      severity: { type: "string", enum: ["low", "medium", "high"] },
      fraud_signal: { type: "string", enum: ["low", "medium", "high"] },
      next_steps: {
        type: "array",
        items: { type: "string" }
      },
      summary: { type: "string", minLength: 1 }
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
                "You are a claims triage assistant for Texas homeowners insurance. Return only the requested structured object."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(input)
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "claim_triage",
          schema,
          strict: true
        }
      }
    } as never);

    const payload = JSON.parse(response.output_text);
    return ClaimTriageResultSchema.parse({
      ...payload,
      provider: "openai",
      model,
      generated_at: new Date().toISOString()
    });
  } catch {
    return heuristicTriage(input);
  }
}
