import { ApplicationActions } from "@/components/applications/application-actions";
import { DocumentUploadPanel } from "@/components/documents/upload-panel";
import { DEMO_ORG_ID } from "@/lib/constants";
import { repoGetApplication } from "@/lib/domain/repository";
import type { ApplicationDraft, DocumentEntityType } from "@/lib/contracts";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const application = (await repoGetApplication(id)) as
    | {
        id: string;
        org_id: string;
        status: string;
        data: Record<string, unknown>;
        created_at: string;
        updated_at: string;
      }
    | null;

  if (!application) {
    return (
      <div className="page">
        <h2>Application not found</h2>
      </div>
    );
  }

  const payload = application.data as ApplicationDraft & { notes?: string };
  const orgId = application.org_id ?? DEMO_ORG_ID;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Application</p>
          <h2>{payload?.policyholder ? `${payload.policyholder.first_name} ${payload.policyholder.last_name}` : application.id}</h2>
          <p className="hint">Status: {application.status}</p>
        </div>
        <ApplicationActions applicationId={application.id} orgId={orgId} />
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Policyholder</p>
              <h3>Contact</h3>
            </div>
          </div>
          <ul className="detail-list">
            <li>
              <span>Name</span>
              <span>
                {payload.policyholder?.first_name} {payload.policyholder?.last_name}
              </span>
            </li>
            <li>
              <span>Email</span>
              <span>{payload.policyholder?.email}</span>
            </li>
            <li>
              <span>Phone</span>
              <span>{payload.policyholder?.phone ?? "—"}</span>
            </li>
          </ul>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Property</p>
              <h3>Location & Risk</h3>
            </div>
          </div>
          <ul className="detail-list">
            <li>
              <span>Address</span>
              <span>{payload.property?.address_line_1}</span>
            </li>
            <li>
              <span>City/State</span>
              <span>
                {payload.property?.city}, {payload.property?.state}
              </span>
            </li>
            <li>
              <span>Year built</span>
              <span>{payload.property?.year_built}</span>
            </li>
            <li>
              <span>Roof age</span>
              <span>{payload.property?.roof_age_years} yrs</span>
            </li>
            <li>
              <span>Construction</span>
              <span>{payload.property?.construction_type}</span>
            </li>
            <li>
              <span>Occupancy</span>
              <span>{payload.property?.occupancy}</span>
            </li>
            <li>
              <span>Prior claims</span>
              <span>{payload.property?.prior_claims_count}</span>
            </li>
          </ul>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Coverage</p>
              <h3>Requested limits</h3>
            </div>
          </div>
          <ul className="detail-list">
            <li>
              <span>Dwelling</span>
              <span>${payload.coverage?.dwelling_limit?.toLocaleString()}</span>
            </li>
            <li>
              <span>Liability</span>
              <span>${payload.coverage?.liability_limit?.toLocaleString()}</span>
            </li>
            <li>
              <span>Deductible</span>
              <span>${payload.coverage?.deductible?.toLocaleString()}</span>
            </li>
          </ul>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Metadata</p>
              <h3>Submission</h3>
            </div>
          </div>
          <ul className="detail-list">
            <li>
              <span>Application ID</span>
              <span>{application.id}</span>
            </li>
            <li>
              <span>Org</span>
              <span>{application.org_id}</span>
            </li>
            <li>
              <span>Created</span>
              <span>{new Date(application.created_at).toLocaleString()}</span>
            </li>
            <li>
              <span>Updated</span>
              <span>{new Date(application.updated_at).toLocaleString()}</span>
            </li>
            {payload.notes && (
              <li className="wide">
                <span>Notes</span>
                <span>{payload.notes}</span>
              </li>
            )}
          </ul>
        </div>
      </div>
      <DocumentUploadPanel orgId={orgId} entityType={"application" as DocumentEntityType} entityId={application.id} />
    </div>
  );
}
// @ts-nocheck
