package com.sdapro.shared.events;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

/**
 * // PATTERN: Singleton + Observer
 * // RATIONALE: Single event bus instance coordinates all domain event publishing.
 * //            Observers subscribe to event types and receive push notifications
 * //            without tight coupling to publishers.
 *
 * In-memory event bus placeholder implementing the Observer pattern.
 * This serves as a local stand-in for the full RabbitMQ/Kafka event bus
 * that Student C will implement.
 *
 * Thread-safe Singleton — ensures a single shared event bus across the application.
 */
public class SimpleEventBus {

    // PATTERN: Singleton — volatile + double-checked locking for thread safety
    private static volatile SimpleEventBus instance;

    private final Map<String, List<Consumer<DomainEvent>>> subscribers;

    private SimpleEventBus() {
        this.subscribers = new ConcurrentHashMap<>();
    }

    /**
     * Returns the singleton instance of the event bus.
     * Uses double-checked locking for thread-safe lazy initialization.
     */
    public static SimpleEventBus getInstance() {
        if (instance == null) {
            synchronized (SimpleEventBus.class) {
                if (instance == null) {
                    instance = new SimpleEventBus();
                }
            }
        }
        return instance;
    }

    /**
     * Subscribe to a specific event type.
     * // PATTERN: Observer — attach observer for a given event type
     *
     * @param eventType the event type to subscribe to
     * @param handler   the callback to invoke when the event is published
     */
    public void subscribe(String eventType, Consumer<DomainEvent> handler) {
        subscribers.computeIfAbsent(eventType, k -> new CopyOnWriteArrayList<>()).add(handler);
    }

    /**
     * Publish an event to all subscribers of its type.
     * // PATTERN: Observer — notify all attached observers
     *
     * @param event the domain event to publish
     */
    public void publish(DomainEvent event) {
        List<Consumer<DomainEvent>> handlers = subscribers.getOrDefault(event.getEventType(), new ArrayList<>());
        for (Consumer<DomainEvent> handler : handlers) {
            try {
                handler.accept(event);
            } catch (Exception e) {
                System.err.println("Error in event handler for " + event.getEventType() + ": " + e.getMessage());
            }
        }
    }

    /**
     * Remove all subscribers (useful for testing).
     */
    public void clearSubscribers() {
        subscribers.clear();
    }

    /**
     * Reset singleton instance (for testing only).
     */
    public static void resetInstance() {
        synchronized (SimpleEventBus.class) {
            instance = null;
        }
    }
}
