import { DocumentConfirmUploadRequestSchema, DocumentRecordSchema } from "@/lib/contracts";
import { apiOk, parseJsonBody, withZodError } from "@/lib/domain/http";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { repoConfirmDocumentUpload } from "@/lib/domain/repository";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const body = await parseJsonBody(request, DocumentConfirmUploadRequestSchema);
    const forbidden = await requireOrgAccess(auth.user.id, body.org_id);
    if (forbidden) return forbidden;

    const updated = (await repoConfirmDocumentUpload({
      document_id: body.document_id,
      org_id: body.org_id,
      size_bytes: body.size_bytes
    })) as {
      id: string;
      org_id: string;
      entity_type: string;
      entity_id: string;
      file_name: string;
      content_type: string | null;
      size_bytes: number | null;
      storage_bucket: string;
      storage_path: string;
      status: string;
      created_at: string;
    };

    const payload = DocumentRecordSchema.parse({
      document_id: updated.id,
      org_id: updated.org_id,
      entity_type: updated.entity_type,
      entity_id: updated.entity_id,
      file_name: updated.file_name,
      content_type: updated.content_type,
      size_bytes: updated.size_bytes ? Number(updated.size_bytes) : null,
      storage_bucket: updated.storage_bucket,
      storage_path: updated.storage_path,
      status: updated.status,
      created_at: updated.created_at
    });

    return apiOk(payload);
  } catch (error) {
    return withZodError(error);
  }
}
