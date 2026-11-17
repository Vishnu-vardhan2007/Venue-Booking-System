package com.venueverse.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "bookings")
public class Booking extends BaseEntity {

    @Id
    @JsonProperty("_id")
    private String id;

    private String user;
    private String venue;
    private Instant bookingDate;
    private Instant endDate;
    private Integer guests;
    private Double totalPrice;
    private String hostMessage;
    private String eventType;
    private String contact;
    private String status = "confirmed";
    private String bookingType = "direct";
    private String cancelledBy;
    private String venueTitle;
    private String venueImage;
    private String userName;
    private String userEmail;

    public Booking() {
        super();
    }

    public Booking(String user, String venue, Instant bookingDate, Instant endDate,
            Integer guests, Double totalPrice, String contact) {
        super();
        this.user = user;
        this.venue = venue;
        this.bookingDate = bookingDate;
        this.endDate = endDate;
        this.guests = guests;
        this.totalPrice = totalPrice;
        this.contact = contact;
        this.status = "pending";
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public Instant getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(Instant bookingDate) {
        this.bookingDate = bookingDate;
    }

    public Instant getEndDate() {
        return endDate;
    }

    public void setEndDate(Instant endDate) {
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

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @JsonIgnore
    public Booking withStatus(String status) {
        this.status = status;
        touchUpdatedTimestamp();
        return this;
    }

    public String getBookingType() {
        return bookingType;
    }

    public void setBookingType(String bookingType) {
        this.bookingType = bookingType;
    }

    public String getCancelledBy() {
        return cancelledBy;
    }

    public void setCancelledBy(String cancelledBy) {
        this.cancelledBy = cancelledBy;
    }

    public String getVenueTitle() {
        return venueTitle;
    }

    public void setVenueTitle(String venueTitle) {
        this.venueTitle = venueTitle;
    }

    public String getVenueImage() {
        return venueImage;
    }

    public void setVenueImage(String venueImage) {
        this.venueImage = venueImage;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    @Override
    @JsonIgnore
    public String getEntitySummary() {
        return "Booking[" + id + ", venue=" + venue + ", status=" + status + "]";
    }

    public static final class CancellationPolicy {
        public static final double FULL_REFUND_WINDOW_DAYS = 7.0;

        private CancellationPolicy() {
        }

        public static double calculateRefundAmount(double totalAmount, long daysBeforeEvent) {
            if (totalAmount <= 0) {
                return 0.0;
            }
            if (daysBeforeEvent >= FULL_REFUND_WINDOW_DAYS) {
                return totalAmount;
            }
            if (daysBeforeEvent >= 2) {
                return totalAmount * 0.5;
            }
            return 0.0;
        }
    }
}
