import Link from "next/link";

import { DashboardSummary } from "@/components/reports/dashboard-summary";
import { getCurrentOrgIdFromCookie, getOrgAndPersona, getSessionUser } from "@/lib/auth";
import { DEMO_ORG_ID } from "@/lib/constants";
import { repoBuildDashboard } from "@/lib/domain/repository";

export default async function ReportsDashboardPage() {
  const user = await getSessionUser();
  const preferredOrgId = await getCurrentOrgIdFromCookie();
  const orgContext = user ? await getOrgAndPersona(user.id, preferredOrgId) : null;
  const orgId = orgContext?.orgId ?? DEMO_ORG_ID;
  const dashboard = await repoBuildDashboard(orgId);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Reports</p>
          <h2>Dashboard report</h2>
        </div>
        <Link href="/app/reports" className="link">
          Back to reports hub
        </Link>
      </div>
      <DashboardSummary dashboard={dashboard} />
    </div>
  );
}
