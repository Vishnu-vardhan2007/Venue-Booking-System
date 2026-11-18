package com.venueverse.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Document(collection = "venues")
public class Venue extends BaseEntity {
    public static final String DEFAULT_BOOKING_TYPE = "direct";
    public static final int MIN_CAPACITY_LIMIT = 1;

    @Id
    @JsonProperty("_id")
    private String id;
    private String title;
    private String description;
    private String category;
    private List<String> categories = new ArrayList<>();
    private String city;
    private String address;
    private Integer capacity;
    private Double pricePerDay;
    private List<String> images = new ArrayList<>();
    private List<String> amenities = new ArrayList<>();
    private Object host;
    private String hostName;
    private String status = "pending";
    private Boolean isActive = false;
    private String bookingType = DEFAULT_BOOKING_TYPE;
    private Double rating = 0.0;
    private Integer reviewsCount = 0;
    private Double lat;
    private Double lng;
    private List<String> blockedDates = new ArrayList<>();
    @Transient
    private List<String> bookedDates = new ArrayList<>();

    public Venue() {
        super();
    }

    public Venue(String title, String category, String city, Integer capacity, Double pricePerDay) {
        this();
        this.title = title;
        setCategory(category);
        this.city = city;
        this.capacity = capacity;
        this.pricePerDay = pricePerDay;
    }

    public Venue(String title, List<String> categories, String city, Integer capacity, Double pricePerDay) {
        this();
        this.title = title;
        setCategories(categories);
        this.city = city;
        this.capacity = capacity;
        this.pricePerDay = pricePerDay;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        if ((category == null || category.isBlank()) && categories != null && !categories.isEmpty()) {
            return categories.get(0);
        }
        return category;
    }

    public void setCategory(String category) {
        if (category == null || category.isBlank()) {
            this.category = category;
            return;
        }
        String normalized = category.trim().toLowerCase();
        this.category = normalized;
        if (this.categories == null || this.categories.isEmpty()) {
            this.categories = new ArrayList<>();
            this.categories.add(normalized);
        } else if (!this.categories.contains(normalized)) {
            this.categories.add(0, normalized);
        }
    }

    public List<String> getCategories() {
        if ((categories == null || categories.isEmpty()) && category != null && !category.isBlank()) {
            List<String> fallback = new ArrayList<>();
            fallback.add(category.trim().toLowerCase());
            return fallback;
        }
        return categories != null ? categories : new ArrayList<>();
    }

    public void setCategories(List<String> categories) {
        Set<String> cleaned = new LinkedHashSet<>();
        if (categories != null) {
            for (String item : categories) {
                if (item != null && !item.isBlank()) {
                    cleaned.add(item.trim().toLowerCase());
                }
            }
        }
        this.categories = new ArrayList<>(cleaned);
        if (!this.categories.isEmpty()) {
            this.category = this.categories.get(0);
        } else if (this.category != null && !this.category.isBlank()) {
            this.categories.add(this.category.trim().toLowerCase());
        }
    }

    @JsonIgnore
    public boolean supportsCategory(String targetCategory) {
        if (targetCategory == null || targetCategory.isBlank()) {
            return false;
        }
        String cleanTarget = targetCategory.trim().toLowerCase();
        for (String cat : getCategories()) {
            if (cat != null && cat.trim().toLowerCase().equals(cleanTarget)) {
                return true;
            }
        }
        return false;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Double getPricePerDay() {
        return pricePerDay;
    }

    public void setPricePerDay(Double pricePerDay) {
        this.pricePerDay = pricePerDay;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images != null ? images : new ArrayList<>();
    }

    public List<String> getAmenities() {
        return amenities;
    }

    public void setAmenities(List<String> amenities) {
        this.amenities = amenities != null ? amenities : new ArrayList<>();
    }

    public Object getHost() {
        return host;
    }

    public void setHost(Object host) {
        this.host = host;
    }

    public String getHostName() {
        return hostName;
    }

    public void setHostName(String hostName) {
        this.hostName = hostName;
    }

    public List<String> getBlockedDates() {
        return blockedDates;
    }

    public void setBlockedDates(List<String> blockedDates) {
        this.blockedDates = blockedDates != null ? blockedDates : new ArrayList<>();
    }

    public List<String> getBookedDates() {
        return bookedDates;
    }

    public void setBookedDates(List<String> bookedDates) {
        this.bookedDates = bookedDates != null ? bookedDates : new ArrayList<>();
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }

    public String getBookingType() {
        return bookingType;
    }

    public void setBookingType(String bookingType) {
        this.bookingType = bookingType != null ? bookingType : DEFAULT_BOOKING_TYPE;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public Integer getReviewsCount() {
        return reviewsCount;
    }

    public void setReviewsCount(Integer reviewsCount) {
        this.reviewsCount = reviewsCount;
    }

    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    public Double getLng() {
        return lng;
    }

    public void setLng(Double lng) {
        this.lng = lng;
    }

    @JsonIgnore
    public double calculateTotalPrice(int days) {
        return calculateTotalPrice(days, 0.0);
    }

    @JsonIgnore
    public double calculateTotalPrice(int days, double discountPercent) {
        int validDays = Math.max(1, days);
        double rate = pricePerDay != null ? pricePerDay : 0.0;
        double safeDiscount = Math.max(0.0, Math.min(50.0, discountPercent));
        return Math.round(rate * validDays * (1.0 - safeDiscount / 100.0));
    }

    @Override
    @JsonIgnore
    public String getEntitySummary() {
        return "Venue[" + title + ", city=" + city + ", capacity=" + capacity + "]";
    }

    @JsonIgnore
    public AvailabilityWindow openAvailabilityWindow() {
        return new AvailabilityWindow();
    }

    public static final class PricingBreakdown {
        private final double totalAmount;

        public PricingBreakdown(double dailyRate, int days) {
            this.totalAmount = Math.max(0.0, dailyRate) * Math.max(1, days);
        }

        public double getTotalAmount() {
            return totalAmount;
        }
    }

    public class AvailabilityWindow {
        public boolean isDateOpen(String dateIso) {
            if (dateIso == null || dateIso.isBlank()) return false;
            boolean blocked = blockedDates != null && blockedDates.contains(dateIso);
            boolean booked = bookedDates != null && bookedDates.contains(dateIso);
            return !blocked && !booked;
        }
    }
}
