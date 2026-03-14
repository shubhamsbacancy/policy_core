import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentOrgIdFromCookie, getOrgAndPersona, getSessionUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ThemeSettingsCard } from "./theme-settings-card";

async function updateProfile(formData: FormData) {
  "use server";

  const fullNameRaw = formData.get("full_name");
  const fullName = typeof fullNameRaw === "string" ? fullNameRaw.trim().slice(0, 120) : "";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: fullName || null,
      status: "active"
    }, { onConflict: "id" });

  if (error) {
    redirect(`/app/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/app/settings");
  redirect("/app/settings?saved=1");
}

export default async function SettingsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const preferredOrgId = await getCurrentOrgIdFromCookie();
  const orgContext = await getOrgAndPersona(user.id, preferredOrgId);

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  const params = (await searchParams) ?? {};
  const saved = (Array.isArray(params.saved) ? params.saved[0] : params.saved) === "1";
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>Profile & organization</h2>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Profile</p>
              <h3>My account</h3>
            </div>
          </div>
          {saved && <p className="hint">Profile updated successfully.</p>}
          {error && <p className="result error">⚠️ {error}</p>}
          <form className="form" action={updateProfile}>
            <label>
              Full name
              <input
                type="text"
                name="full_name"
                defaultValue={profile?.full_name ?? ""}
                maxLength={120}
                placeholder="Your name"
              />
            </label>
            <label>
              Email
              <input type="email" value={user.email ?? ""} disabled readOnly />
            </label>
            <button className="primary" type="submit">
              Save profile
            </button>
          </form>
          <p className="subtle">
            Created: {profile?.created_at ? new Date(profile.created_at).toLocaleString() : "—"}
          </p>
          <p className="subtle">
            Updated: {profile?.updated_at ? new Date(profile.updated_at).toLocaleString() : "—"}
          </p>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Organization</p>
              <h3>Current context</h3>
            </div>
          </div>
          <ul className="detail-list">
            <li>
              <span>Organization</span>
              <span>{orgContext?.orgName ?? "—"}</span>
            </li>
            <li>
              <span>Org ID</span>
              <span>{orgContext?.orgId ?? "—"}</span>
            </li>
            <li>
              <span>Role</span>
              <span>{orgContext?.persona ?? "ops_admin"}</span>
            </li>
          </ul>
        </div>
      </div>

      <ThemeSettingsCard />
    </div>
  );
}
