import {
  BarChart3,
  Bell,
  History,
  LayoutDashboard,
  LogOut,
  MapPin,
  Search,
  Settings,
  Sprout,
  UploadCloud,
  UserRound
} from 'lucide-react';
import type { ReactNode } from 'react';
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

export function AppShell({ user, currentView, onNavigate, onLogout, children }: AppShellProps) {
  const visibleMenuItems = menuItems.filter(
    (item) => item.id !== 'admin' || user.role === 'administrador'
  );
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="no-print hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="border-b border-sidebar-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary">
              <Sprout className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">P.L.A.N.T.A.</h1>
              <p className="text-xs text-white/58">Gestión institucional</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-white/78 hover:bg-sidebar-accent hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-white/58">{roleLabels[user.role]}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/78 transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative hidden min-w-0 max-w-md flex-1 md:block">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Buscar diagnósticos, zonas o alertas..."
                className="w-full rounded-lg border border-border bg-input-background py-2 pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              />
            </div>

            <nav className="flex gap-1 overflow-x-auto lg:hidden">
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

            <div className="ml-auto flex items-center gap-3">
              <button className="relative rounded-lg p-2 transition hover:bg-accent/20" title="Alertas">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
              </button>
              <div className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 md:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <UserRound className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{roleLabels[user.role]}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="planta-scrollbar flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
