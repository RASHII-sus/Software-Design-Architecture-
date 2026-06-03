package com.sdapro.incident;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Incident Management Service — Entry Point.
 *
 * Design Patterns demonstrated:
 * - State: 7-state incident lifecycle (New → UnderTriage → Containment →
 *          Eradication → Recovery → PostIncidentReview → Closed)
 */
@SpringBootApplication
public class IncidentManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(IncidentManagementApplication.class, args);
    }
}
