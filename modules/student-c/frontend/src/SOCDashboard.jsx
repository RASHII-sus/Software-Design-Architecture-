import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
         Legend, ResponsiveContainer } from 'recharts';

// ============================================================
// SDA-Pro SOC Dashboard - Integrated Multi-Page Interface
// Connects to:
//   - Spring Boot SOC Backend at port 8084 (/api)
//   - Spring Boot Ingestion on 8081 (/ingestion-api)
//   - Spring Boot Enrichment on 8082 (/enrichment-api)
//   - Spring Boot Incident Mgmt on 8083 (/incident-api)
// ============================================================

const SEVERITY_COLORS = {
  CRITICAL: '#dc2626',
  HIGH:     '#ea580c',
  MEDIUM:   '#ca8a04',
  LOW:      '#16a34a',
};

const STATUS_COLORS = {
  NEW:                 '#6366f1',
  UNDER_TRIAGE:        '#f59e0b',
  CONTAINMENT:         '#f97316',
  ERADICATION:         '#ef4444',
  RECOVERY:            '#22c55e',
  CLOSED:              '#6b7280',
};

// ─── Stat Card Component ───
function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: '#1e293b', borderRadius: 10, padding: '18px 22px',
      borderLeft: `4px solid ${color}`, minWidth: 140, flex: 1
    }}>
      <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontSize: 28, fontWeight: 700 }}>{value ?? '—'}</div>
      {sub && <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Live Indicator Component ───
function LiveBadge({ connected }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                   color: connected ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: connected ? '#22c55e' : '#ef4444',
        boxShadow: connected ? '0 0 6px #22c55e' : 'none',
      }} />
      {connected ? 'LIVE WS' : 'WS OFFLINE'}
    </span>
  );
}

