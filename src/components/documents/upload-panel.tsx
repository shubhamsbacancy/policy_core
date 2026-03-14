"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { DocumentEntityType, DocumentRecord } from "@/lib/contracts";

type Props = {
  orgId: string;
  entityType: DocumentEntityType;
  entityId: string;
};

type UploadState = "idle" | "uploading" | "confirming";

export function DocumentUploadPanel({ orgId, entityType, entityId }: Props) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [status, setStatus] = useState<UploadState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    const url = new URL("/api/v1/documents", window.location.origin);
    url.searchParams.set("org_id", orgId);
    url.searchParams.set("entity_type", entityType);
    url.searchParams.set("entity_id", entityId);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    setDocuments(json.data?.documents ?? []);
  }, [entityId, entityType, orgId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFile = useCallback(
    async (file: File) => {
      setStatus("uploading");
      setMessage(null);
      try {
        const createRes = await fetch("/api/v1/documents/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            org_id: orgId,
            entity_type: entityType,
            entity_id: entityId,
            file_name: file.name,
            content_type: file.type,
            size_bytes: file.size
          })
        });
        if (!createRes.ok) throw new Error("Unable to create upload url.");
        const createJson = await createRes.json();
        const upload = createJson?.data?.upload;
        const token = upload?.token;
        const path = upload?.path;
        if (!token || !path) throw new Error("Upload metadata missing.");

        const putRes = await fetch(upload.url, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file
        });
        if (!putRes.ok) throw new Error("Failed to upload file.");

        setStatus("confirming");
        const confirmRes = await fetch("/api/v1/documents/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            org_id: orgId,
            document_id: createJson?.data?.document?.document_id
          })
        });
        if (!confirmRes.ok) throw new Error("Failed to confirm upload.");
        await fetchDocuments();
        setMessage("Upload complete.");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setStatus("idle");
      }
    },
    [entityId, entityType, fetchDocuments, orgId]
  );

  const handleInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const hasDocs = documents.length > 0;
  const uploadText = useMemo(() => {
    if (status === "uploading") return "Uploading...";
    if (status === "confirming") return "Confirming...";
    return "Upload file";
  }, [status]);

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Documents</p>
          <h3>Upload & history</h3>
        </div>
        <label className="ghost small">
          {uploadText}
          <input type="file" onChange={handleInput} hidden />
        </label>
      </div>
      {message && <p className="hint">{message}</p>}
      {hasDocs ? (
        <ul className="detail-list">
          {documents.map((doc) => (
            <li key={doc.document_id}>
              <span>{doc.file_name}</span>
              <span>
                {doc.status} · {new Date(doc.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint">No documents yet. Upload one to attach.</p>
      )}
    </div>
  );
}
