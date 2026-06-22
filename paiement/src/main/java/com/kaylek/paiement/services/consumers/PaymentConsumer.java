package com.kaylek.paiement.services.consumers;

import com.alten.back.events.*;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import com.kaylek.paiement.events.*;
import com.kaylek.paiement.services.*;

@Service
public class PaymentConsumer {


    @KafkaListener(topics = "order-created", groupId = "paiement-group-v4")
    public void consume(OrderEvent event) {

        System.out.println("Commande recu : " + event.getOrderId());

        // simulate payment
        if (Math.random() > 0.2) {
            System.out.println("Paiement avec succes");


        } else {
            System.out.println("Paiement echoue");
        }
    }
}
