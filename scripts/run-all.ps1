# SDA-Pro Unified Orchestrator and Live Demo Launcher
# Consolidates Student A, B, and C projects into one running platform.

$Host.UI.RawUI.WindowTitle = "SDA-Pro Master Integration Orchestrator"
Clear-Host

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   SDA-PRO SECURITY DETECTION & AUTOMATED RESPONSE        " -ForegroundColor Cyan -Bold
Write-Host "             Master Integration Orchestrator              " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Student A: Threat Pipeline Engineer (Java/Spring)      " -ForegroundColor Green
Write-Host "   Student B: Event-Driven Services (Node.js/NestJS)      " -ForegroundColor Green
Write-Host "   Student C: SOC Dashboard & Event Bus (Java + React)    " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = Resolve-Path (Join-Path $PSScriptRoot "..")
$studentAPath = Join-Path $rootPath "modules\student-a"
$studentBPath = Join-Path $rootPath "modules\student-b"
$studentCPath = Join-Path $rootPath "modules\student-c"
$oneShotMode = $args.Count -gt 0
$initialChoice = if ($oneShotMode) { $args[0] } else { $null }
$processes = @()

# Helper function to stop all launched processes
function Stop-All-Services {
    Write-Host "`nStopping all running services..." -ForegroundColor Yellow
    
    # Stop locally launched java/node/npm processes
    foreach ($proc in $processes) {
        if ($proc -and !(Get-Process -Id $proc.Id -ErrorAction SilentlyContinue).HasExited) {
            Write-Host "Stopping process: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor DarkGray
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
    
    # Terminate docker compose databases
    Write-Host "Stopping Docker infrastructure..." -ForegroundColor DarkGray
    docker-compose -f "$studentBPath\docker-compose.yml" down -v --remove-orphans 2>$null
    
    Write-Host "All services stopped successfully." -ForegroundColor Green
}

# Trap script exits to clean up processes
trap { Stop-All-Services; exit }

function Show-Menu {
    Write-Host "Select an option to interact with the platform:" -ForegroundColor White
    Write-Host "1) Spin up FULL Integration Platform (Docker DBs + All 8 Services + Frontend)" -ForegroundColor Green -Bold
    Write-Host "2) Start Docker Infrastructure only (PostgreSQL, Redis, RabbitMQ)" -ForegroundColor Yellow
    Write-Host "3) Start Student A Services only (Ingestion, Enrichment, Incident - Local SQLite)" -ForegroundColor White
    Write-Host "4) Start Student B Services only (NestJS Microservices Local)" -ForegroundColor White
    Write-Host "5) Start Student C SOC Platform only (Backend + React Dashboard)" -ForegroundColor White
    Write-Host "6) Run Automated Connection & Health Validation" -ForegroundColor Cyan
    Write-Host "7) Stop All Services and Clean Environment" -ForegroundColor Red
    Write-Host "8) Exit" -ForegroundColor Red
    if ($oneShotMode) {
        exit
    }

    Write-Host ""
    Write-Error -Message " " -ErrorAction SilentlyContinue # Clear error variable
    $choice = Read-Host "Enter option [1-8]"
    return $choice
}

while ($true) {
    if ($initialChoice) {
        $c = $initialChoice
        $initialChoice = $null
    } else {
        $c = Show-Menu
    }
    
    switch ($c) {
        "1" {
            Clear-Host
            Write-Host "=== SPINNING UP INTEGRATION PLATFORM ===" -ForegroundColor Green -Bold
            
            # 1. Start Docker Databases
            Write-Host "`n[1/5] Starting Docker databases and message broker..." -ForegroundColor Cyan
            docker-compose -f "$studentBPath\docker-compose.yml" up -d postgres redis rabbitmq
            
            # Wait for DB, Cache, and Message Broker to be healthy
            Write-Host "Waiting for database infrastructure to initialize (approx 15 seconds)..." -ForegroundColor Yellow
            Start-Sleep -Seconds 15
            
            # 2. Start Student B Services locally
            Write-Host "`n[2/5] Launching Student B NestJS services locally..." -ForegroundColor Cyan
            
            Write-Host "Starting Threat Intel Service (3002)..." -ForegroundColor DarkGray
            $threatIntelProc = Start-Process node -ArgumentList "dist/services/threat-intel-service/src/main.js" `
                -WorkingDirectory "$studentBPath\services\threat-intel-service" -PassThru -WindowStyle Minimized
            $processes += $threatIntelProc
            
            Write-Host "Starting Response Orchestration Service (3003)..." -ForegroundColor DarkGray
            $responseProc = Start-Process node -ArgumentList "dist/services/response-orchestration-service/src/main.js" `
                -WorkingDirectory "$studentBPath\services\response-orchestration-service" -PassThru -WindowStyle Minimized
            $processes += $responseProc
            
            Write-Host "Starting Notification Service (3004)..." -ForegroundColor DarkGray
            $notificationProc = Start-Process node -ArgumentList "dist/services/notification-service/src/main.js" `
                -WorkingDirectory "$studentBPath\services\notification-service" -PassThru -WindowStyle Minimized
            $processes += $notificationProc
            
            Write-Host "Starting Alert Middleware (3005)..." -ForegroundColor DarkGray
            $middlewareProc = Start-Process node -ArgumentList "dist/middleware/src/main.js" `
                -WorkingDirectory "$studentBPath\middleware" -PassThru -WindowStyle Minimized
            $processes += $middlewareProc
            
            # 3. Start Student A Java Services
            Write-Host "`n[3/5] Launching Student A services locally..." -ForegroundColor Cyan
            
            Write-Host "Starting Ingestion Service (8081)..." -ForegroundColor DarkGray
            $ingestionProc = Start-Process java -ArgumentList "-jar target\alert-ingestion-service-1.0.0-SNAPSHOT.jar" `
                -WorkingDirectory "$studentAPath\services\alert-ingestion-service" -PassThru -WindowStyle Minimized
            $processes += $ingestionProc
            
            Write-Host "Starting Enrichment & Correlation Service (8082)..." -ForegroundColor DarkGray
            $enrichmentProc = Start-Process java -ArgumentList "-jar target\enrichment-correlation-service-1.0.0-SNAPSHOT.jar" `
                -WorkingDirectory "$studentAPath\services\enrichment-correlation-service" -PassThru -WindowStyle Minimized
            $processes += $enrichmentProc
            
            Write-Host "Starting Incident Management Service (8083)..." -ForegroundColor DarkGray
            $incidentProc = Start-Process java -ArgumentList "-jar target\incident-management-service-1.0.0-SNAPSHOT.jar" `
                -WorkingDirectory "$studentAPath\services\incident-management-service" -PassThru -WindowStyle Minimized
            $processes += $incidentProc
            
            # 4. Start Student C Java SOC Backend
            Write-Host "`n[4/5] Launching Student C SOC Backend locally..." -ForegroundColor Cyan
            Write-Host "Starting SOC Backend on 8084 (Integrated Profile)..." -ForegroundColor DarkGray
            $socBackendProc = Start-Process java -ArgumentList `
                `"-Dspring.profiles.active=integrated`", `"-jar`", `"target\sda-pro-studentc-1.0.0.jar`" `
                -WorkingDirectory "$studentCPath" -PassThru -WindowStyle Minimized
            $processes += $socBackendProc
            
            # 5. Start Student C Dashboard Frontend
            Write-Host "`n[5/5] Launching Student C React Frontend locally..." -ForegroundColor Cyan
            Write-Host "Starting React app (Port 3000)..." -ForegroundColor DarkGray
            
            $frontendProc = Start-Process npm -ArgumentList "start" -WorkingDirectory "$studentCPath\frontend" -PassThru
            $processes += $frontendProc
            
            Write-Host "`nStartup sequence completed. Verification will start in 10 seconds..." -ForegroundColor Green
            Start-Sleep -Seconds 10
            
            # Run health checks
            & "$PSScriptRoot\run-all.ps1" 6
        }
        
        "2" {
            Write-Host "`nStarting Docker databases & queues..." -ForegroundColor Yellow
            docker-compose -f "$studentBPath\docker-compose.yml" up -d postgres redis rabbitmq
            Write-Host "Infrastructure started." -ForegroundColor Green
        }
        
        "3" {
            Write-Host "`nLaunching Student A services locally..." -ForegroundColor Green
            Write-Host "Starting Ingestion (8081)..." -ForegroundColor DarkGray
            $ingestionProc = Start-Process java -ArgumentList "-jar target\alert-ingestion-service-1.0.0-SNAPSHOT.jar" `
                -WorkingDirectory "$studentAPath\services\alert-ingestion-service" -PassThru -WindowStyle Normal
            $processes += $ingestionProc
            
            Write-Host "Starting Enrichment (8082)..." -ForegroundColor DarkGray
            $enrichmentProc = Start-Process java -ArgumentList "-jar target\enrichment-correlation-service-1.0.0-SNAPSHOT.jar" `
                -WorkingDirectory "$studentAPath\services\enrichment-correlation-service" -PassThru -WindowStyle Normal
            $processes += $enrichmentProc
            
            Write-Host "Starting Incident Management (8083)..." -ForegroundColor DarkGray
            $incidentProc = Start-Process java -ArgumentList "-jar target\incident-management-service-1.0.0-SNAPSHOT.jar" `
                -WorkingDirectory "$studentAPath\services\incident-management-service" -PassThru -WindowStyle Normal
            $processes += $incidentProc
        }
        
        "4" {
            Write-Host "`nLaunching Student B Microservices locally..." -ForegroundColor Green
            
            Write-Host "Starting Threat Intel Service (3002)..." -ForegroundColor DarkGray
            $threatIntelProc = Start-Process node -ArgumentList "dist/services/threat-intel-service/src/main.js" `
                -WorkingDirectory "$studentBPath\services\threat-intel-service" -PassThru -WindowStyle Normal
            $processes += $threatIntelProc
            
            Write-Host "Starting Response Orchestration Service (3003)..." -ForegroundColor DarkGray
            $responseProc = Start-Process node -ArgumentList "dist/services/response-orchestration-service/src/main.js" `
                -WorkingDirectory "$studentBPath\services\response-orchestration-service" -PassThru -WindowStyle Normal
            $processes += $responseProc
            
            Write-Host "Starting Notification Service (3004)..." -ForegroundColor DarkGray
            $notificationProc = Start-Process node -ArgumentList "dist/services/notification-service/src/main.js" `
                -WorkingDirectory "$studentBPath\services\notification-service" -PassThru -WindowStyle Normal
            $processes += $notificationProc
            
            Write-Host "Starting Alert Middleware (3005)..." -ForegroundColor DarkGray
            $middlewareProc = Start-Process node -ArgumentList "dist/middleware/src/main.js" `
                -WorkingDirectory "$studentBPath\middleware" -PassThru -WindowStyle Normal
            $processes += $middlewareProc
        }
        
        "5" {
            Write-Host "`nLaunching Student C Dashboard Platform locally..." -ForegroundColor Green
            Write-Host "Starting SOC Backend on 8084 (standalone)..." -ForegroundColor DarkGray
            $socBackendProc = Start-Process java -ArgumentList `
                `"-Dspring.profiles.active=standalone`", `"-jar`", `"target\sda-pro-studentc-1.0.0.jar`" `
                -WorkingDirectory "$studentCPath" -PassThru -WindowStyle Normal
            $processes += $socBackendProc
            
            Write-Host "Starting React Frontend on 3000..." -ForegroundColor DarkGray
            $frontendProc = Start-Process npm -ArgumentList "start" -WorkingDirectory "$studentCPath\frontend" -PassThru
            $processes += $frontendProc
        }
        
        "6" {
            Write-Host "`n=== RUNNING HEALTH & INTEGRATION VALIDATION ===" -ForegroundColor Cyan -Bold
            
            $endpoints = @{
                "SOC Dashboard Backend (8084)" = "http://localhost:8084/actuator/health";
                "Ingestion Service (8081)"     = "http://localhost:8081/api/v1/alerts";
                "Enrichment Service (8082)"    = "http://localhost:8082/api/v1/enrichment-results";
                "Incident Mgmt (8083)"          = "http://localhost:8083/api/v1/incidents";
                "Threat Intel Service (3002)"   = "http://localhost:3002/api/v1/health";
                "Response Service (3003)"       = "http://localhost:3003/api/v1/health";
                "Notification Service (3004)"   = "http://localhost:3004/api/v1/health";
                "Middleware Pipeline (3005)"    = "http://localhost:3005/api/v1/health"
            }
            
            foreach ($name in $endpoints.Keys) {
                $url = $endpoints[$name]
                try {
                    $res = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 3 -ErrorAction Stop
                    Write-Host "[OK] $name is ONLINE" -ForegroundColor Green
                } catch {
                    Write-Host "[ERR] $name is OFFLINE ($url)" -ForegroundColor Red
                }
            }
            Write-Host "`nAll checks completed." -ForegroundColor White
        }
        
        "7" {
            Stop-All-Services
        }
        
        "8" {
            Stop-All-Services
            exit
        }
        
        Default {
            Write-Host "Invalid choice. Please pick 1 to 8." -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Read-Host "Press Enter to return to menu..."
    Clear-Host
}
