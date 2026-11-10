import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useDialerLogin, getGetDialerSessionQueryKey } from "@workspace/api-client-react";
import { AlertCircle, ArrowRight, ChevronDown, Eye, EyeOff, Loader2 } from "lucide-react";
import { InstallButton, Mark, OfflineBar } from "@/components/chrome";
import { useOnline } from "@/hooks/use-device";
import { clearAllDrafts, errMessage, errStatus } from "@/lib/dialer";

export default function LoginPage() {
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const online = useOnline();
  const login = useDialerLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tdk, setTdk] = useState("");
  const [show, setShow] = useState(false);
  const [adv, setAdv] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (login.isPending) return;
    if (!username.trim() || !password) { setError("Enter your Appflexor username and password."); return; }
    setError(null);
    const data: { username: string; password: string; taskDefinitionKey?: string } = { username: username.trim(), password };
    if (tdk.trim()) data.taskDefinitionKey = tdk.trim();
    login.mutate({ data }, {
      onSuccess: (session) => {
        setPassword("");
        qc.clear();
        clearAllDrafts();
        qc.setQueryData(getGetDialerSessionQueryKey(), session);
        navigate("/", { replace: true });
      },
      onError: (err) => {
        setPassword("");
        const s = errStatus(err);
        setError(s === 401 || s === 403 ? (errMessage(err, "") || "Username or password not recognised by Appflexor.") : errMessage(err, "Sign-in failed. Try again."));
      },
    });
  };

  return (
    <div className="min-h-[100dvh]">
      <OfflineBar />
      <div className="mx-auto grid min-h-[100dvh] max-w-5xl md:grid-cols-[1.1fr_1fr] md:items-center md:gap-12 md:px-8">
        <section className="relative overflow-hidden bg-sidebar px-6 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))] text-sidebar-foreground md:rounded-3xl md:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border-[28px] border-accent/25" />
          <div className="pointer-events-none absolute -right-4 top-6 h-24 w-24 rounded-full border-[10px] border-accent/40" />
          <div className="rise flex items-center gap-3">
            <Mark className="h-10 w-10 bg-sidebar-foreground text-sidebar" />
            <div className="leading-tight">
              <div className="text-sm font-bold">Appflexor Dialer</div>
              <div className="tabnum text-[10px] uppercase tracking-[0.2em] opacity-60">Sales line</div>
            </div>
          </div>
          <h1 className="rise mt-10 text-[2.6rem] font-extrabold leading-[0.95] tracking-tight md:text-6xl" style={{ animationDelay: "60ms" }}>
            Call.<br />Log the outcome.<br /><span className="text-accent">Next lead.</span>
          </h1>
          <p className="rise mt-5 max-w-xs text-sm opacity-70" style={{ animationDelay: "120ms" }}>
            Your assigned lead tasks, one tap from the phone dialer. Every call ends with Hot, Recall or Rejection.
          </p>
        </section>

        <section className="px-6 py-8 md:px-0">
          <form onSubmit={submit} className="rise mx-auto max-w-sm space-y-4" style={{ animationDelay: "160ms" }} noValidate>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
              <p className="mt-1 text-sm text-muted-foreground">Use your Appflexor workspace credentials.</p>
            </div>

            {error && (
              <div data-testid="text-login-error" role="alert" className="rise flex gap-2.5 rounded-xl border border-destructive/30 bg-destructive/8 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
              </div>
            )}

            <Field label="Username">
              <input data-testid="input-username" autoComplete="username" autoCapitalize="none" spellCheck={false}
                value={username} onChange={(e) => setUsername(e.target.value)} maxLength={200}
                className="h-12 w-full rounded-xl border border-input bg-card px-4 text-base outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15" />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input data-testid="input-password" type={show ? "text" : "password"} autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)} maxLength={1000}
                  className="h-12 w-full rounded-xl border border-input bg-card px-4 pr-12 text-base outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15" />
                <button type="button" data-testid="button-toggle-password" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1 grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <div>
              <button type="button" data-testid="button-advanced" onClick={() => setAdv((a) => !a)}
                className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
                Advanced <ChevronDown className={`h-3.5 w-3.5 transition-transform ${adv ? "rotate-180" : ""}`} />
              </button>
              {adv && (
                <div className="rise mt-3">
                  <Field label="Task definition key (optional)">
                    <input data-testid="input-task-definition-key" value={tdk} onChange={(e) => setTdk(e.target.value)} maxLength={200}
                      autoCapitalize="none" spellCheck={false} placeholder="e.g. callLead"
                      className="tabnum h-11 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/15" />
                  </Field>
                  <p className="mt-1.5 text-xs text-muted-foreground">Restricts the queue to one BPMN task key. Leave blank for all assigned tasks that carry a phone number.</p>
                </div>
              )}
            </div>

            <button type="submit" data-testid="button-sign-in" disabled={login.isPending || !online}
              className="press flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-[0_8px_20px_-8px_hsl(var(--primary)/.6)] disabled:opacity-50">
              {login.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in</> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
            </button>
            {!online && <p className="text-center text-xs text-muted-foreground">Connect to the internet to sign in.</p>}
            <div className="flex justify-center pt-2"><InstallButton variant="row" /></div>
          </form>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
