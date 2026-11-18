package com.venueverse.exception;

import com.venueverse.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    public static class AppException extends RuntimeException {
        private final HttpStatus status;
        private final String errorCode;

        public AppException(String message, HttpStatus status, String errorCode) {
            super(message);
            this.status = status;
            this.errorCode = errorCode;
        }

        public HttpStatus getStatus() {
            return status;
        }

        public String getErrorCode() {
            return errorCode;
        }
    }

    public static class BadRequestException extends AppException {
        public BadRequestException(String message) {
            super(message, HttpStatus.BAD_REQUEST, "BAD_REQUEST");
        }

        public BadRequestException(String message, String code) {
            super(message, HttpStatus.BAD_REQUEST, code);
        }
    }

    public static class CapacityExceededException extends BadRequestException {
        public CapacityExceededException(String message) {
            super(message, "CAPACITY_EXCEEDED");
        }
    }

    public static class VenueUnavailableException extends BadRequestException {
        public VenueUnavailableException(String message) {
            super(message, "VENUE_UNAVAILABLE");
        }
    }

    public static class UnauthorizedException extends AppException {
        public UnauthorizedException(String message) {
            super(message, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
        }
    }

    public static class ForbiddenException extends AppException {
        public ForbiddenException(String message) {
            super(message, HttpStatus.FORBIDDEN, "FORBIDDEN");
        }
    }

    public static class ResourceNotFoundException extends AppException {
        public ResourceNotFoundException(String message) {
            super(message, HttpStatus.NOT_FOUND, "NOT_FOUND");
        }
    }

    public static class BookingCheckException extends Exception {
        public BookingCheckException(String message) {
            super(message);
        }
    }

    public static class SlotConflictException extends BookingCheckException {
        public SlotConflictException(String message) {
            super(message);
        }
    }

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse> handleAppException(AppException ex) {
        return ResponseEntity.status(ex.getStatus()).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleGeneralException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Internal Server Error"));
    }
}
