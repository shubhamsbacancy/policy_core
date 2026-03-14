import Link from "next/link";

import { getCurrentOrgIdFromCookie, getOrgAndPersona, getSessionUser } from "@/lib/auth";
import { DEMO_ORG_ID } from "@/lib/constants";
import { repoBuildDashboard } from "@/lib/domain/repository";
import { DashboardSummary } from "@/components/reports/dashboard-summary";

export default async function ReportsPage() {
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
          <h2>Reports hub</h2>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: "1.25rem" }}>
        <div className="panel">
          <p className="eyebrow">Dashboard report</p>
          <h3>Counts and premium summary</h3>
          <p className="subtle">Open the dedicated dashboard report view for focused metrics.</p>
          <Link href="/app/reports/dashboard" className="link">
            Open dashboard report
          </Link>
        </div>
        <div className="panel">
          <p className="eyebrow">Audit log</p>
          <h3>Lifecycle event trail</h3>
          <p className="subtle">Review entity actions, actor, and timestamp with filters and pagination.</p>
          <Link href="/app/reports/audit" className="link">
            Open audit log
          </Link>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Embedded snapshot</p>
            <h3>Dashboard summary</h3>
          </div>
        </div>
        <DashboardSummary dashboard={dashboard} />
      </div>
    </div>
  );
}
