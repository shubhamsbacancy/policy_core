import type { ApplicationDraft } from "@/lib/contracts";

export type DeterministicRatingResult = {
  premium: number;
  taxes: number;
  fees: number;
  totalPremium: number;
  breakdown: Record<string, number>;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateDeterministicPremium(application: ApplicationDraft): DeterministicRatingResult {
  const { property, coverage } = application;

  const baseRate = property.replacement_cost * 0.0032;
  const ageFactor = property.year_built < 1980 ? 1.18 : property.year_built < 2000 ? 1.08 : 1;
  const roofFactor = property.roof_age_years > 15 ? 1.12 : property.roof_age_years > 8 ? 1.05 : 0.98;
  const occupancyFactor =
    property.occupancy === "vacant" ? 1.35 : property.occupancy === "tenant_occupied" ? 1.12 : 1;
  const claimsFactor = 1 + property.prior_claims_count * 0.07;
  const deductibleFactor = coverage.deductible >= 2500 ? 0.89 : coverage.deductible >= 1500 ? 0.94 : 1;

  const premiumRaw = baseRate * ageFactor * roofFactor * occupancyFactor * claimsFactor * deductibleFactor;
  const premium = roundMoney(premiumRaw);
  const taxes = roundMoney(premium * 0.04);
  const fees = roundMoney(85);
  const totalPremium = roundMoney(premium + taxes + fees);

  return {
    premium,
    taxes,
    fees,
    totalPremium,
    breakdown: {
      base_rate: roundMoney(baseRate),
      age_factor: ageFactor,
      roof_factor: roofFactor,
      occupancy_factor: occupancyFactor,
      claims_factor: claimsFactor,
      deductible_factor: deductibleFactor
    }
  };
}
