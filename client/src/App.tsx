import { useEffect, useState } from 'react';
import { AdminView } from './pages/AdminView';
import { AnalysisView } from './pages/AnalysisView';
import { DashboardView } from './pages/DashboardView';
import { HistoryView } from './pages/HistoryView';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ReportsView } from './pages/ReportsView';
import { ZonesView } from './pages/ZonesView';
import { AppShell, type ViewKey } from './layouts/AppShell';
import type { DemoUser, Session } from './types';

const SESSION_KEY = 'planta-local-session';
const VIEW_KEY = 'planta-current-view';
const validViews: ViewKey[] = ['dashboard', 'analisis', 'historial', 'zonas', 'reportes', 'admin'];

interface StoredSession {
  user: DemoUser;
  session: Session;
}

function canAccessView(view: ViewKey, nextUser: DemoUser | null) {
  return view !== 'admin' || nextUser?.role === 'administrador';
}

function readStoredView(nextUser: DemoUser | null): ViewKey {
  const storedView = localStorage.getItem(VIEW_KEY) as ViewKey | null;

  if (storedView && validViews.includes(storedView) && canAccessView(storedView, nextUser)) {
    return storedView;
  }

  return 'dashboard';
}

function readStoredSession(): StoredSession | null {
  const raw = localStorage.getItem(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function App() {
  const [entry, setEntry] = useState<'landing' | 'login'>('landing');
  const [user, setUser] = useState<DemoUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setCurrentView] = useState<ViewKey>('dashboard');

  useEffect(() => {
    const stored = readStoredSession();
    if (stored) {
      setUser(stored.user);
      setSession(stored.session);
      setCurrentView(readStoredView(stored.user));
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'administrador' && currentView === 'admin') {
      setCurrentView('dashboard');
      localStorage.setItem(VIEW_KEY, 'dashboard');
    }
  }, [currentView, user]);

  function handleNavigate(view: ViewKey) {
    if (!canAccessView(view, user)) {
      return;
    }

    setCurrentView(view);
    localStorage.setItem(VIEW_KEY, view);
  }

  function handleLogin(nextUser: DemoUser, nextSession: Session) {
    setUser(nextUser);
    setSession(nextSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: nextUser, session: nextSession }));
    const nextView = readStoredView(nextUser);
    setCurrentView(nextView);
    localStorage.setItem(VIEW_KEY, nextView);
  }

  function handleUserUpdate(nextUser: DemoUser) {
    setUser(nextUser);

    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user: nextUser, session }));
    }
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(VIEW_KEY);
    setUser(null);
    setSession(null);
    setCurrentView('dashboard');
    setEntry('landing');
  }

  if (!user || !session) {
    if (entry === 'login') {
      return <LoginPage onBack={() => setEntry('landing')} onLogin={handleLogin} />;
    }

    return <LandingPage onEnter={() => setEntry('login')} />;
  }

  return (
    <AppShell
      user={user}
      currentView={currentView}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {currentView === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
      {currentView === 'analisis' && (
        <AnalysisView user={user} onNavigate={handleNavigate} onUserUpdate={handleUserUpdate} />
      )}
      {currentView === 'historial' && <HistoryView />}
      {currentView === 'zonas' && <ZonesView />}
      {currentView === 'reportes' && <ReportsView />}
      {currentView === 'admin' && user.role === 'administrador' && <AdminView user={user} />}
    </AppShell>
  );
}
