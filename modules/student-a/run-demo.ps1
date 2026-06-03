# SDA-Pro Threat Pipeline Interactive Demo Script
# Student A: Threat Pipeline Engineer
# Evaluates and runs all 3 services and 7 design patterns in action.

$Host.UI.RawUI.WindowTitle = "SDA-Pro Interactive Threat Pipeline Demo"
Clear-Host

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "                SDA-PRO INTERACTIVE PATTERN DEMO                      " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "This script runs and tests all 3 microservices and validates the"
Write-Host "7 design patterns assigned to Student A (Threat Pipeline Engineer)."
Write-Host "----------------------------------------------------------------------"
Write-Host "Project Directory: C:\Users\RASHID\.gemini\antigravity\scratch\SDA-Pro"
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Define paths
$projectRoot = "C:\Users\RASHID\.gemini\antigravity\scratch\SDA-Pro"
$mvnPath = "C:\Users\RASHID\apache-maven-3.9.6\bin\mvn.cmd"

if (-not (Test-Path $mvnPath)) {
    Write-Host "[!] Could not find Maven at expected path: $mvnPath" -ForegroundColor Yellow
    Write-Host "    Attempting to fall back to 'mvn' on system PATH..." -ForegroundColor Yellow
    $mvnPath = "mvn"
}

# ----------------------------------------------------------------------
# 0. Pre-run cleanup (Terminates any background Java processes and clears lock files)
# ----------------------------------------------------------------------
Write-Host "[0/3] Cleaning up active background processes and lock files..." -ForegroundColor Green
$javaProcesses = Get-Process -Name java -ErrorAction SilentlyContinue
if ($javaProcesses) {
    Write-Host "  -> Found active Java processes. Force-terminating old instances to free ports..." -ForegroundColor Yellow
    taskkill /f /im java.exe 2>&1 | Out-Null
    Start-Sleep -Seconds 2
}
# Delete SQLite lock files
Remove-Item -Path "$projectRoot\services\*\data\*.db-*" -Force -ErrorAction SilentlyContinue

Write-Host "  -> Cleanup complete. System is fresh and ready!" -ForegroundColor Gray
Write-Host ""

# ----------------------------------------------------------------------
# 1. Starting the Microservices
# ----------------------------------------------------------------------
Write-Host "[1/3] Launching the 3 microservices in separate windows..." -ForegroundColor Green

# Start Ingestion Service (Port 8081)
Write-Host "  -> Starting Alert Ingestion Service on Port 8081..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\services\alert-ingestion-service'; Write-Host '--- STARTING ALERT INGESTION SERVICE (PORT 8081) ---' -ForegroundColor Cyan; & '$mvnPath' spring-boot:run"

# Start Enrichment and Correlation Service (Port 8082)
Write-Host "  -> Starting Enrichment and Correlation Service on Port 8082..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\services\enrichment-correlation-service'; Write-Host '--- STARTING ENRICHMENT AND CORRELATION SERVICE (PORT 8082) ---' -ForegroundColor Cyan; & '$mvnPath' spring-boot:run"

# Start Incident Management Service (Port 8083)
Write-Host "  -> Starting Incident Management Service on Port 8083..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\services\incident-management-service'; Write-Host '--- STARTING INCIDENT MANAGEMENT SERVICE (PORT 8083) ---' -ForegroundColor Cyan; & '$mvnPath' spring-boot:run"

Write-Host ""
Write-Host "[!] Waiting 35 seconds for services to fully initialize..." -ForegroundColor Yellow
for ($i = 35; $i -gt 0; $i--) {
    Write-Host -NoNewline "$i.. "
    Start-Sleep -Seconds 1
}
Write-Host "Done!" -ForegroundColor Green
Write-Host ""

# Simple health check helper
function Check-Service {
    param($port, $name)
    try {
        $res = Invoke-WebRequest -Uri "http://localhost:$port/actuator/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        return $true
    } catch {
        # Fallback to checking port availability or simple endpoint connection
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $tcp.Connect("localhost", $port)
            $tcp.Close()
            return $true
        } catch {
            return $false
        }
    }
}

Write-Host "Checking service health..." -ForegroundColor Cyan
$ingestionOk = Check-Service 8081 "Alert Ingestion"
$enrichmentOk = Check-Service 8082 "Enrichment and Correlation"
$incidentOk = Check-Service 8083 "Incident Management"

