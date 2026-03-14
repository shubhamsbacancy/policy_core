# AI Risk Engine

## Goal
Support underwriters with explainable, structured risk insights while keeping final pricing and approval deterministic and auditable.

## Inputs
- Construction type
- Occupancy
- Roof age
- Square footage
- Replacement cost
- Deductible
- Territory
- Prior claims count
- Notes from application intake

## Outputs (Structured JSON)
- `risk_score` (0-100)
- `risk_tier` (`low` | `medium` | `high`)
- `flags` (array of machine-friendly flags)
- `explanation` (short natural language)
- `recommended_action` (`approve` | `refer` | `decline`)

## Guardrails
- AI never mutates policy state directly.
- AI output must pass Zod validation before persistence.
- Missing/invalid AI output falls back to deterministic heuristic score.
- Underwriter override is always allowed and logged.

## Claim Triage Output
- `severity` (`low` | `medium` | `high`)
- `fraud_signal` (`low` | `medium` | `high`)
- `next_steps` (array)
- `summary` (short text)
