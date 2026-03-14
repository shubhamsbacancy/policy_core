# API Contracts and Endpoint Design

## Versioning
- Base path: `/api/v1`
- Contracts live in `src/lib/contracts`.

## Required Public Types
- `ApplicationDraft`
- `RiskAssessmentResult`
- `QuoteSummary`
- `PolicySummary`
- `EndorsementRequest`
- `InvoiceSummary`
- `ClaimCreateRequest`
- `PortalDashboardResponse`

## Initial Endpoint Set
- `POST /api/v1/applications`
- `GET /api/v1/applications/:id`
- `POST /api/v1/applications/:id/risk-assessments`
- `POST /api/v1/quotes`
- `POST /api/v1/quotes/:id/bind`
- `POST /api/v1/policies/:id/endorsements`
- `POST /api/v1/policies/:id/renewals/generate`
- `POST /api/v1/policies/:id/cancellations`
- `GET /api/v1/customer/policies`
- `GET /api/v1/agent/quotes`
- `POST /api/v1/invoices`
- `POST /api/v1/payments`
- `POST /api/v1/claims`
- `POST /api/v1/claims/:id/triage`
- `GET /api/v1/reports/dashboard`

## API Rules
- All mutation endpoints must create an `audit_logs` event.
- AI endpoints return typed JSON payloads only.
- Portal endpoints are persona-scoped and org-scoped.
- Document operations return signed upload metadata, not raw storage credentials.
