Write-Host "🔧 Preparando test SOLO de CrearComponent..." -ForegroundColor Cyan

# Renombrar archivos problemáticos
Write-Host "📁 Ocultando otros tests..." -ForegroundColor Yellow

if (Test-Path "src\app\directives\has-permission.directive.spec.ts") {
    Move-Item "src\app\directives\has-permission.directive.spec.ts" "src\app\directives\has-permission.directive.spec.ts.bak" -Force
    Write-Host "✅ Ocultado: has-permission.directive.spec.ts" -ForegroundColor Green
}

if (Test-Path "src\app\guards\permission.guard.spec.ts") {
    Move-Item "src\app\guards\permission.guard.spec.ts" "src\app\guards\permission.guard.spec.ts.bak" -Force
    Write-Host "✅ Ocultado: permission.guard.spec.ts" -ForegroundColor Green
}

Write-Host "🚀 Ejecutando SOLO el test de CrearComponent..." -ForegroundColor Cyan
ng test --include='src/app/administrador/productos/crear/crear.component.spec.ts' --code-coverage --watch=false

Write-Host "🔄 Restaurando archivos..." -ForegroundColor Yellow

# Restaurar archivos
if (Test-Path "src\app\directives\has-permission.directive.spec.ts.bak") {
    Move-Item "src\app\directives\has-permission.directive.spec.ts.bak" "src\app\directives\has-permission.directive.spec.ts" -Force
    Write-Host "✅ Restaurado: has-permission.directive.spec.ts" -ForegroundColor Green
}

if (Test-Path "src\app\guards\permission.guard.spec.ts.bak") {
    Move-Item "src\app\guards\permission.guard.spec.ts.bak" "src\app\guards\permission.guard.spec.ts" -Force
    Write-Host "✅ Restaurado: permission.guard.spec.ts" -ForegroundColor Green
}

Write-Host "✨ Test de CrearComponent completado!" -ForegroundColor Magenta