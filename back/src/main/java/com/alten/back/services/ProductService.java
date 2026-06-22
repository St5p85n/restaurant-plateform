package com.alten.back.services;
import com.alten.back.entities.Product;
import com.alten.back.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository repository;

    public Product register(Product prod) {
        return repository.save(prod);
    }

    public List<Product> getAllProducts() {
        return repository.findAll();
    }

    public Product getProductById(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("product not found"));
    }

    public Product updateProduct(Integer id, Product prod) {
        Product produit = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("product not found"));

        produit.setDescription(prod.getDescription());
        produit.setName(prod.getName());

        return repository.save(produit);
    }

    public void deleteProduct(Integer id) {
        repository.deleteById(id);
    }
}
