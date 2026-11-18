package com.venueverse.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.venueverse.dto.UserDto;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "users")
public class User extends BaseEntity {
    @Id
    @JsonProperty("_id")
    private String id;
    private String name;
    private String email;
    @JsonIgnore
    private String password;
    private String role = "user";
    private String phone;
    private String businessName;
    private String city;

    public User() {
        super();
    }

    public User(String name, String email, String password, String role) {
        this(name, email, password, role, null);
    }

    public User(String name, String email, String password, String role, String phone) {
        super();
        this.name = name != null ? name.trim() : null;
        this.email = email != null ? email.trim().toLowerCase() : null;
        this.password = password;
        this.role = (role != null && !role.isBlank()) ? role : "user";
        this.phone = phone != null ? phone.trim() : null;
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
        this.name = name != null ? name.trim() : null;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email != null ? email.trim().toLowerCase() : null;
    }

    @JsonIgnore
    public String getPassword() {
        return password;
    }

    @JsonProperty("password")
    public void setPassword(String password) {
        this.password = password;
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
        this.phone = phone != null ? phone.trim() : null;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName != null ? businessName.trim() : null;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city != null ? city.trim() : null;
    }

    public UserDto toDto() {
        return new UserDto(this);
    }

    @Override
    @JsonIgnore
    public String getEntitySummary() {
        return "User[" + name + ", role=" + role + "]";
    }

    public static class Profile {
        @JsonProperty("_id")
        private String id;
        private String name;
        private String email;
        private String role;
        private String phone;
        private Instant createdAt;
        private Instant updatedAt;

        public Profile() {
        }

        public Profile(User user) {
            if (user != null) {
                this.id = user.getId();
                this.name = user.getName();
                this.email = user.getEmail();
                this.role = user.getRole();
                this.phone = user.getPhone();
                this.createdAt = user.getCreatedAt();
                this.updatedAt = user.getUpdatedAt();
            }
        }

        public String getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public String getEmail() {
            return email;
        }

        public String getRole() {
            return role;
        }

        public String getPhone() {
            return phone;
        }

        public Instant getCreatedAt() {
            return createdAt;
        }

        public Instant getUpdatedAt() {
            return updatedAt;
        }
    }
}
