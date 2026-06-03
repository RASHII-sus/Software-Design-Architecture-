-- SDA-Pro Database Initialization
-- Run once on first container start

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Threat Intel Service Schema ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS threat_indicators (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicator       VARCHAR(512) NOT NULL,
    indicator_type  VARCHAR(64)  NOT NULL,  -- IP, DOMAIN, FILE_HASH, URL
    verdict         VARCHAR(32)  NOT NULL,  -- MALICIOUS, SUSPICIOUS, CLEAN, UNKNOWN
    confidence      INTEGER      NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
    reputation_score INTEGER     NOT NULL DEFAULT 0 CHECK (reputation_score BETWEEN 0 AND 100),
    source          VARCHAR(128) NOT NULL,  -- VIRUSTOTAL, MISP, CUSTOM_FEED
    raw_response    JSONB,
    tags            TEXT[],
    first_seen      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_seen       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threat_indicators_indicator ON threat_indicators (indicator);
CREATE INDEX IF NOT EXISTS idx_threat_indicators_type      ON threat_indicators (indicator_type);
CREATE INDEX IF NOT EXISTS idx_threat_indicators_verdict   ON threat_indicators (verdict);
CREATE INDEX IF NOT EXISTS idx_threat_indicators_source    ON threat_indicators (source);
CREATE INDEX IF NOT EXISTS idx_threat_indicators_created   ON threat_indicators (created_at DESC);

-- ─── Response Orchestration Service Schema ────────────────────────────────────
CREATE TABLE IF NOT EXISTS response_plans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id     UUID         NOT NULL,
    strategy_name   VARCHAR(128) NOT NULL,
    status          VARCHAR(32)  NOT NULL DEFAULT 'PENDING',  -- PENDING, IN_PROGRESS, COMPLETED, FAILED, ROLLED_BACK
    context         JSONB        NOT NULL DEFAULT '{}',
    created_by      UUID,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_response_plans_incident ON response_plans (incident_id);
CREATE INDEX IF NOT EXISTS idx_response_plans_status   ON response_plans (status);
CREATE INDEX IF NOT EXISTS idx_response_plans_created  ON response_plans (created_at DESC);

CREATE TABLE IF NOT EXISTS response_actions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_plan_id    UUID         NOT NULL REFERENCES response_plans(id) ON DELETE CASCADE,
    action_type         VARCHAR(64)  NOT NULL,  -- BLOCK_IP, ISOLATE_ENDPOINT, DISABLE_USER, QUARANTINE_FILE, ESCALATE
    target_asset        JSONB        NOT NULL,
    status              VARCHAR(32)  NOT NULL DEFAULT 'PENDING',  -- PENDING, APPROVED, EXECUTING, SUCCESS, FAILED, ROLLED_BACK
    outcome             JSONB,
    rollback_context    JSONB,
    requires_approval   BOOLEAN      NOT NULL DEFAULT false,
    approved_by         UUID,
    approved_at         TIMESTAMPTZ,
    executed_at         TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_response_actions_plan   ON response_actions (response_plan_id);
CREATE INDEX IF NOT EXISTS idx_response_actions_type   ON response_actions (action_type);
CREATE INDEX IF NOT EXISTS idx_response_actions_status ON response_actions (status);

CREATE TABLE IF NOT EXISTS approval_requests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_action_id  UUID         NOT NULL REFERENCES response_actions(id) ON DELETE CASCADE,
    requested_by        UUID,
    status              VARCHAR(32)  NOT NULL DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED
    reason              TEXT,
    decided_by          UUID,
    decided_at          TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_action ON approval_requests (response_action_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests (status);

-- ─── Notification Service Schema ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel         VARCHAR(32)  NOT NULL,  -- EMAIL, SLACK, PAGERDUTY
    recipient       VARCHAR(512) NOT NULL,
    subject         VARCHAR(512),
    body            TEXT         NOT NULL,
    metadata        JSONB        NOT NULL DEFAULT '{}',
    status          VARCHAR(32)  NOT NULL DEFAULT 'PENDING',  -- PENDING, SENT, FAILED, RETRYING
    attempts        INTEGER      NOT NULL DEFAULT 0,
    last_error      TEXT,
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_records_channel ON notification_records (channel);
CREATE INDEX IF NOT EXISTS idx_notification_records_status  ON notification_records (status);
CREATE INDEX IF NOT EXISTS idx_notification_records_created ON notification_records (created_at DESC);

-- ─── Auto-update updated_at trigger ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_threat_indicators_updated_at
    BEFORE UPDATE ON threat_indicators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_response_plans_updated_at
    BEFORE UPDATE ON response_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_response_actions_updated_at
    BEFORE UPDATE ON response_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_records_updated_at
    BEFORE UPDATE ON notification_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
