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

const SESSION_KEY = 'planta-demo-session';

interface StoredSession {
  user: DemoUser;
  session: Session;
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
    }
  }, []);

  function handleLogin(nextUser: DemoUser, nextSession: Session) {
    setUser(nextUser);
    setSession(nextSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: nextUser, session: nextSession }));
    setCurrentView('dashboard');
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setSession(null);
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
      onNavigate={setCurrentView}
      onLogout={handleLogout}
    >
      {currentView === 'dashboard' && <DashboardView onNavigate={setCurrentView} />}
      {currentView === 'analisis' && <AnalysisView user={user} onNavigate={setCurrentView} />}
      {currentView === 'historial' && <HistoryView />}
      {currentView === 'zonas' && <ZonesView />}
      {currentView === 'reportes' && <ReportsView />}
      {currentView === 'admin' && <AdminView user={user} />}
    </AppShell>
  );
}
