"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { BindQuoteRequest } from "@/lib/contracts";

type Props = {
  quoteId: string;
  orgId: string;
};

export function BindForm({ quoteId, orgId }: Props) {
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [expirationDate, setExpirationDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const payload: BindQuoteRequest = {
      org_id: orgId,
      effective_date: effectiveDate,
      expiration_date: expirationDate
    };
    try {
      const res = await fetch(`/api/v1/quotes/${quoteId}/bind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Bind failed");
      setMessage("Quote bound. Policy issued.");
      router.replace(`/app/quotes/${quoteId}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Bind failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Effective date
          <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
        </label>
        <label>
          Expiration date
          <input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} required />
        </label>
      </div>
      {message && <div className="result">{message}</div>}
      <div className="form-actions">
        <button className="ghost" type="button" onClick={() => router.back()}>
          Cancel
        </button>
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "Binding..." : "Bind quote"}
        </button>
      </div>
    </form>
  );
}
