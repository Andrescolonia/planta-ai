# P.L.A.N.T.A.

MVP local de una plataforma web para apoyo al personal de mantenimiento de zonas
verdes de la Universidad Santiago de Cali.

La solucion permite subir fotografias de plantas, analizarlas en modo demo,
guardar casos, consultar historial, revisar zonas verdes y generar reportes
imprimibles. No requiere nube, servicios pagos, Docker ni infraestructura
externa.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Base de datos: SQLite local
- Imagenes: carpeta local `server/uploads` o Cloudflare R2 opcional
- Host local/LAN: servicios escuchando en `0.0.0.0`
- Estilos: CSS propio
- Graficas: componentes React/SVG propios

## Requisitos En Windows

- Windows 10/11
- Node.js 20 o superior recomendado
- npm incluido con Node.js
- Permitir Node.js en el Firewall de Windows para redes privadas si se va a
  abrir desde otro dispositivo en la misma red

Verificar Node y npm:

```powershell
node -v
npm -v
```

## Instalacion

Desde PowerShell, entrar a la carpeta del proyecto:

```powershell
cd C:\Users\andre\OneDrive\Documentos\Projets\2026\planta-ai
```

Instalar dependencias:

```powershell
npm install
```

Configurar variables de entorno en el archivo local `.env` de la raiz del
proyecto. Este archivo contiene claves y secretos, por eso no se versiona en
Git.

Antes de ejecutar la demo, verifica que `.env` exista y tenga los puertos,
credenciales opcionales de OpenAI y credenciales opcionales de Cloudflare R2.

## Ejecucion Rapida Para Demo

Opcion recomendada: iniciar backend y frontend juntos.

```powershell
npm run dev
```

Abrir en el PC anfitrion:

```text
http://localhost:5173
```

API de verificacion:

```text
http://localhost:4000/api/health
```

## Iniciar Por Separado

Terminal 1, backend:

```powershell
npm run dev:server
```

Terminal 2, frontend:

```powershell
npm run dev:client
```

URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:4000/api/health
```

## Abrir Desde Otro Celular O PC En La Misma Red

1. Conecta el PC anfitrion y el celular/otro PC a la misma red Wi-Fi.
2. En el PC anfitrion ejecuta:

```powershell
ipconfig
```

3. Busca la direccion `IPv4` del adaptador Wi-Fi o Ethernet. Ejemplo:

```text
192.168.1.50
```

4. En el navegador del otro dispositivo abre:

```text
http://IP_DEL_PC:5173
```

Ejemplo:

```text
http://192.168.1.50:5173
```

El frontend detecta el host usado y llama automaticamente al backend en:

```text
http://IP_DEL_PC:4000/api
```

Si estas usando `npm run start:home`, abre directamente:

```text
http://IP_DEL_PC:4000
```

Si Windows pregunta por permisos de red para Node.js, permitir acceso en redes
privadas.

## Puertos Configurables

Los valores se configuran en `.env`.

```env
PORT=4000
HOST=0.0.0.0
CLIENT_ORIGIN=http://localhost:5173

FRONTEND_HOST=0.0.0.0
FRONTEND_PORT=5173
FRONTEND_PREVIEW_PORT=4173

VITE_API_URL=auto
CLIENT_DIST_DIR=client/dist

STORAGE_DRIVER=local
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=8

EVENT_ACCESS_CODE=PLANTA2026
EVENT_ACCESS_TTL_HOURS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_WINDOW_MS=600000
AUTH_RATE_LIMIT_MAX=20
ANALYSIS_RATE_LIMIT_WINDOW_MS=3600000
ANALYSIS_RATE_LIMIT_MAX=60
MAX_ANALYSES_PER_HOUR=60
MAX_ANALYSES_PER_DAY=300
OPENAI_FALLBACK_TO_DEMO=true
R2_FALLBACK_TO_LOCAL=true
TRUST_PROXY=true
LOG_DIR=./logs
BACKUP_DIR=./backups
BACKUP_RETENTION_COUNT=25
```

Si cambias el puerto del backend, por ejemplo:

```env
PORT=4100
```

entonces fija tambien:

```env
VITE_API_URL=http://localhost:4100/api
```

Para red local:

```env
VITE_API_URL=http://IP_DEL_PC:4100/api
```

Si cambias el puerto del frontend:

```env
FRONTEND_PORT=5174
CLIENT_ORIGIN=http://localhost:5174
```

## Almacenamiento De Imagenes

Por defecto el MVP guarda imagenes en `server/uploads` para que funcione sin
nube:

```env
STORAGE_DRIVER=local
```

Para usar Cloudflare R2, crea el bucket y un token S3 con permiso Object Read &
Write. Luego configura `.env`:

```env
STORAGE_DRIVER=r2
R2_ACCOUNT_ID=tu_account_id
R2_ENDPOINT=https://tu_account_id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=tu_access_key_id
R2_SECRET_ACCESS_KEY=tu_secret_access_key
R2_BUCKET=planta-imagenes
R2_PREFIX=planta/casos
R2_SIGNED_URL_TTL_SECONDS=900
R2_FALLBACK_TO_LOCAL=true
```

Si el bucket tiene dominio publico o custom domain, puedes definir:

```env
R2_PUBLIC_URL=https://imagenes.tu-dominio.edu
```

Si `R2_PUBLIC_URL` queda vacio, el backend genera una URL firmada temporal al
abrir el detalle de un caso. Los secretos de R2 solo viven en el backend.

## Build Local

Construir frontend:

```powershell
npm run build
```

## Modo Casa / Produccion Local

Para exponer la plataforma desde casa conviene usar un solo puerto. Este comando
compila React y luego inicia Express sirviendo el frontend compilado y la API:

```powershell
npm run start:home
```

Antes de iniciar, este comando ejecuta automaticamente `npm run backup:db` para
crear una copia de seguridad de SQLite en `backups/`.

Abrir en el PC anfitrion:

```text
http://localhost:4000
```

En este modo:

- React se sirve desde `client/dist`
- La API queda en `/api`
- Las imagenes locales quedan en `/uploads`
- Cloudflare Tunnel solo necesita apuntar a `http://localhost:4000`
- Los logs del backend quedan en `logs/server.log` y `logs/error.log`

