package com.venueverse.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class CreateVenueRequest {
    private String title;
    private String description;
    private String category;
    private List<String> categories = new ArrayList<>();
    private String city;
    private String address;
    private Integer capacity;

    @JsonAlias({"price", "price_per_day"})
    private Double pricePerDay;
    private List<String> images = new ArrayList<>();
    private List<String> amenities = new ArrayList<>();
    private String bookingType = "direct";
    private Double lat;
    private Double lng;

    public CreateVenueRequest() {
    }

    public String getBookingType() {
        return bookingType;
    }

    public void setBookingType(String bookingType) {
        this.bookingType = bookingType;
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
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public List<String> getCategories() {
        return categories;
    }

    public void setCategories(List<String> categories) {
        this.categories = categories != null ? categories : new ArrayList<>();
    }

    public List<String> resolveCategories() {
        Set<String> resolved = new LinkedHashSet<>();
        if (categories != null) {
            for (String item : categories) {
                if (item != null && !item.isBlank()) {
                    for (String part : item.split(",")) {
                        if (!part.isBlank()) {
                            resolved.add(part.trim().toLowerCase());
                        }
                    }
                }
            }
        }
        if (resolved.isEmpty() && category != null && !category.isBlank()) {
            for (String part : category.split(",")) {
                if (!part.isBlank()) {
                    resolved.add(part.trim().toLowerCase());
                }
            }
        }
        return new ArrayList<>(resolved);
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
}
