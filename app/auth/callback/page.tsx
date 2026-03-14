"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Handles redirects from Supabase:
 * - Email confirmation: ?code=... or hash fragment (session set by Supabase client).
 * - Password recovery: same.
 * If no code, shows link to sign in (e.g. after user already confirmed).
 */
function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "ok" | "error" | "no-code">("pending");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setStatus("no-code");
      return;
    }

    const run = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        setStatus("ok");
        router.replace("/app");
        router.refresh();
      } catch (err) {
        setStatus("error");
        setMessage(
          err instanceof Error ? err.message : "This link is invalid or expired. Try signing in or request a new link."
        );
      }
    };

    run();
  }, [router, searchParams]);

  if (status === "no-code") {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow">PolicyCore</p>
          <h1>Sign in</h1>
          <p className="hint">Use your email and password to access the dashboard.</p>
          <Link href="/login" className="primary full" style={{ display: "block", textAlign: "center" }}>
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">PolicyCore</p>
        <h1>{status === "pending" ? "Completing sign-in…" : status === "ok" ? "Success" : "Something went wrong"}</h1>
        {status === "pending" && <p className="hint">One moment.</p>}
        {status === "ok" && <p className="hint">Redirecting to your dashboard…</p>}
        {status === "error" && (
          <>
            <div className="result error">⚠️ {message}</div>
            <Link href="/login" className="primary full" style={{ display: "block", textAlign: "center", marginTop: "1rem" }}>
              Go to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell">
          <div className="auth-card">
            <p className="eyebrow">PolicyCore</p>
            <h1>Completing sign-in…</h1>
            <p className="hint">One moment.</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
