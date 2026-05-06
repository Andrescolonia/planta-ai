param(
  [string]$TunnelName = "planta-ai",
  [string]$ConfigPath = "$env:USERPROFILE\.cloudflared\config.yml"
)

$ErrorActionPreference = "Stop"

$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue

if (-not $cloudflared) {
  Write-Error "cloudflared no esta instalado o no esta en PATH."
  exit 1
}

if (-not (Test-Path $ConfigPath)) {
  Write-Error "No existe el archivo de configuracion: $ConfigPath"
  exit 1
}

Write-Host "Iniciando Cloudflare Tunnel '$TunnelName' con config: $ConfigPath"
& cloudflared tunnel --config $ConfigPath run $TunnelName
