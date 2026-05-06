param(
  [string]$PublicUrl = "",
  [string]$LocalUrl = "http://127.0.0.1:4000"
)

$ErrorActionPreference = "Continue"

function Test-Url {
  param(
    [string]$Label,
    [string]$Url
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 20
    Write-Host "[OK] $Label -> HTTP $($response.StatusCode)"
    return $true
  }
  catch {
    Write-Host "[ERROR] $Label -> $($_.Exception.Message)"
    return $false
  }
}

$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue

if (-not $cloudflared) {
  Write-Host "[WARN] cloudflared no esta instalado o no esta en PATH."
  Write-Host "       Descargalo desde la documentacion oficial de Cloudflare Tunnel."
}
else {
  Write-Host "[OK] cloudflared encontrado en $($cloudflared.Source)"
  & cloudflared --version
}

$base = $LocalUrl.TrimEnd("/")
$ok = Test-Url -Label "Origen local" -Url "$base/api/health"

if ($PublicUrl.Trim()) {
  $publicBase = $PublicUrl.TrimEnd("/")
  $ok = (Test-Url -Label "URL publica frontend" -Url "$publicBase/") -and $ok
  $ok = (Test-Url -Label "URL publica API" -Url "$publicBase/api/health") -and $ok
}
else {
  Write-Host "[INFO] Pasa -PublicUrl https://tu-dominio.com para validar el tunel publico."
}

if (-not $ok) {
  exit 1
}
