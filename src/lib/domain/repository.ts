// @ts-nocheck

import {
  ApplicationDraftSchema,
  CancellationRequestSchema,
  ClaimCreateRequestSchema,
  ClaimTriageResultSchema,
  CreateInvoiceRequestSchema,
  CreatePaymentRequestSchema,
  EndorsementRequestSchema,
  GenerateRenewalRequestSchema,
  InvoiceSummarySchema,
  PortalDashboardResponseSchema,
  QuoteSummarySchema,
  RiskAssessmentResultSchema
} from "@/lib/contracts";
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
  PortalDashboardResponse,
  QuoteSummary,
  RiskAssessmentResult
} from "@/lib/contracts";

import { createBusinessNumber } from "./ids";
import { calculateDeterministicPremium } from "./rating";
import { createSupabaseServiceClient } from "../supabase/admin";

type RepoResult<T> = { data: T | null; error?: Error };

function mapError<T>(message: string, error: unknown): RepoResult<T> {
  const normalized = error instanceof Error ? error : new Error(String(error ?? message));
  return { data: null, error: new Error(`${message}: ${normalized.message}`) };
}

export async function repoCreateApplication(payload: ApplicationDraft): Promise<{ id: string }> {
  const validated = ApplicationDraftSchema.parse(payload);
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("applications" as any)
    .insert({
      org_id: validated.org_id,
      data: validated,
      status: "submitted"
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create application");
  return { id: data.id as string };
}

export async function repoGetApplication(id: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("applications" as any)
    .select("id, org_id, status, data, created_at, updated_at")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data;
}

export async function repoListApplications(orgId?: string) {
  const supabase = createSupabaseServiceClient();
  const query = supabase
    .from("applications" as any)
    .select("id, org_id, status, data, created_at, updated_at")
    .order("created_at", { ascending: false });
  const { data, error } = orgId ? await query.eq("org_id", orgId) : await query;
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id as string,
    org_id: row.org_id as string,
    status: row.status as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    policyholder: (row.data as any)?.policyholder,
    property: (row.data as any)?.property,
    coverage: (row.data as any)?.coverage
  }));
}

export async function repoCreateRiskAssessment(applicationId: string, orgId: string, result: RiskAssessmentResult) {
  const validated = RiskAssessmentResultSchema.parse(result);
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("risk_assessments" as any)
    .insert({
      application_id: applicationId,
      org_id: orgId,
      ai_inputs: {},
      ai_outputs: validated,
      risk_score: validated.risk_score,
      risk_tier: validated.risk_tier,
      recommended_action: validated.recommended_action,
      status: "generated"
    })
    .select("id, created_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create risk assessment");
  return { ...data, result: validated };
}

export async function repoCreateQuote(input: {
  application_id: string;
  org_id: string;
  rating_breakdown: Record<string, number>;
  total_premium: number;
  premium: number;
  taxes: number;
  fees: number;
  currency: string;
}): Promise<QuoteSummary> {
  const base: Omit<QuoteSummary, "quote_id" | "quote_number" | "created_at" | "rating_breakdown"> = {
    application_id: input.application_id,
    org_id: input.org_id,
    status: "quoted",
    premium: input.premium,
    taxes: input.taxes,
    fees: input.fees,
    total_premium: input.total_premium,
    currency: input.currency as "USD"
  };
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("quotes" as any)
    .insert({
      ...base,
      rating_breakdown: input.rating_breakdown,
      coverage_snapshot: {},
      quote_number: createBusinessNumber("QTE")
    })
    .select(
      "id, quote_number, created_at, application_id, org_id, status, premium, fees, taxes, total_premium, currency, rating_breakdown"
    )
    .single();
  if (error || !data) throw error ?? new Error("Failed to create quote");
  return QuoteSummarySchema.parse({
    quote_id: data.id,
    quote_number: data.quote_number,
    application_id: data.application_id,
    org_id: data.org_id,
    status: data.status,
    premium: Number(data.premium),
    taxes: Number(data.taxes),
    fees: Number(data.fees),
    total_premium: Number(data.total_premium),
    currency: data.currency,
    rating_breakdown: data.rating_breakdown,
    created_at: data.created_at
  });
}

