import { Cpu, Plus, Tag, Users } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '../services/api';
import type { DemoUser, ModelInfo, Recommendation } from '../types';
import { diagnosticLabel, priorityLabel, riskLabel } from '../utils/format';

interface AdminViewProps {
  user: DemoUser;
}

export function AdminView({ user }: AdminViewProps) {
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [model, setModel] = useState<ModelInfo | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('operador');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function loadAdminData() {
    Promise.all([api.adminUsers(), api.recommendations(), api.modelInfo()])
      .then(([usersResponse, recommendationsResponse, modelResponse]) => {
        setUsers(usersResponse.users);
        setRecommendations(recommendationsResponse.recommendations);
        setModel(modelResponse);
      })
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar administración.')
      );
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await api.createUser({ name, username, role, password: 'planta2026' });
      setName('');
      setUsername('');
      setRole('operador');
      setMessage('Usuario demo creado correctamente.');
      loadAdminData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible crear el usuario.');
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Panel administrador</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestión básica de usuarios demo, catálogo diagnóstico y configuración del modelo.
        </p>
      </div>

      {user.role !== 'administrador' && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Estás usando un rol {user.role}. Para sustentar administración completa, entra como
          <span className="font-medium"> admin</span>.
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Usuarios demo</h3>
              <p className="text-sm text-muted-foreground">Roles precargados para la exposición.</p>
            </div>
          </div>

          <div className="space-y-3">
            {users.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted/35 p-3">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.username}</p>
                </div>
                <span className="rounded border border-border px-2 py-1 text-xs font-medium capitalize">
                  {item.role}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleCreateUser} className="mt-5 rounded-lg border border-border p-4">
            <h4 className="mb-3 text-sm font-semibold">Crear usuario demo</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nombre"
                required
                className="rounded-lg border border-border bg-input-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Usuario"
                required
                className="rounded-lg border border-border bg-input-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="rounded-lg border border-border bg-input-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="operador">Operador</option>
                <option value="supervisor">Supervisor</option>
                <option value="administrador">Administrador</option>
              </select>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/90"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Catálogo de estados</h3>
              <p className="text-sm text-muted-foreground">Recomendaciones asociadas al diagnóstico.</p>
            </div>
          </div>

          <div className="space-y-3">
            {recommendations.map((item) => (
              <article key={item.id} className="rounded-lg border border-border p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h4 className="font-semibold">{diagnosticLabel(item.diagnosticState)}</h4>
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                </div>
                <p className="text-sm text-muted-foreground">{item.irrigationRecommendation}</p>
                <div className="mt-3 flex gap-2 text-xs">
                  <span className="rounded bg-muted px-2 py-1">Riesgo {riskLabel(item.riskLevel)}</span>
                  <span className="rounded bg-muted px-2 py-1">
                    Prioridad {priorityLabel(item.priority)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Información del modelo</h3>
            <p className="text-sm text-muted-foreground">Modo demo preparado para reemplazo por IA real.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <ModelMetric label="Modo" value={model?.mode || 'demo'} />
          <ModelMetric label="Nombre" value={model?.model.name || 'P.L.A.N.T.A. Vision Demo'} />
          <ModelMetric label="Versión" value={model?.model.version || '0.1.0-demo'} />
          <ModelMetric label="Tipo" value={model?.model.type || 'Motor simulado local'} />
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {model?.model.futureReplacement ||
            'La lógica está concentrada en analysisService para poder reemplazarla por un modelo real.'}
        </p>
      </section>
    </div>
  );
}

function ModelMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/35 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
