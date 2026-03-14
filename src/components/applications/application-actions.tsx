"use client";

import { useState } from "react";

type Props = {
  applicationId: string;
  orgId: string;
};

export function ApplicationActions({ applicationId, orgId }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<"quote" | "risk" | null>(null);

  async function handleQuote() {
    setLoading("quote");
    setMessage(null);
    try {
      const res = await fetch("/api/v1/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, application_id: applicationId })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Quote failed");
      setMessage(`Quote created: ${json.data?.quote_number ?? json.data?.quote_id ?? ""}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to create quote");
    } finally {
      setLoading(null);
    }
  }

  async function handleRiskAssessment() {
    setLoading("risk");
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/applications/${applicationId}/risk-assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application: { org_id: orgId } })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Risk assessment failed");
      setMessage("Risk assessment generated");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to run risk assessment");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="action-row">
      <button className="primary" type="button" onClick={handleQuote} disabled={loading !== null}>
        {loading === "quote" ? "Creating quote..." : "Create quote"}
      </button>
      <button className="ghost" type="button" onClick={handleRiskAssessment} disabled={loading !== null}>
        {loading === "risk" ? "Running..." : "Run risk assessment"}
      </button>
      {message && <div className="result">{message}</div>}
    </div>
  );
}
