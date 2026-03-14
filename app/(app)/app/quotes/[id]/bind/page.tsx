import { cookies } from "next/headers";

import { BindForm } from "@/components/quotes/bind-form";
import { getCurrentOrgIdFromCookie } from "@/lib/auth/org-cookie";
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

export default async function BindQuotePage({ params }: PageProps) {
  const { id } = await params;
  const quote = await fetchQuote(id);
  const orgId = (await getCurrentOrgIdFromCookie()) ?? quote?.org_id ?? "";

  if (!quote || !orgId) {
    return (
      <div className="page">
        <h2>Quote not found</h2>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Bind quote</p>
          <h2>{quote.quote_number}</h2>
          <p className="hint">Set term dates to issue the policy.</p>
        </div>
      </div>
      <BindForm quoteId={quote.quote_id} orgId={orgId} />
    </div>
  );
}
