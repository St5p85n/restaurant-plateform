package com.alten.back.dto;

import lombok.Data;

@Data
public class AddressDto {
    private String fullName;
    private String phone;
    private String city;
    private String street;

    public AddressDto() {
    }

    public AddressDto(String fullName, String phone, String city, String street) {
        this.fullName = fullName;
        this.phone = phone;
        this.city = city;
        this.street = street;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }
}
