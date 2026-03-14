import { z } from "zod";

export const UuidSchema = z.string().uuid();
export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const MoneySchema = z.number().finite().nonnegative();

export const PersonaSchema = z.enum(["ops_admin", "agent", "customer"]);
export type Persona = z.infer<typeof PersonaSchema>;

export const RiskTierSchema = z.enum(["low", "medium", "high"]);
export const RecommendedActionSchema = z.enum(["approve", "refer", "decline"]);

export const ApplicationDraftSchema = z.object({
  org_id: UuidSchema,
  agent_user_id: UuidSchema.optional(),
  effective_date: IsoDateSchema,
  policyholder: z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(7).optional()
  }),
  property: z.object({
    address_line_1: z.string().min(1),
    city: z.string().min(1),
    state: z.literal("TX"),
    postal_code: z.string().min(5).max(10),
    construction_type: z.enum(["frame", "masonry", "mixed"]),
    occupancy: z.enum(["owner_occupied", "tenant_occupied", "vacant"]),
    year_built: z.number().int().gte(1800).lte(2100),
    square_footage: z.number().int().gte(250),
    roof_age_years: z.number().int().gte(0).lte(100),
    replacement_cost: MoneySchema,
    territory_code: z.string().min(2),
    prior_claims_count: z.number().int().gte(0).lte(15)
  }),
  coverage: z.object({
    dwelling_limit: MoneySchema,
    liability_limit: MoneySchema,
    deductible: MoneySchema
  }),
  notes: z.string().max(4000).optional()
});
export type ApplicationDraft = z.infer<typeof ApplicationDraftSchema>;

export const RiskAssessmentResultSchema = z.object({
  risk_score: z.number().int().min(0).max(100),
  risk_tier: RiskTierSchema,
  flags: z.array(z.string()).default([]),
  explanation: z.string().min(1),
  recommended_action: RecommendedActionSchema,
  provider: z.string(),
  model: z.string(),
  generated_at: z.string()
});
export type RiskAssessmentResult = z.infer<typeof RiskAssessmentResultSchema>;

export const QuoteSummarySchema = z.object({
  quote_id: UuidSchema,
  quote_number: z.string().min(1),
  application_id: UuidSchema,
  org_id: UuidSchema,
  status: z.enum(["quoted", "bound", "expired"]),
  premium: MoneySchema,
  fees: MoneySchema,
  taxes: MoneySchema,
  total_premium: MoneySchema,
  currency: z.literal("USD"),
  rating_breakdown: z.record(z.string(), z.number().finite()),
  created_at: z.string()
});
export type QuoteSummary = z.infer<typeof QuoteSummarySchema>;

export const PolicySummarySchema = z.object({
  policy_id: UuidSchema,
  policy_number: z.string().min(1),
  quote_id: UuidSchema,
  org_id: UuidSchema,
  status: z.enum(["active", "cancelled", "non_renewed", "expired"]),
  effective_date: IsoDateSchema,
  expiration_date: IsoDateSchema,
  created_at: z.string()
});
export type PolicySummary = z.infer<typeof PolicySummarySchema>;

export const EndorsementRequestSchema = z.object({
  policy_id: UuidSchema,
  org_id: UuidSchema,
  reason: z.string().min(3),
  effective_date: IsoDateSchema,
  changes: z.record(z.string(), z.unknown())
});
export type EndorsementRequest = z.infer<typeof EndorsementRequestSchema>;

export const InvoiceSummarySchema = z.object({
  invoice_id: UuidSchema,
  invoice_number: z.string().min(1),
  policy_id: UuidSchema,
  org_id: UuidSchema,
  amount_due: MoneySchema,
  status: z.enum(["open", "paid", "overdue", "void"]),
  due_date: IsoDateSchema,
  currency: z.literal("USD"),
  created_at: z.string()
});
export type InvoiceSummary = z.infer<typeof InvoiceSummarySchema>;

export const ClaimCreateRequestSchema = z.object({
  org_id: UuidSchema,
  policy_id: UuidSchema,
  reported_by: z.enum(["agent", "customer", "ops_admin"]),
  incident_date: IsoDateSchema,
  description: z.string().min(10).max(5000),
  estimated_loss_amount: MoneySchema,
  document_refs: z.array(z.string()).default([])
});
export type ClaimCreateRequest = z.infer<typeof ClaimCreateRequestSchema>;

export const ClaimTriageResultSchema = z.object({
  severity: RiskTierSchema,
  fraud_signal: RiskTierSchema,
  next_steps: z.array(z.string()),
  summary: z.string().min(1),
  provider: z.string(),
  model: z.string(),
  generated_at: z.string()
});
export type ClaimTriageResult = z.infer<typeof ClaimTriageResultSchema>;

