// @ts-nocheck
import { apiError, apiOk } from "@/lib/domain/http";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoGetApplication } from "@/lib/domain/repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const application = await repoGetApplication(id);
  if (!application) {
    return apiError("Application not found.", 404);
  }
  const forbidden = await requireOrgAccess(auth.user.id, application.org_id);
  if (forbidden) return forbidden;
  return apiOk(application);
}
