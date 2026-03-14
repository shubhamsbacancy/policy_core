"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type PolicyOption = {
  policy_id: string;
  policy_number: string;
  status: string;
  effective_date: string;
  expiration_date: string;
};

export function FNOLForm({
  orgId,
  policies,
  reportedBy = "agent",
  cancelHref = "/app/claims",
  successBasePath = "/app/claims"
}: {
  orgId: string;
  policies: PolicyOption[];
  reportedBy?: "agent" | "customer" | "ops_admin";
  cancelHref?: string;
  successBasePath?: string;
}) {
  const router = useRouter();
  const [policyId, setPolicyId] = useState(policies[0]?.policy_id ?? "");
  const [incidentDate, setIncidentDate] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedLoss, setEstimatedLoss] = useState("");
  const [documentRefs, setDocumentRefs] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const loss = parseFloat(estimatedLoss);
    if (description.length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }
    if (Number.isNaN(loss) || loss < 0) {
      setError("Enter a valid estimated loss amount.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          policy_id: policyId,
          reported_by: reportedBy,
          incident_date: incidentDate,
          description: description.trim(),
          estimated_loss_amount: loss,
          document_refs: documentRefs.trim() ? documentRefs.split(",").map((s) => s.trim()).filter(Boolean) : []
        })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Failed to create claim.");
        return;
      }
      const claimId = json?.data?.id;
      if (claimId) router.push(`${successBasePath}/${claimId}`);
      else router.push(successBasePath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create claim.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Policy
        <select
          value={policyId}
          onChange={(e) => setPolicyId(e.target.value)}
          required
        >
          <option value="">Select policy</option>
          {policies.map((p) => (
            <option key={p.policy_id} value={p.policy_id}>
              {p.policy_number} ({p.effective_date} – {p.expiration_date})
            </option>
          ))}
        </select>
      </label>
      <label>
        Incident date
        <input
          type="date"
          value={incidentDate}
          onChange={(e) => setIncidentDate(e.target.value)}
          required
        />
      </label>
      <label>
        Description (min 10 characters)
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the loss or damage..."
          rows={4}
          minLength={10}
          maxLength={5000}
          required
        />
      </label>
      <label>
        Estimated loss amount (USD)
        <input
          type="number"
          step="0.01"
          min="0"
          value={estimatedLoss}
          onChange={(e) => setEstimatedLoss(e.target.value)}
          placeholder="0.00"
          required
        />
      </label>
      <label>
        Document references (optional, comma-separated)
        <input
          type="text"
          value={documentRefs}
          onChange={(e) => setDocumentRefs(e.target.value)}
          placeholder="doc-id-1, doc-id-2"
        />
      </label>
      {error && (
        <p className="result error" style={{ margin: 0 }}>
          ⚠️ {error}
        </p>
      )}
      <div className="form-actions">
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create claim"}
        </button>
        <Link href={cancelHref} className="ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
