package com.alten.back.entities;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

@Data
@Builder
@AllArgsConstructor
@Entity
public class Cart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private Date createdAt;
    private Date updatedAt;
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<CartItem> items = new ArrayList<>();
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    public User getUser() {
        return user;
    }
    public void setUser(User user) {
        this.user = user;
    }
    public Cart() {this.createdAt = new Date();this.updatedAt = new Date();}

    public void removeItem(Integer productId) {
        this.items.removeIf(item -> item.getProductId().equals(productId));
    }
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<CartItem> getItems() {
        return items;
    }

    public void setItems(List<CartItem> items) {
        this.items = items;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
        updatedAt = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Date();
    }

    public Integer getUserId() {
        return this.user.getId();
    }

    public int getQuantityItem(Integer productId){
        AtomicInteger qt= new AtomicInteger(0);
        this.items.forEach(cartItem -> {
            if(cartItem.getProductId()==productId)
                qt.set(cartItem.getQuantity());
        });
        return qt.get();
    }
    public CartItem addItem(Integer productId, int quantity) {
        System.out.println("Le prod ID est:"+productId);
        System.out.println("La quanti  est:"+quantity);
        Optional<CartItem> existingItem = this.items.stream()
                .filter(item -> item.getProductId().equals(productId))
                .findFirst();

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + quantity);
            return item;
        } else {
            CartItem newItem = new CartItem(this, productId, quantity);
            this.items.add(newItem);
            return newItem;
        }
    }
}
