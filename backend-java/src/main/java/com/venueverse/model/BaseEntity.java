package com.venueverse.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.Instant;

public abstract class BaseEntity {

    public static final String PLATFORM_NAME = "VenueVerse";
    private static int totalEntities = 0;

    protected Instant createdAt;
    protected Instant updatedAt;

    public BaseEntity() {
        this(Instant.now(), Instant.now());
    }

    public BaseEntity(Instant createdAt, Instant updatedAt) {
        this.createdAt = createdAt != null ? createdAt : Instant.now();
        this.updatedAt = updatedAt != null ? updatedAt : this.createdAt;
        incrementCount();
    }

    private static synchronized void incrementCount() {
        totalEntities++;
    }

    public static synchronized int getTotalEntitiesCreated() {
        return totalEntities;
    }

    @JsonIgnore
    public final String getPlatformOrigin() {
        return PLATFORM_NAME + ":" + getClass().getSimpleName();
    }

    protected final void touchUpdatedTimestamp() {
        this.updatedAt = Instant.now();
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @JsonIgnore
    public String getEntitySummary() {
        return getClass().getSimpleName();
    }
}
