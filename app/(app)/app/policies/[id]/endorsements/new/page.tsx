"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EndorsementRequest } from "@/lib/contracts";
import { DEMO_ORG_ID } from "@/lib/constants";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function NewEndorsementPage({ params }: PageProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [changes, setChanges] = useState("{\"change\":\"value\"}");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { id } = await params;
    const payload: EndorsementRequest = {
      org_id: DEMO_ORG_ID,
      policy_id: id,
      reason,
      effective_date: effectiveDate,
      changes: JSON.parse(changes)
    };
    try {
      const res = await fetch(`/api/v1/policies/${id}/endorsements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to create endorsement");
      setMessage("Endorsement created.");
      router.replace(`/app/policies/${id}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to create endorsement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Policy</p>
          <h2>New endorsement</h2>
        </div>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Effective date
            <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
          </label>
          <label>
            Reason
            <input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </label>
        </div>
        <label>
          Changes (JSON)
          <textarea value={changes} onChange={(e) => setChanges(e.target.value)} rows={4} />
        </label>
        {message && <div className="result">{message}</div>}
        <div className="form-actions">
          <button className="ghost" type="button" onClick={() => router.back()}>
            Cancel
          </button>
          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create endorsement"}
          </button>
        </div>
      </form>
    </div>
  );
}
