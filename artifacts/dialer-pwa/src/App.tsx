import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppHeader } from '@/components/app-header';
import { FullScreenLoader, OfflineBar } from '@/components/chrome';
import NotFound from '@/pages/not-found';
import LoginPage from '@/pages/login';
import QueuePage from '@/pages/queue';
import TaskPage from '@/pages/task';
import { clearAllDrafts } from '@/lib/dialer';
import { clearSession, readSession, type DialerSession } from '@/lib/crm';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient: QueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true } },
});

function Gate() {
  const [location, navigate] = useLocation();
  const [session, setSession] = useState<DialerSession | null>(readSession);
  const onLogin = location === '/login';
  const signOut = () => {
    clearSession();
    clearAllDrafts();
    queryClient.clear();
    setSession(null);
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    if (session && onLogin) navigate('/', { replace: true });
    if (!session && !onLogin) navigate('/login', { replace: true });
  }, [session, onLogin, navigate]);

  useEffect(() => {
    window.addEventListener('dialer:unauthorized', signOut);
    return () => window.removeEventListener('dialer:unauthorized', signOut);
  });

  if (!session) return <LoginPage onLogin={setSession} />;
  if (onLogin) return <FullScreenLoader label="Opening queue" />;
  return <Shell session={session} onLogout={signOut} />;
}

function Shell({ session, onLogout }: { session: DialerSession; onLogout: () => void }) {
  return (
    <div className="min-h-[100dvh]">
      <OfflineBar />
      <AppHeader session={session} onLogout={onLogout} />
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
