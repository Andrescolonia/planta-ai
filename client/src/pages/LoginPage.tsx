import { ArrowLeft, ArrowRight, LockKeyhole, UserRound } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import heroImage from '../assets/planta-campus-hero.png';
import { api } from '../services/api';
import type { DemoUser, Session } from '../types';

interface LoginPageProps {
  onBack: () => void;
  onLogin: (user: DemoUser, session: Session) => void;
}

const roleOptions = [
  { label: 'Operador', username: 'operador', description: 'Carga imágenes y guarda casos.' },
  { label: 'Supervisor', username: 'supervisor', description: 'Revisa zonas, reportes e historial.' },
  { label: 'Administrador', username: 'admin', description: 'Gestiona usuarios y catálogo demo.' }
];

export function LoginPage({ onBack, onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('operador');
  const [password, setPassword] = useState('planta2026');
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .demoUsers()
      .then((response) => setDemoUsers(response.users))
      .catch(() => setDemoUsers([]));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(username, password);
      onLogin(response.user, response.session);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No fue posible iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.02fr_0.98fr]">
      <section
        className="relative hidden min-h-screen overflow-hidden hero-panel lg:block"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,25,47,0.18),rgba(10,25,47,0.94))]" />
        <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Universidad Santiago de Cali
          </p>
          <h1 className="mt-3 text-4xl font-semibold">P.L.A.N.T.A.</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/76">
            Plataforma de apoyo operativo para diagnóstico visual y gestión de zonas verdes.
          </p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg">
          <button
            onClick={onBack}
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </button>

          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary">
              Acceso demo local
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">Iniciar sesión</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Usa cualquiera de los roles precargados. La contraseña demo es
              <span className="font-medium text-foreground"> planta2026</span>.
            </p>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-3">
            {roleOptions.map((role) => (
              <button
                key={role.username}
                type="button"
                onClick={() => {
                  setUsername(role.username);
                  setPassword('planta2026');
                }}
                className={`rounded-lg border p-3 text-left transition ${
                  username === role.username
                    ? 'border-secondary bg-secondary/10'
                    : 'border-border bg-card hover:bg-accent/10'
                }`}
              >
                <p className="text-sm font-semibold text-foreground">{role.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{role.description}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-5">
            <label className="mb-2 block text-sm font-medium text-foreground">Usuario</label>
            <div className="relative mb-4">
              <UserRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-lg border border-border bg-input-background py-3 pl-10 pr-3 outline-none transition focus:ring-2 focus:ring-ring"
              />
            </div>

            <label className="mb-2 block text-sm font-medium text-foreground">Contraseña</label>
            <div className="relative mb-4">
              <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-border bg-input-background py-3 pl-10 pr-3 outline-none transition focus:ring-2 focus:ring-ring"
              />
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 font-medium text-secondary-foreground transition hover:bg-secondary/90 disabled:opacity-60"
            >
              {loading ? 'Validando sesión...' : 'Entrar'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {demoUsers.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              Usuarios disponibles:{' '}
              {demoUsers.map((user) => `${user.username} (${user.role})`).join(', ')}.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
