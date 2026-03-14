"use client";

import { useMemo, useState } from "react";

const DEMO_ORG_ID = "8f54f0b2-1376-4273-b2d5-df6088018f5b";

type ApiState<T> = {
  loading: boolean;
  data?: T;
  error?: string;
};

type ApplicationPayload = {
  org_id: string;
  effective_date: string;
  policyholder: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  property: {
    address_line_1: string;
    city: string;
    state: "TX";
    postal_code: string;
    construction_type: "frame" | "masonry" | "mixed";
    occupancy: "owner_occupied" | "tenant_occupied" | "vacant";
    year_built: number;
    square_footage: number;
    roof_age_years: number;
    replacement_cost: number;
    territory_code: string;
    prior_claims_count: number;
  };
  coverage: {
    dwelling_limit: number;
    liability_limit: number;
    deductible: number;
  };
  notes?: string;
};

type QuoteResponse = {
  quote_id: string;
  quote_number: string;
  total_premium: number;
  premium: number;
  fees: number;
  taxes: number;
  status: string;
};

type BindResponse = {
  policy: {
    policy_id: string;
    policy_number: string;
    effective_date: string;
    expiration_date: string;
    status: string;
  };
  invoice: {
    invoice_id: string;
    invoice_number: string;
    amount_due: number;
    status: string;
  };
};

function toISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addYears(date: string, years: number) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return toISO(d);
}

function pretty(obj: unknown) {
  return JSON.stringify(obj, null, 2);
}

