import {
  BarChart3,
  History,
  LayoutDashboard,
  LogOut,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sprout,
  UploadCloud
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import type { DemoUser } from '../types';

export type ViewKey = 'dashboard' | 'analisis' | 'historial' | 'zonas' | 'reportes' | 'admin';

interface AppShellProps {
  user: DemoUser;
  currentView: ViewKey;
  onNavigate: (view: ViewKey) => void;
  onLogout: () => void;
  children: ReactNode;
}

const menuItems: Array<{ id: ViewKey; icon: typeof LayoutDashboard; label: string }> = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'analisis', icon: UploadCloud, label: 'Nuevo análisis' },
  { id: 'historial', icon: History, label: 'Historial' },
  { id: 'zonas', icon: MapPin, label: 'Zonas verdes' },
  { id: 'reportes', icon: BarChart3, label: 'Reportes' },
  { id: 'admin', icon: Settings, label: 'Administrador' }
];

const roleLabels = {
  invitado: 'Invitado',
  usuario: 'Usuario',
  supervisor: 'Supervisor',
  administrador: 'Administrador'
};

const SIDEBAR_COLLAPSED_KEY = 'planta-sidebar-collapsed';

function readStoredSidebarState() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function AppShell({ user, currentView, onNavigate, onLogout, children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readStoredSidebarState);
  const visibleMenuItems = menuItems.filter(
    (item) => item.id !== 'admin' || user.role === 'administrador'
  );
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className="planta-app-shell flex min-h-screen bg-background text-foreground">
      <aside
        className="planta-sidebar no-print hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition lg:flex"
        style={{ width: sidebarCollapsed ? 88 : 256 }}
      >
        <div className="border-b border-sidebar-border p-5">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Sprout className="h-6 w-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-white">P.L.A.N.T.A.</h1>
                <p className="text-xs text-white/58">Gestión institucional</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            aria-pressed={sidebarCollapsed}
            aria-label={sidebarCollapsed ? 'Expandir navegación lateral' : 'Colapsar navegación lateral'}
            title={sidebarCollapsed ? 'Expandir navegación' : 'Colapsar navegación'}
            className={`mt-4 flex w-full items-center rounded-lg border border-white/10 px-3 py-2 text-sm text-white/78 transition hover:bg-white/10 ${
              sidebarCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            {!sidebarCollapsed && <span>Navegación</span>}
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <nav className={`flex-1 space-y-1 ${sidebarCollapsed ? 'p-3' : 'p-4'}`}>
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={item.label}
                className={`flex w-full items-center rounded-lg py-3 transition ${
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-white/78 hover:bg-sidebar-accent hover:text-white'
                } ${sidebarCollapsed ? 'justify-center px-3' : 'gap-3 px-4 text-left'}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className={`border-t border-sidebar-border ${sidebarCollapsed ? 'p-3' : 'p-4'}`}>
          <div
            className={`flex items-center rounded-lg bg-white/5 p-3 ${
              sidebarCollapsed ? 'justify-center' : 'gap-3'
            }`}
            title={`${user.name} · ${roleLabels[user.role]}`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {initials}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-white/58">{roleLabels[user.role]}</p>
              </div>
            )}
          </div>
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/78 transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            {!sidebarCollapsed && 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      <div className="planta-content flex min-w-0 flex-1 flex-col">
        <header className="no-print border-b border-border bg-card px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <nav className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
              {visibleMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={item.label}
                    className={`rounded-lg p-2 ${
                      currentView === item.id ? 'bg-secondary text-white' : 'bg-muted text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </nav>

            <button
              onClick={onLogout}
              className="shrink-0 rounded-lg border border-border bg-card p-2 text-foreground transition hover:bg-accent/20"
              title="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="planta-main planta-scrollbar flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
