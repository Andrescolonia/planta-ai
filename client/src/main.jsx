import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Universidad Santiago de Cali</p>
        <h1>P.L.A.N.T.A.</h1>
        <p>
          Plataforma local para diagnostico visual, seguimiento operativo y apoyo
          a la gestion hidrica de zonas verdes.
        </p>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
