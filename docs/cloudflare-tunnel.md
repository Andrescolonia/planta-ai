# Publicacion Con Cloudflare Tunnel

Esta guia deja P.L.A.N.T.A. expuesta desde el PC de casa usando un solo puerto
local. Cloudflare Tunnel evita abrir puertos del router y publica el servicio
local por medio de una conexion saliente de `cloudflared`.

Arquitectura:

```text
https://planta.tu-dominio.com
  -> Cloudflare Tunnel
  -> http://localhost:4000
  -> Express sirve React, /api y /uploads
```

## Requisitos

- Dominio agregado a Cloudflare.
- `cloudflared` instalado en Windows.
- `.env` local configurado.
- P.L.A.N.T.A. funcionando en modo casa:

```powershell
npm run start:home
```

Verifica el origen local:

```powershell
npm run home:check
```

## Opcion Recomendada: Tunnel Nombrado

Ejecuta estos comandos desde PowerShell o CMD:

```powershell
cloudflared tunnel login
cloudflared tunnel create planta-ai
cloudflared tunnel list
```

El comando `create` devuelve un UUID y crea un archivo de credenciales en:

```text
C:\Users\<TU_USUARIO>\.cloudflared\<TUNNEL_UUID>.json
```

Crea o edita:

```text
C:\Users\<TU_USUARIO>\.cloudflared\config.yml
```

Puedes partir de [config.template.yml](../ops/cloudflare-tunnel/config.template.yml):

```yml
tunnel: <TUNNEL_UUID>
credentials-file: C:\Users\<TU_USUARIO>\.cloudflared\<TUNNEL_UUID>.json

ingress:
  - hostname: planta.tu-dominio.com
    service: http://localhost:4000
  - service: http_status:404
```

Luego crea el DNS del tunnel:

```powershell
cloudflared tunnel route dns planta-ai planta.tu-dominio.com
```

Prueba el tunnel en primer plano:

```powershell
npm run tunnel:run -- -TunnelName planta-ai
```

Cuando abra, visita:

```text
https://planta.tu-dominio.com
```

Valida la URL publica:

```powershell
npm run tunnel:check -- -PublicUrl https://planta.tu-dominio.com
```

## Instalar Como Servicio De Windows

Cuando la prueba manual funcione, instala `cloudflared` como servicio para que
se mantenga activo aunque cierres la terminal.

Abre CMD o PowerShell como administrador y ejecuta:

```powershell
cloudflared service install
```

Despues puedes controlar el servicio con:

```powershell
net start cloudflared
net stop cloudflared
```

Cloudflare indica que, en Windows, la configuracion local por defecto se busca
en `%USERPROFILE%\.cloudflared\config.yml`.

## Variables Recomendadas En .env

Para un solo dominio publico, puedes dejar:

```env
PORT=4000
HOST=0.0.0.0
VITE_API_URL=auto
CLIENT_ORIGIN=https://planta.tu-dominio.com
EVENT_ACCESS_CODE=PLANTA2026
OPENAI_FALLBACK_TO_DEMO=true
R2_FALLBACK_TO_LOCAL=true
TRUST_PROXY=true
```

`VITE_API_URL=auto` hace que el frontend use `/api` cuando Express lo sirve
desde el mismo dominio.

`TRUST_PROXY=true` permite identificar mejor la IP real de visitantes cuando la
app esta detras de Cloudflare Tunnel.

## Prueba Antes Del Evento

1. Inicia P.L.A.N.T.A.:

```powershell
npm run start:home
```

2. Verifica origen local:

```powershell
npm run home:check
```

3. Inicia el tunnel:

```powershell
npm run tunnel:run -- -TunnelName planta-ai
```

4. Verifica desde datos moviles:

```powershell
npm run tunnel:check -- -PublicUrl https://planta.tu-dominio.com
```

5. Prueba flujo completo:

- Entrar como invitado.
- Subir una imagen.
- Guardar caso.
- Abrir historial.
- Abrir detalle del caso.
- Abrir reportes.

## Fuentes Oficiales

- Cloudflare Tunnel: https://developers.cloudflare.com/tunnel/
- Tunnel local con `config.yml`: https://developers.cloudflare.com/tunnel/advanced/local-management/create-local-tunnel/
- Servicio en Windows: https://developers.cloudflare.com/tunnel/advanced/local-management/as-a-service/windows/
