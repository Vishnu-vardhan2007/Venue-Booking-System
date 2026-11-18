package com.venueverse.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class VenueOwner extends User {
    public VenueOwner() {
        super();
        setRole("host");
    }

    public VenueOwner(String name, String email, String password, String phone) {
        super(name, email, password, "host", phone);
    }

    public VenueOwner(User user) {
        if (user != null) {
            setId(user.getId());
            setName(user.getName());
            setEmail(user.getEmail());
            setPassword(user.getPassword());
            setRole(user.getRole());
            setPhone(user.getPhone());
            setBusinessName(user.getBusinessName());
            setCity(user.getCity());
            setCreatedAt(user.getCreatedAt());
            setUpdatedAt(user.getUpdatedAt());
        }
    }

    public static VenueOwner fromUser(User user) {
        if (user == null) {
            return null;
        }
        if (user instanceof VenueOwner) {
            return (VenueOwner) user;
        }
        return new VenueOwner(user);
    }

    public static boolean isHostRole(String role) {
        if (role == null) return false;
        String clean = role.trim().toLowerCase();
        return clean.equals("host")
                || clean.equals("venue_owner")
                || clean.equals("venue owner")
                || clean.equals("venue_host")
                || clean.equals("venue host")
                || clean.equals("owner");
    }

    public static String normalizeRole(String role) {
        if (role == null || role.isBlank()) return "user";
        String clean = role.trim().toLowerCase();
        if (clean.equals("admin") || clean.equals("administrator")) return "admin";
        if (isHostRole(clean)) return "host";
        return "user";
    }

    public boolean isAuthorizedHost() {
        String cleanRole = getRole() == null ? "" : getRole().trim().toLowerCase();
        return isHostRole(cleanRole) || "admin".equals(cleanRole);
    }

    public boolean ownsVenue(String venueHostId) {
        return getId() != null && getId().equals(venueHostId);
    }

    @Override
    @JsonIgnore
    public String getEntitySummary() {
        return "VenueOwner[" + getName() + ", role=" + getRole() + "]";
    }
}
