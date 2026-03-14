import type {
  ApplicationDraft,
  BindQuoteRequest,
  CancellationRequest,
  ClaimCreateRequest,
  ClaimTriageResult,
  CreateInvoiceRequest,
  CreatePaymentRequest,
  EndorsementRequest,
  GenerateRenewalRequest,
  InvoiceSummary,
  PolicySummary,
  PortalDashboardResponse,
  QuoteSummary,
  RiskAssessmentResult
} from "@/lib/contracts";

import { createAuditEvent, type AuditEvent } from "./audit";
import { createBusinessNumber, createEntityId } from "./ids";

type StoredApplication = {
  id: string;
  status: "submitted";
  org_id: string;
  created_at: string;
  updated_at: string;
  payload: ApplicationDraft;
};

type StoredRiskAssessment = {
  id: string;
  application_id: string;
  org_id: string;
  created_at: string;
  result: RiskAssessmentResult;
};

type StoredQuote = QuoteSummary;
type StoredPolicy = PolicySummary;
type StoredInvoice = InvoiceSummary;

type StoredClaim = {
  claim_id: string;
  claim_number: string;
  org_id: string;
  policy_id: string;
  status: "open" | "closed";
  reported_by: ClaimCreateRequest["reported_by"];
  incident_date: string;
  description: string;
  estimated_loss_amount: number;
  triage: ClaimTriageResult | null;
  created_at: string;
};

type StoredPayment = {
  payment_id: string;
  org_id: string;
  invoice_id: string;
  amount: number;
  payment_method: "ach" | "card" | "manual";
  external_reference: string | null;
  created_at: string;
};

type StoredEndorsement = {
  endorsement_id: string;
  policy_id: string;
  org_id: string;
  reason: string;
  effective_date: string;
  changes: Record<string, unknown>;
  status: "issued";
  created_at: string;
};

type StoredRenewal = {
  renewal_offer_id: string;
  policy_id: string;
  org_id: string;
  target_effective_date: string;
  status: "offered";
  created_at: string;
};

type StoredCancellation = {
  cancellation_id: string;
  policy_id: string;
  org_id: string;
  reason: string;
  requested_cancel_date: string;
  status: "requested";
  created_at: string;
};

type PolicyCoreStore = {
  applications: Map<string, StoredApplication>;
  riskAssessments: Map<string, StoredRiskAssessment>;
  quotes: Map<string, StoredQuote>;
  policies: Map<string, StoredPolicy>;
  endorsements: Map<string, StoredEndorsement>;
  renewals: Map<string, StoredRenewal>;
  cancellations: Map<string, StoredCancellation>;
  invoices: Map<string, StoredInvoice>;
  payments: Map<string, StoredPayment>;
  claims: Map<string, StoredClaim>;
  auditLogs: AuditEvent[];
};

declare global {
  var __policycoreStore: PolicyCoreStore | undefined;
}

function getStore(): PolicyCoreStore {
  if (!globalThis.__policycoreStore) {
    globalThis.__policycoreStore = {
      applications: new Map(),
      riskAssessments: new Map(),
      quotes: new Map(),
      policies: new Map(),
      endorsements: new Map(),
      renewals: new Map(),
      cancellations: new Map(),
      invoices: new Map(),
      payments: new Map(),
      claims: new Map(),
      auditLogs: []
    };
  }

  return globalThis.__policycoreStore;
}

function nowIso() {
  return new Date().toISOString();
}

export function addAuditEvent(params: Omit<AuditEvent, "id" | "created_at">) {
  const store = getStore();
  const event = createAuditEvent(params);
  store.auditLogs.unshift(event);
  return event;
}

export function createApplication(payload: ApplicationDraft) {
  const store = getStore();
  const id = createEntityId();
  const createdAt = nowIso();

  const record: StoredApplication = {
    id,
    org_id: payload.org_id,
    status: "submitted",
    created_at: createdAt,
    updated_at: createdAt,
    payload
  };

  store.applications.set(id, record);
  return record;
}

export function getApplication(applicationId: string) {
  return getStore().applications.get(applicationId) ?? null;
}

export function createRiskAssessment(applicationId: string, orgId: string, result: RiskAssessmentResult) {
  const store = getStore();
  const id = createEntityId();
  const record: StoredRiskAssessment = {
    id,
    application_id: applicationId,
    org_id: orgId,
    created_at: nowIso(),
    result
  };
  store.riskAssessments.set(id, record);
  return record;
}

export function createQuote(input: Omit<QuoteSummary, "quote_id" | "quote_number" | "created_at">) {
  const store = getStore();
  const quote: StoredQuote = {
    ...input,
    quote_id: createEntityId(),
    quote_number: createBusinessNumber("QTE"),
    created_at: nowIso()
  };
  store.quotes.set(quote.quote_id, quote);
  return quote;
}

export function getQuote(quoteId: string) {
  return getStore().quotes.get(quoteId) ?? null;
}

export function bindQuote(quote: StoredQuote, request: BindQuoteRequest) {
  const store = getStore();

  const policy: StoredPolicy = {
    policy_id: createEntityId(),
    policy_number: createBusinessNumber("POL"),
    quote_id: quote.quote_id,
    org_id: request.org_id,
    status: "active",
    effective_date: request.effective_date,
    expiration_date: request.expiration_date,
    created_at: nowIso()
  };
  store.policies.set(policy.policy_id, policy);

  const invoice: StoredInvoice = {
    invoice_id: createEntityId(),
    invoice_number: createBusinessNumber("INV"),
    policy_id: policy.policy_id,
    org_id: request.org_id,
    amount_due: quote.total_premium,
    status: "open",
    due_date: request.effective_date,
    currency: "USD",
    created_at: nowIso()
  };
  store.invoices.set(invoice.invoice_id, invoice);

  store.quotes.set(quote.quote_id, { ...quote, status: "bound" });
  return { policy, invoice };
}

