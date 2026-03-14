import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ensureProfileAndMembership } from "@/lib/auth/profile";
import { getCurrentOrgIdFromCookie } from "@/lib/auth/org-cookie";
import { getOrgAndPersona, listUserOrgs } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Idempotent: ensures profile exists and user is in demo orgs (including second org for switcher)
  await ensureProfileAndMembership(user.id, user.email ?? undefined, user.user_metadata?.full_name as string | undefined);

  const preferredOrgId = await getCurrentOrgIdFromCookie();
  const orgContext = await getOrgAndPersona(user.id, preferredOrgId);
  const orgs = await listUserOrgs(user.id);

  return (
    <ThemeProvider>
      <AppShell
        userEmail={user.email ?? null}
        orgName={orgContext?.orgName ?? null}
        orgId={orgContext?.orgId ?? null}
        persona={orgContext?.persona ?? "ops_admin"}
        orgs={orgs}
      >
        {children}
      </AppShell>
    </ThemeProvider>
  );
}
