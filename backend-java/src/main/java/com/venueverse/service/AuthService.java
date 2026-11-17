package com.venueverse.service;

import com.venueverse.dto.LoginRequest;
import com.venueverse.dto.RegisterRequest;
import com.venueverse.exception.GlobalExceptionHandler.BadRequestException;
import com.venueverse.exception.GlobalExceptionHandler.ResourceNotFoundException;
import com.venueverse.exception.GlobalExceptionHandler.UnauthorizedException;
import com.venueverse.model.User;
import com.venueverse.model.Venue;
import com.venueverse.model.VenueOwner;
import com.venueverse.repository.UserRepository;
import com.venueverse.repository.VenueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final VenueRepository venueRepository;

    public AuthService(UserRepository userRepository) {
        this(userRepository, null);
    }

    @Autowired
    public AuthService(UserRepository userRepository, VenueRepository venueRepository) {
        this.userRepository = userRepository;
        this.venueRepository = venueRepository;
    }

    public User register(RegisterRequest request) {
        if (request.getName() == null || request.getName().isBlank() ||
                request.getEmail() == null || request.getEmail().isBlank() ||
                request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadRequestException("Name, email, and password are required");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BadRequestException("User already exists with this email");
        }

        String reqRole = request.getRole();
        if (reqRole != null && reqRole.trim().equalsIgnoreCase("admin")) {
            throw new BadRequestException("Public registration as administrator is not permitted");
        }

        String role = VenueOwner.normalizeRole(reqRole);
        if ("admin".equals(role)) {
            throw new BadRequestException("Public registration as administrator is not permitted");
        }

        User user;
        if ("host".equals(role)) {
            user = new VenueOwner();
        } else {
            user = new User();
        }

        user.setName(request.getName().trim());
        user.setEmail(normalizedEmail);
        user.setPassword(request.getPassword());
        user.setRole(role);
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(request.getPhone().trim());
        }
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());

        return userRepository.save(user);
    }

    public User login(LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank() ||
                request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadRequestException("Email and password are required");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (user.getPassword() == null || !user.getPassword().equals(request.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (VenueOwner.isHostRole(user.getRole())) {
            VenueOwner owner = VenueOwner.fromUser(user);
            owner.setRole("host");
            return owner;
        }

        user.setRole(VenueOwner.normalizeRole(user.getRole()));
        return user;
    }

    public Optional<User> findById(String userId) {
        if (userId == null || userId.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findById(userId.trim());
    }

    public User updateProfile(String userId, String name, String phone, String businessName, String city) {
        if (userId == null || userId.isBlank()) {
            throw new BadRequestException("User ID is required");
        }
        if (name == null || name.isBlank()) {
            throw new BadRequestException("Full name is required");
        }

        User user = userRepository.findById(userId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        String cleanName = name.trim();
        user.setName(cleanName);
        if (phone != null) {
            user.setPhone(phone.trim());
        }
        if (businessName != null) {
            user.setBusinessName(businessName.trim());
        }
        if (city != null) {
            user.setCity(city.trim());
        }
        user.setUpdatedAt(Instant.now());
        User saved = userRepository.save(user);

        if (venueRepository != null) {
            List<Venue> allVenues = venueRepository.findAll();
            for (Venue v : allVenues) {
                if (v.getHost() != null && v.getHost().toString().equals(saved.getId())) {
                    v.setHostName(cleanName);
                    v.setUpdatedAt(Instant.now());
                    venueRepository.save(v);
                }
            }
        }

        if (VenueOwner.isHostRole(saved.getRole())) {
            VenueOwner owner = VenueOwner.fromUser(saved);
            owner.setRole("host");
            return owner;
        }
        return saved;
    }

    public void changePassword(String userId, String currentPassword, String newPassword) {
        if (userId == null || userId.isBlank()) {
            throw new BadRequestException("User ID is required");
        }
        if (currentPassword == null || currentPassword.isBlank() || newPassword == null || newPassword.isBlank()) {
            throw new BadRequestException("Current and new password are required");
        }
        if (newPassword.length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters");
        }

        User user = userRepository.findById(userId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        if (user.getPassword() == null || !user.getPassword().equals(currentPassword)) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPassword(newPassword);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }
}
