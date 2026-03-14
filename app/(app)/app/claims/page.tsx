import Link from "next/link";

import { getCurrentOrgIdFromCookie, getOrgAndPersona, getSessionUser } from "@/lib/auth";
import { DEMO_ORG_ID } from "@/lib/constants";
import { repoListClaims } from "@/lib/domain/repository";

export default async function ClaimsPage() {
  const user = await getSessionUser();
  const preferredOrgId = await getCurrentOrgIdFromCookie();
  const orgContext = user ? await getOrgAndPersona(user.id, preferredOrgId) : null;
  const orgId = orgContext?.orgId ?? DEMO_ORG_ID;

  const claims = await repoListClaims(orgId);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Claims</p>
          <h2>FNOL list</h2>
        </div>
        <Link href="/app/claims/new" className="primary">
          New claim
        </Link>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">All claims</p>
            <h3>Claims</h3>
          </div>
        </div>
        {claims.length === 0 ? (
          <p className="subtle">
            No claims yet. <Link href="/app/claims/new" className="link">File a new claim (FNOL)</Link>.
          </p>
        ) : (
          <div className="billing-table">
            <div className="billing-table-head">
              <span>Claim #</span>
              <span>Policy</span>
              <span>Incident date</span>
              <span>Est. loss</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {claims.map((c) => (
              <div key={c.claim_id} className="billing-table-row">
                <span>
                  <Link href={`/app/claims/${c.claim_id}`} className="link">
                    {c.claim_number}
                  </Link>
                </span>
                <span>
                  {c.policy_number ? (
                    <Link href={`/app/policies/${c.policy_id}`} className="link">
                      {c.policy_number}
                    </Link>
                  ) : (
                    c.policy_id?.slice(0, 8) ?? "—"
                  )}
                </span>
                <span>{c.incident_date}</span>
                <span>${c.estimated_loss_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span>
                  <span className={`badge ${c.status === "open" ? "" : "subtle"}`}>{c.status}</span>
                </span>
                <span>
                  <Link href={`/app/claims/${c.claim_id}`} className="link">
                    View
                  </Link>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
