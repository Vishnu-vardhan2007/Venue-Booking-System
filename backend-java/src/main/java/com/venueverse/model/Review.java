package com.venueverse.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "reviews")
public class Review extends BaseEntity {
    @Id
    @JsonProperty("_id")
    private String id;
    private String venueId;
    private String venueTitle;
    private String venueCategory;
    private String venueCity;
    private String userId;
    private String userName;
    private int rating;
    private String comment;
    private String ownerResponse;
    private Instant ownerRespondedAt;

    public Review() {
        super();
    }

    public Review(String venueId, String userId, int rating, String comment) {
        this();
        this.venueId = venueId;
        this.userId = userId;
        this.rating = rating;
        this.comment = comment;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getVenueId() {
        return venueId;
    }

    public void setVenueId(String venueId) {
        this.venueId = venueId;
    }

    public String getVenueTitle() {
        return venueTitle;
    }

    public void setVenueTitle(String venueTitle) {
        this.venueTitle = venueTitle;
    }

    public String getVenueCategory() {
        return venueCategory;
    }

    public void setVenueCategory(String venueCategory) {
        this.venueCategory = venueCategory;
    }

    public String getVenueCity() {
        return venueCity;
    }

    public void setVenueCity(String venueCity) {
        this.venueCity = venueCity;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getOwnerResponse() {
        return ownerResponse;
    }

    public void setOwnerResponse(String ownerResponse) {
        this.ownerResponse = ownerResponse;
    }

    public Instant getOwnerRespondedAt() {
        return ownerRespondedAt;
    }

    public void setOwnerRespondedAt(Instant ownerRespondedAt) {
        this.ownerRespondedAt = ownerRespondedAt;
    }

    @Override
    @JsonIgnore
    public String getEntitySummary() {
        return "Review[venue=" + venueId + ", rating=" + rating + "/5]";
    }
}

