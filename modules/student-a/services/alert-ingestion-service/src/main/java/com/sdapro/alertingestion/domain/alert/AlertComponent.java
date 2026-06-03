package com.sdapro.alertingestion.domain.alert;

import com.sdapro.shared.commons.Severity;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * // PATTERN: Composite
 * // RATIONALE: Security alerts can be individual (leaf) or grouped into Campaigns
 * //            and IncidentClusters (composites). Both must be analyzed, enriched,
 * //            and responded to uniformly through the same interface.
 *
 * Component interface for the Composite pattern.
 * Defines a uniform interface for both individual alerts (leaves) and
 * alert groupings like Campaigns and Clusters (composites).
 */
public interface AlertComponent {

    /** Unique identifier for this alert component. */
    UUID getId();

    /** Severity level of this component. For composites, returns the maximum severity of children. */
    Severity getSeverity();

    /** Timestamp when this component was created or first observed. */
    Instant getTimestamp();

    /** Human-readable title/summary. */
    String getTitle();

    /**
     * Add a child component. Only valid for composite nodes.
     * @throws UnsupportedOperationException if this is a leaf node
     */
    default void add(AlertComponent component) {
        throw new UnsupportedOperationException("Cannot add children to a leaf alert.");
    }

    /**
     * Remove a child component. Only valid for composite nodes.
     * @throws UnsupportedOperationException if this is a leaf node
     */
    default void remove(AlertComponent component) {
        throw new UnsupportedOperationException("Cannot remove children from a leaf alert.");
    }

    /** Get all children. Returns empty list for leaf nodes. */
    default List<AlertComponent> getChildren() {
        return Collections.emptyList();
    }

    /** Returns true if this is a leaf node (individual alert). */
    default boolean isLeaf() {
        return true;
    }
}
