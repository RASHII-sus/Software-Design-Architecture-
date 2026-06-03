package com.sdapro.incident;

import com.sdapro.incident.domain.incident.Incident;
import com.sdapro.incident.domain.state.*;
import com.sdapro.shared.commons.IncidentStateType;
import com.sdapro.shared.commons.ResponseActionType;
import com.sdapro.shared.commons.Severity;
import org.junit.jupiter.api.*;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive tests for the State pattern — incident lifecycle.
 */
class StatePatternTests {

    private Incident incident;

    @BeforeEach
    void setup() {
        incident = new Incident("Test Incident", "A test security incident",
                                 Severity.HIGH, List.of(UUID.randomUUID()));
    }

    // ========================================================================
    // LEGAL TRANSITIONS
    // ========================================================================

    @Nested
    @DisplayName("Legal State Transitions")
    class LegalTransitions {

        @Test
        @DisplayName("NEW → beginTriage → UNDER_TRIAGE")
        void testNewToTriage() {
            assertEquals(IncidentStateType.NEW, incident.getCurrentStateType());
            incident.beginTriage(UUID.randomUUID());
            assertEquals(IncidentStateType.UNDER_TRIAGE, incident.getCurrentStateType());
        }

        @Test
        @DisplayName("UNDER_TRIAGE → initiateContainment → CONTAINMENT")
        void testTriageToContainment() {
            incident.beginTriage(UUID.randomUUID());
            incident.initiateContainment(List.of("BLOCK_IP", "ISOLATE_ENDPOINT"));
            assertEquals(IncidentStateType.CONTAINMENT, incident.getCurrentStateType());
        }

        @Test
        @DisplayName("CONTAINMENT → beginEradication → ERADICATION")
        void testContainmentToEradication() {
            incident.beginTriage(UUID.randomUUID());
            incident.initiateContainment(List.of("BLOCK_IP"));
            incident.beginEradication();
            assertEquals(IncidentStateType.ERADICATION, incident.getCurrentStateType());
        }

        @Test
        @DisplayName("ERADICATION → beginRecovery → RECOVERY")
        void testEradicationToRecovery() {
            incident.beginTriage(UUID.randomUUID());
            incident.initiateContainment(List.of("BLOCK_IP"));
            incident.beginEradication();
            incident.beginRecovery();
            assertEquals(IncidentStateType.RECOVERY, incident.getCurrentStateType());
        }

        @Test
        @DisplayName("RECOVERY → startPostIncidentReview → POST_INCIDENT_REVIEW")
        void testRecoveryToPostReview() {
            incident.beginTriage(UUID.randomUUID());
            incident.initiateContainment(List.of("BLOCK_IP"));
            incident.beginEradication();
            incident.beginRecovery();
            incident.startPostIncidentReview();
            assertEquals(IncidentStateType.POST_INCIDENT_REVIEW, incident.getCurrentStateType());
        }

        @Test
        @DisplayName("POST_INCIDENT_REVIEW → close → CLOSED")
        void testPostReviewToClosed() {
            incident.beginTriage(UUID.randomUUID());
            incident.initiateContainment(List.of("BLOCK_IP"));
            incident.beginEradication();
            incident.beginRecovery();
            incident.startPostIncidentReview();
            incident.close("Incident resolved. Lessons documented.");
            assertEquals(IncidentStateType.CLOSED, incident.getCurrentStateType());
        }

        @Test
        @DisplayName("Full lifecycle: NEW → UNDER_TRIAGE → CONTAINMENT → ERADICATION → RECOVERY → POST_INCIDENT_REVIEW → CLOSED")
        void testFullLifecycle() {
            assertEquals(IncidentStateType.NEW, incident.getCurrentStateType());

            incident.beginTriage(UUID.randomUUID());
            assertEquals(IncidentStateType.UNDER_TRIAGE, incident.getCurrentStateType());

            incident.initiateContainment(List.of("BLOCK_IP", "ISOLATE_ENDPOINT"));
            assertEquals(IncidentStateType.CONTAINMENT, incident.getCurrentStateType());

            incident.beginEradication();
            assertEquals(IncidentStateType.ERADICATION, incident.getCurrentStateType());

            incident.beginRecovery();
            assertEquals(IncidentStateType.RECOVERY, incident.getCurrentStateType());

            incident.startPostIncidentReview();
            assertEquals(IncidentStateType.POST_INCIDENT_REVIEW, incident.getCurrentStateType());

            incident.close("Full lifecycle test completed successfully.");
            assertEquals(IncidentStateType.CLOSED, incident.getCurrentStateType());
            assertNotNull(incident.getClosedAt());
        }
    }

    // ========================================================================
    // ILLEGAL TRANSITIONS
    // ========================================================================

    @Nested
    @DisplayName("Illegal State Transitions — should throw IllegalStateException")
    class IllegalTransitions {

        @Test
        @DisplayName("NEW → initiateContainment → THROWS")
        void testNewCannotContain() {
            assertThrows(IllegalStateException.class, () ->
                incident.initiateContainment(List.of("BLOCK_IP")));
        }

