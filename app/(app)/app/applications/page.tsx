import Link from "next/link";

import { getCurrentOrgIdFromCookie } from "@/lib/auth/org-cookie";
import { getSessionUser } from "@/lib/auth/session";
import { repoListApplications } from "@/lib/domain/repository";

type ApplicationListItem = {
  id: string;
  org_id: string;
  status: string;
  created_at: string;
  policyholder?: { first_name: string; last_name: string };
  property?: { city: string; state: string };
};

export default async function ApplicationsPage() {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }
  const orgId = (await getCurrentOrgIdFromCookie()) ?? "";
  const apps = orgId ? ((await repoListApplications(orgId)) as ApplicationListItem[]) : [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Applications</p>
          <h2>Submission pipeline</h2>
        </div>
        <Link href="/app/applications/new" className="primary">
          New application
        </Link>
      </div>
      <div className="table">
        <div className="table-head">
          <span>Applicant</span>
          <span>Property</span>
          <span>Status</span>
          <span>Created</span>
          <span />
        </div>
        {apps.length === 0 && <div className="table-row muted">No applications yet.</div>}
        {apps.map((app) => (
          <div className="table-row" key={app.id}>
            <span>
              {app.policyholder
                ? `${app.policyholder.first_name} ${app.policyholder.last_name}`
                : "Policyholder"}
            </span>
            <span>
              {app.property
                ? `${app.property.city ?? ""}, ${app.property.state ?? ""}`
                : "—"}
            </span>
            <span className="pill subtle">{app.status}</span>
            <span>{new Date(app.created_at).toLocaleDateString()}</span>
            <Link href={`/app/applications/${app.id}`} className="link">
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
