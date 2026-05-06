param(
  [string]$BaseUrl = "http://127.0.0.1:4000"
)

$ErrorActionPreference = "Stop"

function Test-Url {
  param(
    [string]$Label,
    [string]$Url
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 12
    Write-Host "[OK] $Label -> HTTP $($response.StatusCode)"
    return $true
  }
  catch {
    Write-Host "[ERROR] $Label -> $($_.Exception.Message)"
    return $false
  }
}

$base = $BaseUrl.TrimEnd("/")
$ok = $true

$ok = (Test-Url -Label "Frontend" -Url "$base/") -and $ok
$ok = (Test-Url -Label "SPA fallback" -Url "$base/historial") -and $ok

try {
  $health = Invoke-RestMethod -Uri "$base/api/health" -TimeoutSec 12
  Write-Host "[OK] API -> $($health.service) / modo $($health.mode)"
}
catch {
  Write-Host "[ERROR] API -> $($_.Exception.Message)"
  $ok = $false
}

if (-not $ok) {
  exit 1
}

Write-Host "[OK] Modo casa listo en $base"