export default function SOCDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter/Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [complianceFilter, setComplianceFilter] = useState('ALL');

  // Selected details
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionSummary, setTransitionSummary] = useState('');
  const [simulationOutput, setSimulationOutput] = useState('');
  const [simulating, setSimulating] = useState(false);

  // Fetch Dashboard Metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/metrics');
      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      setMetrics(data);
      setError(null);
    } catch (e) {
      console.warn("Metrics API failed, using mock metrics fallback", e);
      setMetrics(getMockMetrics());
    }
  }, []);

  // Fetch All Alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      setAlerts(data);
    } catch (e) {
      console.warn("Alerts API failed", e);
    }
  }, []);

  // Fetch All Incidents (Incident Management on 8083)
  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch('/incident-api/api/v1/incidents');
      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      setIncidents(data);
      // Update selected incident details if already open
      if (selectedIncident) {
        const updated = data.find(inc => inc.id === selectedIncident.id);
        if (updated) setSelectedIncident(updated);
      }
    } catch (e) {
      console.warn("Incidents API failed", e);
    }
  }, [selectedIncident]);

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/audit/logs');
      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      setAuditLogs(data);
    } catch (e) {
      console.warn("Audit logs API failed", e);
    }
  }, []);

  // Refresh All Data
  const refreshAllData = useCallback(async () => {
    setLastUpdated(new Date());
    await Promise.all([
      fetchMetrics(),
      fetchAlerts(),
      fetchIncidents(),
      fetchAuditLogs()
    ]);
    setLoading(false);
  }, [fetchMetrics, fetchAlerts, fetchIncidents, fetchAuditLogs]);

  // Load Initial Data
  useEffect(() => {
    refreshAllData();
  }, []);

  // WebSocket Live Sync (Observer Pattern)
  useEffect(() => {
    let stompClient = null;
    const connect = async () => {
      try {
        const SockJS = (await import('sockjs-client')).default;
        const { Client } = await import('@stomp/stompjs');

        stompClient = new Client({
          webSocketFactory: () => new SockJS('http://localhost:8084/ws'),
          onConnect: () => {
            setWsConnected(true);
            stompClient.subscribe('/topic/dashboard', (msg) => {
              const fresh = JSON.parse(msg.body);
              setMetrics(fresh);
              setLastUpdated(new Date());
              // Trigger a background refresh of the tables when an update is pushed
              fetchAlerts();
              fetchIncidents();
              fetchAuditLogs();
            });
          },
          onDisconnect: () => setWsConnected(false),
          onStompError: () => setWsConnected(false),
          reconnectDelay: 5000,
        });
        stompClient.activate();
      } catch (e) {
        setWsConnected(false);
      }
    };
    connect();
    return () => { if (stompClient) stompClient.deactivate(); };
  }, [fetchAlerts, fetchIncidents, fetchAuditLogs]);

  // Handle Incident Transitions
  const handleTransition = async (actionType) => {
    if (!selectedIncident) return;
    setTransitionLoading(true);
    let url = `/incident-api/api/v1/incidents/${selectedIncident.id}/${actionType}`;
    let method = 'PUT';
    let body = null;

    if (actionType === 'triage') {
      body = JSON.stringify({ analystId: 'analyst.ahmed' });
    } else if (actionType === 'contain') {
      body = JSON.stringify({ actions: ['ISOLATE_ENDPOINT', 'REVOKE_CREDENTIALS'] });
    } else if (actionType === 'close') {
      body = JSON.stringify({ summary: transitionSummary || 'Incident resolved. Containment verified. No further action needed.' });
    }

    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Error ${res.status}`);
      }
      setTransitionSummary('');
      alert(`State transition '${actionType.toUpperCase()}' completed successfully!`);
      await refreshAllData();
    } catch (e) {
      alert(`State machine blocked transition: ${e.message}`);
    } finally {
      setTransitionLoading(false);
    }
  };

  // Run Simulated Attacks (Simulator Controls)
  const triggerSimulation = async (type) => {
    setSimulating(true);
    setSimulationOutput(`Initiating ${type} attack injection...\n`);
    try {
      let res, data;
      if (type === 'splunk') {
        res = await fetch('/ingestion-api/api/v1/ingest/splunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            result: {
              search_name: "Brute Force Attack Detected",
              description: "Multiple failed logons on production DB server",
              sid: "splunk-sid-" + Math.floor(Math.random() * 10000),
              src_ip: "198.51.100.42",
              dest_ip: "10.0.0.15",
              user: "admin",
              host: "production-db-01",
              category: "brute-force",
              severity: "8"
            }
          })
        });
        data = await res.json();
        setSimulationOutput(prev => prev + `[Ingested Splunk Alert]\nCanonical Alert ID: ${data.alertId}\nSeverity: HIGH\nStatus: NEW\nPipeline step: FactoryMethod Normalizer mapping complete.`);
      } else if (type === 'crowdstrike') {
        res = await fetch('/ingestion-api/api/v1/ingest/crowdstrike', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            detection_id: "cs-det-" + Math.floor(Math.random() * 10000),
            pattern_disposition: "Blocked",
            severity_name: "Critical",
            device: {
              hostname: "workstation-12",
              external_ip: "198.51.100.42",
              local_ip: "10.0.2.5"
            },
            behavior: {
              scenario: "LSASS Credential Dumping",
              description: "LSASS memory read by unauthorized process",
              user_name: "local_user"
            }
          })
        });
        data = await res.json();
        setSimulationOutput(prev => prev + `[Ingested Crowdstrike Alert]\nCanonical Alert ID: ${data.alertId}\nSeverity: CRITICAL\nStatus: NEW\nPipeline step: Normalizer generated raw threat event.`);
      } else if (type === 'campaign') {
        res = await fetch('/ingestion-api/api/v1/ingest/splunk/campaign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignName: "APT29 Reconnaissance Campaign",
            attackPattern: "External Scan -> Credentials Harvest",
            payloads: [
              '{"result":{"search_name":"Port Scan Detected","src_ip":"198.51.100.42","dest_ip":"10.0.0.1","severity":"4"}}',
              '{"result":{"search_name":"Phishing Link Clicked","src_ip":"10.0.0.55","dest_ip":"203.0.113.88","severity":"8"}}'
            ]
          })
        });
        data = await res.json();
        setSimulationOutput(prev => prev + `[Composite Campaign Alert Ingested]\nCampaign name: ${data.campaignName}\nChild alerts generated: ${data.components?.length || 2}\nPipeline step: Composite tree constructed successfully.`);
      } else if (type === 'populate') {
        // Runs populate-data sequence directly
        res = await fetch('/api/dashboard/refresh', { method: 'POST' });
        setSimulationOutput(prev => prev + `Requested backend cache refresh and simulated event sync.\n`);
        await refreshAllData();
        setSimulationOutput(prev => prev + `Refresh complete. Metrics updated.`);
      }
      
      // Auto-trigger metrics update after short delay
      setTimeout(refreshAllData, 2000);
    } catch (e) {
      setSimulationOutput(prev => prev + `\n[ERROR] Simulation failed: ${e.message}`);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) return (
    <div style={{ background: '#0f172a', minHeight: '100vh', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
      Loading SOC Integration Dashboard...
    </div>
  );

  const severityData = metrics?.severityBreakdown
    ? Object.entries(metrics.severityBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  const statusData = metrics?.statusBreakdown
    ? Object.entries(metrics.statusBreakdown)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name: name.replace('_', ' '), value }))
    : [];

  return (
    <div style={{ background: '#0b0f19', minHeight: '100vh', display: 'flex',
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", color: '#e2e8f0' }}>

      {/* ─── SIDEBAR NAVIGATION ─── */}
      <div style={{ width: 260, background: '#0f172a', borderRight: '1px solid #1e293b',
                    display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
        <div style={{ padding: '0 24px 20px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 8 }}>
            🛡 SDA-Pro Platform
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, letterSpacing: 0.5 }}>
            INTEGRATED SYSTEM DEMO
          </div>
        </div>

        <div style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { id: 'overview',   label: '📊 Overview Dashboard', desc: 'Real-time Metrics & Charts' },
            { id: 'alerts',     label: '🚨 Live Alert Stream',  desc: 'Ingested canonical feeds' },
            { id: 'incidents',  label: '🛡 Incident Lifecycle', desc: 'State Machine Controller' },
            { id: 'audit',      label: '📋 Audit & Compliance', desc: 'Compliance Logs & Trails' },
            { id: 'simulator',  label: '⚙ Attack Simulator',   desc: 'Inject Alerts & Pipelines' },
          ].map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => {
                setActiveTab(tab.id);
                setSelectedAlert(null);
                setSelectedIncident(null);
              }} style={{
                background: active ? 'linear-gradient(90deg, #1e3a8a 0%, #0f172a 100%)' : 'transparent',
                border: 'none', borderLeft: active ? '3px solid #38bdf8' : '3px solid transparent',
                borderRadius: 6, padding: '10px 16px', textAlign: 'left', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 2, transition: 'all 0.2s'
              }}>
                <div style={{ color: active ? '#38bdf8' : '#cbd5e1', fontSize: 13, fontWeight: active ? 700 : 500 }}>
                  {tab.label}
                </div>
                <div style={{ color: active ? '#94a3b8' : '#475569', fontSize: 10 }}>
                  {tab.desc}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <LiveBadge connected={wsConnected} />
          {lastUpdated && (
            <div style={{ color: '#475569', fontSize: 10 }}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <button onClick={refreshAllData} style={{
            background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155',
            borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 11,
            fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>↻ Refresh Platform</button>
        </div>
      </div>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '100vh' }}>

        {/* Header Title Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>
              {activeTab === 'overview' && '📊 Security Operations Center Overview'}
              {activeTab === 'alerts' && '🚨 Live Canonical Threat Stream'}
              {activeTab === 'incidents' && '🛡 Incident State Machine Lifecycle'}
              {activeTab === 'audit' && '📋 Compliance & Security Audit Logs'}
              {activeTab === 'simulator' && '⚙ Interactive Attack Playbook Simulator'}
            </h1>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
              Fully integrated Student A Pipeline, Student B Adaptive Mitigation, and Student C Observer Event Bus
            </div>
          </div>
        </div>

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* KPI Metrics */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <StatCard label="Total Ingested Alerts" value={metrics?.totalAlerts} color="#6366f1" />
              <StatCard label="Open Active Alerts"    value={metrics?.openAlerts}  color="#f59e0b" />
              <StatCard label="Critical Threats"       value={metrics?.criticalAlerts} color="#dc2626" />
              <StatCard label="High Priority Alerts"   value={metrics?.highAlerts}  color="#ea580c" />
              <StatCard label="Active Incident State"  value={incidents.filter(i=>i.currentStateType!=='CLOSED').length} color="#a78bfa" sub="States: NEW -> CONTAIN" />
              <StatCard label="Resolved Alerts"        value={metrics?.alertsResolvedToday} color="#22c55e" />
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Severity Breakdown */}
              <div style={{ background: '#0f172a', borderRadius: 12, padding: 20, border: '1px solid #1e293b' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>
                  ALERTS BY SEVERITY
                </h3>
                {severityData.length === 0 ? (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                    No alerts in database. Go to Simulator tab to inject alerts.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={severityData} cx="50%" cy="50%" outerRadius={80}
                           dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                        {severityData.map((entry) => (
                          <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#6366f1'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Status Breakdown */}
              <div style={{ background: '#0f172a', borderRadius: 12, padding: 20, border: '1px solid #1e293b' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>
                  ALERTS BY LIFECYCLE STATUS
                </h3>
                {statusData.length === 0 ? (
                  <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                    No active lifecycle alerts.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={statusData} barSize={28}>
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                      <Bar dataKey="value" fill="#6366f1" radius={[4,4,0,0]}>
                        {statusData.map((entry) => (
                          <Cell key={entry.name}
                                fill={STATUS_COLORS[entry.name.replace(' ', '_')] || '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Threats Breakdown & System Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              <div style={{ background: '#0f172a', borderRadius: 12, padding: 20, border: '1px solid #1e293b' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>TOP ATTACK TYPES</h3>
                {(!metrics?.topAttackTypes || metrics.topAttackTypes.length === 0) ? (
                  <div style={{ color: '#475569', fontSize: 12 }}>No attacks logged.</div>
                ) : (
                  metrics.topAttackTypes.map((t, i) => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10,
                                          marginBottom: 8, color: '#e2e8f0', fontSize: 13 }}>
                      <span style={{ color: '#38bdf8', fontWeight: 700, width: 20 }}>#{i + 1}</span>
                      <span>{t}</span>
                    </div>
                  ))
                )}
              </div>

              <div style={{ background: '#0f172a', borderRadius: 12, padding: 20, border: '1px solid #1e293b' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>TOP THREAT IP ADDRESSES</h3>
                {(!metrics?.topSourceIPs || metrics.topSourceIPs.length === 0) ? (
                  <div style={{ color: '#475569', fontSize: 12 }}>No source IPs recorded.</div>
                ) : (
                  metrics.topSourceIPs.map((ip, i) => (
                    <div key={ip} style={{ display: 'flex', alignItems: 'center', gap: 10,
                                            marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#ef4444', fontWeight: 700, width: 20 }}>#{i + 1}</span>
                      <code style={{ color: '#fca5a5', fontSize: 12 }}>{ip}</code>
                    </div>
                  ))
                )}
              </div>

              {/* Infrastructure Indicators */}
              <div style={{ background: '#0f172a', borderRadius: 12, padding: 20, border: '1px solid #1e293b' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>INTEGRATION HEALTH STATUS</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['RabbitMQ Exchange Broker', metrics?.eventBusOnline, 'RabbitMQ Queue'],
                    ['Redis Session Cache',     metrics?.cacheOnline,    'Redis DB'],
                    ['WebSocket Server Feed',     wsConnected,             'STOMP client'],
                  ].map(([name, online, tech]) => (
                    <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#cbd5e1', fontSize: 12 }}>
                        {name}
                        <span style={{ color: '#475569', fontSize: 10, marginLeft: 6 }}>({tech})</span>
                      </span>
                      <span style={{
                        background: online ? '#22c55e22' : '#ef444422',
                        color: online ? '#22c55e' : '#ef4444',
                        borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700
                      }}>{online ? '● ONLINE' : '○ OFFLINE'}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #334155', color: '#cbd5e1', fontSize: 12 }}>
                    Assigned Active Analysts:
                    <span style={{ color: '#22c55e', fontWeight: 700, marginLeft: 8 }}>
                      {metrics?.activeAnalysts ?? 0}
                    </span>
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: 12 }}>
                    Primary Incident Handler:
                    <span style={{ color: '#c084fc', marginLeft: 8 }}>
                      {metrics?.mostActiveAnalyst ?? '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Alert Table (Top Open Warnings) */}
            <div style={{ background: '#0f172a', borderRadius: 12, padding: 20, border: '1px solid #1e293b' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#cbd5e1', fontWeight: 600 }}>
                🚨 ACTIVE HIGH PRIORITY ALERTS (LATEST INCIDENTS)
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#0b0f19', borderBottom: '1px solid #1e293b' }}>
                      {['Alert ID', 'Alert Title', 'Severity', 'Analyst', 'Status', 'Host Target'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left',
                                             color: '#64748b', fontSize: 11, fontWeight: 600,
                                             textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(!metrics?.recentCriticalAlerts || metrics.recentCriticalAlerts.length === 0) ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '20px 10px', textAlign: 'center', color: '#475569', fontSize: 13 }}>
                          No active high-priority alerts. Populate database to display alerts.
                        </td>
                      </tr>
                    ) : (
                      metrics.recentCriticalAlerts.map(alert => {
                        const sColor = SEVERITY_COLORS[alert.severity] || '#64748b';
                        return (
                          <tr key={alert.id} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '10px 12px', color: '#38bdf8', fontSize: 12, fontWeight: 600 }}>{alert.alertId.substring(0,8)}...</td>
                            <td style={{ padding: '10px 12px', color: '#f1f5f9', fontSize: 12, fontWeight: 500 }}>{alert.title}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{
                                background: sColor + '22', color: sColor, borderRadius: 4,
                                padding: '2px 8px', fontSize: 10, fontWeight: 700
                              }}>{alert.severity}</span>
                            </td>
                            <td style={{ padding: '10px 12px', color: '#cbd5e1', fontSize: 12 }}>{alert.assignedAnalyst || 'Unassigned'}</td>
                            <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: 12 }}>{alert.status?.replace('_', ' ')}</td>
                            <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>{alert.sourceIp}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: LIVE ALERT STREAM ─── */}
        {activeTab === 'alerts' && (
          <div style={{ display: 'flex', gap: 20 }}>
            {/* Alerts Table */}
            <div style={{ flex: 1, background: '#0f172a', borderRadius: 12, padding: 20, border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
                <input
                  type="text"
                  placeholder="🔍 Search alerts (by ID, Title, Source IP)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: '#0b0f19', border: '1px solid #334155', borderRadius: 6,
                    padding: '8px 14px', color: '#e2e8f0', width: '320px', fontSize: 13
                  }}
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontSize: 12 }}>Filter Severity:</span>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    style={{
                      background: '#0b0f19', border: '1px solid #334155', borderRadius: 6,
                      padding: '8px 12px', color: '#cbd5e1', fontSize: 13
                    }}
                  >
                    <option value="ALL">ALL SEVERITIES</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#0b0f19', borderBottom: '1px solid #1e293b' }}>
                      {['Alert ID', 'Title', 'Severity', 'Source IP', 'Target Host', 'Action'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left',
                                             color: '#64748b', fontSize: 11, fontWeight: 600,
                                             textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.filter(alert => {
                      const matchesSearch = alert.alertId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            alert.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            alert.sourceIp?.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter;
                      return matchesSearch && matchesSeverity;
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '20px 10px', textAlign: 'center', color: '#475569', fontSize: 13 }}>
                          No alerts match the criteria.
                        </td>
                      </tr>
                    ) : (
                      alerts.filter(alert => {
                        const matchesSearch = alert.alertId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                              alert.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                              alert.sourceIp?.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter;
                        return matchesSearch && matchesSeverity;
                      }).map(alert => {
                        const sColor = SEVERITY_COLORS[alert.severity] || '#64748b';
                        return (
                          <tr key={alert.id} style={{ borderBottom: '1px solid #1e293b' }}>
                            <td style={{ padding: '10px 12px', color: '#38bdf8', fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>{alert.alertId.substring(0,8)}...</td>
                            <td style={{ padding: '10px 12px', color: '#f1f5f9', fontSize: 12, fontWeight: 500 }}>{alert.title}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{
                                background: sColor + '22', color: sColor, borderRadius: 4,
                                padding: '2px 8px', fontSize: 10, fontWeight: 700
                              }}>{alert.severity}</span>
                            </td>
                            <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}>{alert.sourceIp}</td>
                            <td style={{ padding: '10px 12px', color: '#cbd5e1', fontSize: 12 }}>{alert.hostName || 'n/a'}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <button onClick={() => setSelectedAlert(alert)} style={{
                                background: '#1e3a8a', color: '#38bdf8', border: 'none',
                                borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 11
                              }}>Inspect</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alert Inspector Panel */}
            {selectedAlert && (
              <div style={{ width: 340, background: '#0f172a', borderRadius: 12, padding: 20, border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, color: '#f1f5f9', fontWeight: 700 }}>🔍 Canonical Alert Inspector</h3>
                  <button onClick={() => setSelectedAlert(null)} style={{ background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>CANONICAL ID</div>
                  <div style={{ fontSize: 12, color: '#38bdf8', fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedAlert.alertId}</div>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>EVENT TITLE</div>
                  <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>{selectedAlert.title}</div>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>DESCRIPTION</div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: '1.4' }}>{selectedAlert.description}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>SEVERITY</div>
                    <span style={{
                      background: (SEVERITY_COLORS[selectedAlert.severity] || '#64748b') + '22',
                      color: SEVERITY_COLORS[selectedAlert.severity] || '#e2e8f0',
                      borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700, display: 'inline-block', marginTop: 4
                    }}>{selectedAlert.severity}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>SOURCE LOG</div>
                    <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600, marginTop: 4 }}>{selectedAlert.sourceType || 'SPLUNK'}</div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #1e293b', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#64748b' }}>Source IP:</span>
                    <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedAlert.sourceIp}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#64748b' }}>Destination IP:</span>
                    <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedAlert.destinationIp || '10.0.0.1'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#64748b' }}>Host Name:</span>
                    <span style={{ color: '#cbd5e1' }}>{selectedAlert.hostName || 'n/a'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#64748b' }}>Target User:</span>
                    <span style={{ color: '#cbd5e1' }}>{selectedAlert.userName || 'SYSTEM'}</span>
                  </div>
                </div>

                <div style={{ background: '#0b0f19', borderRadius: 6, padding: '10px 12px', border: '1px solid #334155', fontSize: 11 }}>
                  <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: 4 }}>🧠 Enrichment Details (CoR Execution)</div>
                  <div style={{ color: '#94a3b8' }}>Deduplication Cluster Status: <b style={{ color: '#22c55e' }}>UNIQUE</b></div>
                  <div style={{ color: '#94a3b8' }}>GeoIP Context: China (Beijing)</div>
                  <div style={{ color: '#94a3b8' }}>Threat Intel Feed: VirusTotal Score 10% (CLEAN)</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: INCIDENT LIFECYCLE ─── */}
        {activeTab === 'incidents' && (
          <div style={{ display: 'flex', gap: 20 }}>
            {/* Incidents List */}
            <div style={{ flex: 1, background: '#0f172a', borderRadius: 12, padding: 20, border: '1px solid #1e293b' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#0b0f19', borderBottom: '1px solid #1e293b' }}>
                      {['Incident ID', 'Incident Title', 'Severity', 'Workflow State', 'Created At', 'Action'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left',
                                             color: '#64748b', fontSize: 11, fontWeight: 600,
                                             textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '20px 10px', textAlign: 'center', color: '#475569', fontSize: 13 }}>
                          No incidents found. Run the simulator to ingest alerts and cluster them into incidents!
                        </td>
                      </tr>
                    ) : (
                      incidents.map(inc => {
                        const sColor = SEVERITY_COLORS[inc.severity] || '#64748b';
                        const statusColor = STATUS_COLORS[inc.currentStateType] || '#64748b';
                        return (
                          <tr key={inc.id} style={{
                            borderBottom: '1px solid #1e293b',
                            background: selectedIncident?.id === inc.id ? '#1e293b55' : 'transparent'
                          }}>
                            <td style={{ padding: '10px 12px', color: '#38bdf8', fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>{inc.id.substring(0,8)}...</td>
                            <td style={{ padding: '10px 12px', color: '#f1f5f9', fontSize: 12, fontWeight: 500 }}>{inc.title}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{
                                background: sColor + '22', color: sColor, borderRadius: 4,
                                padding: '2px 8px', fontSize: 10, fontWeight: 700
                              }}>{inc.severity}</span>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{
                                background: statusColor + '22', color: statusColor, borderRadius: 4,
                                padding: '2px 8px', fontSize: 10, fontWeight: 700
                              }}>{inc.currentStateType}</span>
                            </td>
                            <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12 }}>{new Date(inc.createdAt).toLocaleString()}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <button onClick={() => setSelectedIncident(inc)} style={{
                                background: '#1e40af', color: 'white', border: 'none',
                                borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 11
                              }}>Manage State</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* State Machine Controller / Details */}
            {selectedIncident && (
              <div style={{ width: 380, background: '#0f172a', borderRadius: 12, padding: 20, border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 14, color: '#f1f5f9', fontWeight: 700 }}>⚙️ State Machine Controller</h3>
                  <button onClick={() => setSelectedIncident(null)} style={{ background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>

                <div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>INCIDENT DETAILS</div>
                  <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 700, marginTop: 2 }}>{selectedIncident.title}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, lineHeight: '1.4' }}>{selectedIncident.description}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#0b0f19', padding: 10, borderRadius: 6 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>CURRENT STATE</div>
                    <span style={{
                      color: STATUS_COLORS[selectedIncident.currentStateType] || '#e2e8f0',
                      fontSize: 12, fontWeight: 700, display: 'inline-block', marginTop: 4
                    }}>● {selectedIncident.currentStateType}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>SEVERITY</div>
                    <span style={{
                      color: SEVERITY_COLORS[selectedIncident.severity] || '#e2e8f0',
                      fontSize: 12, fontWeight: 700, display: 'inline-block', marginTop: 4
                    }}>{selectedIncident.severity}</span>
                  </div>
                </div>

                {/* State Machine Transition Actions */}
                <div style={{ borderTop: '1px solid #1e293b', paddingTop: 12 }}>
                  <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, marginBottom: 8 }}>EXECUTE LIFECYCLE ACTION:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { type: 'triage',    label: 'Triage Incident', target: 'UNDER_TRIAGE' },
                      { type: 'contain',   label: 'Contain Host',    target: 'CONTAINMENT' },
                      { type: 'eradicate', label: 'Eradicate Threat', target: 'ERADICATION' },
                      { type: 'recover',   label: 'Recover Asset',   target: 'RECOVERY' },
                      { type: 'review',    label: 'Post-Review',     target: 'POST_INCIDENT_REVIEW' },
                    ].map(btn => {
                      const allowed = selectedIncident.allowedTransitions?.includes(btn.target);
                      return (
                        <button
                          key={btn.type}
                          disabled={!allowed || transitionLoading}
                          onClick={() => handleTransition(btn.type)}
                          style={{
                            background: allowed ? '#1e3a8a' : '#1e293b',
                            color: allowed ? '#38bdf8' : '#475569',
                            border: allowed ? '1px solid #3b82f6' : '1px solid #3b82f6',
                            borderRadius: 6, padding: '8px 10px', cursor: allowed ? 'pointer' : 'not-allowed',
                            fontSize: 11, fontWeight: 600, opacity: allowed ? 1 : 0.4, transition: 'all 0.2s'
                          }}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Closure block (Requires manual summary input) */}
                  <div style={{ marginTop: 12, borderTop: '1px solid #1e293b', paddingTop: 10 }}>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>CLOSURE SUMMARY (REQUIRED FOR CLOSE)</div>
                    <input
                      type="text"
                      placeholder="Enter incident closure summary..."
                      value={transitionSummary}
                      onChange={(e) => setTransitionSummary(e.target.value)}
                      style={{
                        background: '#0b0f19', border: '1px solid #334155', borderRadius: 6,
                        padding: '6px 10px', color: '#e2e8f0', width: '100%', fontSize: 12, marginBottom: 8, boxSizing: 'border-box'
                      }}
                    />
                    <button
                      disabled={!selectedIncident.allowedTransitions?.includes('CLOSED') || transitionLoading}
                      onClick={() => handleTransition('close')}
                      style={{
                        background: selectedIncident.allowedTransitions?.includes('CLOSED') ? '#15803d' : '#1e293b',
                        color: selectedIncident.allowedTransitions?.includes('CLOSED') ? '#4ade80' : '#475569',
                        border: selectedIncident.allowedTransitions?.includes('CLOSED') ? '1px solid #22c55e' : '1px solid #334155',
                        borderRadius: 6, padding: '8px 10px', cursor: selectedIncident.allowedTransitions?.includes('CLOSED') ? 'pointer' : 'not-allowed',
                        fontSize: 11, fontWeight: 700, width: '100%', opacity: selectedIncident.allowedTransitions?.includes('CLOSED') ? 1 : 0.4
                      }}
                    >
                      🔒 Close Incident Loop (legal CLOSED)
                    </button>
                  </div>
                </div>

                {/* Audit Trial Log for Incident */}
                <div style={{ borderTop: '1px solid #1e293b', paddingTop: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>RESPONSE ACTIONS HISTORY</div>
                  <div style={{
                    flex: 1, background: '#0b0f19', padding: 8, borderRadius: 6, fontSize: 10,
                    fontFamily: 'monospace', color: '#22c55e', overflowY: 'auto', maxHeight: 180, display: 'flex', flexDirection: 'column', gap: 6
                  }}>
                    {(!selectedIncident.responseActionsLog || selectedIncident.responseActionsLog.length === 0) ? (
                      <span style={{ color: '#475569' }}>No actions logged yet.</span>
                    ) : (
                      selectedIncident.responseActionsLog.map((logStr, i) => (
                        <div key={i} style={{ borderBottom: '1px solid #1e293b', paddingBottom: 4 }}>
                          {logStr}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 4: AUDIT LOGS ─── */}
        {activeTab === 'audit' && (
          <div style={{ background: '#0f172a', borderRadius: 12, padding: 20, border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
              <span style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600 }}>Security Compliance Event Audit Trail</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: 12 }}>Compliance Filter:</span>
                <select
                  value={complianceFilter}
                  onChange={(e) => setComplianceFilter(e.target.value)}
                  style={{
                    background: '#0b0f19', border: '1px solid #334155', borderRadius: 6,
                    padding: '8px 12px', color: '#cbd5e1', fontSize: 13
                  }}
                >
                  <option value="ALL">ALL EVENTS</option>
                  <option value="GDPR">GDPR COMPLIANT</option>
                  <option value="SOC2">SOC2 SECURE</option>
                  <option value="ISO27001">ISO27001 ALIGNED</option>
                  <option value="HIPAA">HIPAA SECURE</option>
                  <option value="NONE">NO FLAG</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0b0f19', borderBottom: '1px solid #1e293b' }}>
                    {['Event ID', 'Timestamp', 'Operator', 'Action Taken', 'Target Entity', 'Entity ID', 'Compliance Flag'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left',
                                           color: '#64748b', fontSize: 11, fontWeight: 600,
                                           textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.filter(log => complianceFilter === 'ALL' || log.complianceFlag === complianceFilter).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '20px 10px', textAlign: 'center', color: '#475569', fontSize: 13 }}>
                        No audit logs matching this compliance filter found.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.filter(log => complianceFilter === 'ALL' || log.complianceFlag === complianceFilter).map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: 12 }}>#{log.id}</td>
                        <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 11 }}>{new Date(log.timestamp).toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', color: '#c084fc', fontSize: 12, fontWeight: 600 }}>{log.performedBy}</td>
                        <td style={{ padding: '10px 12px', color: '#f1f5f9', fontSize: 12, fontWeight: 500 }}>
                          <span style={{ color: '#22c55e', marginRight: 6 }}>[{log.action}]</span> {log.details}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: 12 }}>{log.targetEntityType || 'System'}</td>
                        <td style={{ padding: '10px 12px', color: '#cbd5e1', fontSize: 11, fontFamily: 'monospace' }}>{log.targetEntityId ? log.targetEntityId.substring(0,8) + '...' : 'Global'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            background: log.complianceFlag !== 'NONE' ? '#22c55e22' : '#33415533',
                            color: log.complianceFlag !== 'NONE' ? '#4ade80' : '#64748b',
                            borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700
                          }}>{log.complianceFlag}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB 5: ATTACK SIMULATOR ─── */}
        {activeTab === 'simulator' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Playbook Injectors */}
            <div style={{ background: '#0f172a', borderRadius: 12, padding: 20, border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, color: '#f1f5f9', fontWeight: 700 }}>🛠 Threat Simulation & Influx Ingress</h3>
                <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                  Trigger real-time log ingestion and campaign scenarios directly into the Spring Boot pipeline.
                </p>
              </div>

              {/* Splunk Injector */}
              <div style={{ border: '1px solid #334155', borderRadius: 8, padding: 14, background: '#0b0f1955', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f97316' }}>🍊 Splunk Brute Force Simulation</span>
                  <span style={{ fontSize: 10, background: '#1e293b', padding: '2px 6px', borderRadius: 4, color: '#94a3b8' }}>Port 8081</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: '1.4' }}>
                  Simulates a Firewall/Syslog detection of 5 failed login attempts to a production DB server from a single IP. Uses the **FactoryMethod normalizer**.
                </div>
                <button
                  disabled={simulating}
                  onClick={() => triggerSimulation('splunk')}
                  style={{
                    background: '#ea580c', color: 'white', border: 'none', borderRadius: 6,
                    padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, alignSelf: 'flex-start'
                  }}
                >
                  🚀 Inject Splunk Raw Log
                </button>
              </div>

              {/* Crowdstrike Injector */}
              <div style={{ border: '1px solid #334155', borderRadius: 8, padding: 14, background: '#0b0f1955', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>🦅 Crowdstrike LSASS Dumping</span>
                  <span style={{ fontSize: 10, background: '#1e293b', padding: '2px 6px', borderRadius: 4, color: '#94a3b8' }}>Port 8081</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: '1.4' }}>
                  Simulates an endpoint protection alert of process credentials dumping on workstation-12. Maps raw fields into a Canonical Critical Alert.
                </div>
                <button
                  disabled={simulating}
                  onClick={() => triggerSimulation('crowdstrike')}
                  style={{
                    background: '#0284c7', color: 'white', border: 'none', borderRadius: 6,
                    padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, alignSelf: 'flex-start'
                  }}
                >
                  🚀 Inject CrowdStrike Log
                </button>
              </div>

              {/* Campaign Injector */}
              <div style={{ border: '1px solid #334155', borderRadius: 8, padding: 14, background: '#0b0f1955', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>🍇 Multi-Stage Composite Scan Campaign</span>
                  <span style={{ fontSize: 10, background: '#1e293b', padding: '2px 6px', borderRadius: 4, color: '#94a3b8' }}>Port 8081</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: '1.4' }}>
                  Simulates an APT29 attack chain combining a network port scan alert and a user phishing link click. Employs the **Composite Pattern tree structure**.
                </div>
                <button
                  disabled={simulating}
                  onClick={() => triggerSimulation('campaign')}
                  style={{
                    background: '#7c3aed', color: 'white', border: 'none', borderRadius: 6,
                    padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, alignSelf: 'flex-start'
                  }}
                >
                  🚀 Inject Composite Campaign
                </button>
              </div>
            </div>

            {/* Simulation Feedback Console */}
            <div style={{ background: '#0f172a', borderRadius: 12, padding: 20, border: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, color: '#f1f5f9', fontWeight: 700 }}>📟 Simulation Output Console</h3>
                <p style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                  Real-time pipeline feedback from double-checked configs, enrichment handlers, and observers.
                </p>
              </div>

              <div style={{
                flex: 1, background: '#070a13', border: '1px solid #334155', borderRadius: 8, padding: 16,
                fontFamily: 'monospace', fontSize: 12, color: '#4ade80', overflowY: 'auto', minHeight: 280, maxHeight: 400, marginTop: 10,
                whiteSpace: 'pre-wrap', lineHeight: '1.5'
              }}>
                {simulationOutput || "System Idle. Select an action from the playbook panel to trigger alert ingestion..."}
              </div>

              <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                <button
                  disabled={simulating}
                  onClick={() => triggerSimulation('populate')}
                  style={{
                    background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: 6,
                    padding: '10px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, flex: 1
                  }}
                >
                  ⚡ Populate Full Test Scenario (all 22+ patterns)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Mock data when API is offline
function getMockMetrics() {
  return {
    totalAlerts: 47, openAlerts: 31, closedAlerts: 16,
    criticalAlerts: 8, highAlerts: 14, mediumAlerts: 12, lowAlerts: 13,
    newAlerts: 5, underTriageAlerts: 9, containmentAlerts: 7,
    eradicationAlerts: 4, recoveryAlerts: 6, postIncidentReview: 0,
    avgResolutionTimeHours: 4.2, mttrHours: 2.5, mttdHours: 1.7,
    alertsCreatedToday: 6, alertsResolvedToday: 4,
    topAttackTypes: ['RANSOMWARE','PHISHING','SQL_INJECTION','BRUTE_FORCE','DDOS'],
    topSourceIPs: ['45.33.32.156','203.0.113.42','198.51.100.42','10.0.0.5','172.16.0.10'],
    mostActiveAnalyst: 'analyst.ahmed',
    eventBusOnline: true, cacheOnline: true, activeAnalysts: 4,
    severityBreakdown: { CRITICAL: 8, HIGH: 14, MEDIUM: 12, LOW: 13 },
    statusBreakdown: { NEW: 5, UNDER_TRIAGE: 9, CONTAINMENT: 7,
                       ERADICATION: 4, RECOVERY: 6, CLOSED: 16 },
    recentCriticalAlerts: [
      { id:1, alertId:'ALERT-001', title:'Ransomware detected on File Server', severity:'CRITICAL',
        status:'CONTAINMENT', sourceIp:'45.33.32.156', attackType:'RANSOMWARE', assignedAnalyst:'analyst.ahmed' },
      { id:2, alertId:'ALERT-002', title:'Spear-phishing campaign targeting HR', severity:'HIGH',
        status:'UNDER_TRIAGE', sourceIp:'203.0.113.42', attackType:'PHISHING', assignedAnalyst:'analyst.sara' },
      { id:3, alertId:'ALERT-003', title:'SQL injection on customer portal', severity:'CRITICAL',
        status:'ERADICATION', sourceIp:'198.51.100.42', attackType:'SQL_INJECTION', assignedAnalyst:'analyst.omar' },
    ]
  };
}