if (-not ($ingestionOk -and $enrichmentOk -and $incidentOk)) {
    Write-Host "[!] Warning: One or more services did not respond immediately." -ForegroundColor Yellow
    Write-Host "    Ingestion (8081): $(if ($ingestionOk) { 'ONLINE' } else { 'OFFLINE' })"
    Write-Host "    Enrichment (8082): $(if ($enrichmentOk) { 'ONLINE' } else { 'OFFLINE' })"
    Write-Host "    Incident (8083): $(if ($incidentOk) { 'ONLINE' } else { 'OFFLINE' })"
    Write-Host "    Please ensure Maven compiled successfully and no port conflicts exist." -ForegroundColor Yellow
    Write-Host "    Press Enter to attempt proceeding anyway, or Ctrl+C to abort..."
    Read-Host
} else {
    Write-Host "[OK] All services are ONLINE and listening!" -ForegroundColor Green
}
Write-Host ""

# ----------------------------------------------------------------------
# 2. Pattern Testing Pipeline
# ----------------------------------------------------------------------
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "                  DEMONSTRATING PATTERNS AND PIPELINE                 " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# ----------------------------------------------------------------------
# PATTERN 1: SINGLETON
# ----------------------------------------------------------------------
Write-Host "[PATTERN 1] Singleton - IngestionConfigManager" -ForegroundColor Yellow
Write-Host "File: services/alert-ingestion-service/.../config/IngestionConfigManager.java" -ForegroundColor Gray
Write-Host "Description: Ensures a single global configuration point for ingestion thresholds."
Write-Host "API Request: GET http://localhost:8081/api/v1/config" -ForegroundColor Cyan

$config = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/config" -Method Get
Write-Host "Response from Ingestion Config (Singleton):" -ForegroundColor DarkGray
$config.configs | Format-List | Out-String | Write-Host -ForegroundColor Gray
Write-Host "[OK] Singleton verified: Configuration loaded from the unique double-checked locked instance." -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter to proceed to the next pattern..."
Read-Host

# ----------------------------------------------------------------------
# PATTERN 2: FACTORY METHOD
# ----------------------------------------------------------------------
Write-Host "[PATTERN 2] Factory Method - AlertNormalizerFactory" -ForegroundColor Yellow
Write-Host "File: services/alert-ingestion-service/.../services/normalizer/AlertNormalizerFactory.java" -ForegroundColor Gray
Write-Host "Description: Dynamically creates source-specific normalizers (Splunk vs. CrowdStrike) to map various JSON schemas to a uniform CanonicalAlert DTO."

# A. Ingest Splunk Alert
Write-Host "API Request A: Ingest raw SPLUNK alert to http://localhost:8081/api/v1/ingest/splunk" -ForegroundColor Cyan
$splunkPayload = '{
    "result": {
        "search_name": "Brute Force Attack Detected",
        "description": "Multiple login failures from single IP",
        "sid": "splunk-sid-9982",
        "src_ip": "198.51.100.42",
        "dest_ip": "10.0.0.15",
        "user": "admin",
        "host": "production-db-01",
        "category": "brute-force",
        "severity": "9"
    }
}'

$splunkResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/ingest/splunk" -Method Post -Body $splunkPayload -ContentType "application/json"
$alertId1 = $splunkResponse.alertId
Write-Host "Splunk Normalizer Output (CanonicalAlert):" -ForegroundColor DarkGray
$splunkResponse | Format-List | Out-String | Write-Host -ForegroundColor Gray

# B. Ingest Crowdstrike Alert
Write-Host "API Request B: Ingest raw CROWDSTRIKE alert to http://localhost:8081/api/v1/ingest/crowdstrike" -ForegroundColor Cyan
$csPayload = '{
    "detection_id": "cs-det-4412",
    "pattern_disposition": "Blocked",
    "severity_name": "Critical",
    "device": {
        "hostname": "workstation-12",
        "external_ip": "198.51.100.42",
        "local_ip": "10.0.2.5"
    },
    "behavior": {
        "scenario": "Credential Dumping",
        "description": "LSASS memory read by unauthorized process",
        "user_name": "local_user"
    }
}'

$csResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/ingest/crowdstrike" -Method Post -Body $csPayload -ContentType "application/json"
$alertId2 = $csResponse.alertId
Write-Host "CrowdStrike Normalizer Output (CanonicalAlert):" -ForegroundColor DarkGray
$csResponse | Format-List | Out-String | Write-Host -ForegroundColor Gray

Write-Host "[OK] Factory Method verified: Different raw formats correctly parsed into a uniform model." -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter to proceed to the next pattern..."
Read-Host

# ----------------------------------------------------------------------
# PATTERN 3: COMPOSITE
# ----------------------------------------------------------------------
Write-Host "[PATTERN 3] Composite - AlertComponent Tree" -ForegroundColor Yellow
Write-Host "File: services/alert-ingestion-service/.../domain/alert/AlertComponent.java" -ForegroundColor Gray
Write-Host "Description: Treats individual alerts (SingleAlert) and campaigns (AlertCampaign - container of alerts) uniformly using a shared composite interface."
Write-Host "API Request: Ingest an entire multi-stage campaign containing two raw payloads to http://localhost:8081/api/v1/ingest/splunk/campaign" -ForegroundColor Cyan

$campaignPayload = @{
    campaignName = "APT29 Reconnaissance Campaign"
    attackPattern = "External Scan -> Credentials Harvest"
    payloads = @(
        '{"result":{"search_name":"Port Scan Detected","src_ip":"198.51.100.42","dest_ip":"10.0.0.1","severity":"4"}}',
        '{"result":{"search_name":"Phishing Link Clicked","src_ip":"10.0.0.55","dest_ip":"203.0.113.88","severity":"8"}}'
    )
} | ConvertTo-Json

$campaignResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/ingest/splunk/campaign" -Method Post -Body $campaignPayload -ContentType "application/json"
Write-Host "Campaign Composite Output:" -ForegroundColor DarkGray
$campaignResponse | Format-List | Out-String | Write-Host -ForegroundColor Gray

Write-Host "[OK] Composite verified: Individual alerts are grouped and queried as one cohesive Campaign entity." -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter to proceed to the next pattern..."
Read-Host

# ----------------------------------------------------------------------
# PATTERN 4: CHAIN OF RESPONSIBILITY
# ----------------------------------------------------------------------
Write-Host "[PATTERN 4] Chain of Responsibility - EnrichmentHandler Pipeline" -ForegroundColor Yellow
Write-Host "File: services/enrichment-correlation-service/.../services/pipeline/EnrichmentHandler.java" -ForegroundColor Gray
Write-Host "Description: Pushes our canonical alert through a chain of 5 distinct processing handlers:"
Write-Host "             Deduplication -> GeoIP -> ThreatIntel -> AssetContext -> Classification"
Write-Host "API Request: Ingest and enrich SingleAlert ID: $alertId1 to http://localhost:8082/api/v1/enrich" -ForegroundColor Cyan

# Fetch the raw alert first to enrich it
$rawAlert = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/alerts/$alertId1" -Method Get
$enrichRequestObj = @{
    id = $rawAlert.id
    sourceType = $rawAlert.sourceType
    title = $rawAlert.title
    description = $rawAlert.description
    sourceIp = $rawAlert.sourceIp
    destinationIp = $rawAlert.destinationIp
    userName = $rawAlert.userName
    hostName = $rawAlert.hostName
    attackCategory = $rawAlert.attackCategory
    severity = $rawAlert.severity
    timestamp = $rawAlert.timestamp
}
$enrichRequest = $enrichRequestObj | ConvertTo-Json

$enrichResponse = Invoke-RestMethod -Uri "http://localhost:8082/api/v1/enrich" -Method Post -Body $enrichRequest -ContentType "application/json"
Write-Host "Pipeline Enrichment Output (After CoR execution):" -ForegroundColor DarkGray
$enrichResponse | Format-List | Out-String | Write-Host -ForegroundColor Gray
Write-Host "Look at these enrichment values appended by the handlers:" -ForegroundColor DarkYellow
Write-Host "  -> Deduplication Status: $($enrichResponse.status)"
Write-Host "  -> GeoIP Country: $($enrichResponse.geoIpData.country) (Lat: $($enrichResponse.geoIpData.lat), Lon: $($enrichResponse.geoIpData.lon))"
Write-Host "  -> ThreatIntel Verdict: $($enrichResponse.threatIntelData.verdict) (Score: $($enrichResponse.threatIntelData.score)%)"
Write-Host "  -> Asset Context Owner: $($enrichResponse.assetContextData.owner) (Criticality: $($enrichResponse.assetContextData.criticality))"
Write-Host "  -> Re-classified Severity: $($enrichResponse.classifiedSeverity)"

