package com.sdapro.shared.commons;

/**
 * Types of automated response actions that can be executed.
 * Used by Factory Method and Strategy patterns.
 */
public enum ResponseActionType {
    ISOLATE_ENDPOINT,
    BLOCK_IP,
    BLOCK_DOMAIN,
    DISABLE_USER_ACCOUNT,
    QUARANTINE_FILE,
    ESCALATE_TO_TIER3
}
