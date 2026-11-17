package com.venueverse.service;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.venueverse.dto.RegisterRequest;
import com.venueverse.dto.UserDto;
import com.venueverse.exception.GlobalExceptionHandler.BadRequestException;
import com.venueverse.exception.GlobalExceptionHandler.ResourceNotFoundException;
import com.venueverse.model.Booking;
import com.venueverse.model.User;
import com.venueverse.model.Venue;
import com.venueverse.model.VenueOwner;
import com.venueverse.repository.BookingRepository;
import com.venueverse.repository.UserRepository;
import com.venueverse.repository.VenueRepository;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final VenueRepository venueRepository;
    private final BookingRepository bookingRepository;

    public AdminService(UserRepository userRepository, VenueRepository venueRepository, BookingRepository bookingRepository) {
        this.userRepository = userRepository;
        this.venueRepository = venueRepository;
        this.bookingRepository = bookingRepository;
    }

    public static Instant extractSortTimestamp(Instant createdAt, String id) {
        if (createdAt != null) {
            return createdAt;
        }
        if (id != null && id.length() == 24 && id.matches("[0-9a-fA-F]{24}")) {
            try {
                long epochSeconds = Long.parseLong(id.substring(0, 8), 16);
                return Instant.ofEpochSecond(epochSeconds);
            } catch (NumberFormatException ignored) {
                return Instant.EPOCH;
            }
        }
        return Instant.EPOCH;
    }

    public Map<String, Object> getDashboardStats() {
        List<User> allUsers = userRepository.findAll();
        long totalUsers;
        long regularUsers;
        long totalHosts;
        long totalAdmins;

        if (!allUsers.isEmpty()) {
            totalUsers = allUsers.size();
            regularUsers = allUsers.stream()
                    .filter(u -> "user".equals(VenueOwner.normalizeRole(u.getRole())))
                    .count();
            totalHosts = allUsers.stream()
                    .filter(u -> "host".equals(VenueOwner.normalizeRole(u.getRole())))
                    .count();
            totalAdmins = allUsers.stream()
                    .filter(u -> "admin".equals(VenueOwner.normalizeRole(u.getRole())))
                    .count();
        } else {
            totalUsers = userRepository.count();
            totalHosts = userRepository.countByRole("host");
            regularUsers = Math.max(0L, totalUsers - totalHosts);
            totalAdmins = 0L;
        }

        List<Venue> allVenues = venueRepository.findAll();
        long totalVenues;
        long pendingVenues;
        long approvedVenues;
        long rejectedVenues;
        long activeVenues;

        if (!allVenues.isEmpty()) {
            totalVenues = allVenues.size();
            pendingVenues = allVenues.stream()
                    .filter(v -> "pending".equalsIgnoreCase(v.getStatus()))
                    .count();
            approvedVenues = allVenues.stream()
                    .filter(v -> v.getStatus() == null
                            || "approved".equalsIgnoreCase(v.getStatus())
                            || "published".equalsIgnoreCase(v.getStatus()))
                    .count();
            rejectedVenues = allVenues.stream()
                    .filter(v -> "rejected".equalsIgnoreCase(v.getStatus()))
                    .count();
            activeVenues = allVenues.stream()
                    .filter(v -> Boolean.TRUE.equals(v.getIsActive()))
                    .count();
        } else {
            totalVenues = venueRepository.count();
            pendingVenues = venueRepository.countByStatus("pending");
            approvedVenues = 0L;
            rejectedVenues = 0L;
            activeVenues = venueRepository.countByIsActiveTrue();
        }

        long totalReviews = allVenues.stream()
                .mapToLong(v -> v.getReviewsCount() != null ? v.getReviewsCount() : 0L)
                .sum();
        double averageRating = allVenues.stream()
                .filter(v -> v.getRating() != null && v.getRating() > 0.0)
                .mapToDouble(Venue::getRating)
                .average()
                .orElse(0.0);
        double roundedAvgRating = Math.round(averageRating * 10.0) / 10.0;

        List<Booking> allBookings = bookingRepository.findAll();
        long totalBookings = bookingRepository.count();
        long pendingBookings = bookingRepository.countByStatus("pending");
        long confirmedBookings = allBookings.stream()
                .filter(b -> "confirmed".equalsIgnoreCase(b.getStatus()))
                .count();
        long completedBookings = allBookings.stream()
                .filter(b -> "completed".equalsIgnoreCase(b.getStatus()))
                .count();
        long cancelledBookings = allBookings.stream()
                .filter(b -> "cancelled".equalsIgnoreCase(b.getStatus()))
                .count();
        long rejectedBookings = allBookings.stream()
                .filter(b -> "rejected".equalsIgnoreCase(b.getStatus()))
                .count();
        double totalRevenue = allBookings.stream()
                .filter(b -> "confirmed".equalsIgnoreCase(b.getStatus()) || "completed".equalsIgnoreCase(b.getStatus()))
                .mapToDouble(b -> b.getTotalPrice() != null ? b.getTotalPrice() : 0.0)
                .sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalAccounts", totalUsers);
        stats.put("regularUsers", regularUsers);
        stats.put("totalHosts", totalHosts);
        stats.put("totalAdmins", totalAdmins);
        stats.put("totalVenues", totalVenues);
        stats.put("approvedVenues", approvedVenues);
        stats.put("rejectedVenues", rejectedVenues);
        stats.put("pendingVenues", pendingVenues);
        stats.put("activeVenues", activeVenues);
        stats.put("totalBookings", totalBookings);
        stats.put("pendingBookings", pendingBookings);
        stats.put("confirmedBookings", confirmedBookings);
        stats.put("completedBookings", completedBookings);
        stats.put("cancelledBookings", cancelledBookings);
        stats.put("rejectedBookings", rejectedBookings);
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalReviews", totalReviews);
        stats.put("averageRating", roundedAvgRating);

        return stats;
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(
                        (User u) -> extractSortTimestamp(u.getCreatedAt(), u.getId()),
                        Comparator.reverseOrder()))
                .map(u -> {
                    UserDto dto = UserDto.fromEntity(u);
                    dto.setRole(VenueOwner.normalizeRole(u.getRole()));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public UserDto createUserByAdmin(RegisterRequest request) {
        if (request == null
                || request.getName() == null || request.getName().isBlank()
                || request.getEmail() == null || request.getEmail().isBlank()
                || request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadRequestException("Name, email, and password are required");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BadRequestException("An account with email " + normalizedEmail + " already exists");
        }

        String normalizedRole = VenueOwner.normalizeRole(request.getRole());
        User user = "host".equals(normalizedRole) ? new VenueOwner() : new User();
        user.setName(request.getName().trim());
        user.setEmail(normalizedEmail);
        user.setPassword(request.getPassword());
        user.setRole(normalizedRole);
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(request.getPhone().trim());
        }
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());

        User saved = userRepository.save(user);
        UserDto dto = UserDto.fromEntity(saved);
        dto.setRole(normalizedRole);
        return dto;
    }

    public void deleteUser(String userId, String actingAdminId) {
        if (userId == null || userId.isBlank()) {
            throw new BadRequestException("User ID is required");
        }
        String cleanId = userId.trim();
        if (actingAdminId != null && actingAdminId.equals(cleanId)) {
            throw new BadRequestException("You cannot delete your own active administrator account");
        }
        User user = userRepository.findById(cleanId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + cleanId));
        userRepository.delete(user);
    }

    public List<Venue> getAllVenues() {
        List<Venue> venues = venueRepository.findAll().stream()
                .sorted(Comparator.comparing(
                        (Venue v) -> extractSortTimestamp(v.getCreatedAt(), v.getId()),
                        Comparator.reverseOrder()))
                .collect(Collectors.toList());

        Map<String, String> hostNameCache = new HashMap<>();
        for (Venue v : venues) {
            if (v.getHost() != null) {
                String hId = v.getHost().toString();
                v.setHost(hId);
                String fallbackName = (v.getHostName() != null && !v.getHostName().isBlank())
                        ? v.getHostName()
                        : "Verified Host";
                String resolved = hostNameCache.computeIfAbsent(hId, id ->
                        userRepository.findById(id).map(User::getName).orElse(fallbackName));
                v.setHostName(resolved);
            }
        }
        return venues;
    }

    public Venue updateVenueStatus(String venueId, String status) {
        if (venueId == null || venueId.isBlank()) {
            throw new BadRequestException("Venue ID is required");
        }
        if (status == null || status.isBlank()) {
            throw new BadRequestException("Status is required");
        }

        String cleanStatus = status.trim().toLowerCase();
        if (!List.of("approved", "rejected", "pending", "published").contains(cleanStatus)) {
            throw new BadRequestException("Invalid venue approval status: " + status);
        }

        Venue venue = venueRepository.findById(venueId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found with id: " + venueId));

        String normalizedStatus = "published".equals(cleanStatus) ? "approved" : cleanStatus;
        venue.setStatus(normalizedStatus);
        if ("approved".equals(normalizedStatus)) {
            venue.setIsActive(true);
        } else if ("rejected".equals(normalizedStatus)) {
            venue.setIsActive(false);
        }
        venue.setUpdatedAt(Instant.now());
        return venueRepository.save(venue);
    }

    public long clearAllBookings() {
        long count = bookingRepository.count();
        bookingRepository.deleteAll();
        return count;
    }
}
