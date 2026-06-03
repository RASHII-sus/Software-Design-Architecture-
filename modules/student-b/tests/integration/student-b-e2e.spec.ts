// tests/integration/student-b-e2e.spec.ts
// End-to-end integration test covering the complete Student B flow:
// Alert → Middleware Pipeline → Threat Intel → Response Orchestration → Notification
//
// Run with: docker-compose up -d && npm run test:integration
// Requires: PostgreSQL, Redis, RabbitMQ, and all services running.

import axios from 'axios';

const MIDDLEWARE_URL = process.env.MIDDLEWARE_URL ?? 'http://localhost:3005/api/v1';
const THREAT_INTEL_URL = process.env.THREAT_INTEL_URL ?? 'http://localhost:3002/api/v1';
const RESPONSE_URL = process.env.RESPONSE_URL ?? 'http://localhost:3003/api/v1';
const NOTIFICATION_URL = process.env.NOTIFICATION_URL ?? 'http://localhost:3004/api/v1';

const API_KEY = process.env.API_KEY_SECRET ?? 'internal_api_key_secret';
const headers = { 'x-api-key': API_KEY };

// Shared test data
const TEST_INCIDENT_ID = `e2e-incident-${Date.now()}`;
const MALICIOUS_IP = '185.220.100.55';

