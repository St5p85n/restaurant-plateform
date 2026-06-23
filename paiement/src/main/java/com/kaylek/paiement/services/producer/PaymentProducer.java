package com.kaylek.paiement.services.consumers;

import com.alten.back.events.*;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import com.kaylek.paiement.events.*;
import com.kaylek.paiement.services.*;

@Service
public class PaymentProducer {


    public final PaiementRepository paiementRepository;
    @KafkaListener(topics = "order-created", groupId = "paiement-group-v4")
    public void consume(OrderEvent event) {

        System.out.println("Commande recu : " + event.getOrderId());
        Paiement paiement = new Paiement();
        paiement.setOrderId(event.getOrderId());
        paiement.setAmount(event.getAmount());
        if (event.getAmount()==event.getMtn()) {
            paiementRepository.addPaiement(paiement);
        } else {
            System.out.println("Paiement echoue");
        }
    }
}
