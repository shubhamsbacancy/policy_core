import { createSupabaseServerClient } from "@/lib/supabase/server";

type OrgContext = {
  user: { id: string; email: string | null };
  org: { id: string; name: string; slug: string };
  role: string;
};

const DEMO_ORG = {
  id: "8f54f0b2-1376-4273-b2d5-df6088018f5b",
  name: "Lone Star MGA",
  slug: "lone-star-mga"
};

export async function getUserOrgContext(): Promise<OrgContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch memberships
  const { data: memberships } = await supabase
    .from("org_memberships")
    .select("org_id, org:orgs(id, name, slug)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const { data: roles } = await supabase
    .from("role_assignments")
    .select("org_id, role_key")
    .eq("user_id", user.id)
    .eq("status", "active");

  type Membership = { org_id?: string; org?: { id: string; name: string; slug: string } };
  const membershipList = ((memberships ?? []) as unknown as Membership[]) ?? [];
  const primaryMembership = membershipList[0];
  const primaryRole = (roles ?? []).find((r) => r.org_id === primaryMembership?.org_id) ?? (roles ?? [])[0];

  if (primaryMembership?.org) {
    return {
      user: { id: user.id, email: user.email ?? null },
      org: {
        id: primaryMembership.org.id,
        name: primaryMembership.org.name,
        slug: primaryMembership.org.slug
      },
      role: primaryRole?.role_key ?? "ops_admin"
    };
  }

  // Fallback to demo org when user has no membership yet (demo convenience)
  return {
    user: { id: user.id, email: user.email ?? null },
    org: DEMO_ORG,
    role: primaryRole?.role_key ?? "ops_admin"
  };
}
