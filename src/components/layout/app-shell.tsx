"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { useTheme } from "@/components/ui/theme-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Persona, UserOrg } from "@/lib/auth/session";

const BASE_NAV_ITEMS = [
  { label: "Dashboard", href: "/app" },
  { label: "Applications", href: "/app/applications" },
  { label: "Quotes", href: "/app/quotes" },
  { label: "Policies", href: "/app/policies" },
  { label: "Claims", href: "/app/claims" },
  { label: "Billing", href: "/app/billing" },
  { label: "Reports", href: "/app/reports" },
  { label: "Settings", href: "/app/settings" }
];

function navItemsForPersona(persona: Persona) {
  if (persona === "customer") {
    return [
      { label: "Customer Home", href: "/app/customer" },
      { label: "My Policies", href: "/app/customer/policies" },
      { label: "My Invoices", href: "/app/customer/invoices" },
      { label: "My Claims", href: "/app/customer/claims" },
      { label: "Settings", href: "/app/settings" }
    ];
  }
  return [
    ...BASE_NAV_ITEMS.slice(0, 3),
    { label: "Agent Quotes", href: "/app/agent/quotes" },
    ...BASE_NAV_ITEMS.slice(3)
  ];
}

function personaLabel(p: Persona): string {
  return p === "ops_admin" ? "Ops / Admin" : p === "agent" ? "Agent" : "Customer";
}

export function AppShell({
  children,
  userEmail,
  orgName,
  orgId,
  persona = "ops_admin",
  orgs = []
}: {
  children: React.ReactNode;
  userEmail: string | null;
  orgName?: string | null;
  orgId?: string | null;
  persona?: Persona;
  orgs?: UserOrg[];
}) {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const navItems = navItemsForPersona(persona);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const handleOrgChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const nextOrgId = e.target.value;
      if (!nextOrgId || nextOrgId === orgId) return;
      setSwitching(true);
      try {
        const res = await fetch("/api/v1/me/org", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ org_id: nextOrgId })
        });
        if (res.ok) router.refresh();
      } finally {
        setSwitching(false);
      }
    },
    [orgId, router]
  );

  const showOrgSwitcher = orgs.length > 1;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="logo-dot" />
          <div className="brand-text">
            <p className="brand-name">PolicyCore</p>
            {showOrgSwitcher ? (
              <select
                className="org-switcher"
                value={orgId ?? ""}
                onChange={handleOrgChange}
                disabled={switching}
                aria-label="Switch organization"
              >
                {orgs.map((o) => (
                  <option key={o.orgId} value={o.orgId}>
                    {o.orgName}
                  </option>
                ))}
              </select>
            ) : (
              <p className="brand-sub">{orgName ?? "Texas HO"}</p>
            )}
          </div>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{userEmail?.slice(0, 1).toUpperCase() ?? "U"}</div>
            <div>
              <p className="user-email">{userEmail ?? "User"}</p>
              <p className="user-role">{personaLabel(persona)}</p>
            </div>
          </div>
          <button className="ghost small" onClick={toggle} type="button">
            Theme: {theme === "light" ? "Light" : "Dark"}
          </button>
          <button className="ghost small" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">AI Hackathon</p>
            <h1>Texas Homeowners Administration</h1>
          </div>
          <div className="topbar-actions">
            <Link href="/app/applications/new" className="primary">
              New application
            </Link>
            <button className="ghost" type="button" onClick={toggle}>
              {theme === "light" ? "Switch to dark" : "Switch to light"}
            </button>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
