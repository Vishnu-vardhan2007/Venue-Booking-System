package com.venueverse.repository;

import com.venueverse.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByUser(Object user);

    List<Booking> findByVenue(Object venue);

    List<Booking> findByVenueIn(List<String> venues);

    List<Booking> findByStatus(String status);

    long countByStatus(String status);
}
