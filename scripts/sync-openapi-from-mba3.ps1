# Descarga openapi.json desde mba3-consultas en ejecución (Docker app o venv).
# Uso: .\scripts\sync-openapi-from-mba3.ps1
#      .\scripts\sync-openapi-from-mba3.ps1 -BaseUrl http://localhost:8000

param(
    [string]$BaseUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"
$outFile = Join-Path $PSScriptRoot "..\openapi.json"
$uri = "$BaseUrl/openapi.json"

Write-Host "Descargando $uri -> $outFile"
try {
    Invoke-WebRequest -Uri $uri -OutFile $outFile -UseBasicParsing
} catch {
    Write-Error "No se pudo descargar OpenAPI. ¿Está la API arriba? ($BaseUrl/health)"
    throw
}

$size = (Get-Item $outFile).Length
Write-Host "OK: openapi.json ($size bytes)"
$checks = @("upload-async", "proceso-completo-sap-async", "reintentar-st")
$content = Get-Content $outFile -Raw
foreach ($c in $checks) {
    if ($content -match [regex]::Escape($c)) {
        Write-Host "  [OK] contiene: $c"
    } else {
        Write-Warning "  [??] no encontrado: $c"
    }
}
