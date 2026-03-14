import Link from "next/link";

import { getCurrentOrgIdFromCookie, getOrgAndPersona, getSessionUser } from "@/lib/auth";
import { DEMO_ORG_ID } from "@/lib/constants";
import { repoListPolicies } from "@/lib/domain/repository";
import { FNOLForm } from "./fnol-form";

export default async function NewClaimPage() {
  const user = await getSessionUser();
  const preferredOrgId = await getCurrentOrgIdFromCookie();
  const orgContext = user ? await getOrgAndPersona(user.id, preferredOrgId) : null;
  const orgId = orgContext?.orgId ?? DEMO_ORG_ID;

  const policies = await repoListPolicies(orgId);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Claims</p>
          <h2>File a claim (FNOL)</h2>
        </div>
        <Link href="/app/claims" className="link">
          ← Back to Claims
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
          <p className="subtle">
            No policies in this org. Bind a quote to create a policy first, then you can file a claim.
          </p>
        ) : (
          <FNOLForm orgId={orgId} policies={policies} reportedBy="agent" />
        )}
      </div>
    </div>
  );
}
