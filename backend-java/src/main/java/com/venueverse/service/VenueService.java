package com.venueverse.service;

import com.venueverse.dto.CreateVenueRequest;
import com.venueverse.exception.GlobalExceptionHandler.BadRequestException;
import com.venueverse.exception.GlobalExceptionHandler.ForbiddenException;
import com.venueverse.exception.GlobalExceptionHandler.ResourceNotFoundException;
import com.venueverse.model.BaseEntity;
import com.venueverse.model.Booking;
import com.venueverse.model.User;
import com.venueverse.model.Venue;
import com.venueverse.model.VenueOwner;
import com.venueverse.repository.BookingRepository;
import com.venueverse.repository.ReviewRepository;
import com.venueverse.repository.UserRepository;
import com.venueverse.repository.VenueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class VenueService {

    private final VenueRepository venueRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    @Autowired(required = false)
    private ReviewRepository reviewRepository;

    public VenueService(VenueRepository venueRepository, UserRepository userRepository) {
        this(venueRepository, userRepository, null);
    }

    @Autowired
    public VenueService(VenueRepository venueRepository,
                        UserRepository userRepository,
                        BookingRepository bookingRepository) {
        this.venueRepository = venueRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
    }

    public List<Venue> getAllVenues(String category, String city) {
        return getAllVenues(category, city, null, null, null);
    }

    public double calculateEstimate(Venue venue, int days) {
        return venue != null ? venue.calculateTotalPrice(days) : 0.0;
    }

    public double calculateEstimate(Venue venue, int days, double discountPercent) {
        return venue != null ? venue.calculateTotalPrice(days, discountPercent) : 0.0;
    }

    public <T> List<T> paginate(List<T> items, int page, int size) {
        if (items == null || items.isEmpty()) return List.of();
        int safeSize = Math.max(1, size);
        int from = Math.min((Math.max(1, page) - 1) * safeSize, items.size());
        int to = Math.min(from + safeSize, items.size());
        return items.subList(from, to);
    }

    public <T extends BaseEntity> List<String> getSummaries(List<T> items) {
        if (items == null) return List.of();
        List<String> list = new ArrayList<>();
        for (T item : items) {
            if (item instanceof VenueOwner) {
                VenueOwner host = (VenueOwner) item;
                list.add("[HOST] " + host.getEntitySummary());
            } else {
                list.add(item.getEntitySummary());
            }
        }
        return list;
    }

    public List<Venue> getAllVenues(String category, String city, Integer minCapacity, Double maxPrice, String search) {
        List<Venue> allVenues = venueRepository.findAll();

        List<Venue> filtered = allVenues.stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsActive()))
                .filter(v -> "approved".equalsIgnoreCase(v.getStatus()) || "published".equalsIgnoreCase(v.getStatus()))
                .filter(v -> {
                    if (category == null || category.isBlank() || category.equalsIgnoreCase("all")) {
                        return true;
                    }
                    return v.supportsCategory(category.trim());
                })
                .filter(v -> {
                    if (city == null || city.isBlank() || city.equalsIgnoreCase("Everywhere") || city.equalsIgnoreCase("all")) {
                        return true;
                    }
                    return v.getCity() != null && v.getCity().toLowerCase().contains(city.trim().toLowerCase());
                })
                .filter(v -> {
                    if (minCapacity == null || minCapacity <= 0) {
                        return true;
                    }
                    return v.getCapacity() != null && v.getCapacity() >= minCapacity;
                })
                .filter(v -> {
                    if (maxPrice == null || maxPrice <= 0) {
                        return true;
                    }
                    return v.getPricePerDay() != null && v.getPricePerDay() <= maxPrice;
                })
                .filter(v -> {
                    if (search == null || search.isBlank()) {
                        return true;
                    }
                    String q = search.trim().toLowerCase();
                    boolean matchTitle = v.getTitle() != null && v.getTitle().toLowerCase().contains(q);
                    boolean matchDesc = v.getDescription() != null && v.getDescription().toLowerCase().contains(q);
                    boolean matchCity = v.getCity() != null && v.getCity().toLowerCase().contains(q);
                    boolean matchAddr = v.getAddress() != null && v.getAddress().toLowerCase().contains(q);
                    boolean matchCat = v.getCategories().stream().anyMatch(c -> c != null && c.toLowerCase().contains(q));
                    return matchTitle || matchDesc || matchCity || matchAddr || matchCat;
                })
                .sorted(Comparator.comparing(
                        (Venue v) -> AdminService.extractSortTimestamp(v.getCreatedAt(), v.getId()),
                        Comparator.reverseOrder()))
                .collect(Collectors.toList());

        return enrichVenues(filtered);
    }

    public Venue getVenueById(String id) {
        if (id == null || id.isBlank()) {
            throw new BadRequestException("Venue ID is required");
        }
        Venue venue = venueRepository.findById(id.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found with id: " + id));
        return enrichVenues(List.of(venue)).get(0);
    }

    public List<Venue> getVenuesByHost(String hostId) {
        if (hostId == null || hostId.isBlank()) {
            throw new BadRequestException("Host ID is required");
        }
        List<Venue> all = venueRepository.findAll();
        List<Venue> hostVenues = all.stream()
                .filter(v -> v.getHost() != null && v.getHost().toString().equals(hostId.trim()))
                .sorted(Comparator.comparing(
                        (Venue v) -> AdminService.extractSortTimestamp(v.getCreatedAt(), v.getId()),
                        Comparator.reverseOrder()))
                .collect(Collectors.toList());
        return enrichVenues(hostVenues);
    }

    public Venue createVenue(CreateVenueRequest request, String hostId) {
        List<String> resolvedCategories = request.resolveCategories();
        if (request.getTitle() == null || request.getTitle().isBlank() ||
            request.getDescription() == null || request.getDescription().isBlank() ||
            resolvedCategories.isEmpty() ||
            request.getCity() == null || request.getCity().isBlank() ||
            request.getAddress() == null || request.getAddress().isBlank() ||
            request.getCapacity() == null || request.getCapacity() < 1 ||
            request.getPricePerDay() == null || request.getPricePerDay() < 0) {
            throw new BadRequestException("All venue fields with valid positive capacity and price are required");
        }

        User user = userRepository.findById(hostId)
                .orElseThrow(() -> new ResourceNotFoundException("Host not found"));

        VenueOwner host = VenueOwner.fromUser(user);
        if (!host.isAuthorizedHost()) {
            throw new ForbiddenException("Only authenticated venue owners are allowed to add venues");
        }

        List<String> images = (request.getImages() != null && !request.getImages().isEmpty())
                ? request.getImages()
                : List.of("assets/venue-ballroom.jpg");

        double[] defaultCoords = getDefaultCityCoordinates(request.getCity());

        Venue venue = new Venue();
        venue.setTitle(request.getTitle().trim());
        venue.setDescription(request.getDescription().trim());
        venue.setCategories(resolvedCategories);
        venue.setCategory(resolvedCategories.get(0));
        venue.setCity(request.getCity().trim());
        venue.setAddress(request.getAddress().trim());
        venue.setCapacity(request.getCapacity());
        venue.setPricePerDay(request.getPricePerDay());
        venue.setImages(images);
        venue.setAmenities(request.getAmenities() != null ? request.getAmenities() : List.of());
        venue.setBookingType("direct");
        venue.setLat(request.getLat() != null ? request.getLat() : defaultCoords[0]);
        venue.setLng(request.getLng() != null ? request.getLng() : defaultCoords[1]);
        venue.setHost(host.getId());
        venue.setHostName(host.getName());
        venue.setStatus("pending");
        venue.setIsActive(false);
        venue.setCreatedAt(Instant.now());
        venue.setUpdatedAt(Instant.now());

        return venueRepository.save(venue);
    }

    public Venue toggleVenueActive(String venueId, String hostId, boolean isAdmin) {
        Venue venue = getVenueById(venueId);

        if (!isAdmin && (venue.getHost() == null || !venue.getHost().toString().equals(hostId))) {
            throw new ForbiddenException("You are not authorized to manage this venue");
        }
        if (!isAdmin && ("pending".equalsIgnoreCase(venue.getStatus()) || "rejected".equalsIgnoreCase(venue.getStatus()))) {
            throw new ForbiddenException("Admin approval is required before publishing this venue.");
        }

        venue.setIsActive(!Boolean.TRUE.equals(venue.getIsActive()));
        venue.setUpdatedAt(Instant.now());
        return venueRepository.save(venue);
    }

    public Venue toggleBlockedDate(String venueId, String dateStr, boolean block, String callerId, boolean isAdmin) {
        if (dateStr == null || dateStr.isBlank()) {
            throw new BadRequestException("Date (YYYY-MM-DD) is required");
        }
        LocalDate targetDate;
        try {
            targetDate = LocalDate.parse(dateStr.trim());
        } catch (Exception e) {
            throw new BadRequestException("Invalid date format. Expected YYYY-MM-DD");
        }
        if (targetDate.isBefore(LocalDate.now())) {
            throw new BadRequestException("Past dates are unavailable and cannot be modified.");
        }

        Venue venue = venueRepository.findById(venueId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found with id: " + venueId));

        if (!isAdmin && (venue.getHost() == null || !venue.getHost().toString().equals(callerId))) {
            throw new ForbiddenException("You are not authorized to manage availability for this venue");
        }

        String normalizedDate = targetDate.toString();
        if (block && bookingRepository != null && venue.getId() != null) {
            List<Booking> bookings = bookingRepository.findByVenue(venue.getId());
            if (bookings != null) {
                boolean hasConfirmedOnDay = bookings.stream()
                        .filter(b -> "confirmed".equalsIgnoreCase(b.getStatus()) && b.getBookingDate() != null)
                        .anyMatch(b -> {
                            LocalDate start = b.getBookingDate().atZone(ZoneOffset.UTC).toLocalDate();
                            LocalDate end = b.getEndDate() != null ? b.getEndDate().atZone(ZoneOffset.UTC).toLocalDate() : start.plusDays(1);
                            if (!end.isAfter(start)) end = start.plusDays(1);
                            return !targetDate.isBefore(start) && targetDate.isBefore(end);
                        });
                if (hasConfirmedOnDay) {
                    throw new BadRequestException("Cannot block this date because it already has a confirmed customer booking.");
                }
            }
        }

        Set<String> blockedSet = new LinkedHashSet<>(venue.getBlockedDates());
        if (block) {
            blockedSet.add(normalizedDate);
        } else {
            blockedSet.remove(normalizedDate);
        }
        venue.setBlockedDates(new ArrayList<>(blockedSet));
        venue.setUpdatedAt(Instant.now());
        Venue saved = venueRepository.save(venue);
        return enrichVenues(List.of(saved)).get(0);
    }

    public void deleteVenue(String venueId, String hostId, boolean isAdmin) {
        Venue venue = getVenueById(venueId);

        if (!isAdmin && (venue.getHost() == null || !venue.getHost().toString().equals(hostId))) {
            throw new ForbiddenException("You are not authorized to delete this venue");
        }

        venueRepository.delete(venue);
        if (reviewRepository != null) {
            reviewRepository.deleteByVenueId(venue.getId());
        }
    }

    private List<Venue> enrichVenues(List<Venue> venues) {
        if (venues == null || venues.isEmpty()) {
            return venues;
        }
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
            Set<String> dates = new LinkedHashSet<>();
            if (v.getBlockedDates() != null) {
                dates.addAll(v.getBlockedDates());
            }
            if (bookingRepository != null && v.getId() != null) {
                List<Booking> bookings = bookingRepository.findByVenue(v.getId());
                if (bookings != null && !bookings.isEmpty()) {
                    for (Booking b : bookings) {
                        if ("confirmed".equalsIgnoreCase(b.getStatus()) && b.getBookingDate() != null) {
                            LocalDate start = b.getBookingDate().atZone(ZoneOffset.UTC).toLocalDate();
                            LocalDate end = b.getEndDate() != null
                                    ? b.getEndDate().atZone(ZoneOffset.UTC).toLocalDate()
                                    : start.plusDays(1);
                            if (!end.isAfter(start)) {
                                end = start.plusDays(1);
                            }
                            for (LocalDate d = start; d.isBefore(end); d = d.plusDays(1)) {
                                dates.add(d.toString());
                            }
                        }
                    }
                }
            }
            v.setBookedDates(new ArrayList<>(dates));
        }
        return venues;
    }

    private double[] getDefaultCityCoordinates(String city) {
        if (city == null) return new double[]{23.0225, 72.5714};
        String c = city.trim().toLowerCase();
        if (c.contains("gandhinagar")) return new double[]{23.2156, 72.6369};
        if (c.contains("surat")) return new double[]{21.1702, 72.8311};
        if (c.contains("rajkot")) return new double[]{22.3039, 70.8022};
        if (c.contains("vadodara")) return new double[]{22.3072, 73.1812};
        return new double[]{23.0225, 72.5714};
    }
}
