package com.sdapro.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ Configuration - Event Bus infrastructure setup.
 *
 * Architecture Style: Event-Driven Architecture
 *
 * Creates 3 queues:
 *   - sda.alert.queue        → alert lifecycle events
 *   - sda.incident.queue     → incident escalation events
 *   - sda.notification.queue → analyst notification events
 */
@Configuration
public class RabbitMQConfig {

    @Value("${rabbitmq.queue.alert}")
    private String alertQueue;

    @Value("${rabbitmq.queue.incident}")
    private String incidentQueue;

    @Value("${rabbitmq.queue.notification}")
    private String notificationQueue;

    @Value("${rabbitmq.exchange}")
    private String exchange;

    @Value("${rabbitmq.routing.alert}")
    private String alertRoutingKey;

    @Value("${rabbitmq.routing.incident}")
    private String incidentRoutingKey;

    @Value("${rabbitmq.routing.notification}")
    private String notificationRoutingKey;

    // ============ Queues ============

    @Bean
    public Queue alertQueue() {
        return QueueBuilder.durable(alertQueue).build();
    }

    @Bean
    public Queue incidentQueue() {
        return QueueBuilder.durable(incidentQueue).build();
    }

    @Bean
    public Queue notificationQueue() {
        return QueueBuilder.durable(notificationQueue).build();
    }

    // ============ Exchange ============

    @Bean
    public TopicExchange sdaExchange() {
        return new TopicExchange(exchange);
    }

    // ============ Bindings ============

    @Bean
    public Binding alertBinding(Queue alertQueue, TopicExchange sdaExchange) {
        return BindingBuilder.bind(alertQueue).to(sdaExchange).with(alertRoutingKey);
    }

    @Bean
    public Binding incidentBinding(Queue incidentQueue, TopicExchange sdaExchange) {
        return BindingBuilder.bind(incidentQueue).to(sdaExchange).with(incidentRoutingKey);
    }

    @Bean
    public Binding notificationBinding(Queue notificationQueue, TopicExchange sdaExchange) {
        return BindingBuilder.bind(notificationQueue).to(sdaExchange).with(notificationRoutingKey);
    }

    // ============ JSON Converter ============

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
