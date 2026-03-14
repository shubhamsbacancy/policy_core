import { StatTiles } from "@/components/ui/stat-tiles";
import type { PortalDashboardResponse } from "@/lib/contracts";

export function DashboardSummary({ dashboard }: { dashboard: PortalDashboardResponse }) {
  const stats = [
    { label: "Applications", value: dashboard.counts.applications },
    { label: "Quotes", value: dashboard.counts.quotes },
    { label: "Policies", value: dashboard.counts.policies },
    { label: "Open claims", value: dashboard.counts.open_claims },
    { label: "Open invoices", value: dashboard.counts.open_invoices }
  ];

  return (
    <>
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
            <li>
              <div>
                <p className="hint">Written premium</p>
                <p className="metric">${dashboard.totals.written_premium.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <span className="badge subtle">USD</span>
            </li>
            <li>
              <div>
                <p className="hint">Paid premium</p>
                <p className="metric">${dashboard.totals.paid_premium.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <span className="badge subtle">USD</span>
            </li>
            <li>
              <div>
                <p className="hint">Outstanding invoices</p>
                <p className="metric">${dashboard.totals.outstanding_invoices.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <span className="badge subtle">USD</span>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
