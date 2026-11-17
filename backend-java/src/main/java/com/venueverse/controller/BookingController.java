package com.venueverse.controller;

import com.venueverse.dto.ApiResponse;
import com.venueverse.dto.CreateBookingRequest;
import com.venueverse.exception.GlobalExceptionHandler.ForbiddenException;
import com.venueverse.exception.GlobalExceptionHandler.UnauthorizedException;
import com.venueverse.model.Booking;
import com.venueverse.security.AuthUser;
import com.venueverse.service.BookingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createBooking(
            @RequestBody CreateBookingRequest request,
            HttpServletRequest httpRequest) {
        AuthUser authUser = (AuthUser) httpRequest.getAttribute("authUser");
        if (authUser == null) {
            throw new UnauthorizedException("Access denied. Please log in first.");
        }

        Booking booking = bookingService.createBooking(request, authUser.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Booking confirmed successfully",
                "booking", booking
        ));
    }

    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyBookings(HttpServletRequest httpRequest) {
        AuthUser authUser = (AuthUser) httpRequest.getAttribute("authUser");
        if (authUser == null) {
            throw new UnauthorizedException("Access denied. Please log in first.");
        }

        List<Booking> bookings = bookingService.getUserBookings(authUser.getId());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "bookings", bookings,
                "count", bookings.size()
        ));
    }

    @GetMapping("/host")
    public ResponseEntity<Map<String, Object>> getHostBookings(HttpServletRequest httpRequest) {
        AuthUser authUser = (AuthUser) httpRequest.getAttribute("authUser");
        if (authUser == null) {
            throw new UnauthorizedException("Access denied. Please log in first.");
        }

        if (!"host".equalsIgnoreCase(authUser.getRole()) && !"admin".equalsIgnoreCase(authUser.getRole())) {
            throw new ForbiddenException("Access denied. Host role required.");
        }

        List<Booking> bookings = bookingService.getHostBookings(authUser.getId());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "bookings", bookings,
                "count", bookings.size()
        ));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelBooking(
            @PathVariable String id,
            HttpServletRequest httpRequest) {
        AuthUser authUser = (AuthUser) httpRequest.getAttribute("authUser");
        if (authUser == null) {
            throw new UnauthorizedException("Access denied. Please log in first.");
        }

        boolean isAdmin = "admin".equalsIgnoreCase(authUser.getRole());
        Booking cancelled = bookingService.cancelBooking(id, authUser.getId(), isAdmin);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Booking cancelled successfully",
                "booking", cancelled
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteBooking(
            @PathVariable String id,
            HttpServletRequest httpRequest) {
        AuthUser authUser = (AuthUser) httpRequest.getAttribute("authUser");
        if (authUser == null) {
            throw new UnauthorizedException("Access denied. Please log in first.");
        }

        boolean isAdmin = "admin".equalsIgnoreCase(authUser.getRole());
        bookingService.deleteBooking(id, authUser.getId(), isAdmin);

        return ResponseEntity.ok(ApiResponse.success("Booking deleted successfully"));
    }
}
