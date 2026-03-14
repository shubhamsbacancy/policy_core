import Link from "next/link";
import { cookies } from "next/headers";

import { getCurrentOrgIdFromCookie } from "@/lib/auth/org-cookie";
import { getSessionUser } from "@/lib/auth/session";

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

async function fetchQuotes(orgId: string): Promise<QuoteListItem[]> {
  const cookieStore = await cookies();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/v1/quotes?org_id=${orgId}`, {
    cache: "no-store",
    headers: { cookie: cookieStore.toString() }
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? json ?? [];
}

export default async function QuotesPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const orgId = (await getCurrentOrgIdFromCookie()) ?? "";
  const quotes = orgId ? await fetchQuotes(orgId) : [];

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
