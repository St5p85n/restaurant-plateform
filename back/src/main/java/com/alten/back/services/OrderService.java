package com.alten.back.services;

import com.alten.back.dto.OrderRequest;
import com.alten.back.entities.*;
import com.alten.back.events.*;
import com.alten.back.repository.OrderRepository;
import com.alten.back.services.producer.OrderProducer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderProducer orderProducer;
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
    public List<Order> getOrderByClientId(Long clientId) {
        return orderRepository.findByClientId(clientId);
    }
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("order not found"));
    }
    public Order createOrder(OrderRequest request) {

        Order order = new Order();
        order.setClientId(request.getClientId());
        order.setRestaurantId(request.getRestaurantId());
        order.setTypeCommande(request.getTypeCommande());
        order.setTotal(request.getTotal());
        order.setStatut("EN_ATTENTE");
        order.setCodeCommande(UUID.randomUUID().toString().substring(0,8));

        /*
        // Address
        order.setFullName(request.getAddress().getFullName());
        order.setPhone(request.getAddress().getPhone());
        order.setCity(request.getAddress().getCity());
        order.setStreet(request.getAddress().getStreet());
        // Items
        List<OrderItem> items = request.getItems().stream().map(i -> {
            OrderItem item = new OrderItem();
            item.setProductId(i.getProductId());
            item.setQuantity(i.getQuantity());
            item.setPrice(i.getPrice());
            item.setName(i.getName());
            item.setTotalLine(i.getQuantity() * i.getPrice());
            item.setOrder(order);
            return item;
        }).toList();

       order.setItems(items);
       return orderRepository.save(order);

         */
       //commande enregistree , je declenche l'event kafka pour notifier paiement
        OrderEvent ord = new OrderEvent();
        ord.setEventId(""+request.getClientId());
        ord.setOrderId((long)request.getClientId());
        ord.setClientId((long)request.getClientId());
        ord.setAmount(request.getTotal());
        orderProducer.sendOrderCreatedEvent(ord);

        return order;
    }
}

