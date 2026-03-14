"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RecordPaymentForm({
  invoiceId,
  orgId,
  maxAmount
}: {
  invoiceId: string;
  orgId: string;
  maxAmount: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(maxAmount > 0 ? String(maxAmount) : "");
  const [method, setMethod] = useState<"ach" | "card" | "manual">("manual");
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const num = parseFloat(amount);
    if (Number.isNaN(num) || num <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (num > maxAmount) {
      setError(`Amount cannot exceed $${maxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          invoice_id: invoiceId,
          amount: num,
          payment_method: method,
          external_reference: ref.trim() || undefined
        })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Failed to record payment.");
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Amount (USD)
        <input
          type="number"
          step="0.01"
          min="0.01"
          max={maxAmount}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
        />
      </label>
      <label>
        Payment method
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as "ach" | "card" | "manual")}
        >
          <option value="manual">Manual</option>
          <option value="ach">ACH</option>
          <option value="card">Card</option>
        </select>
      </label>
      <label>
        External reference (optional)
        <input
          type="text"
          maxLength={120}
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="Check # or transaction ID"
        />
      </label>
      {error && <p className="result error" style={{ margin: 0 }}>⚠️ {error}</p>}
      <button className="primary" type="submit" disabled={loading}>
        {loading ? "Recording…" : "Record payment"}
      </button>
    </form>
  );
}