export async function repoGetQuote(id: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("quotes" as any)
    .select("id, quote_number, application_id, org_id, status, premium, taxes, fees, total_premium, currency, rating_breakdown, created_at")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return QuoteSummarySchema.parse({
    quote_id: data.id,
    quote_number: data.quote_number,
    application_id: data.application_id,
    org_id: data.org_id,
    status: data.status,
    premium: Number(data.premium),
    taxes: Number(data.taxes),
    fees: Number(data.fees),
    total_premium: Number(data.total_premium),
    currency: data.currency,
    rating_breakdown: data.rating_breakdown,
    created_at: data.created_at
  });
}

export async function repoBindQuote(quote: QuoteSummary, request: BindQuoteRequest) {
  const supabase = createSupabaseServiceClient();

  const policyNumber = createBusinessNumber("POL");
  const invoiceNumber = createBusinessNumber("INV");

  const policyResult = await supabase
    .from("policies" as any)
    .insert({
      org_id: request.org_id,
      quote_id: quote.quote_id,
      policy_number: policyNumber,
      effective_date: request.effective_date,
      expiration_date: request.expiration_date,
      status: "active"
    })
    .select("id, policy_number, created_at, effective_date, expiration_date, status")
    .single();
  if (policyResult.error || !policyResult.data) throw policyResult.error ?? new Error("Failed to insert policy");

  const invoiceResult = await supabase
    .from("invoices" as any)
    .insert({
      org_id: request.org_id,
      policy_id: policyResult.data.id,
      invoice_number: invoiceNumber,
      amount_due: quote.total_premium,
      due_date: request.effective_date,
      currency: "USD",
      status: "open"
    })
    .select("id, invoice_number, created_at, amount_due, status, due_date, currency, org_id, policy_id")
    .single();
  if (invoiceResult.error || !invoiceResult.data) throw invoiceResult.error ?? new Error("Failed to insert invoice");

  const quoteResult = await supabase.from("quotes" as any).update({ status: "bound" }).eq("id", quote.quote_id);
  if (quoteResult.error) throw quoteResult.error;

  return {
    policy: {
      policy_id: policyResult.data.id,
      policy_number: policyResult.data.policy_number,
      quote_id: quote.quote_id,
      org_id: request.org_id,
      status: policyResult.data.status,
      effective_date: policyResult.data.effective_date,
      expiration_date: policyResult.data.expiration_date,
      created_at: policyResult.data.created_at
    },
    invoice: InvoiceSummarySchema.parse({
      invoice_id: invoiceResult.data.id,
      invoice_number: invoiceResult.data.invoice_number,
      policy_id: policyResult.data.id,
      org_id: request.org_id,
      amount_due: Number(invoiceResult.data.amount_due),
      status: invoiceResult.data.status,
      due_date: invoiceResult.data.due_date,
      currency: invoiceResult.data.currency,
      created_at: invoiceResult.data.created_at
    })
  };
}

export async function repoCreateEndorsement(request: EndorsementRequest) {
  const validated = EndorsementRequestSchema.parse(request);
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("endorsements" as any)
    .insert({
      org_id: validated.org_id,
      policy_id: validated.policy_id,
      change_set: validated.changes,
      effective_date: validated.effective_date,
      reason: validated.reason,
      status: "issued"
    })
    .select("id, created_at, status, effective_date, policy_id, org_id, reason, change_set")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create endorsement");
  return {
    endorsement_id: data.id,
    policy_id: data.policy_id,
    org_id: data.org_id,
    reason: data.reason ?? "",
    effective_date: data.effective_date,
    changes: data.change_set,
    status: data.status,
    created_at: data.created_at
  };
}

export async function repoCreateRenewalOffer(policyId: string, request: GenerateRenewalRequest) {
  try {
    const validated = GenerateRenewalRequestSchema.parse(request);
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("renewal_offers")
      .insert({
        org_id: validated.org_id,
        policy_id: policyId,
        target_effective_date: validated.target_effective_date,
        status: "offered",
        offer_payload: {}
      })
      .select("id, created_at, org_id, policy_id, target_effective_date, status")
      .single();
    if (error || !data) return mapError("Failed to create renewal offer", error ?? new Error("No data"));
    return { data };
  } catch (error) {
    return mapError("Validation failed", error);
  }
}

