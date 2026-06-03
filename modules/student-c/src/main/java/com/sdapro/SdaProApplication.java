package com.sdapro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * SDA-Pro: Security Incident Response & Threat Mitigation Platform
 * Student C Module - SOC Platform Engineer
 *
 * Responsibilities:
 *   - SOC Analyst Dashboard (MVC + Observer + Singleton)
 *   - Event Bus (Event-Driven Architecture + RabbitMQ)
 *   - SOA Orchestration (SOA + Chain of Responsibility + Strategy)
 *   - Real-time WebSocket push
 *   - Audit & Compliance Logging (Factory + Facade)
 *
 * Architecture Styles: MVC, Layered, SOA, Event-Driven
 * Design Patterns: Singleton, Factory, Observer, Chain of Responsibility, Strategy, Facade
 */
@SpringBootApplication
@EnableCaching
@EnableScheduling
public class SdaProApplication {

    public static void main(String[] args) {
        SpringApplication.run(SdaProApplication.class, args);
        System.out.println("=========================================");
        System.out.println("  SDA-Pro SOC Platform - Student C");
        System.out.println("  Running at http://localhost:8080");
        System.out.println("  WebSocket: ws://localhost:8080/ws");
        System.out.println("=========================================");
    }
}
