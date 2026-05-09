import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
  UserRound,
  type LucideIcon
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import heroImage from '../assets/planta-botanical-hero.svg';
import { api } from '../services/api';
import type { DemoUser, Session } from '../types';

interface LoginPageProps {
  onBack: () => void;
  onLogin: (user: DemoUser, session: Session) => void;
}

type AccessMode = 'login' | 'register';
type LoadingAction = 'login' | 'register' | 'guest' | null;

function normalizePersonName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function validateOptionalPersonName(value: string) {
  const name = normalizePersonName(value);

  if (!name) {
    return '';
  }

  if (name.length < 2 || name.length > 50) {
    return 'El nombre debe tener entre 2 y 50 caracteres.';
  }

  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(name)) {
    return 'El nombre solo puede contener letras y espacios.';
  }

  return '';
}

export function LoginPage({ onBack, onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<AccessMode>('login');
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [accessRequired, setAccessRequired] = useState(false);
  const [accessVerified, setAccessVerified] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [error, setError] = useState('');
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);

  useEffect(() => {
    api
      .accessStatus()
      .then((status) => {
        setAccessRequired(status.required);
        setAccessVerified(status.verified);
      })
      .catch(() => {
        setAccessRequired(false);
        setAccessVerified(true);
      })
      .finally(() => setCheckingAccess(false));
  }, []);

  async function handleEventAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!eventCode.trim()) {
      setError('Ingresa el código de acceso del evento.');
      return;
    }

    setLoadingAction('login');

    try {
      const response = await api.verifyEventAccess(eventCode);
      setAccessRequired(response.required);
      setAccessVerified(response.verified);
      setEventCode('');
    } catch (accessError) {
      setError(accessError instanceof Error ? accessError.message : 'No fue posible validar el código.');
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoadingAction('login');

    try {
      const response = await api.login(identifier, loginPassword);
      onLogin(response.user, response.session);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No fue posible iniciar sesión.');
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (registerPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoadingAction('register');

    try {
      const response = await api.register({
        name,
        username,
        email,
        password: registerPassword
      });
      onLogin(response.user, response.session);
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'No fue posible crear la cuenta.');
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleGuestAccess() {
    setError('');

    const guestNameError = validateOptionalPersonName(guestName);
    if (guestNameError) {
      setError(guestNameError);
      return;
    }

    setLoadingAction('guest');

    try {
      const response = await api.guestLogin(normalizePersonName(guestName));
      onLogin(response.user, response.session);
    } catch (guestError) {
      setError(guestError instanceof Error ? guestError.message : 'No fue posible ingresar como invitado.');
    } finally {
      setLoadingAction(null);
    }
  }

  const loading = loadingAction !== null;
  const showAccessGate = !checkingAccess && accessRequired && !accessVerified;

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.02fr_0.98fr]">
      <section
        className="relative hidden min-h-screen overflow-hidden hero-panel lg:block"
        style={{ backgroundImage: `url(${heroImage})`, backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,25,47,0.18),rgba(10,25,47,0.94))]" />
        <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Universidad Santiago de Cali
          </p>
          <h1 className="mt-3 text-4xl font-semibold">P.L.A.N.T.A.</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/76">
            Acceso para visitantes, personal operativo y administradores de la exposición.
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

          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary">
              MVP funcional del evento
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">Entrar a P.L.A.N.T.A.</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Ingresa con una cuenta, crea un usuario nuevo o continúa como invitado para probar
              el flujo completo desde cualquier dispositivo conectado a la red.
            </p>
          </div>

          {checkingAccess && (
            <section className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Validando acceso al evento</h3>
                  <p className="text-xs text-muted-foreground">Preparando la entrada segura.</p>
                </div>
              </div>
            </section>
          )}

          {showAccessGate && (
            <form onSubmit={handleEventAccess} className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Código de acceso del evento</h3>
                  <p className="text-xs text-muted-foreground">
                    Este paso protege el consumo de análisis e imágenes durante la exposición.
                  </p>
                </div>
              </div>

              <label className="mb-2 block text-sm font-medium text-foreground">Código</label>
              <div className="relative mb-4">
                <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={eventCode}
                  onChange={(event) => setEventCode(event.target.value)}
                  disabled={loading}
                  autoFocus
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
                {loading ? 'Validando...' : 'Continuar'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {!checkingAccess && !showAccessGate && (
          <>
          <section className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-800">Ingreso rápido para visitantes</h3>
                <p className="text-xs text-green-700">Ideal para interacción libre durante la muestra.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Nombre opcional"
                disabled={loading}
                maxLength={50}
                className="flex-1 rounded-lg border border-green-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={handleGuestAccess}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/90 disabled:opacity-60"
              >
                {loadingAction === 'guest' ? 'Ingresando...' : 'Continuar como invitado'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-green-700">
              Si lo dejas vacío, se pedirá el nombre antes de analizar una imagen.
            </p>
          </section>

          <div className="mb-5 flex gap-2 rounded-lg bg-muted/35 p-2">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                mode === 'login'
                  ? 'border-secondary bg-card text-foreground'
                  : 'border-border text-muted-foreground hover:bg-accent/10'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                mode === 'register'
                  ? 'border-secondary bg-card text-foreground'
                  : 'border-border text-muted-foreground hover:bg-accent/10'
              }`}
            >
              Registrarse
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="rounded-lg border border-border bg-card p-5">
              <label className="mb-2 block text-sm font-medium text-foreground">Usuario o correo</label>
              <div className="relative mb-4">
                <UserRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  disabled={loading}
                  placeholder="admin, supervisor o correo"
                  className="w-full rounded-lg border border-border bg-input-background py-3 pl-10 pr-3 outline-none transition focus:ring-2 focus:ring-ring"
                />
              </div>

              <label className="mb-2 block text-sm font-medium text-foreground">Contraseña</label>
              <div className="relative mb-4">
                <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  disabled={loading}
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
                {loadingAction === 'login' ? 'Validando...' : 'Entrar'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="rounded-lg border border-border bg-card p-5">
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  icon={UserRound}
                  label="Nombre completo"
                  value={name}
                  onChange={setName}
                  disabled={loading}
                  required
                />
                <Field
                  icon={UserPlus}
                  label="Usuario"
                  value={username}
                  onChange={setUsername}
                  disabled={loading}
                  required
                />
                <Field
                  icon={Mail}
                  label="Correo"
                  value={email}
                  onChange={setEmail}
                  disabled={loading}
                  type="email"
                />
                <Field
                  icon={LockKeyhole}
                  label="Contraseña"
                  value={registerPassword}
                  onChange={setRegisterPassword}
                  disabled={loading}
                  type="password"
                  required
                />
              </div>

              <div className="mt-3">
                <Field
                  icon={LockKeyhole}
                  label="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  disabled={loading}
                  type="password"
                  required
                />
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 font-medium text-secondary-foreground transition hover:bg-secondary/90 disabled:opacity-60"
              >
                {loadingAction === 'register' ? 'Creando cuenta...' : 'Crear cuenta e ingresar'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          </>
          )}
        </div>
      </section>
    </main>
  );
}

interface FieldProps {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  type?: string;
  required?: boolean;
}

function Field({ icon: Icon, label, value, onChange, disabled, type = 'text', required }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-foreground">{label}</span>
      <span className="relative block">
        <Icon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          required={required}
          className="w-full rounded-lg border border-border bg-input-background py-3 pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
        />
      </span>
    </label>
  );
}
