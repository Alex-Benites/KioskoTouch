Write-Host "Preparando test de CarritoCompraComponent..." -ForegroundColor Cyan

# Ocultar TODOS los otros tests
Write-Host "Ocultando otros tests..."
Get-ChildItem -Path "src/app" -Filter "*.spec.ts" -Recurse | Where-Object { 
    $_.Name -ne "carrito-compra.component.spec.ts"
} | ForEach-Object {
    if (Test-Path $_.FullName) {
        Rename-Item $_.FullName ($_.FullName + ".bak")
        Write-Host "Ocultado: $($_.Name)" -ForegroundColor Green
    }
}

Write-Host "Ejecutando test de CarritoCompraComponent..."
ng test --watch=false --browsers=Chrome --code-coverage

Write-Host "Restaurando archivos..."
Get-ChildItem -Path "src/app" -Filter "*.spec.ts.bak" -Recurse | ForEach-Object {
    $originalName = $_.FullName -replace "\.bak$", ""
    Rename-Item $_.FullName $originalName
    $fileName = Split-Path $originalName -Leaf
    Write-Host "Restaurado: $fileName" -ForegroundColor Green
}

Write-Host "Test de CarritoCompraComponent completado!" -ForegroundColor Green