export const PortalDashboardResponseSchema = z.object({
  org_id: UuidSchema,
  snapshot_at: z.string(),
  counts: z.object({
    applications: z.number().int().nonnegative(),
    quotes: z.number().int().nonnegative(),
    policies: z.number().int().nonnegative(),
    open_claims: z.number().int().nonnegative(),
    open_invoices: z.number().int().nonnegative()
  }),
  totals: z.object({
    written_premium: MoneySchema,
    paid_premium: MoneySchema,
    outstanding_invoices: MoneySchema
  })
});
export type PortalDashboardResponse = z.infer<typeof PortalDashboardResponseSchema>;

export const CreateQuoteRequestSchema = z.object({
  org_id: UuidSchema,
  application_id: UuidSchema
});
export type CreateQuoteRequest = z.infer<typeof CreateQuoteRequestSchema>;

export const BindQuoteRequestSchema = z.object({
  org_id: UuidSchema,
  effective_date: IsoDateSchema,
  expiration_date: IsoDateSchema
});
export type BindQuoteRequest = z.infer<typeof BindQuoteRequestSchema>;

export const GenerateRenewalRequestSchema = z.object({
  org_id: UuidSchema,
  target_effective_date: IsoDateSchema
});
export type GenerateRenewalRequest = z.infer<typeof GenerateRenewalRequestSchema>;

export const CancellationRequestSchema = z.object({
  org_id: UuidSchema,
  reason: z.string().min(3),
  requested_cancel_date: IsoDateSchema
});
export type CancellationRequest = z.infer<typeof CancellationRequestSchema>;

export const CreateInvoiceRequestSchema = z.object({
  org_id: UuidSchema,
  policy_id: UuidSchema,
  amount_due: MoneySchema,
  due_date: IsoDateSchema
});
export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceRequestSchema>;

export const CreatePaymentRequestSchema = z.object({
  org_id: UuidSchema,
  invoice_id: UuidSchema,
  amount: MoneySchema,
  payment_method: z.enum(["ach", "card", "manual"]),
  external_reference: z.string().max(120).optional()
});
export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequestSchema>;

export const TriageClaimRequestSchema = z.object({
  org_id: UuidSchema,
  adjuster_notes: z.string().max(4000).optional()
});
export type TriageClaimRequest = z.infer<typeof TriageClaimRequestSchema>;

export const DocumentEntityTypeSchema = z.enum(["application", "claim"]);
export type DocumentEntityType = z.infer<typeof DocumentEntityTypeSchema>;

export const DocumentRecordSchema = z.object({
  document_id: UuidSchema,
  org_id: UuidSchema,
  entity_type: DocumentEntityTypeSchema,
  entity_id: UuidSchema,
  file_name: z.string().min(1),
  content_type: z.string().optional().nullable(),
  size_bytes: z.number().int().nonnegative().optional().nullable(),
  storage_bucket: z.string().min(1),
  storage_path: z.string().min(1),
  status: z.enum(["pending", "uploaded", "failed"]),
  created_at: z.string()
});
export type DocumentRecord = z.infer<typeof DocumentRecordSchema>;

export const DocumentCreateUploadRequestSchema = z.object({
  org_id: UuidSchema,
  entity_type: DocumentEntityTypeSchema,
  entity_id: UuidSchema,
  file_name: z.string().min(1),
  content_type: z.string().optional(),
  size_bytes: z.number().int().nonnegative().optional()
});
export type DocumentCreateUploadRequest = z.infer<typeof DocumentCreateUploadRequestSchema>;

export const DocumentCreateUploadResponseSchema = z.object({
  document: DocumentRecordSchema,
  upload: z.object({
    bucket: z.string().min(1),
    path: z.string().min(1),
    token: z.string().min(1)
    ,
    url: z.string().min(1)
  })
});
export type DocumentCreateUploadResponse = z.infer<typeof DocumentCreateUploadResponseSchema>;

export const DocumentConfirmUploadRequestSchema = z.object({
  org_id: UuidSchema,
  document_id: UuidSchema,
  size_bytes: z.number().int().nonnegative().optional()
});
export type DocumentConfirmUploadRequest = z.infer<typeof DocumentConfirmUploadRequestSchema>;

export const DocumentListResponseSchema = z.object({
  documents: z.array(DocumentRecordSchema)
});
export type DocumentListResponse = z.infer<typeof DocumentListResponseSchema>;
