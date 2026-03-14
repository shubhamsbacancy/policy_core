import Link from "next/link";

import { repoGetPolicy, repoListInvoicesByPolicy } from "@/lib/domain/repository";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PolicyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const policy = await repoGetPolicy(id);
  if (!policy) {
    return (
      <div className="page">
        <h2>Policy not found</h2>
      </div>
    );
  }

  const invoices = await repoListInvoicesByPolicy(policy.policy_id);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Policy</p>
          <h2>{policy.policy_number}</h2>
          <p className="hint">Status: {policy.status}</p>
        </div>
        <div className="action-row">
          <Link href={`/app/policies/${policy.policy_id}/endorsements/new`} className="primary">
            New endorsement
          </Link>
          <Link href={`/app/policies/${policy.policy_id}/renewals/new`} className="ghost">
            Generate renewal
          </Link>
          <Link href={`/app/policies/${policy.policy_id}/cancellations/new`} className="ghost">
            Request cancellation
          </Link>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Term</p>
              <h3>Dates</h3>
            </div>
          </div>
          <ul className="detail-list">
            <li>
              <span>Effective</span>
              <span>{policy.effective_date}</span>
            </li>
            <li>
              <span>Expiration</span>
              <span>{policy.expiration_date}</span>
            </li>
            <li>
              <span>Created</span>
              <span>{new Date(policy.created_at).toLocaleString()}</span>
            </li>
          </ul>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Invoices</p>
              <h3>Billing</h3>
            </div>
          </div>
          <ul className="detail-list">
            {invoices.length === 0 && <li>No invoices yet.</li>}
            {invoices.map((inv) => (
              <li key={inv.invoice_id}>
                <span>{inv.invoice_number}</span>
                <span>
                  ${inv.amount_due.toLocaleString()} · {inv.status} · due {inv.due_date}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
