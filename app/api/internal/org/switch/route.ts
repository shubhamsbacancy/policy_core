import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/api-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const orgId = body?.org_id as string | undefined;
  if (!orgId) return NextResponse.json({ ok: false, error: "org_id is required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("org_memberships")
    .select("id")
    .eq("org_id", orgId)
    .eq("user_id", auth.user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!data) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const cookieStore = await cookies();
  cookieStore.set("pc_org", orgId, { path: "/", httpOnly: false, sameSite: "lax" });

  return NextResponse.json({ ok: true });
}