export async function repoCreateCancellation(policyId: string, request: CancellationRequest) {
  try {
    const validated = CancellationRequestSchema.parse(request);
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("cancellations")
      .insert({
        org_id: validated.org_id,
        policy_id: policyId,
        reason: validated.reason,
        requested_cancel_date: validated.requested_cancel_date,
        status: "requested"
      })
      .select("id, created_at, org_id, policy_id, reason, requested_cancel_date, status")
      .single();
    if (error || !data) return mapError("Failed to create cancellation", error ?? new Error("No data"));
    return { data };
  } catch (error) {
    return mapError("Validation failed", error);
  }
}

export async function repoCreateInvoice(request: CreateInvoiceRequest) {
  try {
    const validated = CreateInvoiceRequestSchema.parse(request);
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("invoices")
      .insert({
        org_id: validated.org_id,
        policy_id: validated.policy_id,
        invoice_number: createBusinessNumber("INV"),
        amount_due: validated.amount_due,
        due_date: validated.due_date,
        currency: "USD",
        status: "open"
      })
      .select("id, invoice_number, created_at, org_id, policy_id, amount_due, status, due_date, currency")
      .single();
    if (error || !data) return mapError("Failed to create invoice", error ?? new Error("No data"));
    return {
      data: InvoiceSummarySchema.parse({
        invoice_id: data.id,
        invoice_number: data.invoice_number,
        policy_id: data.policy_id,
        org_id: data.org_id,
        amount_due: Number(data.amount_due),
        status: data.status,
        due_date: data.due_date,
        currency: data.currency,
        created_at: data.created_at
      })
    };
  } catch (error) {
    return mapError("Validation failed", error);
  }
}

export async function repoCreatePayment(request: CreatePaymentRequest) {
  try {
    const validated = CreatePaymentRequestSchema.parse(request);
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("payments")
      .insert({
        org_id: validated.org_id,
        invoice_id: validated.invoice_id,
        amount: validated.amount,
        payment_method: validated.payment_method,
        external_reference: validated.external_reference ?? null,
        status: "recorded"
      })
      .select("id, org_id, invoice_id, amount, payment_method, external_reference, created_at, status")
      .single();
    if (error || !data) return mapError("Failed to record payment", error ?? new Error("No data"));

    const invoice = await supabase.from("invoices").select("amount_due, status").eq("id", validated.invoice_id).single();
    if (!invoice.error && invoice.data) {
      const remaining = Math.max(0, Number(invoice.data.amount_due) - validated.amount);
      await supabase
        .from("invoices")
        .update({ amount_due: remaining, status: remaining <= 0 ? "paid" : invoice.data.status })
        .eq("id", validated.invoice_id);
    }

    return { data };
  } catch (error) {
    return mapError("Validation failed", error);
  }
}

export async function repoCreateClaim(request: ClaimCreateRequest) {
  try {
    const validated = ClaimCreateRequestSchema.parse(request);
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("claims")
      .insert({
        org_id: validated.org_id,
        policy_id: validated.policy_id,
        claim_number: createBusinessNumber("CLM"),
        incident_date: validated.incident_date,
        description: validated.description,
        estimated_loss_amount: validated.estimated_loss_amount,
        status: "open",
        ai_inputs: validated,
        ai_outputs: {}
      })
      .select("id, claim_number, org_id, policy_id, incident_date, description, estimated_loss_amount, status, created_at, ai_outputs")
      .single();
    if (error || !data) return mapError("Failed to create claim", error ?? new Error("No data"));
    return { data };
  } catch (error) {
    return mapError("Validation failed", error);
  }
}

export async function repoGetClaim(id: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("claims")
    .select("id, claim_number, org_id, policy_id, incident_date, description, estimated_loss_amount, status, ai_inputs, ai_outputs, created_at")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as {
    id: string;
    claim_number: string;
    org_id: string;
    policy_id: string;
    incident_date: string;
    description: string;
    estimated_loss_amount: number;
    status: string;
    ai_inputs: unknown;
    ai_outputs: unknown;
    created_at: string;
  };
}

