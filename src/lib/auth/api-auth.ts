import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Returns the current session user from cookies. Use in API route handlers.
 * Returns null if not authenticated.
 */
export async function getApiUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user ?? null;
}

const UNAUTHORIZED_RESPONSE = new Response(
  JSON.stringify({ ok: false, error: { message: "Unauthorized." } }),
  { status: 401, headers: { "Content-Type": "application/json" } }
);

const FORBIDDEN_RESPONSE = new Response(
  JSON.stringify({ ok: false, error: { message: "Forbidden: no access to this organization." } }),
  { status: 403, headers: { "Content-Type": "application/json" } }
);

/**
 * Returns the current user, or a 401 Response to return from the route.
 * Use at the start of protected API routes: const auth = await requireAuth(); if (auth.error) return auth.error; const user = auth.user;
 */
export async function requireAuth(): Promise<{ user: User } | { error: Response }> {
  const user = await getApiUser();
  if (!user) return { error: UNAUTHORIZED_RESPONSE };
  return { user };
}

/**
 * Checks that the current user has access to the given org. Returns a 403 Response
 * to return from the route if no access. Call after requireAuth().
 */
export async function requireOrgAccess(userId: string, orgId: string): Promise<Response | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("org_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!data) return FORBIDDEN_RESPONSE;
  return null;
}
