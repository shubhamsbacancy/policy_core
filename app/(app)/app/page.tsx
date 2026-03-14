import { StatTiles } from "@/components/ui/stat-tiles";
import { getCurrentOrgIdFromCookie, getOrgAndPersona, getSessionUser } from "@/lib/auth";
import { DEMO_ORG_ID } from "@/lib/constants";
import { repoBuildDashboard } from "@/lib/domain/repository";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const preferredOrgId = await getCurrentOrgIdFromCookie();
  const orgContext = user ? await getOrgAndPersona(user.id, preferredOrgId) : null;
  const orgId = orgContext?.orgId ?? DEMO_ORG_ID;
  const dashboard = await repoBuildDashboard(orgId);

  const stats = [
    { label: "Applications", value: dashboard.counts.applications },
    { label: "Quotes", value: dashboard.counts.quotes },
    { label: "Policies", value: dashboard.counts.policies },
    { label: "Open claims", value: dashboard.counts.open_claims },
    { label: "Open invoices", value: dashboard.counts.open_invoices }
  ];

  const totals = [
    { label: "Written premium", value: dashboard.totals.written_premium, suffix: "USD" },
    { label: "Paid premium", value: dashboard.totals.paid_premium, suffix: "USD" },
    { label: "Outstanding invoices", value: dashboard.totals.outstanding_invoices, suffix: "USD" }
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Org snapshot</p>
          <h2>Dashboard</h2>
        </div>
      </div>
      <StatTiles items={stats} />
      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Premium</p>
              <h3>Written vs Paid</h3>
            </div>
          </div>
          <ul className="totals-list">
            {totals.map((t) => (
              <li key={t.label}>
                <div>
                  <p className="hint">{t.label}</p>
                  <p className="metric">${t.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <span className="badge subtle">{t.suffix}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Next steps</p>
              <h3>Workflow links</h3>
            </div>
          </div>
          <ol className="next-steps">
            <li>
              <span>Create or import an application</span>
              <a href="/app/applications" className="link">
                Go to Applications
              </a>
            </li>
            <li>
              <span>Generate a quote and bind a policy</span>
              <a href="/app/quotes" className="link">
                Go to Quotes
              </a>
            </li>
            <li>
              <span>Submit FNOL and triage with AI</span>
              <a href="/app/claims" className="link">
                Go to Claims
              </a>
            </li>
            <li>
              <span>Review invoices and record payments</span>
              <a href="/app/billing" className="link">
                Go to Billing
              </a>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
