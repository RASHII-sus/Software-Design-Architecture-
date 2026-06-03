# SDA-Pro Data Population Script
# Ingests alerts and creates incidents to populate the integrated database and dashboard

Write-Host "Ingesting alerts into the pipeline..." -ForegroundColor Cyan

# 1. Ingest Splunk Brute Force Alert
$splunkPayload = '{
    "result": {
        "search_name": "Brute Force Attack Detected",
        "description": "Multiple login failures from single IP on production DB server",
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
Write-Host "  -> Splunk Alert Ingested (ID: $alertId1)" -ForegroundColor Green

# 2. Ingest Crowdstrike Credential Dumping Alert
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
Write-Host "  -> Crowdstrike Alert Ingested (ID: $alertId2)" -ForegroundColor Green

# 3. Ingest Campaign Scan Alerts
$campaignPayload = @{
    campaignName = "APT29 Reconnaissance Campaign"
    attackPattern = "External Scan -> Credentials Harvest"
    payloads = @(
        '{"result":{"search_name":"Port Scan Detected","src_ip":"198.51.100.42","dest_ip":"10.0.0.1","severity":"4"}}',
        '{"result":{"search_name":"Phishing Link Clicked","src_ip":"10.0.0.55","dest_ip":"203.0.113.88","severity":"8"}}'
    )
} | ConvertTo-Json
$campaignResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/ingest/splunk/campaign" -Method Post -Body $campaignPayload -ContentType "application/json"
Write-Host "  -> Campaign Alerts Ingested" -ForegroundColor Green

# 4. Enrich Alerts
Write-Host "Enriching alerts..." -ForegroundColor Cyan
$rawAlert1 = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/alerts/$alertId1" -Method Get
$enrichRequestObj = @{
    id = $rawAlert1.id
    sourceType = $rawAlert1.sourceType
    title = $rawAlert1.title
    description = $rawAlert1.description
    sourceIp = $rawAlert1.sourceIp
    destinationIp = $rawAlert1.destinationIp
    userName = $rawAlert1.userName
    hostName = $rawAlert1.hostName
    attackCategory = $rawAlert1.attackCategory
    severity = $rawAlert1.severity
    timestamp = $rawAlert1.timestamp
}
$enrichResponse1 = Invoke-RestMethod -Uri "http://localhost:8082/api/v1/enrich" -Method Post -Body ($enrichRequestObj | ConvertTo-Json) -ContentType "application/json"
Write-Host "  -> Alert 1 Enriched" -ForegroundColor Green

# 5. Create Incidents to populate Student C's Dashboard
Write-Host "Creating Incidents in Incident Management Service..." -ForegroundColor Cyan

$incidentPayload1 = @{
    title = "Credential Dumping Attempt on workstation-12"
    description = "Correlated LSASS memory read activity from source IP 198.51.100.42"
    severity = "CRITICAL"
    alertIds = @($alertId2)
} | ConvertTo-Json
$incident1 = Invoke-RestMethod -Uri "http://localhost:8083/api/v1/incidents" -Method Post -Body $incidentPayload1 -ContentType "application/json"
$incidentId1 = $incident1.id
Write-Host "  -> Incident 1 Created (ID: $incidentId1) - State: $($incident1.currentStateType)" -ForegroundColor Green

# Move Incident 1 to UNDER_TRIAGE
$triagePayload = @{ analystId = "c814b7e2-7634-4b53-8419-f53835e5d179" } | ConvertTo-Json
$incident1 = Invoke-RestMethod -Uri "http://localhost:8083/api/v1/incidents/$incidentId1/triage" -Method Put -Body $triagePayload -ContentType "application/json"
Write-Host "  -> Incident 1 Transitioned to UNDER_TRIAGE" -ForegroundColor Green

# Move Incident 1 to CONTAINMENT
$containPayload = @{ actions = @("ISOLATE_ENDPOINT", "REVOKE_CREDENTIALS") } | ConvertTo-Json
$incident1 = Invoke-RestMethod -Uri "http://localhost:8083/api/v1/incidents/$incidentId1/contain" -Method Put -Body $containPayload -ContentType "application/json"
Write-Host "  -> Incident 1 Transitioned to CONTAINMENT" -ForegroundColor Green

# 6. Create another Incident for variety
$incidentPayload2 = @{
    title = "Brute Force Attack on production-db-01"
    description = "Multiple authentication failures detected by Splunk from 198.51.100.42"
    severity = "HIGH"
    alertIds = @($alertId1)
} | ConvertTo-Json
$incident2 = Invoke-RestMethod -Uri "http://localhost:8083/api/v1/incidents" -Method Post -Body $incidentPayload2 -ContentType "application/json"
$incidentId2 = $incident2.id
Write-Host "  -> Incident 2 Created (ID: $incidentId2) - State: $($incident2.currentStateType)" -ForegroundColor Green

# Move Incident 2 to UNDER_TRIAGE
$incident2 = Invoke-RestMethod -Uri "http://localhost:8083/api/v1/incidents/$incidentId2/triage" -Method Put -Body $triagePayload -ContentType "application/json"
Write-Host "  -> Incident 2 Transitioned to UNDER_TRIAGE" -ForegroundColor Green

# 7. Inject direct alerts into Student C's orchestrator to test the Student C alert list
Write-Host "Injecting alerts directly into Student C Alert Controller..." -ForegroundColor Cyan

$studentCAlert1 = @{
    alertId = $alertId1
    title = "Brute Force Attack on production-db-01"
    severity = "HIGH"
    status = "UNDER_TRIAGE"
    sourceIp = "198.51.100.42"
    attackType = "BRUTE_FORCE"
    assignedAnalyst = "analyst.ahmed"
    description = "Multiple failed logons"
} | ConvertTo-Json

$studentCAlert2 = @{
    alertId = $alertId2
    title = "LSASS Credential Dump on workstation-12"
    severity = "CRITICAL"
    status = "CONTAINMENT"
    sourceIp = "198.51.100.42"
    attackType = "RANSOMWARE"
    assignedAnalyst = "analyst.sara"
    description = "LSASS memory dumping"
} | ConvertTo-Json

$res1 = Invoke-RestMethod -Uri "http://localhost:8084/api/alerts" -Method Post -Body $studentCAlert1 -ContentType "application/json"
$res2 = Invoke-RestMethod -Uri "http://localhost:8084/api/alerts" -Method Post -Body $studentCAlert2 -ContentType "application/json"

Write-Host "Data population completed successfully!" -ForegroundColor Green
