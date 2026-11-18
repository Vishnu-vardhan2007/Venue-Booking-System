package com.venueverse.service;

import com.venueverse.dto.CreateBookingRequest;
import com.venueverse.exception.GlobalExceptionHandler.BadRequestException;
import com.venueverse.exception.GlobalExceptionHandler.CapacityExceededException;
import com.venueverse.exception.GlobalExceptionHandler.ForbiddenException;
import com.venueverse.exception.GlobalExceptionHandler.ResourceNotFoundException;
import com.venueverse.exception.GlobalExceptionHandler.VenueUnavailableException;
import com.venueverse.model.Booking;
import com.venueverse.model.User;
import com.venueverse.model.Venue;
import com.venueverse.repository.BookingRepository;
import com.venueverse.repository.UserRepository;
import com.venueverse.repository.VenueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final VenueRepository venueRepository;
    private final UserRepository userRepository;
    private final BookingConcurrencyManager defaultConcurrencyManager = new BookingConcurrencyManager();

    @Autowired(required = false)
    private BookingConcurrencyManager concurrencyManager;

    public BookingService(BookingRepository bookingRepository,
                          VenueRepository venueRepository,
                          UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.venueRepository = venueRepository;
        this.userRepository = userRepository;
    }

    private BookingConcurrencyManager resolveConcurrencyManager() {
        return concurrencyManager != null ? concurrencyManager : defaultConcurrencyManager;
    }

    public Booking createBooking(CreateBookingRequest request, User authenticatedUser) {
        if (authenticatedUser == null || authenticatedUser.getId() == null) {
            throw new ForbiddenException("Authentication required to create a booking");
        }
        return createBookingInternal(request, authenticatedUser.getId(), authenticatedUser);
    }

    public Booking createBooking(CreateBookingRequest request, String userId) {
        return createBookingInternal(request, userId, null);
    }

    private Booking createBookingInternal(CreateBookingRequest request, String userId, User preloadedUser) {
        if (userId == null || userId.isBlank()) {
            throw new ForbiddenException("Authentication required to create a booking");
        }
        if (request.getVenueId() == null || request.getVenueId().isBlank()) {
            throw new BadRequestException("Venue ID is required");
        }
        if (request.getGuests() == null || request.getGuests() < 1) {
            throw new BadRequestException("Number of guests must be at least 1");
        }

        Venue venue = venueRepository.findById(request.getVenueId().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found"));

        if (!Boolean.TRUE.equals(venue.getIsActive())
                || "pending".equalsIgnoreCase(venue.getStatus())
                || "rejected".equalsIgnoreCase(venue.getStatus())) {
            throw new VenueUnavailableException("This venue is currently unavailable for bookings");
        }

        if (venue.getHost() != null && venue.getHost().toString().equals(userId.trim())) {
            throw new ForbiddenException("Venue owners cannot book their own venue. Use Availability & Calendar to block dates instead.");
        }

        if (venue.getCapacity() != null && request.getGuests() > venue.getCapacity()) {
            throw new CapacityExceededException("Guest count (" + request.getGuests() +
                    ") exceeds venue capacity (" + venue.getCapacity() + ")");
        }

        Instant startDate = parseDate(request.getBookingDate());
        LocalDate startLocal = startDate.atZone(ZoneOffset.UTC).toLocalDate();
        if (startLocal.isBefore(LocalDate.now())) {
            throw new VenueUnavailableException("Past dates are unavailable and cannot be booked.");
        }

        Instant endDate = request.getEndDate() != null && !request.getEndDate().isBlank()
                ? parseDate(request.getEndDate())
                : startDate.plusSeconds(86400);

        if (endDate.isBefore(startDate)) {
            throw new BadRequestException("End date cannot be earlier than booking date");
        }
        if (endDate.equals(startDate)) {
            endDate = startDate.plusSeconds(86400);
        }

        LocalDate endLocal = endDate.atZone(ZoneOffset.UTC).toLocalDate();
        if (venue.getBlockedDates() != null && !venue.getBlockedDates().isEmpty()) {
            for (LocalDate d = startLocal; d.isBefore(endLocal); d = d.plusDays(1)) {
                if (venue.getBlockedDates().contains(d.toString())) {
                    throw new VenueUnavailableException("Venue is unavailable on " + d + " (blocked by the venue owner). Please choose another date.");
                }
            }
        }

        List<Booking> existingVenueBookings = bookingRepository.findByVenue(venue.getId());
        final Instant requestedEndDate = endDate;
        boolean hasConflict = existingVenueBookings.stream()
                .filter(b -> "confirmed".equalsIgnoreCase(b.getStatus()))
                .anyMatch(b -> {
                    Instant bStart = b.getBookingDate();
                    Instant bEnd = b.getEndDate();
                    if (bStart == null) return false;
                    if (bEnd == null || !bEnd.isAfter(bStart)) {
                        bEnd = bStart.plusSeconds(86400);
                    }
                    return startDate.isBefore(bEnd) && requestedEndDate.isAfter(bStart);
                });

        if (hasConflict) {
            throw new VenueUnavailableException("Venue is already booked on the selected date. Please choose another date.");
        }

        User user = preloadedUser != null
                ? preloadedUser
                : userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Double total = request.getTotalPrice();
        if (venue.getPricePerDay() != null && venue.getPricePerDay() > 0) {
            long days = Math.max(1L, java.time.temporal.ChronoUnit.DAYS.between(startLocal, endLocal));
            total = venue.calculateTotalPrice((int) days);
        } else if (total == null || total <= 0) {
            total = 10000.0;
        }

        String contact = request.getContact();
        if (contact == null || contact.isBlank()) {
            contact = user.getPhone() != null ? user.getPhone() : user.getEmail();
        }

        String requestedEventType = request.getEventType() != null ? request.getEventType().trim().toLowerCase() : "";
        List<String> supportedCategories = venue.getCategories();
        String resolvedEventType;
        if (!requestedEventType.isBlank()) {
            if (requestedEventType.contains(",")) {
                throw new BadRequestException("Please select only one event type for your booking");
            }
            if (!supportedCategories.isEmpty() && !venue.supportsCategory(requestedEventType)) {
                throw new BadRequestException("Selected event type '" + requestedEventType + "' is not supported by this venue");
            }
            resolvedEventType = requestedEventType;
        } else {
            resolvedEventType = !supportedCategories.isEmpty() ? supportedCategories.get(0) : venue.getCategory();
        }

        String initialStatus = "confirmed";

        String venueImg = (venue.getImages() != null && !venue.getImages().isEmpty())
                ? venue.getImages().get(0)
                : "";

        Booking booking = new Booking();
        booking.setUser(user.getId());
        booking.setVenue(venue.getId());
        booking.setBookingDate(startDate);
        booking.setEndDate(endDate);
        booking.setGuests(request.getGuests());
        booking.setTotalPrice(total);
        booking.setContact(contact);
        booking.setHostMessage(request.getHostMessage());
        booking.setEventType(resolvedEventType);
        booking.withStatus(initialStatus);
        booking.setBookingType("direct");
        booking.setVenueTitle(venue.getTitle());
        booking.setVenueImage(venueImg);
        booking.setUserName(user.getName());
        booking.setUserEmail(user.getEmail());
        booking.setCreatedAt(Instant.now());
        booking.setUpdatedAt(Instant.now());

        Booking saved = bookingRepository.save(booking);
        BookingConcurrencyManager manager = resolveConcurrencyManager();
        manager.safeValidateSlot(venue.getId(), false);
        manager.recordAsync(saved != null ? saved.getId() : "pending");
        return saved;
    }

    public List<Booking> getUserBookings(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new BadRequestException("User ID is required");
        }
        List<Booking> bookings = bookingRepository.findByUser(userId.trim());
        populateBookingMetadata(bookings);
        return sortBookingsNewestFirst(bookings);
    }

    public List<Booking> getHostBookings(String hostId) {
        if (hostId == null || hostId.isBlank()) {
            throw new BadRequestException("Host ID is required");
        }
        String cleanHostId = hostId.trim();
        List<Venue> hostVenues = venueRepository.findAll().stream()
                .filter(v -> v.getHost() != null && v.getHost().toString().equals(cleanHostId))
                .collect(Collectors.toList());
        List<String> venueIds = hostVenues.stream()
                .map(Venue::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (venueIds.isEmpty()) {
            return List.of();
        }

        List<Booking> bookings = bookingRepository.findByVenueIn(venueIds);
        populateBookingMetadata(bookings);
        return sortBookingsNewestFirst(bookings);
    }

    public Booking cancelBooking(String bookingId, String userId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (!isAdmin && (booking.getUser() == null || !booking.getUser().equals(userId))) {
            throw new ForbiddenException("You are not authorized to cancel this booking");
        }

        if ("cancelled".equalsIgnoreCase(booking.getStatus())) {
            throw new BadRequestException("Booking is already cancelled");
        }

        booking.setStatus("cancelled");
        booking.setCancelledBy(isAdmin ? "admin" : "user");
        booking.setUpdatedAt(Instant.now());
        return bookingRepository.save(booking);
    }

    public List<Booking> getAllBookings() {
        List<Booking> bookings = bookingRepository.findAll();
        populateBookingMetadata(bookings);
        return sortBookingsNewestFirst(bookings);
    }

    private List<Booking> sortBookingsNewestFirst(List<Booking> bookings) {
        return bookings.stream()
                .sorted(Comparator.comparing(
                        (Booking b) -> AdminService.extractSortTimestamp(b.getCreatedAt(), b.getId()),
                        Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    public void deleteBooking(String id, String userId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (!isAdmin && !booking.getUser().equals(userId)) {
            throw new ForbiddenException("Not authorized to delete this booking");
        }
        bookingRepository.delete(booking);
    }

    private void populateBookingMetadata(List<Booking> bookings) {
        for (Booking b : bookings) {
            if (b.getVenueTitle() == null && b.getVenue() != null) {
                venueRepository.findById(b.getVenue()).ifPresent(v -> {
                    b.setVenueTitle(v.getTitle());
                    if (v.getImages() != null && !v.getImages().isEmpty()) {
                        b.setVenueImage(v.getImages().get(0));
                    }
                });
            }
            if (b.getUserName() == null && b.getUser() != null) {
                userRepository.findById(b.getUser()).ifPresent(u -> {
                    b.setUserName(u.getName());
                    b.setUserEmail(u.getEmail());
                });
            }
        }
    }

    private Instant parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return Instant.now().plusSeconds(86400);
        }
        try {
            if (dateStr.length() == 10 && dateStr.contains("-")) {
                LocalDate ld = LocalDate.parse(dateStr.trim());
                return ld.atStartOfDay().toInstant(ZoneOffset.UTC);
            }
            return Instant.parse(dateStr.trim());
        } catch (Exception e) {
            return Instant.now().plusSeconds(86400);
        }
    }
}
