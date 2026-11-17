# Script de lancement du développement local Youth City (Backend + Frontend)
$Root = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $Root "backend"
$FrontendDir = Join-Path $Root "frontend"

Write-Host "🏙️ Démarrage de Youth City..." -ForegroundColor Cyan

# 1. Démarrer le Backend Django
Write-Host "🚀 Lancement du backend Django sur http://127.0.0.1:8000..." -ForegroundColor Green
$BackendPython = Join-Path $BackendDir ".venv\Scripts\python.exe"
if (-not (Test-Path $BackendPython)) {
    $BackendPython = "python"
}
Start-Process -FilePath $BackendPython -ArgumentList "manage.py runserver 127.0.0.1:8000" -WorkingDirectory $BackendDir

# 2. Démarrer le Frontend Vite
Write-Host "⚡ Lancement du frontend Vite sur http://localhost:5173..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $FrontendDir

Write-Host "✅ Les deux serveurs sont démarrés !" -ForegroundColor Cyan
Write-Host "👉 Application web : http://localhost:5173 (ou http://127.0.0.1:5173)" -ForegroundColor Yellow
Write-Host "👉 API Django : http://127.0.0.1:8000/api/v1/" -ForegroundColor Yellow
