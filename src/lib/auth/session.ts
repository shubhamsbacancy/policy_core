import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Persona = "ops_admin" | "agent" | "customer";

export type OrgContext = {
  orgId: string;
  orgName: string;
  persona: Persona;
};

export type UserOrg = {
  orgId: string;
  orgName: string;
};

/**
 * Returns the current session user or null. Use in server components and route handlers
 * that have access to cookies (e.g. via next/headers).
 */
export async function getSessionUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user ?? null;
}

/**
 * Returns all orgs the user belongs to (for org switcher). Uses RLS.
 */
export async function listUserOrgs(userId: string): Promise<UserOrg[]> {
  const supabase = await createSupabaseServerClient();
  const { data: memberships } = await supabase
    .from("org_memberships")
    .select("org_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (!memberships?.length) return [];

  const orgIds = [...new Set(memberships.map((m) => m.org_id))];
  const results: UserOrg[] = [];

  for (const orgId of orgIds) {
    const { data: org } = await supabase.from("orgs").select("name").eq("id", orgId).single();
    if (org?.name) results.push({ orgId, orgName: org.name });
    else results.push({ orgId, orgName: "Organization" });
  }

  return results.sort((a, b) => a.orgName.localeCompare(b.orgName));
}

/**
 * Returns org context for the current user. If preferredOrgId is set and the user
 * has access to that org, uses it; otherwise uses the first org from memberships.
 * Use with getCurrentOrgIdFromCookie() to respect the org switcher.
 */
export async function getOrgAndPersona(
  userId: string,
  preferredOrgId?: string | null
): Promise<OrgContext | null> {
  const supabase = await createSupabaseServerClient();
  const cookieOrg = preferredOrgId ?? (await cookies()).get("pc_org")?.value ?? undefined;

  let orgId: string | null = null;

  if (cookieOrg) {
    const { data: membership } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", userId)
      .eq("org_id", cookieOrg)
      .eq("status", "active")
      .maybeSingle();
    if (membership?.org_id) orgId = membership.org_id;
  }

  if (!orgId) {
    const { data: membership } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    orgId = membership?.org_id ?? null;
  }

  if (!orgId) return null;

  const { data: org } = await supabase.from("orgs").select("name").eq("id", orgId).single();
  const orgName = org?.name ?? "Organization";

  const { data: role } = await supabase
    .from("role_assignments")
    .select("role_key")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const persona = (role?.role_key as Persona) ?? "ops_admin";

  return { orgId, orgName, persona };
}