Si ya ejecutaste `npm run build` y solo quieres levantar el servidor:

```powershell
npm run start:home:no-build
```

Servir frontend compilado con Vite Preview:

```powershell
npm run start:frontend
```

Iniciar backend en modo estable:

```powershell
npm run start:backend
```

`npm run start:frontend` es util para revisar el build con Vite Preview, pero
para publicar la demo usa `npm run start:home`.

## Cloudflare Tunnel

Para publicarlo desde casa sin abrir puertos del router, usa Cloudflare Tunnel
apuntando a:

```text
http://localhost:4000
```

Guia completa:

```text
docs/cloudflare-tunnel.md
```

Comandos de apoyo:

```powershell
npm run home:check
npm run tunnel:check
npm run tunnel:run -- -TunnelName planta-ai
npm run tunnel:quick
```

`npm run tunnel:quick` es solo un modo de emergencia: genera una URL temporal de
Cloudflare Quick Tunnel apuntando a `http://localhost:4000` si el tunel nombrado
falla.

## Seguridad Basica Para Exposicion

Antes de publicar la URL del evento, configura en `.env`:

```env
EVENT_ACCESS_CODE=PLANTA2026
EVENT_ACCESS_TTL_HOURS=12
OPENAI_FALLBACK_TO_DEMO=true
R2_FALLBACK_TO_LOCAL=true
TRUST_PROXY=true

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300

AUTH_RATE_LIMIT_WINDOW_MS=600000
AUTH_RATE_LIMIT_MAX=20

ANALYSIS_RATE_LIMIT_WINDOW_MS=3600000
ANALYSIS_RATE_LIMIT_MAX=60
MAX_ANALYSES_PER_HOUR=60
MAX_ANALYSES_PER_DAY=300
```

Con `EVENT_ACCESS_CODE` activo, la app pide el codigo antes de mostrar login,
registro o ingreso invitado. El backend tambien exige un token temporal para
usar la API, por lo que no basta con saltarse la pantalla desde el navegador.

Los limites son en memoria y estan pensados para una exposicion corriendo desde
un solo PC. Si reinicias el servidor, los contadores vuelven a cero.

Para desactivar la puerta de evento durante desarrollo, deja vacio:

```env
EVENT_ACCESS_CODE=
```

## Panel De Estado Para Exposicion

El panel administrador incluye una seccion `Estado de exposicion` con:

- Estado del backend y base SQLite.
- Modo de analisis actual.
- Almacenamiento activo: local o Cloudflare R2.
- Casos guardados hoy.
- Analisis ejecutados en la sesion actual.
- Limites configurados para API, auth y analisis.
- Ultimo error registrado.
- URL publica configurada.
- Boton `Probar conexion`.

El endpoint usado por esta vista es:

```http
GET /api/admin/status
```

Si `EVENT_ACCESS_CODE` esta activo, el endpoint requiere el token temporal que
se obtiene al validar el codigo de evento desde la pantalla de ingreso.

## Respaldo Y Recuperacion

La base principal vive en:

```text
server/data/planta.sqlite
```

Crear respaldo manual:

```powershell
npm run backup:db
```

Los respaldos se guardan en:

```text
backups/planta-YYYYMMDD-HHMMSS.sqlite
```

El arranque de exposicion crea un respaldo automatico antes de levantar el
servidor:

```powershell
npm run start:home
```

Restaurar una copia requiere detener el backend primero. Luego ejecutar:

```powershell
npm run restore:db -- backups/planta-YYYYMMDD-HHMMSS.sqlite
```

El script crea antes una copia preventiva llamada
`backups/pre-restore-YYYYMMDD-HHMMSS.sqlite` y despues reemplaza
`server/data/planta.sqlite`.

