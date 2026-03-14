"use client";

import { useState } from "react";

import type { ApplicationDraft } from "@/lib/contracts";

type Props = {
  orgId: string;
};

export function ApplicationForm({ orgId }: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<ApplicationDraft>({
    org_id: orgId,
    effective_date: new Date().toISOString().slice(0, 10),
    policyholder: {
      first_name: "Avery",
      last_name: "Rivera",
      email: "avery.agent@example.com",
      phone: "5125550101"
    },
    property: {
      address_line_1: "742 Evergreen Terrace",
      city: "Houston",
      state: "TX",
      postal_code: "77002",
      construction_type: "frame",
      occupancy: "owner_occupied",
      year_built: 2005,
      square_footage: 2200,
      roof_age_years: 8,
      replacement_cost: 450000,
      territory_code: "TX-HOU-01",
      prior_claims_count: 0
    },
    coverage: {
      dwelling_limit: 450000,
      liability_limit: 300000,
      deductible: 2500
    },
    notes: "Demo submission"
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/v1/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(application)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to create application");
      setStatus("success");
      window.location.href = `/app/applications/${json.data?.id ?? json.id ?? ""}`;
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Effective date
          <input
            type="date"
            value={application.effective_date}
            onChange={(e) => setApplication({ ...application, effective_date: e.target.value })}
            required
          />
        </label>
        <label>
          Territory code
          <input
            type="text"
            value={application.property.territory_code}
            onChange={(e) =>
              setApplication({ ...application, property: { ...application.property, territory_code: e.target.value } })
            }
            required
          />
        </label>
      </div>

      <section className="form-section">
        <h3>Policyholder</h3>
        <div className="form-grid">
          <label>
            First name
            <input
              value={application.policyholder.first_name}
              onChange={(e) =>
                setApplication({
                  ...application,
                  policyholder: { ...application.policyholder, first_name: e.target.value }
                })
              }
              required
            />
          </label>
          <label>
            Last name
            <input
              value={application.policyholder.last_name}
              onChange={(e) =>
                setApplication({
                  ...application,
                  policyholder: { ...application.policyholder, last_name: e.target.value }
                })
              }
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={application.policyholder.email}
              onChange={(e) =>
                setApplication({
                  ...application,
                  policyholder: { ...application.policyholder, email: e.target.value }
                })
              }
              required
            />
          </label>
          <label>
            Phone
            <input
              value={application.policyholder.phone ?? ""}
              onChange={(e) =>
                setApplication({
                  ...application,
                  policyholder: { ...application.policyholder, phone: e.target.value }
                })
              }
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h3>Property</h3>
        <div className="form-grid">
          <label>
            Address
            <input
              value={application.property.address_line_1}
              onChange={(e) =>
                setApplication({
                  ...application,
                  property: { ...application.property, address_line_1: e.target.value }
                })
              }
              required
            />
          </label>
          <label>
            City
            <input
              value={application.property.city}
              onChange={(e) =>
                setApplication({
                  ...application,
                  property: { ...application.property, city: e.target.value }
                })
              }
              required
            />
          </label>
          <label>
            State
            <input value="TX" readOnly />
          </label>
          <label>
            Postal code
            <input
              value={application.property.postal_code}
              onChange={(e) =>
                setApplication({
                  ...application,
                  property: { ...application.property, postal_code: e.target.value }
                })
              }
              required
            />
          </label>
          <label>
            Year built
            <input
              type="number"
              value={application.property.year_built}
              onChange={(e) =>
                setApplication({
                  ...application,
                  property: { ...application.property, year_built: Number(e.target.value) }
                })
              }
              required
            />
          </label>
          <label>
            Roof age (years)
            <input
              type="number"
              value={application.property.roof_age_years}
              onChange={(e) =>
                setApplication({
                  ...application,
                  property: { ...application.property, roof_age_years: Number(e.target.value) }
                })
              }
              required
            />
          </label>
          <label>
            Square footage
            <input
              type="number"
              value={application.property.square_footage}
              onChange={(e) =>
                setApplication({
                  ...application,
                  property: { ...application.property, square_footage: Number(e.target.value) }
                })
              }
              required
            />
          </label>
          <label>
            Replacement cost
            <input
              type="number"
              value={application.property.replacement_cost}
              onChange={(e) =>
                setApplication({
                  ...application,
                  property: { ...application.property, replacement_cost: Number(e.target.value) }
                })
              }
              required
            />
          </label>
          <label>
            Construction type
            <select
              value={application.property.construction_type}
              onChange={(e) =>
                setApplication({
                  ...application,
                  property: { ...application.property, construction_type: e.target.value as ApplicationDraft["property"]["construction_type"] }
                })
              }
            >
              <option value="frame">Frame</option>
              <option value="masonry">Masonry</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>
          <label>
            Occupancy
            <select
              value={application.property.occupancy}
              onChange={(e) =>
                setApplication({
                  ...application,
                  property: { ...application.property, occupancy: e.target.value as ApplicationDraft["property"]["occupancy"] }
                })
              }
            >
              <option value="owner_occupied">Owner occupied</option>
              <option value="tenant_occupied">Tenant occupied</option>
              <option value="vacant">Vacant</option>
            </select>
          </label>
          <label>
            Prior claims
            <input
              type="number"
              value={application.property.prior_claims_count}
              onChange={(e) =>
                setApplication({
                  ...application,
                  property: { ...application.property, prior_claims_count: Number(e.target.value) }
                })
              }
              required
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <h3>Coverage</h3>
        <div className="form-grid">
          <label>
            Dwelling limit
            <input
              type="number"
              value={application.coverage.dwelling_limit}
              onChange={(e) =>
                setApplication({
                  ...application,
                  coverage: { ...application.coverage, dwelling_limit: Number(e.target.value) }
                })
              }
              required
            />
          </label>
          <label>
            Liability limit
            <input
              type="number"
              value={application.coverage.liability_limit}
              onChange={(e) =>
                setApplication({
                  ...application,
                  coverage: { ...application.coverage, liability_limit: Number(e.target.value) }
                })
              }
              required
            />
          </label>
          <label>
            Deductible
            <input
              type="number"
              value={application.coverage.deductible}
              onChange={(e) =>
                setApplication({
                  ...application,
                  coverage: { ...application.coverage, deductible: Number(e.target.value) }
                })
              }
              required
            />
          </label>
        </div>
      </section>

      {error && <div className="result error">⚠️ {error}</div>}
      <div className="form-actions">
        <button className="ghost" type="button" onClick={() => window.history.back()}>
          Cancel
        </button>
        <button className="primary" type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Submitting..." : "Submit application"}
        </button>
      </div>
    </form>
  );
}
