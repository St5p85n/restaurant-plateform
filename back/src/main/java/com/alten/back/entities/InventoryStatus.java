package com.alten.back.entities;

public enum InventoryStatus {
    INSTOCK("En stock"),
    LOWSTOCK("Stock faible"),
    OUTOFSTOCK("En rupture de stock");

    private final String displayName;

    InventoryStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
