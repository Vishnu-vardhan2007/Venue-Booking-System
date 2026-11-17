package com.venueverse.controller;

import com.venueverse.dto.ApiResponse;
import com.venueverse.dto.RegisterRequest;
import com.venueverse.dto.UpdateVenueStatusRequest;
import com.venueverse.dto.UserDto;
import com.venueverse.exception.GlobalExceptionHandler.ForbiddenException;
import com.venueverse.exception.GlobalExceptionHandler.UnauthorizedException;
import com.venueverse.model.Booking;
import com.venueverse.model.Venue;
import com.venueverse.repository.VenueRepository;
import com.venueverse.security.AuthUser;
import com.venueverse.service.AdminService;
import com.venueverse.service.BookingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final VenueRepository venueRepository;
    private final BookingService bookingService;

    public AdminController(AdminService adminService,
                           VenueRepository venueRepository,
                           BookingService bookingService) {
        this.adminService = adminService;
        this.venueRepository = venueRepository;
        this.bookingService = bookingService;
    }

    private AuthUser enforceAdmin(HttpServletRequest request) {
        AuthUser authUser = (AuthUser) request.getAttribute("authUser");
        if (authUser == null) {
            throw new UnauthorizedException("Access denied. Please log in first.");
        }
        if (!"admin".equalsIgnoreCase(authUser.getRole())) {
            throw new ForbiddenException("Access denied. Administrator privileges required.");
        }
        return authUser;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(HttpServletRequest request) {
        enforceAdmin(request);
        Map<String, Object> stats = adminService.getDashboardStats();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "stats", stats
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getUsers(HttpServletRequest request) {
        enforceAdmin(request);
        List<UserDto> users = adminService.getAllUsers();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "users", users,
                "count", users.size()
        ));
    }

    @PostMapping("/users")
    public ResponseEntity<Map<String, Object>> createUser(
            @RequestBody RegisterRequest req,
            HttpServletRequest request) {
        enforceAdmin(request);
        UserDto created = adminService.createUserByAdmin(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Account created successfully",
                "user", created
        ));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse> deleteUser(
            @PathVariable String id,
            HttpServletRequest request) {
        AuthUser admin = enforceAdmin(request);
        adminService.deleteUser(id, admin.getId());
        return ResponseEntity.ok(ApiResponse.success("Account deleted successfully"));
    }

    @GetMapping("/venues")
    public ResponseEntity<Map<String, Object>> getVenues(HttpServletRequest request) {
        enforceAdmin(request);
        List<Venue> venues = adminService.getAllVenues();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "venues", venues,
                "count", venues.size()
        ));
    }

    @PatchMapping("/venues/{id}/status")
    public ResponseEntity<Map<String, Object>> updateVenueStatus(
            @PathVariable String id,
            @RequestBody UpdateVenueStatusRequest req,
            HttpServletRequest request) {
        enforceAdmin(request);
        Venue updated = adminService.updateVenueStatus(id, req.getStatus());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Venue status updated to " + updated.getStatus(),
                "venue", updated
        ));
    }

    @GetMapping("/bookings")
    public ResponseEntity<Map<String, Object>> getBookings(HttpServletRequest request) {
        enforceAdmin(request);
        List<Booking> bookings = bookingService.getAllBookings();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "bookings", bookings,
                "count", bookings.size()
        ));
    }

    @DeleteMapping("/bookings")
    public ResponseEntity<Map<String, Object>> clearAllBookings(HttpServletRequest request) {
        enforceAdmin(request);
        long deletedCount = adminService.clearAllBookings();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Cleared " + deletedCount + " booking records",
                "deletedCount", deletedCount
        ));
    }
}
