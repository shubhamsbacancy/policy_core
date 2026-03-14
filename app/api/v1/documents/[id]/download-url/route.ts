import { apiError, apiOk, withZodError } from "@/lib/domain/http";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { repoGetDocumentById } from "@/lib/domain/repository";
import { DocumentRecordSchema } from "@/lib/contracts";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("org_id");
    if (!orgId) return apiError("org_id is required.", 400);

    const forbidden = await requireOrgAccess(auth.user.id, orgId);
    if (forbidden) return forbidden;

    const rawDoc = await repoGetDocumentById({ org_id: orgId, document_id: id });
    if (!rawDoc) return apiError("Document not found.", 404);
    const doc = rawDoc as {
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
    if (!doc) return apiError("Document not found.", 404);

    const parsed = DocumentRecordSchema.parse({
      document_id: doc.id,
      org_id: doc.org_id,
      entity_type: doc.entity_type,
      entity_id: doc.entity_id,
      file_name: doc.file_name,
      content_type: doc.content_type,
      size_bytes: doc.size_bytes ? Number(doc.size_bytes) : null,
      storage_bucket: doc.storage_bucket,
      storage_path: doc.storage_path,
      status: doc.status,
      created_at: doc.created_at
    });

    const admin = createSupabaseServiceClient();
    const { data, error } = await admin.storage.from(parsed.storage_bucket).createSignedUrl(parsed.storage_path, 60 * 5);
    if (error || !data) return apiError(error?.message ?? "Failed to create signed url.", 500);
    return apiOk({ url: data.signedUrl });
  } catch (error) {
    return withZodError(error);
  }
}
