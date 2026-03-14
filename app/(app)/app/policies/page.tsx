import Link from "next/link";
import { cookies } from "next/headers";

import { getCurrentOrgIdFromCookie } from "@/lib/auth/org-cookie";
import { getSessionUser } from "@/lib/auth/session";

type PolicyListItem = {
  policy_id: string;
  policy_number: string;
  status: string;
  effective_date: string;
  expiration_date: string;
  created_at: string;
};

async function fetchPolicies(orgId: string): Promise<PolicyListItem[]> {
  const cookieStore = await cookies();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/v1/customer/policies?org_id=${orgId}`, {
    cache: "no-store",
    headers: { cookie: cookieStore.toString() }
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? json ?? [];
}

export default async function PoliciesPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const orgId = (await getCurrentOrgIdFromCookie()) ?? "";
  const policies = orgId ? await fetchPolicies(orgId) : [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Policies</p>
          <h2>In-force terms</h2>
        </div>
      </div>
      <div className="table">
        <div className="table-head">
          <span>Policy #</span>
          <span>Status</span>
          <span>Effective</span>
          <span>Expires</span>
          <span />
        </div>
        {policies.length === 0 && <div className="table-row muted">No policies yet. Bind a quote to create one.</div>}
        {policies.map((p) => (
          <div className="table-row" key={p.policy_id}>
            <span>{p.policy_number}</span>
            <span className="pill subtle">{p.status}</span>
            <span>{p.effective_date}</span>
            <span>{p.expiration_date}</span>
            <Link href={`/app/policies/${p.policy_id}`} className="link">
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
