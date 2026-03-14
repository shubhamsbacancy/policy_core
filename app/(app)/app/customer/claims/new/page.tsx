import Link from "next/link";

import { getCurrentOrgIdFromCookie, getOrgAndPersona, getSessionUser } from "@/lib/auth";
import { DEMO_ORG_ID } from "@/lib/constants";
import { repoListPolicies } from "@/lib/domain/repository";
import { FNOLForm } from "../../../claims/new/fnol-form";

export default async function NewCustomerClaimPage() {
  const user = await getSessionUser();
  const preferredOrgId = await getCurrentOrgIdFromCookie();
  const orgContext = user ? await getOrgAndPersona(user.id, preferredOrgId) : null;
  const orgId = orgContext?.orgId ?? DEMO_ORG_ID;

  const policies = await repoListPolicies(orgId);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Customer Portal</p>
          <h2>File a claim (FNOL)</h2>
        </div>
        <Link href="/app/customer/claims" className="link">
          Back to my claims
        </Link>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">First notice of loss</p>
            <h3>New claim</h3>
          </div>
        </div>
        {policies.length === 0 ? (
          <p className="subtle">No active policies found for this organization.</p>
        ) : (
          <FNOLForm
            orgId={orgId}
            policies={policies}
            reportedBy="customer"
            cancelHref="/app/customer/claims"
            successBasePath="/app/claims"
          />
        )}
      </div>
    </div>
  );
}
