# Hackathon Demo Script

## Setup
- Use seeded tenant: `Lone Star MGA`.
- Use seeded product: `Texas Homeowners HO3`.
- Log in as `agent.demo@policycore.local` and `ops.demo@policycore.local`.

## Demo Flow
1. Agent creates an application with property details.
2. System returns deterministic premium estimate and AI risk assessment.
3. Ops user reviews risk output and records underwriting decision.
4. Agent converts quote to bound policy.
5. System creates policy term and first invoice.
6. Customer view shows policy, invoice, and documents.
7. Customer submits a first notice of loss claim.
8. System returns AI claim triage payload with severity/fraud signal.
9. Dashboard endpoint shows key counts and totals.

## Demo Talking Points
- API-first architecture and typed contracts.
- Multi-tenant schema with RLS.
- Immutable version records for compliance traceability.
- AI as decision support, not opaque replacement.
- Secure deployment with environment-segregated secrets.