        @Test
        @DisplayName("NEW → beginEradication → THROWS")
        void testNewCannotEradicate() {
            assertThrows(IllegalStateException.class, () ->
                incident.beginEradication());
        }

        @Test
        @DisplayName("NEW → close → THROWS")
        void testNewCannotClose() {
            assertThrows(IllegalStateException.class, () ->
                incident.close("invalid"));
        }

        @Test
        @DisplayName("UNDER_TRIAGE → beginEradication → THROWS (must go through CONTAINMENT)")
        void testTriageCannotEradicate() {
            incident.beginTriage(UUID.randomUUID());
            assertThrows(IllegalStateException.class, () ->
                incident.beginEradication());
        }

        @Test
        @DisplayName("CONTAINMENT → close → THROWS (must go through review)")
        void testContainmentCannotClose() {
            incident.beginTriage(UUID.randomUUID());
            incident.initiateContainment(List.of("BLOCK_IP"));
            assertThrows(IllegalStateException.class, () ->
                incident.close("invalid"));
        }

        @Test
        @DisplayName("CLOSED → any transition → THROWS")
        void testClosedCannotTransition() {
            // Transition through full lifecycle
            incident.beginTriage(UUID.randomUUID());
            incident.initiateContainment(List.of("BLOCK_IP"));
            incident.beginEradication();
            incident.beginRecovery();
            incident.startPostIncidentReview();
            incident.close("Done");

            assertEquals(IncidentStateType.CLOSED, incident.getCurrentStateType());

            assertThrows(IllegalStateException.class, () -> incident.beginTriage(UUID.randomUUID()));
            assertThrows(IllegalStateException.class, () -> incident.initiateContainment(List.of()));
            assertThrows(IllegalStateException.class, () -> incident.beginEradication());
            assertThrows(IllegalStateException.class, () -> incident.beginRecovery());
            assertThrows(IllegalStateException.class, () -> incident.startPostIncidentReview());
            assertThrows(IllegalStateException.class, () -> incident.close("again"));
            assertThrows(IllegalStateException.class, () -> incident.escalate("nope"));
        }
    }

    // ========================================================================
    // ESCALATION
    // ========================================================================

    @Nested
    @DisplayName("Escalation behavior")
    class EscalationTests {

        @Test
        @DisplayName("Escalate from NEW state transitions to UNDER_TRIAGE")
        void testEscalateFromNew() {
            incident.escalate("Critical threat detected");
            assertEquals(IncidentStateType.UNDER_TRIAGE, incident.getCurrentStateType());
            assertTrue(incident.isEscalated());
            assertEquals("Critical threat detected", incident.getEscalationReason());
        }

        @Test
        @DisplayName("Escalate from UNDER_TRIAGE stays in UNDER_TRIAGE")
        void testEscalateFromTriage() {
            incident.beginTriage(UUID.randomUUID());
            incident.escalate("Need Tier-3 analyst");
            assertEquals(IncidentStateType.UNDER_TRIAGE, incident.getCurrentStateType());
            assertTrue(incident.isEscalated());
        }
    }

    // ========================================================================
    // ALLOWED ACTIONS & TRANSITIONS
    // ========================================================================

    @Nested
    @DisplayName("State-specific allowed actions and transitions")
    class AllowedActionsTests {

        @Test
        @DisplayName("NEW state has no allowed response actions")
        void testNewNoActions() {
            assertTrue(incident.getAllowedActions().isEmpty());
        }

        @Test
        @DisplayName("UNDER_TRIAGE allows ISOLATE_ENDPOINT and BLOCK_IP")
        void testTriageActions() {
            incident.beginTriage(UUID.randomUUID());
            List<ResponseActionType> actions = incident.getAllowedActions();
            assertTrue(actions.contains(ResponseActionType.ISOLATE_ENDPOINT));
            assertTrue(actions.contains(ResponseActionType.BLOCK_IP));
        }

        @Test
        @DisplayName("CONTAINMENT allows 5 response actions")
        void testContainmentActions() {
            incident.beginTriage(UUID.randomUUID());
            incident.initiateContainment(List.of("BLOCK_IP"));
            assertEquals(5, incident.getAllowedActions().size());
        }

        @Test
        @DisplayName("CLOSED has no allowed transitions")
        void testClosedNoTransitions() {
            incident.beginTriage(UUID.randomUUID());
            incident.initiateContainment(List.of("x"));
            incident.beginEradication();
            incident.beginRecovery();
            incident.startPostIncidentReview();
            incident.close("done");
            assertTrue(incident.getAllowedTransitions().isEmpty());
        }

        @Test
        @DisplayName("stateFromType correctly reconstructs all states")
        void testStateFromType() {
            for (IncidentStateType type : IncidentStateType.values()) {
                IncidentState state = Incident.stateFromType(type);
                assertEquals(type, state.getName());
            }
        }
    }
}
