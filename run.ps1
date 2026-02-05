
function Show-Menu {
    Clear-Host
    Write-Host "================ AXD Project Manager ================" -ForegroundColor Cyan
    Write-Host "1. [Build & Start] Build Docker and Start Everything"
    Write-Host "2. [Start] Start Docker Services (DB/Backend) only"
    Write-Host "3. [Frontend] Start Frontend (pnpm start:LOCAL)"
    Write-Host "4. [Build] Docker Build only"
    Write-Host "5. [Stop] Stop and Remove Containers"
    Write-Host "6. [Logs] View Backend Logs"
    Write-Host "Q. Quit"
    Write-Host "====================================================="
}

do {
    Show-Menu
    $choice = Read-Host "Select an option"
    switch ($choice) {
        '1' {
            Write-Host "Cleaning up old containers..." -ForegroundColor Gray
            docker-compose down
            Write-Host "Building and Starting Docker services..." -ForegroundColor Yellow
            docker-compose up --build -d
            Write-Host "Starting Frontend..." -ForegroundColor Yellow
            Set-Location axd-front
            pnpm install
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "pnpm start:LOCAL"
            Set-Location ..
            Write-Host "Done! Backend is running in background, Frontend is opening in a new window." -ForegroundColor Green
            Pause
        }
        '2' {
            Write-Host "Starting Docker services..." -ForegroundColor Yellow
            docker-compose up -d
            Write-Host "Backend and DB started." -ForegroundColor Green
            Pause
        }
        '3' {
            Write-Host "Starting Frontend..." -ForegroundColor Yellow
            Set-Location axd-front
            pnpm start:LOCAL
            Set-Location ..
        }
        '4' {
            Write-Host "Building Docker images..." -ForegroundColor Yellow
            docker-compose build
            Write-Host "Build complete." -ForegroundColor Green
            Pause
        }
        '5' {
            Write-Host "Stopping Docker services..." -ForegroundColor Yellow
            docker-compose down
            Write-Host "Services stopped." -ForegroundColor Green
            Pause
        }
        '6' {
            docker-compose logs -f backend
        }
    }
} while ($choice -ne 'Q')
