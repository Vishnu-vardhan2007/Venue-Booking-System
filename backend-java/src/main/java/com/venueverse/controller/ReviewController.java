package com.venueverse.controller;

import com.venueverse.dto.ApiResponse;
import com.venueverse.exception.GlobalExceptionHandler.ForbiddenException;
import com.venueverse.exception.GlobalExceptionHandler.UnauthorizedException;
import com.venueverse.model.Review;
import com.venueverse.model.Venue;
import com.venueverse.security.AuthUser;
import com.venueverse.service.ReviewService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/venues/{venueId}/reviews")
    public ResponseEntity<Map<String, Object>> getVenueReviews(@PathVariable String venueId) {
        List<Review> reviews = reviewService.getVenueReviews(venueId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "reviews", reviews,
                "count", reviews.size()
        ));
    }

    @PostMapping("/venues/{venueId}/reviews")
    public ResponseEntity<Map<String, Object>> createVenueReview(
            @PathVariable String venueId,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        AuthUser authUser = (AuthUser) request.getAttribute("authUser");
        if (authUser == null) {
            throw new UnauthorizedException("Please sign in to submit a review.");
        }

        Integer rating = null;
        if (body != null && body.get("rating") != null) {
            try {
                rating = Integer.parseInt(String.valueOf(body.get("rating")).trim());
            } catch (NumberFormatException ignored) {
                rating = null;
            }
        }
        String comment = body != null && body.get("comment") != null ? String.valueOf(body.get("comment")) : null;

        Review[] savedHolder = new Review[1];
        Venue updatedVenue = reviewService.addReviewAndRefreshVenue(venueId, authUser.getId(), rating, comment, savedHolder);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Review submitted successfully!",
                "review", savedHolder[0],
                "venueRating", updatedVenue.getRating() != null ? updatedVenue.getRating() : 0.0,
                "venueReviewsCount", updatedVenue.getReviewsCount() != null ? updatedVenue.getReviewsCount() : 0
        ));
    }

    @GetMapping("/reviews/top")
    public ResponseEntity<Map<String, Object>> getTopReviews(
            @RequestParam(defaultValue = "6") int limit) {
        List<Review> reviews = reviewService.getTopRatedReviews(limit);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "reviews", reviews,
                "count", reviews.size()
        ));
    }

    @GetMapping("/reviews/owner")
    public ResponseEntity<Map<String, Object>> getOwnerReviews(HttpServletRequest request) {
        AuthUser authUser = (AuthUser) request.getAttribute("authUser");
        if (authUser == null) {
            throw new UnauthorizedException("Please sign in first.");
        }
        List<Review> reviews = reviewService.getOwnerReviews(authUser.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "reviews", reviews,
                "count", reviews.size()
        ));
    }

    @GetMapping("/reviews")
    public ResponseEntity<Map<String, Object>> getAllReviews(HttpServletRequest request) {
        AuthUser authUser = (AuthUser) request.getAttribute("authUser");
        if (authUser == null) {
            throw new UnauthorizedException("Please sign in first.");
        }
        if (!"admin".equalsIgnoreCase(authUser.getRole())) {
            throw new ForbiddenException("Administrator access required.");
        }
        List<Review> reviews = reviewService.getAllReviews();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "reviews", reviews,
                "count", reviews.size()
        ));
    }

    @PatchMapping("/reviews/{reviewId}/response")
    public ResponseEntity<Map<String, Object>> respondToReview(
            @PathVariable String reviewId,
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        AuthUser authUser = (AuthUser) request.getAttribute("authUser");
        if (authUser == null) {
            throw new UnauthorizedException("Please sign in first.");
        }
        boolean isAdmin = "admin".equalsIgnoreCase(authUser.getRole());
        String responseText = body != null ? body.get("response") : null;
        Review updated = reviewService.respondToReview(reviewId, authUser.getId(), isAdmin, responseText);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Response saved successfully",
                "review", updated
        ));
    }

    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<ApiResponse> deleteReview(
            @PathVariable String reviewId,
            HttpServletRequest request) {
        AuthUser authUser = (AuthUser) request.getAttribute("authUser");
        if (authUser == null) {
            throw new UnauthorizedException("Please sign in first.");
        }
        if (!"admin".equalsIgnoreCase(authUser.getRole())) {
            throw new ForbiddenException("Only administrators can delete reviews.");
        }
        reviewService.deleteReview(reviewId);
        return ResponseEntity.ok(ApiResponse.success("Review deleted successfully"));
    }
}