export default function WorkflowDemo() {
  const today = useMemo(() => toISO(new Date()), []);

  const [application, setApplication] = useState<ApplicationPayload>({
    org_id: DEMO_ORG_ID,
    effective_date: today,
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
    notes: "Demo submission generated from the PolicyCore playground."
  });

  const [appResult, setAppResult] = useState<ApiState<{ id: string }>>({ loading: false });
  const [quoteResult, setQuoteResult] = useState<ApiState<QuoteResponse>>({ loading: false });
  const [bindResult, setBindResult] = useState<ApiState<BindResponse>>({ loading: false });
  const [dashboard, setDashboard] = useState<ApiState<unknown>>({ loading: false });

  const disableQuote = !appResult.data || quoteResult.loading || bindResult.loading;
  const disableBind = !quoteResult.data || bindResult.loading;

  async function createApplication() {
    setAppResult({ loading: true });
    try {
      const res = await fetch("/api/v1/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(application)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Application failed");
      setAppResult({ loading: false, data: json.data ?? json });
    } catch (error) {
      setAppResult({ loading: false, error: (error as Error).message });
    }
  }

  async function createQuote() {
    if (!appResult.data) return;
    setQuoteResult({ loading: true });
    try {
      const res = await fetch("/api/v1/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: application.org_id, application_id: appResult.data.id })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Quote failed");
      setQuoteResult({ loading: false, data: json.data ?? json });
    } catch (error) {
      setQuoteResult({ loading: false, error: (error as Error).message });
    }
  }

  async function bindQuote() {
    if (!quoteResult.data) return;
    setBindResult({ loading: true });
    try {
      const res = await fetch(`/api/v1/quotes/${quoteResult.data.quote_id}/bind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: application.org_id,
          effective_date: application.effective_date,
          expiration_date: addYears(application.effective_date, 1)
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Bind failed");
      setBindResult({ loading: false, data: json.data ?? json });
    } catch (error) {
      setBindResult({ loading: false, error: (error as Error).message });
    }
  }

  async function refreshDashboard() {
    setDashboard({ loading: true });
    try {
      const res = await fetch(`/api/v1/reports/dashboard?org_id=${application.org_id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Dashboard fetch failed");
      setDashboard({ loading: false, data: json.data ?? json });
    } catch (error) {
      setDashboard({ loading: false, error: (error as Error).message });
    }
  }

  function resetFlow() {
    setAppResult({ loading: false, data: undefined, error: undefined });
    setQuoteResult({ loading: false, data: undefined, error: undefined });
    setBindResult({ loading: false, data: undefined, error: undefined });
    setDashboard({ loading: false, data: undefined, error: undefined });
  }

  return (
    <section className="workflow">
      <div className="workflow-header">
        <div>
          <p className="eyebrow">Agent & Ops Demo</p>
          <h2>End-to-end workflow on Supabase</h2>
          <p className="lede">
            Use the seeded Texas org to submit an application, rate a quote, bind a policy, and see dashboard totals. All calls hit the
            live /api/v1 routes which talk to Supabase with RLS-ready schemas.
          </p>
        </div>
        <div className="toolbar">
          <button className="ghost" onClick={resetFlow} type="button">
            Reset run
          </button>
          <button className="primary" onClick={refreshDashboard} type="button" disabled={dashboard.loading}>
            {dashboard.loading ? "Loading..." : "Refresh dashboard"}
          </button>
        </div>
      </div>

      <div className="workflow-grid">
        <article className="workflow-card">
          <div className="card-head">
            <div>
              <p className="eyebrow">Step 1</p>
              <h3>Create application</h3>
            </div>
            <button className="primary" onClick={createApplication} type="button" disabled={appResult.loading}>
              {appResult.loading ? "Submitting..." : "Submit"}
            </button>
          </div>
          <div className="field-grid">
            <label>
              Effective date
              <input
                type="date"
                value={application.effective_date}
                onChange={(e) => setApplication({ ...application, effective_date: e.target.value })}
              />
            </label>
            <label>
              Policyholder email
              <input
                type="email"
                value={application.policyholder.email}
                onChange={(e) =>
                  setApplication({
                    ...application,
                    policyholder: { ...application.policyholder, email: e.target.value }
                  })
                }
              />
            </label>
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
              />
            </label>
            <label>
              Territory code
              <input
                type="text"
                value={application.property.territory_code}
                onChange={(e) =>
                  setApplication({
                    ...application,
                    property: { ...application.property, territory_code: e.target.value }
                  })
                }
              />
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
              />
            </label>
          </div>
          <Result state={appResult} />
        </article>

        <article className="workflow-card">
          <div className="card-head">
            <div>
              <p className="eyebrow">Step 2</p>
              <h3>Generate quote</h3>
            </div>
            <button className="primary" onClick={createQuote} type="button" disabled={disableQuote}>
              {quoteResult.loading ? "Rating..." : "Rate"}
            </button>
          </div>
          <p className="hint">Uses deterministic rating + coverage snapshot. Application must exist first.</p>
          <Result state={quoteResult} />
        </article>

        <article className="workflow-card">
          <div className="card-head">
            <div>
              <p className="eyebrow">Step 3</p>
              <h3>Bind policy & create invoice</h3>
            </div>
            <button className="primary" onClick={bindQuote} type="button" disabled={disableBind}>
              {bindResult.loading ? "Binding..." : "Bind"}
            </button>
          </div>
          <p className="hint">Creates policy term + first invoice, then updates the quote status to bound.</p>
          <Result state={bindResult} />
        </article>

        <article className="workflow-card">
          <div className="card-head">
            <div>
              <p className="eyebrow">Step 4</p>
              <h3>Org dashboard</h3>
            </div>
            <button className="ghost" onClick={refreshDashboard} type="button" disabled={dashboard.loading}>
              {dashboard.loading ? "Loading..." : "Refresh"}
            </button>
          </div>
          <p className="hint">Reads aggregates from Supabase (applications, quotes, policies, claims, invoices, payments).</p>
          <Result state={dashboard} />
        </article>
      </div>
    </section>
  );
}

function Result<T>({ state }: { state: ApiState<T> }) {
  if (state.loading) return <div className="result loading">Working...</div>;
  if (state.error) return <div className="result error">⚠️ {state.error}</div>;
  if (!state.data) return <div className="result muted">No data yet.</div>;
  return (
    <pre className="result code">
      <code>{pretty(state.data)}</code>
    </pre>
  );
}
