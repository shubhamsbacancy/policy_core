import Link from "next/link";

import { getCurrentOrgIdFromCookie } from "@/lib/auth/org-cookie";
import { getSessionUser } from "@/lib/auth/session";
import { repoListQuotes } from "@/lib/domain/repository";

type QuoteListItem = {
  quote_id: string;
  quote_number: string;
  application_id: string;
  org_id: string;
  status: string;
  total_premium: number;
  currency: string;
  created_at: string;
};

export default async function QuotesPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const orgId = (await getCurrentOrgIdFromCookie()) ?? "";
  const quotes = orgId ? ((await repoListQuotes(orgId)) as QuoteListItem[]) : [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Quotes</p>
          <h2>Rating & bind pipeline</h2>
        </div>
      </div>
      <div className="table">
        <div className="table-head">
          <span>Quote #</span>
          <span>Status</span>
          <span>Total premium</span>
          <span>Created</span>
          <span />
        </div>
        {quotes.length === 0 && <div className="table-row muted">No quotes yet.</div>}
        {quotes.map((q) => (
          <div className="table-row" key={q.quote_id}>
            <span>{q.quote_number}</span>
            <span className="pill subtle">{q.status}</span>
            <span>
              ${q.total_premium.toLocaleString()} {q.currency}
            </span>
            <span>{new Date(q.created_at).toLocaleDateString()}</span>
            <Link href={`/app/quotes/${q.quote_id}`} className="link">
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
