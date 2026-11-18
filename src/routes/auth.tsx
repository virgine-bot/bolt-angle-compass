import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AppShell } from "@/components/bolt/app-shell";
import { LogoMark } from "@/components/bolt/logo-mark";
import { APP_NAME } from "@/lib/app-config";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: `Sign in — ${APP_NAME}` },
      { name: "description", content: "Sign in with your team account to save and review bolt inspections." },
      { property: "og:title", content: `Sign in — ${APP_NAME}` },
      { property: "og:description", content: "Sign in with your team account to save and review bolt inspections." },
    ],
  }),
  component: AuthPage,
});

const safePath = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/");

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const goNext = () => navigate({ href: safePath(redirect), replace: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && goNext());
    const { data } = supabase.auth.onAuthStateChange((e) => e === "SIGNED_IN" && goNext());
    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      setMsg(error ? error.message : "Check your email and click the link to confirm your account.");
    }
    setBusy(false);
  };

  const social = async (provider: "google" | "lovable") => {
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (r.error) setMsg(r.error.message);
  };

  const field = "w-full rounded-xl border bg-card px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40";
  return (
    <AppShell hideNav>
      <div className="flex flex-1 flex-col px-6 pt-12">
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="font-display text-lg font-extrabold">{APP_NAME}</span>
        </div>
        <h1 className="mt-8 font-display text-[28px] font-extrabold leading-tight">
          {mode === "signin" ? "Sign in to your team" : "Create a team account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Inspections and photos are shared with everyone on the team.</p>
        <div className="mt-6 flex flex-col gap-2.5">
          <button type="button" onClick={() => social("google")} className="flex items-center justify-center gap-2.5 rounded-xl border bg-card py-3 text-sm font-medium">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
            Continue with Google
          </button>
          <button type="button" onClick={() => social("lovable")} className="flex items-center justify-center gap-2.5 rounded-xl border bg-card py-3 text-sm font-medium">
            <LovableMark className="size-[18px]" />
            Continue with Lovable
          </button>
        </div>
        <p className="my-5 text-center text-xs text-muted-foreground">or with email</p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === "signup" && <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={field} />}
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={field} />
          <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={field} />
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
          <button disabled={busy} className="mt-1 rounded-2xl bg-signal py-4 font-semibold text-primary-foreground shadow-signal disabled:opacity-50">
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMsg(null); }} className="mt-4 pb-10 text-sm font-medium text-primary">
          {mode === "signin" ? "New to the team? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </AppShell>
  );
}
