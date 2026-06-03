param(
    [switch]$InjectSampleAlert
)

$ErrorActionPreference = "Stop"

$checks = @(
    @{ Name = "SOC backend"; Url = "http://localhost:8084/actuator/health" },
    @{ Name = "Student A ingestion"; Url = "http://localhost:8081/api/v1/alerts" },
    @{ Name = "Student A enrichment"; Url = "http://localhost:8082/api/v1/enrichment-results" },
    @{ Name = "Student A incidents"; Url = "http://localhost:8083/api/v1/incidents" },
    @{ Name = "Student B threat intel"; Url = "http://localhost:3002/api/v1/health" },
    @{ Name = "Student B response"; Url = "http://localhost:3003/api/v1/health" },
    @{ Name = "Student B notification"; Url = "http://localhost:3004/api/v1/health" },
    @{ Name = "Student B middleware"; Url = "http://localhost:3005/api/v1/health" },
    @{ Name = "SOC frontend"; Url = "http://localhost:3000" }
)

Write-Host "SDA-Pro integration smoke check" -ForegroundColor Cyan

foreach ($check in $checks) {
    try {
        Invoke-RestMethod -Uri $check.Url -Method Get -TimeoutSec 5 | Out-Null
        Write-Host "[OK]  $($check.Name)" -ForegroundColor Green
    } catch {
        Write-Host "[ERR] $($check.Name) - $($check.Url)" -ForegroundColor Red
        throw
    }
}

if ($InjectSampleAlert) {
    $payload = @{
        result = @{
            search_name = "Smoke Test Brute Force"
            description = "Integration smoke test generated alert"
            sid = "smoke-" + [guid]::NewGuid().ToString("N").Substring(0, 8)
            src_ip = "198.51.100.42"
            dest_ip = "10.0.0.15"
            user = "admin"
            host = "smoke-db-01"
            category = "brute-force"
            severity = "8"
        }
    } | ConvertTo-Json -Depth 5

    $ingested = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/ingest/splunk" -Method Post -ContentType "application/json" -Body $payload
    Write-Host "[OK]  Sample alert ingested: $($ingested.alertId)" -ForegroundColor Green
}

Write-Host "Smoke check completed." -ForegroundColor Cyan