export function createEndorsement(request: EndorsementRequest) {
  const store = getStore();
  const record: StoredEndorsement = {
    endorsement_id: createEntityId(),
    policy_id: request.policy_id,
    org_id: request.org_id,
    reason: request.reason,
    effective_date: request.effective_date,
    changes: request.changes,
    status: "issued",
    created_at: nowIso()
  };
  store.endorsements.set(record.endorsement_id, record);
  return record;
}

export function createRenewalOffer(policyId: string, request: GenerateRenewalRequest) {
  const store = getStore();
  const record: StoredRenewal = {
    renewal_offer_id: createEntityId(),
    policy_id: policyId,
    org_id: request.org_id,
    target_effective_date: request.target_effective_date,
    status: "offered",
    created_at: nowIso()
  };
  store.renewals.set(record.renewal_offer_id, record);
  return record;
}

export function createCancellation(policyId: string, request: CancellationRequest) {
  const store = getStore();
  const record: StoredCancellation = {
    cancellation_id: createEntityId(),
    policy_id: policyId,
    org_id: request.org_id,
    reason: request.reason,
    requested_cancel_date: request.requested_cancel_date,
    status: "requested",
    created_at: nowIso()
  };
  store.cancellations.set(record.cancellation_id, record);
  return record;
}

export function createInvoice(request: CreateInvoiceRequest) {
  const store = getStore();
  const invoice: StoredInvoice = {
    invoice_id: createEntityId(),
    invoice_number: createBusinessNumber("INV"),
    policy_id: request.policy_id,
    org_id: request.org_id,
    amount_due: request.amount_due,
    status: "open",
    due_date: request.due_date,
    currency: "USD",
    created_at: nowIso()
  };
  store.invoices.set(invoice.invoice_id, invoice);
  return invoice;
}

export function createPayment(request: CreatePaymentRequest) {
  const store = getStore();
  const payment: StoredPayment = {
    payment_id: createEntityId(),
    org_id: request.org_id,
    invoice_id: request.invoice_id,
    amount: request.amount,
    payment_method: request.payment_method,
    external_reference: request.external_reference ?? null,
    created_at: nowIso()
  };
  store.payments.set(payment.payment_id, payment);

  const invoice = store.invoices.get(request.invoice_id);
  if (invoice) {
    const nextAmount = Math.max(0, invoice.amount_due - request.amount);
    store.invoices.set(invoice.invoice_id, {
      ...invoice,
      amount_due: nextAmount,
      status: nextAmount <= 0 ? "paid" : invoice.status
    });
  }

  return payment;
}

export function createClaim(request: ClaimCreateRequest) {
  const store = getStore();
  const claim: StoredClaim = {
    claim_id: createEntityId(),
    claim_number: createBusinessNumber("CLM"),
    org_id: request.org_id,
    policy_id: request.policy_id,
    status: "open",
    reported_by: request.reported_by,
    incident_date: request.incident_date,
    description: request.description,
    estimated_loss_amount: request.estimated_loss_amount,
    triage: null,
    created_at: nowIso()
  };
  store.claims.set(claim.claim_id, claim);
  return claim;
}

export function getClaim(claimId: string) {
  return getStore().claims.get(claimId) ?? null;
}

export function setClaimTriage(claimId: string, triage: ClaimTriageResult) {
  const store = getStore();
  const claim = store.claims.get(claimId);
  if (!claim) return null;
  const updated = { ...claim, triage };
  store.claims.set(claimId, updated);
  return updated;
}

export function listCustomerPolicies(orgId?: string) {
  const values = [...getStore().policies.values()];
  if (!orgId) return values;
  return values.filter((policy) => policy.org_id === orgId);
}

export function listAgentQuotes(orgId?: string) {
  const values = [...getStore().quotes.values()];
  if (!orgId) return values;
  return values.filter((quote) => quote.org_id === orgId);
}

export function buildDashboard(orgId: string): PortalDashboardResponse {
  const store = getStore();
  const applications = [...store.applications.values()].filter((x) => x.org_id === orgId);
  const quotes = [...store.quotes.values()].filter((x) => x.org_id === orgId);
  const policies = [...store.policies.values()].filter((x) => x.org_id === orgId);
  const claims = [...store.claims.values()].filter((x) => x.org_id === orgId);
  const invoices = [...store.invoices.values()].filter((x) => x.org_id === orgId);
  const payments = [...store.payments.values()].filter((x) => x.org_id === orgId);

  const writtenPremium = quotes.reduce((acc, current) => acc + current.total_premium, 0);
  const paidPremium = payments.reduce((acc, current) => acc + current.amount, 0);
  const outstandingInvoices = invoices
    .filter((invoice) => invoice.status === "open")
    .reduce((acc, current) => acc + current.amount_due, 0);

  return {
    org_id: orgId,
    snapshot_at: nowIso(),
    counts: {
      applications: applications.length,
      quotes: quotes.length,
      policies: policies.length,
      open_claims: claims.filter((claim) => claim.status === "open").length,
      open_invoices: invoices.filter((invoice) => invoice.status === "open").length
    },
    totals: {
      written_premium: Math.round(writtenPremium * 100) / 100,
      paid_premium: Math.round(paidPremium * 100) / 100,
      outstanding_invoices: Math.round(outstandingInvoices * 100) / 100
    }
  };
}

export function getAuditEvents(orgId?: string) {
  const events = getStore().auditLogs;
  if (!orgId) return events;
  return events.filter((event) => event.org_id === orgId);
}
