package com.alten.back.controller;

import com.alten.back.dto.AddItemRequest;
import com.alten.back.dto.CartDto;
import com.alten.back.entities.Cart;
import com.alten.back.services.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carts")
public class CartController {

    private final CartService cartService;


    @RequestMapping(method = RequestMethod.OPTIONS)
    public ResponseEntity<?> options() {
        return ResponseEntity.ok()
                .header("Access-Control-Allow-Origin", "http://localhost:4200")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "*")
                .header("Access-Control-Max-Age", "3600")
                .build();
    }

    @Autowired
    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    @CrossOrigin(origins = "http://localhost:4200")
    public ResponseEntity<List<Cart>> getAllCarts() {
        List<Cart> carts = cartService.getAllCarts();
        return new ResponseEntity<>(carts, HttpStatus.OK);
    }


    @GetMapping("/{userId}/details")
    @CrossOrigin(origins = "http://localhost:4200")
    public ResponseEntity<CartDto> getCartByUserId(@PathVariable Integer userId) {
        return cartService.getCartByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    @PostMapping("/user/{userId}")
    @CrossOrigin(origins = "http://localhost:4200")
    public ResponseEntity<Cart> createCartForUser(@PathVariable Integer userId) {
        try {
            Cart cart = cartService.getOrCreateCartForUser(userId);
            return new ResponseEntity<>(cart, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{cartId}/items")
    @CrossOrigin(origins = "http://localhost:4200")
    public ResponseEntity<Cart> addItemToCart(
            @PathVariable Integer cartId,
            @RequestBody AddItemRequest request) {
        Cart updatedCart = cartService.addItemToCart(cartId, request.getProductId(), request.getQuantity());
        return new ResponseEntity<>(updatedCart, HttpStatus.OK);
    }
    @PutMapping("/{id}")
    public ResponseEntity<Cart> updateCart(@PathVariable Integer id, @RequestBody Cart cart) {
        if (!id.equals(cart.getId())) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        Cart updatedCart = cartService.updateCart(cart);
        return new ResponseEntity<>(updatedCart, HttpStatus.OK);
    }
    @DeleteMapping("/{cartId}/items/{productId}")
    public ResponseEntity<Void> removeItemFromCart(
            @PathVariable Integer cartId,
            @PathVariable Integer productId) {
        try {
            cartService.removeItemFromCart(cartId, productId);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCart(@PathVariable Integer id) {
        cartService.deleteCart(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}