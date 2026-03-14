import Link from "next/link";

import { getCurrentOrgIdFromCookie, getOrgAndPersona, getSessionUser } from "@/lib/auth";
import { DEMO_ORG_ID } from "@/lib/constants";
import { repoGetInvoice } from "@/lib/domain/repository";
import { RecordPaymentForm } from "./record-payment-form";

export default async function InvoiceDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  const preferredOrgId = await getCurrentOrgIdFromCookie();
  const orgContext = user ? await getOrgAndPersona(user.id, preferredOrgId) : null;
  const orgId = orgContext?.orgId ?? DEMO_ORG_ID;

  const invoice = await repoGetInvoice(id);
  if (!invoice) {
    return (
      <div className="page">
        <div className="page-header">
          <h2>Invoice not found</h2>
          <Link href="/app/billing" className="link">
            Back to Billing
          </Link>
        </div>
      </div>
    );
  }

  if (invoice.org_id !== orgId) {
    return (
      <div className="page">
        <div className="page-header">
          <h2>Access denied</h2>
          <Link href="/app/billing" className="link">
            Back to Billing
          </Link>
        </div>
      </div>
    );
  }

  const inv = invoice as typeof invoice & { policy_number?: string | null };
  const isOpen = invoice.status === "open";

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Billing</p>
          <h2>Invoice {invoice.invoice_number}</h2>
        </div>
        <Link href="/app/billing" className="link">
          ← Back to Billing
        </Link>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Details</p>
              <h3>Invoice summary</h3>
            </div>
          </div>
          <ul className="totals-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
              <span className="hint">Invoice number</span>
              <span>{invoice.invoice_number}</span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
              <span className="hint">Policy</span>
              <span>
                {inv.policy_number ? (
                  <Link href={`/app/policies/${invoice.policy_id}`} className="link">
                    {inv.policy_number}
                  </Link>
                ) : (
                  invoice.policy_id
                )}
              </span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
              <span className="hint">Amount due</span>
              <span className="metric">${Number(invoice.amount_due).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
              <span className="hint">Due date</span>
              <span>{invoice.due_date}</span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0" }}>
              <span className="hint">Status</span>
              <span className={`badge ${invoice.status === "open" ? "" : "subtle"}`}>{invoice.status}</span>
            </li>
          </ul>
        </div>

        {isOpen && (
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Record payment</p>
                <h3>Add payment</h3>
              </div>
            </div>
            <RecordPaymentForm
              invoiceId={invoice.invoice_id}
              orgId={invoice.org_id}
              maxAmount={Number(invoice.amount_due)}
            />
          </div>
        )}
      </div>

      {!isOpen && (
        <div className="panel">
          <p className="subtle">This invoice is {invoice.status}. No further payments can be recorded.</p>
        </div>
      )}
    </div>
  );
}
