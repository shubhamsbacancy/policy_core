import {
  DocumentEntityTypeSchema,
  DocumentListResponseSchema
} from "@/lib/contracts";
import { apiError, apiOk, withZodError } from "@/lib/domain/http";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoListDocuments } from "@/lib/domain/repository";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("org_id");
    const entityTypeRaw = searchParams.get("entity_type");
    const entityId = searchParams.get("entity_id");

    if (!orgId || !entityTypeRaw || !entityId) {
      return apiError("org_id, entity_type, and entity_id are required.", 400);
    }

    const entityType = DocumentEntityTypeSchema.parse(entityTypeRaw);

    const forbidden = await requireOrgAccess(auth.user.id, orgId);
    if (forbidden) return forbidden;

    const documents = await repoListDocuments({ org_id: orgId, entity_type: entityType, entity_id: entityId });
    const payload = DocumentListResponseSchema.parse({
      documents: documents.map((d: any) => ({
        document_id: d.id,
        org_id: d.org_id,
        entity_type: d.entity_type,
        entity_id: d.entity_id,
        file_name: d.file_name,
        content_type: d.content_type,
        size_bytes: d.size_bytes ? Number(d.size_bytes) : null,
        storage_bucket: d.storage_bucket,
        storage_path: d.storage_path,
        status: d.status,
        created_at: d.created_at
      }))
    });

    return apiOk(payload);
  } catch (error) {
    return withZodError(error);
  }
}