/** Claim list item with policy_number for display. */
export type ClaimListItem = {
  claim_id: string;
  claim_number: string;
  policy_id: string;
  policy_number: string | null;
  org_id: string;
  incident_date: string;
  status: string;
  estimated_loss_amount: number;
  created_at: string;
};

export async function repoListClaims(orgId: string): Promise<ClaimListItem[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("claims")
    .select("id, claim_number, policy_id, org_id, incident_date, status, estimated_loss_amount, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const policyIds = [...new Set((data as any[]).map((r) => r.policy_id).filter(Boolean))];
  const policyNumbers: Record<string, string> = {};
  if (policyIds.length > 0) {
    const { data: policies } = await supabase.from("policies").select("id, policy_number").in("id", policyIds);
    (policies ?? []).forEach((p: any) => {
      policyNumbers[p.id] = p.policy_number;
    });
  }
  return (data as any[]).map((c) => ({
    claim_id: c.id,
    claim_number: c.claim_number,
    policy_id: c.policy_id,
    policy_number: c.policy_id ? policyNumbers[c.policy_id] ?? null : null,
    org_id: c.org_id,
    incident_date: c.incident_date,
    status: c.status,
    estimated_loss_amount: Number(c.estimated_loss_amount),
    created_at: c.created_at
  }));
}

export async function repoSetClaimTriage(claimId: string, triage: ClaimTriageResult) {
  try {
    const validated = ClaimTriageResultSchema.parse(triage);
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("claims")
      .update({ ai_outputs: validated })
      .eq("id", claimId)
      .select("id, claim_number, org_id, policy_id, incident_date, description, estimated_loss_amount, status, ai_outputs, created_at")
      .single();
    if (error || !data) return mapError("Failed to update claim triage", error ?? new Error("No data"));
    return { data };
  } catch (error) {
    return mapError("Validation failed", error);
  }
}

export async function repoListPolicies(orgId?: string) {
  const supabase = createSupabaseServiceClient();
  const query = supabase.from("policies").select("id, policy_number, quote_id, org_id, status, effective_date, expiration_date, created_at");
  const { data, error } = orgId ? await query.eq("org_id", orgId) : await query;
  if (error || !data) return [];
  return data.map((p) => ({
    policy_id: p.id,
    policy_number: p.policy_number,
    quote_id: p.quote_id,
    org_id: p.org_id,
    status: p.status,
    effective_date: p.effective_date,
    expiration_date: p.expiration_date,
    created_at: p.created_at
  }));
}

export async function repoGetPolicy(id: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("policies" as any)
    .select("id, policy_number, quote_id, org_id, status, effective_date, expiration_date, created_at")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return {
    policy_id: data.id as string,
    policy_number: data.policy_number as string,
    quote_id: data.quote_id as string,
    org_id: data.org_id as string,
    status: data.status as string,
    effective_date: data.effective_date as string,
    expiration_date: data.expiration_date as string,
    created_at: data.created_at as string
  };
}

export async function repoListInvoicesByPolicy(policyId: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("invoices" as any)
    .select("id, invoice_number, amount_due, status, due_date, currency, created_at")
    .eq("policy_id", policyId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((inv: any) => ({
    invoice_id: inv.id as string,
    invoice_number: inv.invoice_number as string,
    amount_due: Number(inv.amount_due),
    status: inv.status as string,
    due_date: inv.due_date as string,
    currency: inv.currency as string,
    created_at: inv.created_at as string
  }));
}

/** Invoice list item with optional policy_number for display. */
export type InvoiceListItem = {
  invoice_id: string;
  invoice_number: string;
  policy_id: string;
  policy_number: string | null;
  org_id: string;
  amount_due: number;
  status: string;
  due_date: string;
  currency: string;
  created_at: string;
};

export async function repoListInvoices(orgId: string): Promise<InvoiceListItem[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, policy_id, org_id, amount_due, status, due_date, currency, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const policyIds = [...new Set((data as any[]).map((r) => r.policy_id).filter(Boolean))];
  const policyNumbers: Record<string, string> = {};
  if (policyIds.length > 0) {
    const { data: policies } = await supabase
      .from("policies")
      .select("id, policy_number")
      .in("id", policyIds);
    (policies ?? []).forEach((p: any) => {
      policyNumbers[p.id] = p.policy_number;
    });
  }
  return (data as any[]).map((inv) => ({
    invoice_id: inv.id,
    invoice_number: inv.invoice_number,
    policy_id: inv.policy_id,
    policy_number: inv.policy_id ? policyNumbers[inv.policy_id] ?? null : null,
    org_id: inv.org_id,
    amount_due: Number(inv.amount_due),
    status: inv.status,
    due_date: inv.due_date,
    currency: inv.currency,
    created_at: inv.created_at
  }));
}

export async function repoGetInvoice(id: string): Promise<InvoiceSummary & { policy_number?: string | null } | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, policy_id, org_id, amount_due, status, due_date, currency, created_at")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  let policy_number: string | null = null;
  if ((data as any).policy_id) {
    const { data: policy } = await supabase
      .from("policies")
      .select("policy_number")
      .eq("id", (data as any).policy_id)
      .single();
    policy_number = (policy as any)?.policy_number ?? null;
  }
  const summary = InvoiceSummarySchema.parse({
    invoice_id: data.id,
    invoice_number: data.invoice_number,
    policy_id: data.policy_id,
    org_id: data.org_id,
    amount_due: Number(data.amount_due),
    status: data.status,
    due_date: data.due_date,
    currency: data.currency,
    created_at: data.created_at
  });
  return { ...summary, policy_number };
}

export async function repoListQuotes(orgId?: string) {
  const supabase = createSupabaseServiceClient();
  const query = supabase.from("quotes").select("id, quote_number, application_id, org_id, status, premium, taxes, fees, total_premium, currency, rating_breakdown, created_at");
  const { data, error } = orgId ? await query.eq("org_id", orgId) : await query;
  if (error || !data) return [];
  return data.map((q) =>
    QuoteSummarySchema.parse({
      quote_id: q.id,
      quote_number: q.quote_number,
      application_id: q.application_id,
      org_id: q.org_id,
      status: q.status,
      premium: Number(q.premium),
      taxes: Number(q.taxes),
      fees: Number(q.fees),
      total_premium: Number(q.total_premium),
      currency: q.currency,
      rating_breakdown: q.rating_breakdown,
      created_at: q.created_at
    })
  );
}

export async function repoBuildDashboard(orgId: string): Promise<PortalDashboardResponse> {
  const supabase = createSupabaseServiceClient();
  const [applications, quotes, policies, claims, invoices, payments] = await Promise.all([
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("quotes").select("total_premium", { count: "exact" }).eq("org_id", orgId),
    supabase.from("policies").select("id", { count: "exact" }).eq("org_id", orgId),
    supabase.from("claims").select("id, status", { count: "exact" }).eq("org_id", orgId),
    supabase.from("invoices").select("id, amount_due, status", { count: "exact" }).eq("org_id", orgId),
    supabase.from("payments").select("amount").eq("org_id", orgId)
  ]);

  const writtenPremium = (quotes.data ?? []).reduce((sum, q: any) => sum + Number(q.total_premium ?? 0), 0);
  const paidPremium = (payments.data ?? []).reduce((sum, p: any) => sum + Number(p.amount ?? 0), 0);
  const outstanding = (invoices.data ?? [])
    .filter((i: any) => i.status === "open")
    .reduce((sum, i: any) => sum + Number(i.amount_due ?? 0), 0);

  return PortalDashboardResponseSchema.parse({
    org_id: orgId,
    snapshot_at: new Date().toISOString(),
    counts: {
      applications: applications.count ?? 0,
      quotes: quotes.count ?? 0,
      policies: policies.count ?? 0,
      open_claims: (claims.data ?? []).filter((c: any) => c.status === "open").length,
      open_invoices: (invoices.data ?? []).filter((i: any) => i.status === "open").length
    },
    totals: {
      written_premium: Number(writtenPremium.toFixed(2)),
      paid_premium: Number(paidPremium.toFixed(2)),
      outstanding_invoices: Number(outstanding.toFixed(2))
    }
  });
}

export async function repoAddAuditEvent(params: {
  org_id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before_state: unknown;
  after_state: unknown;
}) {
  const supabase = createSupabaseServiceClient();
  await supabase.from("audit_logs").insert({
    org_id: params.org_id,
    actor_user_id: params.actor_user_id,
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    before_state: params.before_state ?? null,
    after_state: params.after_state ?? null,
    status: "recorded"
  });
}

export async function repoListAuditLogs(input: {
  org_id: string;
  page?: number;
  page_size?: number;
  action?: string;
  entity_type?: string;
}) {
  const supabase = createSupabaseServiceClient();
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(input.page_size ?? 20)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("audit_logs")
    .select("id, org_id, actor_user_id, action, entity_type, entity_id, status, created_at", { count: "exact" })
    .eq("org_id", input.org_id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (input.action) query = query.eq("action", input.action);
  if (input.entity_type) query = query.eq("entity_type", input.entity_type);

  const { data, error, count } = await query;
  if (error || !data) {
    return { data: [], page, page_size: pageSize, total: 0, has_next: false };
  }

  const actorIds = [...new Set((data as any[]).map((x) => x.actor_user_id).filter(Boolean))];
  const actorNames: Record<string, string> = {};
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", actorIds);
    (profiles ?? []).forEach((p: any) => {
      actorNames[p.id] = p.full_name ?? p.id;
    });
  }

  const rows = (data as any[]).map((row) => ({
    id: row.id,
    org_id: row.org_id,
    actor_user_id: row.actor_user_id,
    actor_name: row.actor_user_id ? actorNames[row.actor_user_id] ?? row.actor_user_id : null,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    status: row.status,
    created_at: row.created_at
  }));

  return {
    data: rows,
    page,
    page_size: pageSize,
    total: count ?? rows.length,
    has_next: from + rows.length < (count ?? rows.length)
  };
}

export async function repoCreateDocument(params: {
  org_id: string;
  entity_type: string;
  entity_id: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  content_type?: string | null;
  size_bytes?: number | null;
  document_metadata?: Record<string, unknown>;
  status?: string;
}) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("documents" as any)
    .insert({
      org_id: params.org_id,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      storage_bucket: params.storage_bucket,
      storage_path: params.storage_path,
      file_name: params.file_name,
      content_type: params.content_type ?? null,
      size_bytes: params.size_bytes ?? null,
      document_metadata: params.document_metadata ?? {},
      status: params.status ?? "pending"
    })
    .select(
      "id, org_id, entity_type, entity_id, file_name, content_type, size_bytes, storage_bucket, storage_path, status, created_at"
    )
    .single();
  if (error || !data) throw error ?? new Error("Failed to create document record");
  return data;
}

