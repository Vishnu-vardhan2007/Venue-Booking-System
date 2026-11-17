package com.venueverse.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.venueverse.model.User;
import java.io.Serializable;
import java.time.Instant;

public class UserDto implements Serializable {
    private static final long serialVersionUID = 1L;
    @JsonProperty("_id")
    private String id;
    private String name;
    private String email;
    private String role;
    private String phone;
    private String businessName;
    private String city;
    private Instant createdAt;
    private Instant updatedAt;

    public UserDto() {
    }

    public UserDto(String id, String name, String email, String role, String phone, Instant createdAt,
            Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.phone = phone;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UserDto(User user) {
        if (user != null) {
            this.id = user.getId();
            this.name = user.getName();
            this.email = user.getEmail();
            this.role = user.getRole();
            this.phone = user.getPhone();
            this.businessName = user.getBusinessName();
            this.city = user.getCity();
            this.createdAt = user.getCreatedAt();
            this.updatedAt = user.getUpdatedAt();
        }
    }

    public static UserDto from(User user) {
        return user != null ? new UserDto(user) : null;
    }

    public static UserDto fromEntity(User user) {
        return from(user);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
