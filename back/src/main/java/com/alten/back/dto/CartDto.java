package com.alten.back.dto;

import java.util.List;

public class CartDto {
    private Integer id;
    private Integer userId;
    private List<CartItemDto> items;

    public CartDto() {}

    public CartDto(Integer id, Integer userId, List<CartItemDto> items) {
        this.id = id;
        this.userId = userId;
        this.items = items;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public List<CartItemDto> getItems() {
        return items;
    }

    public void setItems(List<CartItemDto> items) {
        this.items = items;
    }
}

