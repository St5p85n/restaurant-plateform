package com.alten.back.services;
import com.alten.back.dto.CartDto;
import com.alten.back.dto.CartItemDto;
import com.alten.back.entities.Cart;

import com.alten.back.entities.CartItem;
import com.alten.back.entities.Product;
import com.alten.back.entities.User;
import com.alten.back.repository.CartItemRepository;
import com.alten.back.repository.CartRepository;
import com.alten.back.repository.ProductRepository;
import com.alten.back.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class CartService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    private CartItemRepository cartItemRepository;
    @Autowired
    public CartService(CartRepository cartRepository, UserRepository userRepository, ProductRepository repository) {
        this.cartRepository = cartRepository;
        this.userRepository = userRepository;
        this.productRepository = repository;
    }
    public Cart getOrCreateCartForUser(Integer userId) {
        Optional<Cart> existingCart = cartRepository.findByUserId(userId);
        if (existingCart.isPresent()) {
            return existingCart.get();
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cart newCart = new Cart();
        newCart.setUser(user);
        return cartRepository.save(newCart);
    }

    public List<Cart> getAllCarts() {
        return cartRepository.findAll();
    }


    public Optional<CartDto> getCartByUserId(Integer userId) {
        return cartRepository.findByUserId(userId)
                .map(this::convertToDto);
    }

    private CartDto convertToDto(Cart cart) {
        List<CartItemDto> itemDtos = cart.getItems().stream()
                .map(item -> new CartItemDto(item.getProductId(), item.getQuantity()))
                .collect(Collectors.toList());

        return new CartDto(cart.getId(), cart.getUserId(), itemDtos);
    }
    public Optional<Cart> getCartById(Integer id) {
        return cartRepository.findById(id);
    }

    public Cart addItemToCart(Integer cartId, Integer productId, int quantity) {
        System.out.println("CartID:"+cartId+" -- ProductID: "+productId+" -- Quantity: "+quantity);
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Cart not found with id: " + cartId));

        Product prod = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("product not found"));
        prod.setQuantity(prod.getQuantity()-quantity);
        System.out.println("Produit quantite modifiee: "+prod.getQuantity());
        cart.addItem(productId, quantity);
        productRepository.save(prod);
        return cartRepository.save(cart);
    }

    public void deleteCart(Integer id) {
        cartRepository.deleteById(id);
    }

    public Cart updateCart(Cart cart) {
        return cartRepository.save(cart);
    }
    public void removeItemFromCart(Integer cartId, Integer productId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Cart not found"));

        Product prod = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("product not found"));

        int qt = cart.getQuantityItem(productId);

        if(qt!=0){
            prod.setQuantity(prod.getQuantity()+qt);
            productRepository.save(prod);
        }
        cart.removeItem(productId);
        cartRepository.save(cart);
    }

}
