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

Fase 2 completada: backend local Express con SQLite, uploads, semillas demo y
motor de analisis simulado.

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

1. Construir navegacion y pantallas React del MVP.
2. Conectar flujo de subida, analisis, historial y reportes.
3. Pulir UI para sustentacion y verificar ejecucion en red local.

## Backend Local

El backend inicializa automaticamente:

- Base de datos SQLite en `server/data/planta.sqlite`
- Carpeta de imagenes en `server/uploads`
- Usuarios demo
- Zonas verdes demo
- Catalogo de estados y recomendaciones
- Casos historicos de ejemplo

### Usuarios Demo

Todos usan la contrasena:

```text
planta2026
```

Usuarios:

- `operador`
- `supervisor`
- `admin`

### Endpoints Principales

Salud de la API:

```http
GET /api/health
```

Login demo:

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "operador",
  "password": "planta2026"
}
```

Usuarios demo visibles:

```http
GET /api/auth/demo-users
```

Dashboard:

```http
GET /api/dashboard
```

Analisis de imagen:

```http
POST /api/analysis/analyze
Content-Type: multipart/form-data

image: archivo JPG/PNG/WEBP/HEIC
zoneId: 1
location: Jardinera norte
```

Guardar caso:

```http
POST /api/cases
Content-Type: application/json
```

Historial con filtros:

```http
GET /api/cases
GET /api/cases?estado=estres%20hidrico
GET /api/cases?zoneId=2&prioridad=alta
GET /api/cases?zona=Jardin%20central
GET /api/cases?desde=2026-05-01&hasta=2026-05-04
```

Zonas verdes:

```http
GET /api/zones
GET /api/zones/1
```

Reportes:

```http
GET /api/reports
```

Administracion demo:

```http
GET /api/admin/users
POST /api/admin/users
PATCH /api/admin/users/:id
GET /api/admin/recommendations
PUT /api/admin/recommendations/:id
GET /api/admin/diagnostic-states
GET /api/admin/model
```

### Modo Demo De Analisis

El archivo `server/src/services/analysisService.js` concentra el motor de
analisis. En esta fase funciona en `ANALYSIS_MODE=demo`, genera resultados
deterministicos a partir de la imagen y devuelve:

- estado de la planta
- confianza
- nivel de riesgo
- prioridad
- recomendacion de riego
- observaciones automaticas
- etapas visuales del flujo de analisis

Esta capa esta preparada para reemplazarse despues por un modelo real sin
reescribir las rutas de la API.
