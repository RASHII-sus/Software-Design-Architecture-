// shared/contracts/interfaces.ts
// Canonical interfaces shared across all SDA-Pro services

import {
  Severity,
  AlertSourceType,
  IndicatorType,
  Verdict,
  ThreatIntelSource,
  ResponseActionType,
  ResponseActionStatus,
  IncidentState,
  NotificationChannel,
} from './enums';

// ─── Alert Contracts ──────────────────────────────────────────────────────────
export interface CanonicalAlert {
  id: string;
  severity: Severity;
  timestamp: string; // ISO-8601
  sourceType: AlertSourceType;
  sourceId: string;
  rawPayload: Record<string, unknown>;
  normalizedData: NormalizedAlertData;
  enrichmentContext?: EnrichmentContext;
  tags?: string[];
}

export interface NormalizedAlertData {
  title: string;
  description: string;
  sourceIp?: string;
  destinationIp?: string;
  sourcePort?: number;
  destinationPort?: number;
  protocol?: string;
  userId?: string;
  hostname?: string;
  filePath?: string;
  fileHash?: string;
  url?: string;
  domain?: string;
  eventType: string;
}

export interface EnrichmentContext {
  geoIp?: GeoIpContext;
  threatIntel?: ThreatIntelContext;
  assetContext?: AssetContext;
  userContext?: UserContext;
  deduplicationKey?: string;
  correlationId?: string;
  classifiedSeverity?: Severity;
}

export interface GeoIpContext {
  ip: string;
  country?: string;
  countryCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  isKnownMaliciousRange?: boolean;
}

export interface ThreatIntelContext {
  indicator: string;
  indicatorType: IndicatorType;
  verdict: Verdict;
  reputationScore: number;
  confidenceScore: number;
  sources: string[];
  tags?: string[];
}

export interface AssetContext {
  assetId?: string;
  hostname?: string;
  criticality?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  owner?: string;
  environment?: string;
  tags?: string[];
}

export interface UserContext {
  userId?: string;
  username?: string;
  privilegeLevel?: 'ADMIN' | 'PRIVILEGED' | 'STANDARD' | 'GUEST';
  department?: string;
  isServiceAccount?: boolean;
}

// ─── Threat Intel Contracts ───────────────────────────────────────────────────
export interface ReputationResult {
  indicator: string;
  indicatorType: IndicatorType;
  verdict: Verdict;
  reputationScore: number;
  confidenceScore: number;
  source: ThreatIntelSource;
  tags: string[];
  rawData?: Record<string, unknown>;
  cachedAt?: string;
  expiresAt?: string;
}

export interface ThreatIndicator {
  id: string;
  indicator: string;
  indicatorType: IndicatorType;
  verdict: Verdict;
  reputationScore: number;
  confidenceScore: number;
  source: ThreatIntelSource;
  tags: string[];
  firstSeen: string;
  lastSeen: string;
}

// ─── Response Action Contracts ────────────────────────────────────────────────
export interface TargetAsset {
  assetId?: string;
  hostname?: string;
  ipAddress?: string;
  userId?: string;
  filePath?: string;
  fileHash?: string;
  domain?: string;
  metadata?: Record<string, unknown>;
}

export interface ActionOutcome {
  actionId: string;
  actionType: ResponseActionType;
  status: ResponseActionStatus;
  success: boolean;
  message: string;
  executedAt: string;
  completedAt?: string;
  rollbackContext?: RollbackContext;
  metadata?: Record<string, unknown>;
}

export interface RollbackContext {
  snapshotId?: string;
  previousState?: Record<string, unknown>;
  rollbackInstructions?: string;
  canAutoRollback: boolean;
}

export interface ResponseContext {
  incidentId: string;
  incidentState: IncidentState;
  severity: Severity;
  assetCriticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  businessContext?: string;
  analystId?: string;
  autoResponse: boolean;
}

// ─── Notification Contracts ───────────────────────────────────────────────────
export interface NotificationPayload {
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DeliveryResult {
  notificationId: string;
  channel: NotificationChannel;
  success: boolean;
  messageId?: string;
  error?: string;
  sentAt?: string;
}
