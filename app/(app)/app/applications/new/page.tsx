import { ApplicationForm } from "@/components/applications/application-form";
import { getCurrentOrgIdFromCookie } from "@/lib/auth/org-cookie";
import { DEMO_ORG_ID } from "@/lib/constants";

export default async function NewApplicationPage() {
  const orgId = (await getCurrentOrgIdFromCookie()) ?? DEMO_ORG_ID;
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Applications</p>
          <h2>New application</h2>
          <p className="hint">Capture policyholder, property, and coverage details for a Texas homeowners submission.</p>
        </div>
      </div>
      <ApplicationForm orgId={orgId} />
    </div>
  );
}
