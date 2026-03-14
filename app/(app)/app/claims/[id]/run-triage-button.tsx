"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RunTriageButton({ claimId, orgId }: { claimId: string; orgId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/claims/${claimId}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId })
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="primary small"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? "Running…" : "Run triage"}
    </button>
  );
}
