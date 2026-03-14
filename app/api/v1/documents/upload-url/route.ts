import { randomUUID } from "crypto";

import {
  DocumentCreateUploadRequestSchema,
  DocumentCreateUploadResponseSchema,
  DocumentRecordSchema
} from "@/lib/contracts";
import { apiError, apiOk, parseJsonBody, withZodError } from "@/lib/domain/http";
import { requireAuth, requireOrgAccess } from "@/lib/auth/api-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { repoCreateDocument } from "@/lib/domain/repository";

async function ensureStorageBucket(admin: ReturnType<typeof createSupabaseServiceClient>, bucket: string) {
  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) {
    throw new Error(`Storage bucket lookup failed: ${listError.message}`);
  }

  const exists = (buckets ?? []).some((b: any) => b?.id === bucket || b?.name === bucket);
  if (exists) return;

  const { error: createError } = await admin.storage.createBucket(bucket, {
    public: false
  });
  if (createError && !/already exists/i.test(createError.message ?? "")) {
    throw new Error(`Storage bucket creation failed: ${createError.message}`);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const body = await parseJsonBody(request, DocumentCreateUploadRequestSchema);
    const forbidden = await requireOrgAccess(auth.user.id, body.org_id);
    if (forbidden) return forbidden;

    const safeName = body.file_name.replace(/[^\w.\- ]+/g, "_").slice(0, 140) || `upload-${randomUUID()}.bin`;
    const storageBucket = "documents";
    const storagePath = `${body.org_id}/${body.entity_type}/${body.entity_id}/${randomUUID()}-${safeName}`;

    const admin = createSupabaseServiceClient();
    await ensureStorageBucket(admin, storageBucket);
    const { data: signed, error } = await admin.storage.from(storageBucket).createSignedUploadUrl(storagePath);
    if (error || !signed) {
      return apiError(error?.message ?? "Failed to create signed upload url.", 500, {
        bucket: storageBucket,
        path: storagePath
      });
    }

    const doc = (await repoCreateDocument({
      org_id: body.org_id,
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      storage_bucket: storageBucket,
      storage_path: storagePath,
      file_name: safeName,
      content_type: body.content_type ?? null,
      size_bytes: body.size_bytes ?? null,
      document_metadata: {},
      status: "pending"
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

    const documentRecord = DocumentRecordSchema.parse({
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

    const payload = DocumentCreateUploadResponseSchema.parse({
      document: {
        ...documentRecord
      },
      upload: {
        bucket: storageBucket,
        path: signed.path,
        token: signed.token
        ,
        url: signed.signedUrl
      }
    });

    return apiOk(payload, 201);
  } catch (error) {
    return withZodError(error);
  }
}
