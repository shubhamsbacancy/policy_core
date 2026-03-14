import Link from "next/link";

import { getCurrentOrgIdFromCookie, getOrgAndPersona, getSessionUser } from "@/lib/auth";
import { DEMO_ORG_ID } from "@/lib/constants";
import { repoGetClaim, repoGetPolicy } from "@/lib/domain/repository";
import { RunTriageButton } from "./run-triage-button";
import type { DocumentEntityType } from "@/lib/contracts";
import { DocumentUploadPanel } from "@/components/documents/upload-panel";

type TriageOutput = {
  severity?: string;
  fraud_signal?: string;
  next_steps?: string[];
  summary?: string;
  provider?: string;
  model?: string;
  generated_at?: string;
};

export default async function ClaimDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  const preferredOrgId = await getCurrentOrgIdFromCookie();
  const orgContext = user ? await getOrgAndPersona(user.id, preferredOrgId) : null;
  const orgId = orgContext?.orgId ?? DEMO_ORG_ID;

  const claim = await repoGetClaim(id);
  if (!claim) {
    return (
      <div className="page">
        <div className="page-header">
          <h2>Claim not found</h2>
          <Link href="/app/claims" className="link">
            Back to Claims
          </Link>
        </div>
      </div>
    );
  }

  if (claim.org_id !== orgId) {
    return (
      <div className="page">
        <div className="page-header">
          <h2>Access denied</h2>
          <Link href="/app/claims" className="link">
            Back to Claims
          </Link>
        </div>
      </div>
    );
  }

  const triage = claim.ai_outputs as TriageOutput | null | undefined;
  const hasTriage = triage && (triage.severity ?? triage.summary);
  const policy = claim.policy_id ? await repoGetPolicy(claim.policy_id) : null;
  const policyLabel = policy?.policy_number ?? `${claim.policy_id.slice(0, 8)}…`;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Claims</p>
          <h2>Claim {claim.claim_number}</h2>
        </div>
        <Link href="/app/claims" className="link">
          ← Back to Claims
        </Link>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Details</p>
              <h3>Claim info</h3>
            </div>
          </div>
          <ul className="totals-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
              <span className="hint">Claim number</span>
              <span>{claim.claim_number}</span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
              <span className="hint">Policy</span>
              <span>
                <Link href={`/app/policies/${claim.policy_id}`} className="link">
                  {policyLabel}
                </Link>
              </span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
              <span className="hint">Incident date</span>
              <span>{claim.incident_date}</span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
              <span className="hint">Estimated loss</span>
              <span className="metric">${Number(claim.estimated_loss_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
              <span className="hint">Status</span>
              <span className={`badge ${claim.status === "open" ? "" : "subtle"}`}>{claim.status}</span>
            </li>
            <li style={{ padding: "0.5rem 0" }}>
              <span className="hint">Description</span>
              <p style={{ margin: "0.35rem 0 0", whiteSpace: "pre-wrap" }}>{claim.description}</p>
            </li>
          </ul>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">AI triage</p>
              <h3>Triage result</h3>
            </div>
            {!hasTriage && (
              <RunTriageButton claimId={claim.id} orgId={claim.org_id} />
            )}
          </div>
          {hasTriage ? (
            <div className="triage-summary">
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                {triage.severity && (
                  <span className="badge">Severity: {triage.severity}</span>
                )}
                {triage.fraud_signal && (
                  <span className="badge subtle">Fraud signal: {triage.fraud_signal}</span>
                )}
              </div>
              {triage.summary && (
                <p style={{ margin: "0 0 0.75rem" }}>{triage.summary}</p>
              )}
              {triage.next_steps && triage.next_steps.length > 0 && (
                <div>
                  <p className="hint" style={{ marginBottom: "0.35rem" }}>Next steps</p>
                  <ol style={{ margin: 0, paddingLeft: "1.2rem" }}>
                    {triage.next_steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
              {(triage.provider ?? triage.generated_at) && (
                <p className="subtle" style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
                  {triage.provider ?? ""} {triage.generated_at ? ` · ${triage.generated_at}` : ""}
                </p>
              )}
            </div>
          ) : (
            <p className="subtle">
              No triage yet. Run AI triage to get severity, fraud signal, and next steps.
            </p>
          )}
        </div>
      </div>
      <DocumentUploadPanel orgId={orgId} entityType={"claim" as DocumentEntityType} entityId={claim.id} />
    </div>
  );
}
