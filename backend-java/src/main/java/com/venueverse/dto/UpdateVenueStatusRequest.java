package com.venueverse.dto;

public class UpdateVenueStatusRequest {
    private String status;

    public UpdateVenueStatusRequest() {
    }

    public UpdateVenueStatusRequest(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
