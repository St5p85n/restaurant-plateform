package com.kaylek.paiement.model;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Paiement{
    private String id;
    private String montant;
    private String date;
    private String type;
    private String status;
    private int orderId;
}