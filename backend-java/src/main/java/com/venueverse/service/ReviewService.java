package com.venueverse.service;

import com.venueverse.exception.GlobalExceptionHandler.BadRequestException;
import com.venueverse.exception.GlobalExceptionHandler.ForbiddenException;
import com.venueverse.exception.GlobalExceptionHandler.ResourceNotFoundException;
import com.venueverse.model.Review;
import com.venueverse.model.User;
import com.venueverse.model.Venue;
import com.venueverse.repository.ReviewRepository;
import com.venueverse.repository.UserRepository;
import com.venueverse.repository.VenueRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final VenueRepository venueRepository;
    private final UserRepository userRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         VenueRepository venueRepository,
                         UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.venueRepository = venueRepository;
        this.userRepository = userRepository;
    }

    public Venue addReviewAndRefreshVenue(String venueId, String userId, Integer rating, String comment, Review[] savedOut) {
        if (userId == null || userId.isBlank()) {
            throw new ForbiddenException("Authentication required to submit a review");
        }
        if (venueId == null || venueId.isBlank()) {
            throw new BadRequestException("Venue ID is required");
        }
        if (rating == null || rating < 1 || rating > 5) {
            throw new BadRequestException("Rating must be between 1 and 5 stars");
        }
        if (comment == null || comment.trim().length() < 3) {
            throw new BadRequestException("Please write a review comment (at least 3 characters)");
        }
        String cleanComment = comment.trim();
        if (cleanComment.length() > 1000) {
            cleanComment = cleanComment.substring(0, 1000);
        }

        Venue venue = venueRepository.findById(venueId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found"));

        if (!Boolean.TRUE.equals(venue.getIsActive())
                || "pending".equalsIgnoreCase(venue.getStatus())
                || "rejected".equalsIgnoreCase(venue.getStatus())) {
            throw new BadRequestException("Cannot review a venue that is not published");
        }

        User user = userRepository.findById(userId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        Review review = new Review();
        review.setVenueId(venue.getId());
        review.setVenueTitle(venue.getTitle());
        review.setVenueCategory(venue.getCategory());
        review.setVenueCity(venue.getCity());
        review.setUserId(user.getId());
        review.setUserName(user.getName() != null && !user.getName().isBlank() ? user.getName() : "Verified User");
        review.setRating(rating);
        review.setComment(cleanComment);
        review.setCreatedAt(Instant.now());
        review.setUpdatedAt(Instant.now());

        Review saved = reviewRepository.save(review);
        if (savedOut != null && savedOut.length > 0) {
            savedOut[0] = saved;
        }

        return recalculateVenueRating(venue);
    }

    public List<Review> getVenueReviews(String venueId) {
        if (venueId == null || venueId.isBlank()) {
            throw new BadRequestException("Venue ID is required");
        }
        return reviewRepository.findByVenueIdOrderByCreatedAtDesc(venueId.trim());
    }

    public List<Review> getTopRatedReviews(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 24));
        Map<String, Venue> activeVenuesById = new HashMap<>();
        for (Venue v : venueRepository.findAll()) {
            if (Boolean.TRUE.equals(v.getIsActive())
                    && !"pending".equalsIgnoreCase(v.getStatus())
                    && !"rejected".equalsIgnoreCase(v.getStatus())
                    && v.getId() != null) {
                activeVenuesById.put(v.getId(), v);
            }
        }

        List<Review> eligible = reviewRepository.findAllByOrderByRatingDescCreatedAtDesc().stream()
                .filter(r -> r.getVenueId() != null && activeVenuesById.containsKey(r.getVenueId()))
                .collect(Collectors.toList());

        if (eligible.isEmpty()) {
            return List.of();
        }

        List<Review> highRated = eligible.stream()
                .filter(r -> r.getRating() >= 4)
                .collect(Collectors.toCollection(ArrayList::new));

        List<Review> remainder = eligible.stream()
                .filter(r -> r.getRating() < 4)
                .collect(Collectors.toCollection(ArrayList::new));

        Collections.shuffle(highRated);
        highRated.sort((a, b) -> {
            return Integer.compare(b.getRating(), a.getRating());
        });

        List<Review> fiveStars = highRated.stream().filter(r -> r.getRating() == 5).collect(Collectors.toCollection(ArrayList::new));
        List<Review> fourStars = highRated.stream().filter(r -> r.getRating() == 4).collect(Collectors.toCollection(ArrayList::new));
        Collections.shuffle(fiveStars);
        Collections.shuffle(fourStars);

        List<Review> result = new ArrayList<>();
        result.addAll(fiveStars);
        if (result.size() < safeLimit) {
            result.addAll(fourStars);
        } else if (!fourStars.isEmpty()) {
            List<Review> topPool = new ArrayList<>(fiveStars);
            topPool.addAll(fourStars);
            Collections.shuffle(topPool);
            result = topPool;
        }
        if (result.size() < safeLimit && !remainder.isEmpty()) {
            remainder.sort((a, b) -> Integer.compare(b.getRating(), a.getRating()));
            result.addAll(remainder);
        }

        return result.size() > safeLimit ? new ArrayList<>(result.subList(0, safeLimit)) : result;
    }

    public List<Review> getOwnerReviews(String hostId) {
        if (hostId == null || hostId.isBlank()) {
            throw new BadRequestException("Host ID is required");
        }
        List<String> hostVenueIds = venueRepository.findAll().stream()
                .filter(v -> v.getHost() != null && v.getHost().toString().equals(hostId.trim()))
                .map(Venue::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (hostVenueIds.isEmpty()) {
            return List.of();
        }
        return reviewRepository.findByVenueIdInOrderByCreatedAtDesc(hostVenueIds);
    }

    public List<Review> getAllReviews() {
        return reviewRepository.findAll().stream()
                .sorted(Comparator.comparing(
                        (Review r) -> r.getCreatedAt() != null ? r.getCreatedAt() : Instant.EPOCH,
                        Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    public Review respondToReview(String reviewId, String callerId, boolean isAdmin, String responseText) {
        if (responseText == null || responseText.isBlank()) {
            throw new BadRequestException("Response message cannot be empty");
        }
        Review review = reviewRepository.findById(reviewId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        Venue venue = venueRepository.findById(review.getVenueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found"));

        if (!isAdmin && (venue.getHost() == null || !venue.getHost().toString().equals(callerId))) {
            throw new ForbiddenException("You are not authorized to respond to reviews for this venue");
        }

        review.setOwnerResponse(responseText.trim());
        review.setOwnerRespondedAt(Instant.now());
        review.setUpdatedAt(Instant.now());
        return reviewRepository.save(review);
    }

    public void deleteReview(String reviewId) {
        Review review = reviewRepository.findById(reviewId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        String venueId = review.getVenueId();
        reviewRepository.delete(review);
        if (venueId != null && !venueId.isBlank()) {
            venueRepository.findById(venueId).ifPresent(this::recalculateVenueRating);
        }
    }

    private Venue recalculateVenueRating(Venue venue) {
        List<Review> allForVenue = reviewRepository.findByVenueIdOrderByCreatedAtDesc(venue.getId());
        int count = allForVenue.size();
        double avg = count == 0 ? 0.0 : allForVenue.stream().mapToInt(Review::getRating).average().orElse(0.0);
        double roundedAvg = Math.round(avg * 10.0) / 10.0;
        venue.setReviewsCount(count);
        venue.setRating(roundedAvg);
        venue.setUpdatedAt(Instant.now());
        return venueRepository.save(venue);
    }
}

