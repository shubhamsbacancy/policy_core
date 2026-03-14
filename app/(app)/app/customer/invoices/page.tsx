import Link from "next/link";
import { cookies } from "next/headers";

import { QuickPayForm } from "@/components/billing/quick-pay-form";
import { getCurrentOrgIdFromCookie } from "@/lib/auth/org-cookie";
import { getSessionUser } from "@/lib/auth/session";

type CustomerInvoice = {
  invoice_id: string;
  invoice_number: string;
  policy_id: string;
  policy_number: string | null;
  amount_due: number;
  status: string;
  due_date: string;
  currency: string;
};

async function fetchInvoices(orgId: string): Promise<CustomerInvoice[]> {
  const cookieStore = await cookies();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/v1/customer/invoices?org_id=${orgId}`, {
    cache: "no-store",
    headers: { cookie: cookieStore.toString() }
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? json ?? [];
}

export default async function CustomerInvoicesPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const orgId = (await getCurrentOrgIdFromCookie()) ?? "";
  const invoices = orgId ? await fetchInvoices(orgId) : [];
  const openInvoices = invoices.filter((i) => i.status === "open");

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Customer Portal</p>
          <h2>My invoices</h2>
        </div>
        <Link href="/app/customer" className="link">
          Back to customer home
        </Link>
      </div>

      <div className="panel" style={{ marginBottom: "1.25rem" }}>
        <p className="eyebrow">Open amount</p>
        <h3>
          $
          {openInvoices
            .reduce((sum, i) => sum + Number(i.amount_due ?? 0), 0)
            .toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </h3>
      </div>

      <div className="billing-table">
        <div className="billing-table-head">
          <span>Invoice #</span>
          <span>Policy</span>
          <span>Amount due</span>
          <span>Due date</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {invoices.length === 0 && <div className="billing-table-row">No invoices found.</div>}
        {invoices.map((inv) => (
          <div className="billing-table-row" key={inv.invoice_id}>
            <span>{inv.invoice_number}</span>
            <span>{inv.policy_number ?? inv.policy_id.slice(0, 8)}</span>
            <span>${inv.amount_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span>{inv.due_date}</span>
            <span>
              <span className={`badge ${inv.status === "open" ? "" : "subtle"}`}>{inv.status}</span>
            </span>
            <span>
              {inv.status === "open" && orgId ? (
                <QuickPayForm invoiceId={inv.invoice_id} orgId={orgId} maxAmount={inv.amount_due} />
              ) : (
                <span className="subtle">Paid</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
