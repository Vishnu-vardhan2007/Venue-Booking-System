package com.venueverse.controller;

import com.venueverse.dto.ApiResponse;
import com.venueverse.dto.CreateVenueRequest;
import com.venueverse.exception.GlobalExceptionHandler.UnauthorizedException;
import com.venueverse.model.Venue;
import com.venueverse.security.AuthUser;
import com.venueverse.service.VenueService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/venues")
public class VenueController {

    private final VenueService venueService;

    public VenueController(VenueService venueService) {
        this.venueService = venueService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllVenues(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String q) {

        String searchQuery = (search != null && !search.isBlank()) ? search : q;
        List<Venue> venues = venueService.getAllVenues(category, city, minCapacity, maxPrice, searchQuery);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "venues", venues,
                "count", venues.size()
        ));
    }

    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyVenues(HttpServletRequest request) {
        AuthUser authUser = (AuthUser) request.getAttribute("authUser");
        if (authUser == null) {
            throw new UnauthorizedException("Access denied. Please log in first.");
        }

        List<Venue> venues = venueService.getVenuesByHost(authUser.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "venues", venues,
                "count", venues.size()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getVenueById(@PathVariable String id) {
        Venue venue = venueService.getVenueById(id);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "venue", venue
        ));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createVenue(
            @RequestBody CreateVenueRequest createRequest,
            HttpServletRequest httpRequest) {
        AuthUser authUser = (AuthUser) httpRequest.getAttribute("authUser");
        if (authUser == null) {
            throw new UnauthorizedException("Access denied. Please log in first.");
        }

        Venue venue = venueService.createVenue(createRequest, authUser.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Venue added successfully",
                "venue", venue
        ));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<Map<String, Object>> toggleVenueStatus(
            @PathVariable String id,
            HttpServletRequest httpRequest) {
        AuthUser authUser = (AuthUser) httpRequest.getAttribute("authUser");
        if (authUser == null) {
            throw new UnauthorizedException("Access denied. Please log in first.");
        }

        boolean isAdmin = "admin".equalsIgnoreCase(authUser.getRole());
        Venue toggled = venueService.toggleVenueActive(id, authUser.getId(), isAdmin);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", Boolean.TRUE.equals(toggled.getIsActive()) ? "Venue published" : "Venue moved to drafts",
                "venue", toggled
        ));
    }

    @PatchMapping("/{id}/blocked-dates")
    public ResponseEntity<Map<String, Object>> toggleBlockedDate(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest httpRequest) {
        AuthUser authUser = (AuthUser) httpRequest.getAttribute("authUser");
        if (authUser == null) {
            throw new UnauthorizedException("Access denied. Please log in first.");
        }

        String dateStr = body != null && body.get("date") != null ? String.valueOf(body.get("date")) : null;
        boolean block = true;
        if (body != null) {
            if (body.get("blocked") != null) {
                block = Boolean.parseBoolean(String.valueOf(body.get("blocked")));
            } else if (body.get("action") != null) {
                String actionStr = String.valueOf(body.get("action")).trim().toLowerCase();
                if ("unblock".equals(actionStr) || "false".equals(actionStr) || "remove".equals(actionStr)) {
                    block = false;
                }
            }
        }
        boolean isAdmin = "admin".equalsIgnoreCase(authUser.getRole());

        Venue updated = venueService.toggleBlockedDate(id, dateStr, block, authUser.getId(), isAdmin);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", block ? ("Date " + dateStr + " blocked") : ("Date " + dateStr + " unblocked"),
                "venue", updated
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteVenue(
            @PathVariable String id,
            HttpServletRequest httpRequest) {
        AuthUser authUser = (AuthUser) httpRequest.getAttribute("authUser");
        if (authUser == null) {
            throw new UnauthorizedException("Access denied. Please log in first.");
        }

        boolean isAdmin = "admin".equalsIgnoreCase(authUser.getRole());
        venueService.deleteVenue(id, authUser.getId(), isAdmin);

        return ResponseEntity.ok(ApiResponse.success("Venue deleted successfully"));
    }
}
