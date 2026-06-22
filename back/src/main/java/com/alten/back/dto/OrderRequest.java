package com.alten.back.dto;

import java.util.List;

import lombok.Data;



@Data
public class OrderRequest {
    private Long clientId;
    private Long restaurantId;
    private String typeCommande;   // livraison | sur_place | emporter
    private AddressDto address;
    private List<OrderItemDto> items;
    private double total;
}

