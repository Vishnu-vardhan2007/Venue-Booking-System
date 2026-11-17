package com.venueverse.dto;

public class AuthResponse extends ApiResponse {
    private UserDto user;

    public AuthResponse() {
    }

    public AuthResponse(Boolean success, String message, UserDto user) {
        super(success, message);
        this.user = user;
    }

    public static AuthResponse of(boolean success, String message, UserDto user) {
        return new AuthResponse(success, message, user);
    }

    public UserDto getUser() {
        return user;
    }

    public void setUser(UserDto user) {
        this.user = user;
    }
}
