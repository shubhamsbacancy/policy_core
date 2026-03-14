import Link from "next/link";
import { cookies } from "next/headers";

import { getCurrentOrgIdFromCookie } from "@/lib/auth/org-cookie";
import { getSessionUser } from "@/lib/auth/session";

type PolicyItem = { policy_id: string; status: string };
type InvoiceItem = { invoice_id: string; status: string; amount_due: number };
type ClaimItem = { claim_id: string; status: string };

async function fetchJson(path: string) {
  const cookieStore = await cookies();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}${path}`, {
    cache: "no-store",
    headers: { cookie: cookieStore.toString() }
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? json ?? [];
}

export default async function CustomerHomePage() {
  const user = await getSessionUser();
  if (!user) return null;

  const orgId = (await getCurrentOrgIdFromCookie()) ?? "";
  const [policies, invoices, claims] = await Promise.all([
    orgId ? fetchJson(`/api/v1/customer/policies?org_id=${orgId}`) : Promise.resolve([]),
    orgId ? fetchJson(`/api/v1/customer/invoices?org_id=${orgId}`) : Promise.resolve([]),
    orgId ? fetchJson(`/api/v1/customer/claims?org_id=${orgId}`) : Promise.resolve([])
  ]);

  const openInvoices = (invoices as InvoiceItem[]).filter((x) => x.status === "open");
  const openClaims = (claims as ClaimItem[]).filter((x) => x.status === "open");
  const totalDue = openInvoices.reduce((sum, i) => sum + Number(i.amount_due ?? 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Customer Portal</p>
          <h2>My insurance dashboard</h2>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <p className="eyebrow">Policies</p>
          <h3>{(policies as PolicyItem[]).length} active records</h3>
          <Link href="/app/customer/policies" className="link">
            View my policies
          </Link>
        </div>
        <div className="panel">
          <p className="eyebrow">Open invoices</p>
          <h3>${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          <Link href="/app/customer/invoices" className="link">
            Pay now
          </Link>
        </div>
        <div className="panel">
          <p className="eyebrow">Claims</p>
          <h3>{openClaims.length} open claims</h3>
          <Link href="/app/customer/claims" className="link">
            View my claims
          </Link>
        </div>
        <div className="panel">
          <p className="eyebrow">Need help?</p>
          <h3>File first notice of loss</h3>
          <Link href="/app/customer/claims/new" className="link">
            File a claim
          </Link>
        </div>
      </div>
    </div>
  );
}
