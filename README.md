# P.L.A.N.T.A.

MVP local de una plataforma web para apoyo al personal de mantenimiento de zonas
verdes de la Universidad Santiago de Cali.

La solucion se esta construyendo con:

- Frontend: React + Vite
- Backend: Node.js + Express
- Base de datos: SQLite
- Subida de imagenes: almacenamiento local en `server/uploads`
- Ejecucion local/red LAN: servicios escuchando en `0.0.0.0`

## Estado Actual

Fase 1 completada: estructura base del proyecto.

```text
planta-ai/
  client/              Frontend React + Vite
    src/
      components/
      layouts/
      pages/
      services/
      utils/
  server/              Backend Node.js + Express
    data/              Base de datos local SQLite
    uploads/           Imagenes subidas
    src/
      config/
      database/
      middleware/
      routes/
      services/
  .env.example
  package.json
```

## Instalacion Inicial

Requisitos:

- Node.js 20 o superior recomendado
- npm incluido con Node.js

Desde la raiz del proyecto:

```bash
npm install
```

Crear archivo de entorno:

```bash
copy .env.example .env
```

## Ejecucion En Desarrollo

Iniciar frontend y backend al mismo tiempo:

```bash
npm run dev
```

Tambien se pueden iniciar por separado:

```bash
npm run dev:server
npm run dev:client
```

URLs esperadas:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000/api/health`

Para abrir la plataforma desde otro dispositivo en la misma red local, usa la IP
del PC anfitrion:

```text
http://IP_DEL_PC:5173
```

Ejemplo:

```text
http://192.168.1.50:5173
```

## Siguientes Fases

1. Implementar backend con base de datos, semillas demo y servicio de analisis.
2. Construir navegacion y pantallas React del MVP.
3. Conectar flujo de subida, analisis, historial y reportes.
4. Pulir UI para sustentacion y verificar ejecucion en red local.
