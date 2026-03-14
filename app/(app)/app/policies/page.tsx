import Link from "next/link";

import { getCurrentOrgIdFromCookie } from "@/lib/auth/org-cookie";
import { getSessionUser } from "@/lib/auth/session";
import { repoListPolicies } from "@/lib/domain/repository";

type PolicyListItem = {
  policy_id: string;
  policy_number: string;
  status: string;
  effective_date: string;
  expiration_date: string;
  created_at: string;
};

export default async function PoliciesPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const orgId = (await getCurrentOrgIdFromCookie()) ?? "";
  const policies = orgId ? ((await repoListPolicies(orgId)) as PolicyListItem[]) : [];

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
