package com.kaylek.paiement.services;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class PaiementService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public PaiementService(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendPaymentSuccess(Object event) {
        kafkaTemplate.send("paiement-success", event);
    }

    public void sendPaymentFailed(Object event) {
        kafkaTemplate.send("paiement-failed", event);
    }
}