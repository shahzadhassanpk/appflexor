import { useState, type ReactNode } from "react";
import { Download, Share, SquarePlus, WifiOff, X } from "lucide-react";
import { useInstall, useOnline } from "@/hooks/use-device";
import { OUTCOME_META, isOutcome } from "@/lib/dialer";
import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <div className={cn("grid place-items-center rounded-[10px] bg-primary text-primary-foreground", className)}>
      <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
        <path d="M15 3a6 6 0 0 1 6 6" stroke="hsl(var(--accent))" />
      </svg>
    </div>
  );
}

export function OfflineBar() {
  const online = useOnline();
  if (online) return null;
  return (
    <div data-testid="status-offline" className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-foreground px-4 py-2 text-xs font-semibold text-background">
      <WifiOff className="h-3.5 w-3.5" /> Offline. Queue shows last loaded data; completing tasks is paused.
    </div>
  );
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  if (!status) return <span className={cn("rounded-full border border-dashed border-input px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", className)}>Unset</span>;
  const known = isOutcome(status);
  return (
    <span
      data-testid="status-task"
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", className)}
      style={known
        ? { background: `hsl(${OUTCOME_META[status].color} / .14)`, color: `hsl(${OUTCOME_META[status].color})` }
        : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: known ? `hsl(${OUTCOME_META[status].color})` : "currentColor" }} />
      {status}
    </span>
  );
}

export function InstallButton({ variant = "chip" }: { variant?: "chip" | "row" }) {
  const { canPrompt, isIOS, installed, prompt } = useInstall();
  const [iosOpen, setIosOpen] = useState(false);
  if (installed || (!canPrompt && !isIOS)) return null;
  const onClick = () => (canPrompt ? void prompt() : setIosOpen(true));
  return (
    <>
      <button
        data-testid="button-install"
        onClick={onClick}
        className={cn("press inline-flex items-center gap-1.5 font-semibold",
          variant === "chip" ? "rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-secondary" : "text-sm text-primary underline-offset-4 hover:underline")}
      >
        <Download className="h-3.5 w-3.5" /> Install app
      </button>
      {iosOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 p-3 sm:items-center" onClick={() => setIosOpen(false)}>
          <div className="rise w-full max-w-sm rounded-2xl bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Add Dialer to Home Screen</h3>
              <button data-testid="button-close-ios" onClick={() => setIosOpen(false)} className="rounded-full p-1.5 hover:bg-muted" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <ol className="space-y-3 text-sm">
              <Step n={1}>Open this page in Safari.</Step>
              <Step n={2}>Tap <Share className="mx-1 inline h-4 w-4 align-[-3px]" /> Share in the toolbar.</Step>
              <Step n={3}>Choose <SquarePlus className="mx-1 inline h-4 w-4 align-[-3px]" /> Add to Home Screen, then Add.</Step>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="tabnum grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">{n}</span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

export function FullScreenLoader({ label = "Checking your session" }: { label?: string }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4" data-testid="status-session-loading">
      <div className="ring-pulse rounded-[14px]"><Mark className="h-14 w-14 rounded-[14px]" /></div>
      <p className="tabnum text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
    </div>
  );
}