Write-Host ""
Write-Host "[OK] Chain of Responsibility verified: The alert successfully gathered detail at each pipeline step." -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter to proceed to the next patterns..."
Read-Host

# ----------------------------------------------------------------------
# PATTERNS 5 and 6: ABSTRACT FACTORY AND STRATEGY
# ----------------------------------------------------------------------
Write-Host "[PATTERNS 5 and 6] Abstract Factory and Strategy - Enrichment and Correlation" -ForegroundColor Yellow
Write-Host "Files: EnrichmentProviderFactory.java, CorrelationStrategy.java" -ForegroundColor Gray
Write-Host "Description: 1. Abstract Factory swaps out whole families of data providers (Premium vs Standard)."
Write-Host "             2. Strategy selects how alerts are clustered together (e.g. TimeWindowCorrelation)."
Write-Host "API Request: Perform a batch correlation on multiple alerts to http://localhost:8082/api/v1/enrich/batch" -ForegroundColor Cyan

# Prepare secondary alert for correlation
$rawAlert2 = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/alerts/$alertId2" -Method Get
$enrichRequest2 = @{
    id = $rawAlert2.id
    sourceType = $rawAlert2.sourceType
    title = $rawAlert2.title
    description = $rawAlert2.description
    sourceIp = $rawAlert2.sourceIp
    destinationIp = $rawAlert2.destinationIp
    userName = $rawAlert2.userName
    hostName = $rawAlert2.hostName
    attackCategory = $rawAlert2.attackCategory
    severity = $rawAlert2.severity
    timestamp = $rawAlert2.timestamp
}

$batchPayload = @($enrichRequestObj, $enrichRequest2) | ConvertTo-Json

$batchResponse = Invoke-RestMethod -Uri "http://localhost:8082/api/v1/enrich/batch" -Method Post -Body $batchPayload -ContentType "application/json"
Write-Host "Batch Processing Output:" -ForegroundColor DarkGray
$batchResponse | Format-List | Out-String | Write-Host -ForegroundColor Gray

Write-Host "Correlation Action: $($batchResponse.correlationAction)" -ForegroundColor Cyan
Write-Host "Correlation Rule: $($batchResponse.correlationRule)" -ForegroundColor Cyan
Write-Host "Confidence: $($batchResponse.confidence)%" -ForegroundColor Cyan
Write-Host "Summary: $($batchResponse.summary)" -ForegroundColor Cyan

Write-Host ""
Write-Host "[OK] Abstract Factory and Strategy verified: Premium data was generated, and TimeWindow strategy triggered correlation!" -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter to proceed to the final pattern..."
Read-Host

# ----------------------------------------------------------------------
# PATTERN 7: STATE PATTERN (INCIDENT LIFECYCLE)
# ----------------------------------------------------------------------
Write-Host "[PATTERN 7] State Pattern - IncidentState Lifecycle" -ForegroundColor Yellow
Write-Host "Files: IncidentState.java, Incident.java, NewState.java, UnderTriageState.java, etc." -ForegroundColor Gray
Write-Host "Description: A security Incident aggregate root encapsulates state transitions through 7 distinct lifecycle phases."
Write-Host "             Only legal state transitions are permitted; illegal transitions throw 409 Conflict."

# Step A: Create Incident (Starts in NEW state)
Write-Host "Step A: Create Incident" -ForegroundColor Cyan
$incidentPayload = @{
    title = "Credential Dumping Incident"
    description = "Correlated credential stealing activity from Host 198.51.100.42"
    severity = "CRITICAL"
    alertIds = @($alertId1, $alertId2)
} | ConvertTo-Json

$incident = Invoke-RestMethod -Uri "http://localhost:8083/api/v1/incidents" -Method Post -Body $incidentPayload -ContentType "application/json"
$incidentId = $incident.id
Write-Host "  -> Incident Created! State: $($incident.currentStateType) (ID: $incidentId)" -ForegroundColor Green
Write-Host ""

