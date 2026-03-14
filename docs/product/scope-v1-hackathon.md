# Scope v1 Hackathon

## Product Slice
Texas homeowners insurance policy administration MVP with three personas: ops/admin, agent, customer.

## In Scope
- Auth and org membership model.
- Application intake for homeowners line.
- Deterministic quote/rating flow.
- AI risk assessment for underwriting decision support.
- Quote bind and policy issue flow.
- Endorsement, renewal offer generation, cancellation request flow.
- Billing invoice creation and payment recording (mock adapter).
- FNOL claim intake and AI triage summary.
- Portal reads for agent/customer.
- Document metadata and signed-upload URL flow.
- Dashboard summary endpoint.
- Audit logging for lifecycle mutations.

## Out of Scope
- Reinsurance contracts and cessions.
- Real payment processor settlement and reconciliation.
- Multi-currency and multi-jurisdiction production compliance.
- Blockchain, IoT, catastrophe feeds, embedded white-label SDK.
- Live regulator filing automation.

## Quality Gates
- All v1 endpoints available under `/api/v1`.
- Zod validation at every API boundary.
- RLS active across exposed domain tables.
- Demo data supports full script from quote to claim triage.
