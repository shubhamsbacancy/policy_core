import Link from "next/link";
import { cookies } from "next/headers";

import { getCurrentOrgIdFromCookie } from "@/lib/auth/org-cookie";
import { getSessionUser } from "@/lib/auth/session";

type CustomerClaim = {
  claim_id: string;
  claim_number: string;
  policy_id: string;
  policy_number: string | null;
  incident_date: string;
  estimated_loss_amount: number;
  status: string;
};

async function fetchClaims(orgId: string): Promise<CustomerClaim[]> {
  const cookieStore = await cookies();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/v1/customer/claims?org_id=${orgId}`, {
    cache: "no-store",
    headers: { cookie: cookieStore.toString() }
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? json ?? [];
}

export default async function CustomerClaimsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const orgId = (await getCurrentOrgIdFromCookie()) ?? "";
  const claims = orgId ? await fetchClaims(orgId) : [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Customer Portal</p>
          <h2>My claims</h2>
        </div>
        <Link href="/app/customer/claims/new" className="primary">
          File a claim
        </Link>
      </div>
      <div className="billing-table">
        <div className="billing-table-head">
          <span>Claim #</span>
          <span>Policy</span>
          <span>Incident date</span>
          <span>Est. loss</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {claims.length === 0 && <div className="billing-table-row">No claims found.</div>}
        {claims.map((c) => (
          <div className="billing-table-row" key={c.claim_id}>
            <span>{c.claim_number}</span>
            <span>{c.policy_number ?? c.policy_id.slice(0, 8)}</span>
            <span>{c.incident_date}</span>
            <span>${Number(c.estimated_loss_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span>
              <span className={`badge ${c.status === "open" ? "" : "subtle"}`}>{c.status}</span>
            </span>
            <Link href={`/app/claims/${c.claim_id}`} className="link">
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
