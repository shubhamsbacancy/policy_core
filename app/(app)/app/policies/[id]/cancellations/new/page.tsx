"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CancellationRequest } from "@/lib/contracts";
import { DEMO_ORG_ID } from "@/lib/constants";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function NewCancellationPage({ params }: PageProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [requestedDate, setRequestedDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { id } = await params;
    const payload: CancellationRequest = { org_id: DEMO_ORG_ID, reason, requested_cancel_date: requestedDate };
    try {
      const res = await fetch(`/api/v1/policies/${id}/cancellations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to request cancellation");
      setMessage("Cancellation requested.");
      router.replace(`/app/policies/${id}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to request cancellation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Policy</p>
          <h2>Request cancellation</h2>
        </div>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Requested cancel date
            <input type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} required />
          </label>
          <label>
            Reason
            <input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </label>
        </div>
        {message && <div className="result">{message}</div>}
        <div className="form-actions">
          <button className="ghost" type="button" onClick={() => router.back()}>
            Cancel
          </button>
          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit request"}
          </button>
        </div>
      </form>
    </div>
  );
}
