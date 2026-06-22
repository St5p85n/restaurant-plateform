package com.alten.back.repository;

import com.alten.back.entities.Role;
import com.alten.back.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role,Integer> {
    Optional<Role> findByLibelle(String libelle);

}
