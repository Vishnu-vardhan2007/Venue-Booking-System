package com.venueverse.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import java.time.Instant;

public class CreateBookingRequest {
    @JsonAlias({ "venue", "venue_id" })
    private String venueId;

    @JsonAlias({ "startDate", "date" })
    private String bookingDate;

    private String endDate;

    @JsonAlias({ "guestCount", "guestsCount" })
    private Integer guests;

    private Double totalPrice;
    private String contact;
    private String hostMessage;

    @JsonAlias({ "event_type", "occasion", "category" })
    private String eventType;

    public CreateBookingRequest() {
    }

    public String getVenueId() {
        return venueId;
    }

    public void setVenueId(String venueId) {
        this.venueId = venueId;
    }

    public String getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(String bookingDate) {
        this.bookingDate = bookingDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    public Integer getGuests() {
        return guests;
    }

    public void setGuests(Integer guests) {
        this.guests = guests;
    }

    public Double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(Double totalPrice) {
        this.totalPrice = totalPrice;
    }

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public String getHostMessage() {
        return hostMessage;
    }

    public void setHostMessage(String hostMessage) {
        this.hostMessage = hostMessage;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }
}