export async function repoListDocuments(params: { org_id: string; entity_type: string; entity_id: string }) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("documents" as any)
    .select(
      "id, org_id, entity_type, entity_id, file_name, content_type, size_bytes, storage_bucket, storage_path, status, created_at"
    )
    .eq("org_id", params.org_id)
    .eq("entity_type", params.entity_type)
    .eq("entity_id", params.entity_id)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function repoGetDocumentById(params: { org_id: string; document_id: string }) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("documents" as any)
    .select(
      "id, org_id, entity_type, entity_id, file_name, content_type, size_bytes, storage_bucket, storage_path, status, created_at"
    )
    .eq("id", params.document_id)
    .eq("org_id", params.org_id)
    .single();
  if (error || !data) return null;
  return data;
}

export async function repoConfirmDocumentUpload(params: { document_id: string; org_id: string; size_bytes?: number }) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("documents" as any)
    .update({ status: "uploaded", size_bytes: params.size_bytes ?? null })
    .eq("id", params.document_id)
    .eq("org_id", params.org_id)
    .select(
      "id, org_id, entity_type, entity_id, file_name, content_type, size_bytes, storage_bucket, storage_path, status, created_at"
    )
    .single();
  if (error || !data) throw error ?? new Error("Failed to confirm document upload");
  return data;
}

export async function repoRatingAndQuote(applicationId: string, orgId: string, application: ApplicationDraft) {
  const rating = calculateDeterministicPremium(application);
  return repoCreateQuote({
    application_id: applicationId,
    org_id: orgId,
    rating_breakdown: rating.breakdown,
    total_premium: rating.totalPremium,
    premium: rating.premium,
    taxes: rating.taxes,
    fees: rating.fees,
    currency: "USD"
  });
}
// @ts-nocheck