Logs locales:

```text
logs/server.log  -> actividad general del backend
logs/error.log   -> advertencias y errores
```

Variables opcionales:

```env
LOG_DIR=./logs
BACKUP_DIR=./backups
BACKUP_RETENTION_COUNT=25
```

## Modo Emergencia Para El Evento

- Si OpenAI falla, mantener `OPENAI_FALLBACK_TO_DEMO=true`.
- Si Cloudflare R2 falla, mantener `R2_FALLBACK_TO_LOCAL=true`.
- Si el tunel nombrado falla, usar `npm run tunnel:quick`.
- Si internet de casa falla, ejecutar `npm run start:home` en la laptop del
  evento y abrir `http://localhost:4000`.
- Llevar una copia del proyecto y de la carpeta `backups/` en USB.
- Antes de salir al evento, correr `npm run build`, `npm run backup:db` y
  verificar que `http://localhost:4000/api/health` responda.

## Acceso Local

La plataforma permite tres formas de ingreso:

- Continuar como invitado para que visitantes del evento prueben el flujo sin
  credenciales.
- Registrarse desde la pantalla de acceso con una cuenta local guardada en
  SQLite.
- Entrar con una cuenta inicial para administracion.

Cuenta inicial de administracion:

```text
usuario: admin
clave:   planta2026
```

Cuentas iniciales adicionales para pruebas internas:

```text
supervisor / planta2026
operador   / planta2026
```

El rol `operador` se conserva como usuario operativo inicial, pero la pantalla
principal ya no muestra tarjetas de roles precargados.

## Flujo Principal De Sustentacion

1. Abrir `http://localhost:5173` o `http://IP_DEL_PC:5173`.
2. Entrar desde la landing con `Ingresar a la plataforma`.
3. Continuar como invitado, registrar un usuario nuevo o iniciar sesion con
   `admin` y clave `planta2026`.
4. Ir a `Nuevo analisis`.
5. Seleccionar zona verde y escribir ubicacion especifica.
6. Subir una fotografia de planta.
7. Confirmar la vista previa.
8. Presionar `Analizar imagen`.
9. Mostrar el flujo visual:

```text
Captura -> Preproceso -> Clasificacion -> Resultado
```

10. Explicar estado, confianza, riesgo, prioridad, recomendacion de riego y
    observaciones.
11. Presionar `Guardar caso`.
12. Consultar el caso en `Historial`, `Zonas verdes` y `Reportes`.

## Datos Demo Locales

Al iniciar el backend se crea automaticamente:

- Base SQLite en `server/data/planta.sqlite`
- Usuarios iniciales, cuentas registradas e invitados locales
- Zonas verdes institucionales
- Recomendaciones por estado diagnostico
- Casos historicos de ejemplo
- Carpeta `server/uploads` para imagenes subidas, o referencias `r2://...` si
  activas Cloudflare R2

La base de datos queda en el PC local. Las imagenes quedan en el PC local o en
R2 segun `STORAGE_DRIVER`.

## Endpoints Principales

```http
GET  /api/health
POST /api/auth/login
POST /api/auth/register
POST /api/auth/guest
GET  /api/auth/me
GET  /api/dashboard
POST /api/analysis/analyze
GET  /api/cases
GET  /api/cases/:id
POST /api/cases
GET  /api/zones
GET  /api/reports
GET  /api/admin/users
GET  /api/admin/recommendations
GET  /api/admin/model
```

## Motor De Analisis

El servicio `server/src/services/analysisService.js` concentra dos motores:

- `ANALYSIS_MODE=demo`: motor local deterministico para exposiciones sin
  internet ni clave externa.
- `ANALYSIS_MODE=openai`: motor real con OpenAI Vision usando la Responses API.

Para activar OpenAI, define en `.env`:

```env
ANALYSIS_MODE=openai
OPENAI_API_KEY=sk-tu_clave_real
OPENAI_MODEL=gpt-5.4-mini
```

En modo OpenAI, el sistema valida si la imagen contiene una planta evaluable. Si
la imagen no es una planta, devuelve un error claro y no guarda el caso. Para
este modo se recomiendan imagenes `JPG`, `PNG` o `WEBP`.

## Notas De Solucion De Problemas

Si el celular no abre la app:

- Verifica que ambos dispositivos esten en la misma red.
- Usa la IPv4 correcta del PC anfitrion.
- Permite Node.js en el Firewall de Windows.
- Confirma que `npm run dev` sigue ejecutandose.

Si el frontend abre pero no carga datos:

- Revisa `http://IP_DEL_PC:4000/api/health`.
- Si cambiaste el puerto backend, actualiza `VITE_API_URL` en `.env`.
- Reinicia `npm run dev` despues de editar `.env`.

Si quieres limpiar la demo:

```powershell
del server\data\planta.sqlite
```

Al iniciar nuevamente el backend, SQLite se recrea con datos demo.
