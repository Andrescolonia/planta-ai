$ErrorActionPreference = "Stop"

$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflared) {
  Write-Host "[quick-tunnel] cloudflared no esta disponible en PATH." -ForegroundColor Red
  Write-Host "[quick-tunnel] Abre una terminal nueva o instala cloudflared antes de usar este modo." -ForegroundColor Yellow
  exit 1
}

Write-Host "[quick-tunnel] Modo emergencia: se generara una URL temporal de Cloudflare." -ForegroundColor Yellow
Write-Host "[quick-tunnel] Asegurate de tener P.L.A.N.T.A. corriendo con: npm run start:home" -ForegroundColor Cyan
Write-Host "[quick-tunnel] Servicio local: http://localhost:4000" -ForegroundColor Cyan
Write-Host ""

cloudflared tunnel --url http://localhost:4000
