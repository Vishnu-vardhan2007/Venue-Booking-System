package com.venueverse.repository;

import com.venueverse.model.Venue;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface VenueRepository extends MongoRepository<Venue, String> {
    List<Venue> findByHost(Object host);

    List<Venue> findByIsActiveTrue();

    List<Venue> findByCityIgnoreCase(String city);

    List<Venue> findByCategoryIgnoreCase(String category);

    long countByStatus(String status);

    long countByIsActiveTrue();
}
