import Link from "next/link";

import { getCurrentOrgIdFromCookie, getOrgAndPersona, getSessionUser } from "@/lib/auth";
import { DEMO_ORG_ID } from "@/lib/constants";
import { repoListInvoices } from "@/lib/domain/repository";

export default async function BillingPage() {
  const user = await getSessionUser();
  const preferredOrgId = await getCurrentOrgIdFromCookie();
  const orgContext = user ? await getOrgAndPersona(user.id, preferredOrgId) : null;
  const orgId = orgContext?.orgId ?? DEMO_ORG_ID;

  const invoices = await repoListInvoices(orgId);
  const openInvoices = invoices.filter((i) => i.status === "open");
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const totalOpen = openInvoices.reduce((sum, i) => sum + i.amount_due, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Billing</p>
          <h2>Invoices</h2>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: "1.5rem" }}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">Summary</p>
            <h3>Open vs paid</h3>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <div>
            <p className="hint">Open invoices</p>
            <p className="metric">{openInvoices.length}</p>
          </div>
          <div>
            <p className="hint">Amount due (open)</p>
            <p className="metric">${totalOpen.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="hint">Paid</p>
            <p className="metric">{paidInvoices.length}</p>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">All invoices</p>
            <h3>Invoice list</h3>
          </div>
        </div>
        {invoices.length === 0 ? (
          <p className="subtle">No invoices yet. Invoices are created when you bind a quote (first premium) or add them manually.</p>
        ) : (
          <div className="billing-table">
            <div className="billing-table-head">
              <span>Invoice #</span>
              <span>Policy</span>
              <span>Amount due</span>
              <span>Due date</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {invoices.map((inv) => (
              <div key={inv.invoice_id} className="billing-table-row">
                <span>
                  <Link href={`/app/billing/invoices/${inv.invoice_id}`} className="link">
                    {inv.invoice_number}
                  </Link>
                </span>
                <span>
                  {inv.policy_number ? (
                    <Link href={`/app/policies/${inv.policy_id}`} className="link">
                      {inv.policy_number}
                    </Link>
                  ) : (
                    inv.policy_id?.slice(0, 8) ?? "—"
                  )}
                </span>
                <span>${inv.amount_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span>{inv.due_date}</span>
                <span>
                  <span className={`badge ${inv.status === "open" ? "" : "subtle"}`}>{inv.status}</span>
                </span>
                <span>
                  {inv.status === "open" ? (
                    <Link href={`/app/billing/invoices/${inv.invoice_id}`} className="link">
                      Record payment
                    </Link>
                  ) : (
                    <Link href={`/app/billing/invoices/${inv.invoice_id}`} className="link">
                      View
                    </Link>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
