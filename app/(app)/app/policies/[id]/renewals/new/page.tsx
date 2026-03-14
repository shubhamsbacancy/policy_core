"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { GenerateRenewalRequest } from "@/lib/contracts";
import { DEMO_ORG_ID } from "@/lib/constants";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function NewRenewalPage({ params }: PageProps) {
  const router = useRouter();
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { id } = await params;
    const payload: GenerateRenewalRequest = { org_id: DEMO_ORG_ID, target_effective_date: targetDate };
    try {
      const res = await fetch(`/api/v1/policies/${id}/renewals/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to generate renewal");
      setMessage("Renewal offer created.");
      router.replace(`/app/policies/${id}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to generate renewal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Policy</p>
          <h2>Generate renewal</h2>
        </div>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Target effective date
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
        </label>
        {message && <div className="result">{message}</div>}
        <div className="form-actions">
          <button className="ghost" type="button" onClick={() => router.back()}>
            Cancel
          </button>
          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Generating..." : "Generate renewal"}
          </button>
        </div>
      </form>
    </div>
  );
}
