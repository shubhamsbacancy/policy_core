import Link from "next/link";
import { cookies } from "next/headers";

import type { QuoteSummary } from "@/lib/contracts";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function fetchQuote(id: string): Promise<QuoteSummary | null> {
  const cookieStore = await cookies();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/v1/quotes/${id}`, {
    cache: "no-store",
    headers: { cookie: cookieStore.toString() }
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? json ?? null;
}

export default async function QuoteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const quote = await fetchQuote(id);
  if (!quote) {
    return (
      <div className="page">
        <h2>Quote not found</h2>
      </div>
    );
  }

  const rating = Object.entries(quote.rating_breakdown ?? {});

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Quote</p>
          <h2>{quote.quote_number}</h2>
          <p className="hint">Status: {quote.status}</p>
        </div>
        <div className="action-row">
          <Link href={`/app/quotes/${quote.quote_id}/bind`} className="primary">
            Bind policy
          </Link>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Premium</p>
              <h3>Pricing</h3>
            </div>
          </div>
          <ul className="detail-list">
            <li>
              <span>Premium</span>
              <span>${quote.premium.toLocaleString()}</span>
            </li>
            <li>
              <span>Fees</span>
              <span>${quote.fees.toLocaleString()}</span>
            </li>
            <li>
              <span>Taxes</span>
              <span>${quote.taxes.toLocaleString()}</span>
            </li>
            <li>
              <span>Total</span>
              <span>${quote.total_premium.toLocaleString()}</span>
            </li>
          </ul>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Rating breakdown</p>
              <h3>Deterministic factors</h3>
            </div>
          </div>
          <ul className="detail-list">
            {rating.length === 0 && <li>No rating breakdown.</li>}
            {rating.map(([k, v]) => (
              <li key={k}>
                <span>{k}</span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
