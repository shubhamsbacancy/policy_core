import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/api-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("org_memberships")
    .select("org_id, orgs(id, name, slug)")
    .eq("user_id", auth.user.id)
    .eq("status", "active");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const orgs = (data ?? []).map((item) => {
    const org = (item as { org_id: string; orgs?: { id?: string; name?: string; slug?: string } }).orgs;
    return {
      id: org?.id ?? (item as { org_id: string }).org_id,
      name: org?.name ?? "Organization",
      slug: org?.slug ?? ""
    };
  });

  return NextResponse.json({ ok: true, orgs });
}