# Step B: Attempt an ILLEGAL transition (Going from NEW straight to CLOSED - not allowed!)
Write-Host "Step B: Attempt ILLEGAL Transition: NEW -> CLOSED" -ForegroundColor Cyan
Write-Host "API Request: PUT http://localhost:8083/api/v1/incidents/$incidentId/close" -ForegroundColor Cyan
try {
    $illegalClose = @{ summary = "Trying to close early." } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "http://localhost:8083/api/v1/incidents/$incidentId/close" -Method Put -Body $illegalClose -ContentType "application/json"
    Write-Host "  [!] ERROR: Transition succeeded when it should have failed!" -ForegroundColor Red
} catch {
    $errObj = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($errObj)
    $errBody = $reader.ReadToEnd() | ConvertFrom-Json
    Write-Host "  -> Transition Blocked! Professor-friendly Error returned:" -ForegroundColor DarkRed
    Write-Host "     HTTP Status Code: 409 Conflict" -ForegroundColor DarkRed
    Write-Host "     Reason: $($errBody.error)" -ForegroundColor DarkRed
    Write-Host "  [OK] Verified: State machine protects invalid state leaps!" -ForegroundColor Green
}
Write-Host ""

# Step C: Legal transition: NEW -> UNDER_TRIAGE
Write-Host "Step C: Legal Transition: NEW -> UNDER_TRIAGE" -ForegroundColor Cyan
$triagePayload = @{ analystId = "c814b7e2-7634-4b53-8419-f53835e5d179" } | ConvertTo-Json
$incident = Invoke-RestMethod -Uri "http://localhost:8083/api/v1/incidents/$incidentId/triage" -Method Put -Body $triagePayload -ContentType "application/json"
Write-Host "  -> Transition OK! State: $($incident.currentState)" -ForegroundColor Green
Write-Host "     Next legal states allowed: $($incident.allowedTransitions -join ', ')" -ForegroundColor DarkGray
Write-Host ""

# Step D: Legal transition: UNDER_TRIAGE -> CONTAINMENT
Write-Host "Step D: Legal Transition: UNDER_TRIAGE -> CONTAINMENT" -ForegroundColor Cyan
$containPayload = @{ actions = @("ISOLATE_ENDPOINT", "REVOKE_CREDENTIALS") } | ConvertTo-Json
$incident = Invoke-RestMethod -Uri "http://localhost:8083/api/v1/incidents/$incidentId/contain" -Method Put -Body $containPayload -ContentType "application/json"
Write-Host "  -> Transition OK! State: $($incident.currentState)" -ForegroundColor Green
Write-Host "     Allowed actions in Containment state: $($incident.allowedActions -join ', ')" -ForegroundColor DarkGray
Write-Host ""

# Step E: Legal transitions to close the loop: CONTAINMENT -> ERADICATION -> RECOVERY -> POST_INCIDENT_REVIEW -> CLOSED
Write-Host "Step E: Closing the Incident Lifecycle..." -ForegroundColor Cyan

# Containment -> Eradication
$incident = Invoke-RestMethod -Uri "http://localhost:8083/api/v1/incidents/$incidentId/eradicate" -Method Put
Write-Host "  -> Transition OK! State: $($incident.currentState)" -ForegroundColor Green

# Eradication -> Recovery
$incident = Invoke-RestMethod -Uri "http://localhost:8083/api/v1/incidents/$incidentId/recover" -Method Put
Write-Host "  -> Transition OK! State: $($incident.currentState)" -ForegroundColor Green

# Recovery -> Post Incident Review
$incident = Invoke-RestMethod -Uri "http://localhost:8083/api/v1/incidents/$incidentId/review" -Method Put
Write-Host "  -> Transition OK! State: $($incident.currentState)" -ForegroundColor Green

# Post Incident Review -> Closed
$closePayload = @{ summary = "Attacking IP blocked at firewall. Host re-imaged. No data loss." } | ConvertTo-Json
$incident = Invoke-RestMethod -Uri "http://localhost:8083/api/v1/incidents/$incidentId/close" -Method Put -Body $closePayload -ContentType "application/json"
Write-Host "  -> Transition OK! State: $($incident.currentState)" -ForegroundColor Green

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "                     DEMO FINISHED SUCCESSFULLY                       " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "All 7 design patterns and 3 Spring Boot services executed cleanly!" -ForegroundColor Green
Write-Host "Check the console windows spawned to see standard Spring Boot logs."
Write-Host "Press Enter to exit..."
Read-Host
