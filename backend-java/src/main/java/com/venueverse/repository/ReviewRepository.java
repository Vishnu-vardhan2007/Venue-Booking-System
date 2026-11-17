package com.venueverse.repository;

import com.venueverse.model.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findByVenueIdOrderByCreatedAtDesc(String venueId);
    List<Review> findByVenueIdInOrderByCreatedAtDesc(List<String> venueIds);
    List<Review> findAllByOrderByRatingDescCreatedAtDesc();
    void deleteByVenueId(String venueId);
}

