import { useEffect, type ReactNode } from 'react';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGetDialerSession, getGetDialerSessionQueryKey, type DialerSession } from '@workspace/api-client-react';
import { AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppHeader } from '@/components/app-header';
import { FullScreenLoader, Mark, OfflineBar } from '@/components/chrome';
import NotFound from '@/pages/not-found';
import LoginPage from '@/pages/login';
import QueuePage from '@/pages/queue';
import TaskPage from '@/pages/task';
import { clearAllDrafts, errMessage, errStatus } from '@/lib/dialer';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (err, query) => {
      if (errStatus(err) !== 401) return;
      const sk = getGetDialerSessionQueryKey();
      if (query.queryKey[0] === sk[0]) return;
      // Session expired mid-use: drop user data and recheck session -> gate sends to /login
      clearAllDrafts();
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== sk[0] });
      queryClient.invalidateQueries({ queryKey: sk });
    },
  }),
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true } },
});

function Gate() {
  const [location, navigate] = useLocation();
  const s = useGetDialerSession({ query: { queryKey: getGetDialerSessionQueryKey(), retry: false, refetchOnWindowFocus: true } });
  const unauth = errStatus(s.error) === 401;
  const onLogin = location === '/login';

  useEffect(() => {
    if (s.isLoading) return;
    if (s.data && !s.isError && onLogin) navigate('/', { replace: true });
    if (unauth && !onLogin) { queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== getGetDialerSessionQueryKey()[0] }); navigate('/login', { replace: true }); }
  }, [s.isLoading, s.data, s.isError, unauth, onLogin, navigate]);

  if (s.isLoading) return <FullScreenLoader />;
  if (onLogin) return s.data && !s.isError ? <FullScreenLoader label="Opening queue" /> : <LoginPage />;
  if (unauth) return <FullScreenLoader label="Redirecting to sign in" />;
  if (s.isError || !s.data) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center" data-testid="status-session-error">
        <Mark className="h-12 w-12" />
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <p className="max-w-xs text-sm text-muted-foreground">{errMessage(s.error)}</p>
        <button data-testid="button-retry-session" onClick={() => s.refetch()} className="press rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">Try again</button>
      </div>
    );
  }
  return <Shell session={s.data} />;
}

function Shell({ session }: { session: DialerSession }) {
  return (
    <div className="min-h-[100dvh]">
      <OfflineBar />
      <AppHeader session={session} />
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/">{() => <QueuePage session={session} />}</Route>
          <Route path="/tasks/:id">{(p) => <TaskPage key={p.id} id={decodeURIComponent(p.id)} session={session} />}</Route>
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </div>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Gate />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
