package com.alten.back.services.consumer;

import com.alten.back.events.OrderEvent;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class PaymentResultConsumer {
//payment-success
    @KafkaListener(topics = "paiement-success", groupId = "order-group")
    public void handleSuccess(OrderEvent event) {
        System.out.println("Paiement avec succes pour la commande " + event.getOrderId());
        // modifier le status => Payee
    }

    @KafkaListener(topics = "paiement-failed", groupId = "order-group")
    public void handleFailure(OrderEvent event) {
        System.out.println("Payment failed for order " + event.getOrderId());
        // modifier le status => annullee
    }
}