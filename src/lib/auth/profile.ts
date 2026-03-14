import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { DEMO_ORG_ID, SECOND_DEMO_ORG_ID, DEFAULT_FIRST_ROLE } from "@/lib/constants";

/**
 * Ensures a profile exists for the user and they have at least one org membership.
 * Called on first sign-in so new users get access to the demo org.
 * Uses service role so we can insert into org_memberships without existing access.
 */
export async function ensureProfileAndMembership(
  userId: string,
  email: string | undefined,
  fullName?: string | null
): Promise<void> {
  const supabase = createSupabaseServiceClient();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (!existingProfile) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("profiles").insert({
      id: userId,
      status: "active",
      full_name: fullName ?? email ?? null
    });
  }

  const orgsToEnsure = [DEMO_ORG_ID, SECOND_DEMO_ORG_ID];

  for (const orgId of orgsToEnsure) {
    const { data: existingMembership } = await supabase
      .from("org_memberships")
      .select("id")
      .eq("user_id", userId)
      .eq("org_id", orgId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!existingMembership) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("org_memberships").insert({
        org_id: orgId,
        user_id: userId,
        membership_type: "member",
        status: "active"
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("role_assignments").insert({
        org_id: orgId,
        user_id: userId,
        role_key: DEFAULT_FIRST_ROLE,
        status: "active"
      });
    }
  }
}
