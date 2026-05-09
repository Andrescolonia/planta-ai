import { ArrowRight, BarChart3, Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import heroImage from '../assets/planta-botanical-hero.svg';

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <section
        className="relative min-h-[88vh] overflow-hidden hero-panel"
        style={{ backgroundImage: `url(${heroImage})`, backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,25,47,0.96),rgba(10,25,47,0.78)_46%,rgba(45,90,39,0.5))]" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-6 py-16 lg:px-10">
          <div className="max-w-3xl text-white">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-accent">
              Universidad Santiago de Cali
            </p>
            <h1 className="text-6xl font-semibold leading-none tracking-normal md:text-8xl">
              P.L.A.N.T.A.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82 md:text-xl">
              Plataforma para diagnóstico visual de plantas, seguimiento operativo y apoyo a
              decisiones de cuidado vegetal en zonas verdes universitarias.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button
                onClick={onEnter}
                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-5 py-3 font-medium text-secondary-foreground shadow-lg shadow-black/20 transition hover:bg-secondary/90"
              >
                Ingresar a la plataforma
                <ArrowRight className="h-5 w-5" />
              </button>
              <span className="rounded-lg border border-white/20 px-4 py-3 text-sm text-white/78">
                MVP funcional
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-8 lg:grid-cols-3 lg:px-10">
        <article className="rounded-lg border border-border bg-card p-5">
          <ShieldCheck className="mb-4 h-8 w-8 text-secondary" />
          <h2 className="text-lg font-semibold">Diagnóstico estandarizado</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Registra resultados consistentes para que operadores y supervisores hablen el mismo
            lenguaje técnico durante las rondas.
          </p>
        </article>
        <article className="rounded-lg border border-border bg-card p-5">
          <Sparkles className="mb-4 h-8 w-8 text-secondary" />
          <h2 className="text-lg font-semibold">Cuidado vegetal integral</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Prioriza alertas de sanidad, riego, poda y seguimiento preventivo sin depender de sensores ni
            automatización de hardware.
          </p>
        </article>
        <article className="rounded-lg border border-border bg-card p-5">
          <BarChart3 className="mb-4 h-8 w-8 text-secondary" />
          <h2 className="text-lg font-semibold">Mayor eficiencia operativa</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Centraliza historial, zonas y reportes imprimibles para sustentar decisiones de
            mantenimiento.
          </p>
        </article>
      </section>

      <footer className="border-t border-border px-6 py-5 text-center text-sm text-muted-foreground">
        <Leaf className="mr-2 inline h-4 w-4 text-secondary" />
        Prototipo demostrable para exposición universitaria.
      </footer>
    </div>
  );
}