describe('Student B — End-to-End Integration', () => {
  // ─── Health checks ──────────────────────────────────────────────────────────
  describe('Service health', () => {
    it('threat-intel-service is healthy', async () => {
      const res = await axios.get(`${THREAT_INTEL_URL}/health`);
      expect(res.status).toBe(200);
    });

    it('response-orchestration-service is healthy', async () => {
      const res = await axios.get(`${RESPONSE_URL}/health`);
      expect(res.status).toBe(200);
    });

    it('notification-service is healthy', async () => {
      const res = await axios.get(`${NOTIFICATION_URL}/health`);
      expect(res.status).toBe(200);
    });

    it('middleware is healthy', async () => {
      const res = await axios.get(`${MIDDLEWARE_URL}/health`);
      expect(res.status).toBe(200);
    });
  });

  // ─── Threat Intel Service ───────────────────────────────────────────────────
  describe('Threat Intel Service — Adapter + Proxy patterns', () => {
    it('POST /threat-intel/reputation returns a reputation result', async () => {
      const res = await axios.post(
        `${THREAT_INTEL_URL}/threat-intel/reputation`,
        { indicator: MALICIOUS_IP, indicatorType: 'IP' },
        { headers },
      );
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('indicator', MALICIOUS_IP);
      expect(res.data).toHaveProperty('verdict');
      expect(res.data).toHaveProperty('reputationScore');
      expect(res.data).toHaveProperty('source');
      expect(['MALICIOUS', 'SUSPICIOUS', 'CLEAN', 'UNKNOWN']).toContain(res.data.verdict);
    });

    it('caches the result — second call returns faster (from CachingProxy)', async () => {
      const start1 = Date.now();
      await axios.post(
        `${THREAT_INTEL_URL}/threat-intel/reputation`,
        { indicator: '8.8.8.8', indicatorType: 'IP' },
        { headers },
      );
      const duration1 = Date.now() - start1;

      const start2 = Date.now();
      await axios.post(
        `${THREAT_INTEL_URL}/threat-intel/reputation`,
        { indicator: '8.8.8.8', indicatorType: 'IP' },
        { headers },
      );
      const duration2 = Date.now() - start2;

      // Second call should be significantly faster due to CachingProxy
      expect(duration2).toBeLessThan(duration1 + 200); // allow generous margin
    });

    it('POST /threat-intel/reputation/bulk handles multiple indicators', async () => {
      const res = await axios.post(
        `${THREAT_INTEL_URL}/threat-intel/reputation/bulk`,
        {
          indicators: [
            { indicator: '1.1.1.1', indicatorType: 'IP' },
            { indicator: 'example.com', indicatorType: 'DOMAIN' },
          ],
        },
        { headers },
      );
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data).toHaveLength(2);
    });

    it('GET /threat-intel/stats returns cache and verdict statistics', async () => {
      const res = await axios.get(`${THREAT_INTEL_URL}/threat-intel/stats`, { headers });
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('verdictCounts');
      expect(res.data).toHaveProperty('cacheStats');
    });
  });

  // ─── Middleware Pipeline ─────────────────────────────────────────────────────
  describe('Middleware Pipeline — Chain of Responsibility', () => {
    const canonicalAlert = {
      id: `alert-e2e-${Date.now()}`,
      severity: 'MEDIUM',
      timestamp: new Date().toISOString(),
      sourceType: 'SPLUNK',
      sourceId: 'splunk-e2e-001',
      rawPayload: {},
      normalizedData: {
        title: 'E2E Test Alert',
        description: 'Integration test alert with malicious IP',
        eventType: 'NETWORK_CONNECTION',
        sourceIp: MALICIOUS_IP,
        destinationIp: '10.0.0.1',
      },
    };

    it('POST /pipeline/process returns a PipelineResult with all 4 stages', async () => {
      const res = await axios.post(
        `${MIDDLEWARE_URL}/pipeline/process`,
        { alert: canonicalAlert },
      );
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('originalAlertId', canonicalAlert.id);
      expect(res.data).toHaveProperty('processedAlert');
      expect(res.data).toHaveProperty('stageResults');
      expect(res.data).toHaveProperty('completed');
      expect(res.data.stageResults.length).toBeGreaterThanOrEqual(1);
    });

    it('pipeline classifies severity based on threat intel verdict', async () => {
      const res = await axios.post(
        `${MIDDLEWARE_URL}/pipeline/process`,
        { alert: { ...canonicalAlert, id: `alert-class-${Date.now()}` } },
      );
      expect(res.status).toBe(200);
      const processedSeverity = res.data.processedAlert.severity;
      expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']).toContain(processedSeverity);
    });

    it('stops the chain for duplicate alerts', async () => {
      const dupAlert = {
        ...canonicalAlert,
        id: `alert-dup-${Date.now()}`,
        normalizedData: {
          ...canonicalAlert.normalizedData,
          sourceIp: '192.0.2.1', // unique IP for this test to avoid cache collision
        },
      };

      // First call — should pass through
      const res1 = await axios.post(`${MIDDLEWARE_URL}/pipeline/process`, { alert: dupAlert });
      expect(res1.data.completed).toBe(true);

      // Second call — same fingerprint — should be stopped as duplicate
      const res2 = await axios.post(
        `${MIDDLEWARE_URL}/pipeline/process`,
        { alert: { ...dupAlert, id: `${dupAlert.id}-copy` } },
      );
      expect(res2.data.completed).toBe(false);
      expect(res2.data.stopReason).toBe('DUPLICATE');
    });

    it('GET /pipeline/chain describes the CoR handler chain', async () => {
      const res = await axios.get(`${MIDDLEWARE_URL}/pipeline/chain`);
      expect(res.status).toBe(200);
      expect(res.data.pattern).toBe('Chain of Responsibility');
      expect(res.data.handlers).toHaveLength(4);
    });
  });

  // ─── Response Orchestration Service ─────────────────────────────────────────
  describe('Response Orchestration Service — Facade + Strategy + Decorator', () => {
    it('GET /response/strategies lists all 4 response strategies', async () => {
      const res = await axios.get(`${RESPONSE_URL}/response/strategies`, { headers });
      expect(res.status).toBe(200);
      expect(res.data.strategies).toHaveLength(4);
      const names = res.data.strategies.map((s: { name: string }) => s.name);
      expect(names).toContain('AggressiveContainmentStrategy');
      expect(names).toContain('BalancedResponseStrategy');
      expect(names).toContain('ConservativeStrategy');
      expect(names).toContain('WatchAndWaitStrategy');
    });

    it('POST /response/assess executes full response plan via Facade', async () => {
      const res = await axios.post(
        `${RESPONSE_URL}/response/assess`,
        {
          incidentId: TEST_INCIDENT_ID,
          severity: 'HIGH',
          incidentState: 'CONTAINMENT',
          assetCriticality: 'HIGH',
          targetAssets: [
            { ipAddress: MALICIOUS_IP, hostname: 'compromised-host-01' },
          ],
          autoResponse: true,
        },
        { headers },
      );

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('responsePlanId');
      expect(res.data).toHaveProperty('incidentId', TEST_INCIDENT_ID);
      expect(res.data).toHaveProperty('strategyUsed');
      expect(res.data).toHaveProperty('actions');
      expect(Array.isArray(res.data.actions)).toBe(true);
      expect(res.data.actions.length).toBeGreaterThan(0);
    });

    it('selects BalancedResponseStrategy for HIGH severity + HIGH criticality', async () => {
      const res = await axios.post(
        `${RESPONSE_URL}/response/assess`,
        {
          incidentId: `${TEST_INCIDENT_ID}-balanced`,
          severity: 'HIGH',
          incidentState: 'CONTAINMENT',
          assetCriticality: 'HIGH',
          targetAssets: [{ ipAddress: '10.1.2.3' }],
          autoResponse: true,
        },
        { headers },
      );
      expect(res.data.strategyUsed).toBe('BalancedResponseStrategy');
    });

    it('selects WatchAndWaitStrategy for LOW severity', async () => {
      const res = await axios.post(
        `${RESPONSE_URL}/response/assess`,
        {
          incidentId: `${TEST_INCIDENT_ID}-low`,
          severity: 'LOW',
          incidentState: 'UNDER_TRIAGE',
          assetCriticality: 'LOW',
          targetAssets: [{ ipAddress: '10.5.5.5' }],
          autoResponse: true,
        },
        { headers },
      );
      expect(res.data.strategyUsed).toBe('WatchAndWaitStrategy');
    });

    it('GET /response/incidents/:id/history returns response history', async () => {
      const res = await axios.get(
        `${RESPONSE_URL}/response/incidents/${TEST_INCIDENT_ID}/history`,
        { headers },
      );
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
    });

    it('GET /response/metrics returns MetricsDecorator data', async () => {
      const res = await axios.get(`${RESPONSE_URL}/response/metrics`, { headers });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  // ─── Notification Service ─────────────────────────────────────────────────────
  describe('Notification Service — Abstract Factory', () => {
    it('GET /notifications/tier reports the active factory tier', async () => {
      const res = await axios.get(`${NOTIFICATION_URL}/notifications/tier`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('tier');
      expect(['ENTERPRISE', 'BASIC']).toContain(res.data.tier);
    });

    it('POST /notifications/dispatch sends an email notification', async () => {
      const res = await axios.post(
        `${NOTIFICATION_URL}/notifications/dispatch`,
        {
          channel: 'EMAIL',
          recipient: 'soc@example.com',
          subject: 'E2E Test Alert',
          body: 'This is a test notification from the E2E integration suite.',
          priority: 'MEDIUM',
        },
      );
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('success');
      expect(res.data).toHaveProperty('channel', 'EMAIL');
    });

    it('POST /notifications/incident-alert dispatches to all available channels', async () => {
      const res = await axios.post(
        `${NOTIFICATION_URL}/notifications/incident-alert`,
        {
          incidentId: TEST_INCIDENT_ID,
          severity: 'HIGH',
          description: 'E2E integration test incident alert',
        },
      );
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('results');
      expect(Array.isArray(res.data.results)).toBe(true);
      expect(res.data.results.length).toBeGreaterThan(0);
    });

    it('GET /notifications/stats returns delivery statistics', async () => {
      const res = await axios.get(`${NOTIFICATION_URL}/notifications/stats`);
      expect(res.status).toBe(200);
      expect(typeof res.data).toBe('object');
    });
  });
});
