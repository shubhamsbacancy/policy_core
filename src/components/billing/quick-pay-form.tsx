"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function QuickPayForm({
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
  const [method, setMethod] = useState<"ach" | "card" | "manual">("card");
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
          payment_method: method
        })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Failed to pay invoice.");
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pay invoice.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
      <input
        type="number"
        step="0.01"
        min="0.01"
        max={maxAmount}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        required
        style={{ width: "120px" }}
      />
      <select value={method} onChange={(e) => setMethod(e.target.value as "ach" | "card" | "manual")}>
        <option value="card">Card</option>
        <option value="ach">ACH</option>
        <option value="manual">Manual</option>
      </select>
      <button className="primary small" type="submit" disabled={loading}>
        {loading ? "Paying…" : "Pay"}
      </button>
      {error && <span className="subtle">{error}</span>}
    </form>
  );
}
