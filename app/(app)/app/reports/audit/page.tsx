import Link from "next/link";
import { cookies } from "next/headers";

import { getCurrentOrgIdFromCookie } from "@/lib/auth/org-cookie";
import { getSessionUser } from "@/lib/auth/session";

type AuditRow = {
  id: string;
  actor_user_id: string | null;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  status: string;
  created_at: string;
};

type AuditResponse = {
  data: AuditRow[];
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
};

async function fetchAudit(
  orgId: string,
  page: number,
  pageSize: number,
  action?: string,
  entityType?: string
): Promise<AuditResponse> {
  const cookieStore = await cookies();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const params = new URLSearchParams({
    org_id: orgId,
    page: String(page),
    page_size: String(pageSize)
  });
  if (action) params.set("action", action);
  if (entityType) params.set("entity_type", entityType);

  const res = await fetch(`${base}/api/v1/reports/audit?${params.toString()}`, {
    cache: "no-store",
    headers: { cookie: cookieStore.toString() }
  });
  if (!res.ok) {
    return { data: [], page, page_size: pageSize, total: 0, has_next: false };
  }
  const json = await res.json();
  return (json.data ?? json) as AuditResponse;
}

export default async function ReportsAuditPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const params = (await searchParams) ?? {};
  const page = Math.max(1, Number(Array.isArray(params.page) ? params.page[0] : params.page ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(5, Number(Array.isArray(params.page_size) ? params.page_size[0] : params.page_size ?? "20") || 20)
  );
  const action = (Array.isArray(params.action) ? params.action[0] : params.action ?? "").trim();
  const entityType = (Array.isArray(params.entity_type) ? params.entity_type[0] : params.entity_type ?? "").trim();

  const orgId = (await getCurrentOrgIdFromCookie()) ?? "";
  const result = orgId ? await fetchAudit(orgId, page, pageSize, action || undefined, entityType || undefined) : { data: [], page, page_size: pageSize, total: 0, has_next: false };

  const baseParams = new URLSearchParams();
  if (action) baseParams.set("action", action);
  if (entityType) baseParams.set("entity_type", entityType);
  baseParams.set("page_size", String(pageSize));

  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("page", String(Math.max(1, page - 1)));
  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("page", String(page + 1));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Reports</p>
          <h2>Audit log</h2>
        </div>
        <Link href="/app/reports" className="link">
          Back to reports hub
        </Link>
      </div>

      <form method="GET" className="panel" style={{ marginBottom: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          Action
          <input name="action" defaultValue={action} placeholder="e.g. quote.bound" />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          Entity type
          <input name="entity_type" defaultValue={entityType} placeholder="e.g. policy" />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          Page size
          <input name="page_size" type="number" min={5} max={100} defaultValue={pageSize} />
        </label>
        <input type="hidden" name="page" value="1" />
        <button className="primary" type="submit">Apply filters</button>
      </form>

      <div className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Events</p>
            <h3>
              {result.total} total records
            </h3>
          </div>
        </div>
        <div className="billing-table">
          <div className="billing-table-head">
            <span>Date</span>
            <span>Action</span>
            <span>Entity</span>
            <span>Actor</span>
            <span>Status</span>
          </div>
          {result.data.length === 0 && <div className="billing-table-row">No audit events found.</div>}
          {result.data.map((row) => (
            <div key={row.id} className="billing-table-row">
              <span>{new Date(row.created_at).toLocaleString()}</span>
              <span>{row.action}</span>
              <span>
                {row.entity_type}
                {row.entity_id ? ` (${row.entity_id.slice(0, 8)})` : ""}
              </span>
              <span>{row.actor_name ?? row.actor_user_id ?? "system"}</span>
              <span>
                <span className="badge subtle">{row.status}</span>
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between" }}>
          <Link
            href={`/app/reports/audit?${prevParams.toString()}`}
            className={`link ${page <= 1 ? "subtle" : ""}`}
            aria-disabled={page <= 1}
          >
            Previous
          </Link>
          <span className="subtle">Page {page}</span>
          <Link
            href={`/app/reports/audit?${nextParams.toString()}`}
            className={`link ${!result.has_next ? "subtle" : ""}`}
            aria-disabled={!result.has_next}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
