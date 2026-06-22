import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { MenuItem } from '@/types';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  addItem: (menuItem: MenuItem, quantity?: number, notes?: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateNotes: (menuItemId: string, notes: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  setRestaurant: (restaurantId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'restaurantCart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantIdState] = useState<string | null>(null);

  // Charger le panier depuis localStorage au démarrage
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setItems(parsed.items || []);
        setRestaurantIdState(parsed.restaurantId || null);
      } catch (error) {
        console.error('Erreur lors du chargement du panier:', error);
      }
    }
  }, []);

  // Sauvegarder le panier dans localStorage à chaque modification
  useEffect(() => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ items, restaurantId })
    );
  }, [items, restaurantId]);

  const setRestaurant = (newRestaurantId: string) => {
    // Si on change de restaurant, vider le panier
    if (restaurantId && restaurantId !== newRestaurantId) {
      setItems([]);
    }
    setRestaurantIdState(newRestaurantId);
  };

  const addItem = (menuItem: MenuItem, quantity = 1, notes = '') => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.menuItem.id === menuItem.id
      );

      if (existingItemIndex >= 0) {
        // Article déjà dans le panier, augmenter la quantité
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += quantity;
        if (notes) {
          newItems[existingItemIndex].notes = notes;
        }
        return newItems;
      } else {
        // Nouvel article
        return [...prevItems, { menuItem, quantity, notes }];
      }
    });
  };

  const removeItem = (menuItemId: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.menuItem.id !== menuItemId)
    );
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.menuItem.id === menuItemId ? { ...item, quantity } : item
      )
    );
  };

  const updateNotes = (menuItemId: string, notes: string) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.menuItem.id === menuItemId ? { ...item, notes } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantIdState(null);
  };

  const getTotal = () => {
    return items.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0
    );
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        addItem,
        removeItem,
        updateQuantity,
        updateNotes,
        clearCart,
        getTotal,
        getItemCount,
        setRestaurant,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
