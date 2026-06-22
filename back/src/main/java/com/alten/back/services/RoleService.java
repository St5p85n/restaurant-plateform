package com.alten.back.services;

import com.alten.back.entities.Product;
import com.alten.back.entities.Role;
import com.alten.back.repository.ProductRepository;
import com.alten.back.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {
    private final RoleRepository repository;

    public Role addRole(Role role) {
        return repository.save(role);
    }

    public List<Role> getAllRoles() {
        return repository.findAll();
    }
    public Role getRoleById(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("role not found"));
    }
    public void deleteRole(Integer id) {
        repository.deleteById(id);
    }

}
