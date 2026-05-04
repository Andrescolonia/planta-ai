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

Fase 3 completada: frontend React navegable conectado al backend local.

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

En Windows el backend usa arranque estable sin autorecarga. Si quieres modo
watch durante desarrollo:

```bash
npm run dev:watch --workspace server
```

URLs esperadas:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000/api/health`

Flujo de uso recomendado para demo:

1. Abrir `http://localhost:5173`.
2. Entrar desde la landing con el boton de acceso.
3. Usar un usuario demo: `operador`, `supervisor` o `admin`.
4. Usar la contrasena `planta2026`.
5. Ir a `Nuevo analisis`, subir una imagen, analizarla y guardar el caso.
6. Revisar el caso en `Historial`, `Zonas verdes` y `Reportes`.

## Flujo Principal De Demo

Este es el recorrido recomendado durante la sustentacion:

1. Entrar a la landing institucional de P.L.A.N.T.A.
2. Hacer clic en `Ingresar a la plataforma`.
3. Iniciar sesion con:

```text
Usuario: operador
Clave: planta2026
```

4. Abrir `Nuevo analisis`.
5. Seleccionar una zona verde y escribir una ubicacion especifica.
6. Subir una fotografia de planta con drag and drop o selector de archivo.
7. Confirmar la vista previa de la imagen.
8. Presionar `Analizar imagen`.
9. Mostrar el flujo visual:

```text
Captura -> Preproceso -> Clasificacion -> Resultado
```

10. Explicar el resultado: estado, confianza, riesgo, prioridad, recomendacion de riego y observaciones.
11. Presionar `Guardar caso`.
12. Usar los botones posteriores para consultar:
    - `Historial`
    - `Zonas verdes`
    - `Reportes`

El caso guardado queda persistido en SQLite y se refleja en los modulos operativos.

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

1. Pulir detalles visuales finales para sustentacion.
2. Verificar ejecucion completa en red local desde otro dispositivo.

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

## Frontend React

El frontend incluye:

- Landing institucional de P.L.A.N.T.A.
- Login demo con roles operador, supervisor y administrador.
- Layout interno con barra lateral y barra superior.
- Dashboard con KPIs, actividad reciente y graficas.
- Nuevo analisis con drag and drop, vista previa, etapas visuales y resultado.
- Guardado de casos contra SQLite.
- Historial con filtros por fecha, estado, zona y prioridad.
- Gestion de zonas verdes.
- Reportes imprimibles desde el navegador.
- Panel administrador con usuarios demo, catalogo de recomendaciones e informacion del modelo.

El tema visual usa CSS propio. No se usa framework UI pesado ni componentes
externos de diseño.

## Diseño Y Robustez

Adaptacion aplicada para mantener el MVP liviano y confiable:

- CSS propio en `client/src/styles.css` con tokens institucionales y utilidades
  necesarias para el MVP.
- Sin framework UI pesado tipo Bootstrap, Material UI o shadcn runtime.
- Sin dependencia de Tailwind en tiempo de instalacion/build.
- Graficas simples hechas con componentes React/SVG propios en
  `client/src/components/SimpleCharts.tsx`.
- Sin dependencia de `recharts`.
- Estados vacios reutilizables en `client/src/components/EmptyState.tsx`.
- Mensajes de error visibles cuando falla una llamada a la API.
- Datos demo sembrados automaticamente en SQLite para no depender de servicios
  externos durante la exposicion.

La paleta se mantiene institucional: azul profundo, verde botanico, blanco roto,
grises suaves y acentos dorados.
