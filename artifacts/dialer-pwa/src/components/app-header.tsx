import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { logoutFromCrm, type DialerSession } from "@/lib/crm";
import { Loader2, LogOut } from "lucide-react";
import { InstallButton, Mark } from "@/components/chrome";

export function AppHeader({ session, onLogout }: { session: DialerSession; onLogout: () => void }) {
  const [, navigate] = useLocation();
  const logout = useMutation({ mutationFn: () => logoutFromCrm(session) });
  const finish = () => { onLogout(); navigate("/login", { replace: true }); };
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
        <Mark className="h-8 w-8" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-sm font-bold">Dialer</div>
          <div data-testid="text-username" className="tabnum truncate text-[11px] text-muted-foreground">
            {session.username}{session.taskDefinitionKey ? ` / ${session.taskDefinitionKey}` : ""}
          </div>
        </div>
        <InstallButton />
        <button data-testid="button-logout" disabled={logout.isPending}
          onClick={() => logout.mutate(undefined, { onSettled: finish })}
          className="press grid h-10 w-10 place-items-center rounded-full hover:bg-secondary" aria-label="Sign out">
          {logout.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
