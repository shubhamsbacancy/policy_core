import { describe, expect, it } from "vitest";

import { ApplicationDraftSchema } from "../src/lib/contracts";
import { calculateDeterministicPremium } from "../src/lib/domain/rating";

const baseDraft = ApplicationDraftSchema.parse({
  org_id: "8f54f0b2-1376-4273-b2d5-df6088018f5b",
  agent_user_id: "43c99275-5fca-48c9-8d44-6e43e003236f",
  effective_date: "2026-04-01",
  policyholder: {
    first_name: "Ana",
    last_name: "Reyes",
    email: "ana@example.com"
  },
  property: {
    address_line_1: "123 Bayou Street",
    city: "Houston",
    state: "TX",
    postal_code: "77001",
    construction_type: "frame",
    occupancy: "owner_occupied",
    year_built: 2004,
    square_footage: 2100,
    roof_age_years: 7,
    replacement_cost: 410000,
    territory_code: "TX-HOU-01",
    prior_claims_count: 1
  },
  coverage: {
    dwelling_limit: 400000,
    liability_limit: 300000,
    deductible: 2000
  }
});

describe("calculateDeterministicPremium", () => {
  it("returns a positive premium and total", () => {
    const result = calculateDeterministicPremium(baseDraft);
    expect(result.premium).toBeGreaterThan(0);
    expect(result.totalPremium).toBeGreaterThan(result.premium);
  });

  it("increases risk for vacant occupancy", () => {
    const owner = calculateDeterministicPremium(baseDraft);
    const vacant = calculateDeterministicPremium({
      ...baseDraft,
      property: {
        ...baseDraft.property,
        occupancy: "vacant"
      }
    });

    expect(vacant.totalPremium).toBeGreaterThan(owner.totalPremium);
  });
});
