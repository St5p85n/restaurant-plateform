package com.alten.back.entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String codeCommande;
    private Long clientId;
    private Long restaurantId;
    private String typeCommande;
    private double total;
    private String statut; // en_attente, confirme, etc

    private String fullName;
    private String phone;
    private String city;
    private String street;

    private LocalDateTime dateCommande = LocalDateTime.now();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<OrderItem> items;
}
