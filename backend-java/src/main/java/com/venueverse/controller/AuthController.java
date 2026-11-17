package com.venueverse.controller;

import com.venueverse.dto.ApiResponse;
import com.venueverse.dto.AuthResponse;
import com.venueverse.dto.LoginRequest;
import com.venueverse.dto.RegisterRequest;
import com.venueverse.dto.UserDto;
import com.venueverse.model.User;
import com.venueverse.security.AuthUser;
import com.venueverse.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request, HttpSession session) {
        User user = authService.register(request);
        session.setAttribute("user", new AuthUser(user.getId(), user.getName(), user.getEmail(), user.getRole()));
        UserDto userDto = UserDto.fromEntity(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                new AuthResponse(true, "User registered successfully", userDto));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request, HttpSession session) {
        User user = authService.login(request);
        session.setAttribute("user", new AuthUser(user.getId(), user.getName(), user.getEmail(), user.getRole()));

        UserDto userDto = UserDto.fromEntity(user);
        return ResponseEntity.ok(
                new AuthResponse(true, "Login successful", userDto));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(HttpServletRequest request, HttpServletResponse response) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.removeAttribute("user");
            session.invalidate();
        }
        request.removeAttribute("authUser");
        response.addHeader("Set-Cookie", "JSESSIONID=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
        response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
        return ResponseEntity.ok(ApiResponse.success("Logout successful"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpSession session, HttpServletRequest request) {
        AuthUser user = (AuthUser) request.getAttribute("authUser");
        if (user == null && session != null) {
            user = (AuthUser) session.getAttribute("user");
        }
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Not authenticated"));
        }
        User fresh = authService.findById(user.getId()).orElse(null);
        if (fresh != null) {
            UserDto dto = UserDto.fromEntity(fresh);
            dto.setRole(com.venueverse.model.VenueOwner.normalizeRole(fresh.getRole()));
            return ResponseEntity.ok(dto);
        }
        return ResponseEntity.ok(user);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        AuthUser authUser = (AuthUser) request.getAttribute("authUser");
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Not authenticated"));
        }

        User updated = authService.updateProfile(
                authUser.getId(),
                body != null ? body.get("name") : null,
                body != null ? body.get("phone") : null,
                body != null ? body.get("businessName") : null,
                body != null ? body.get("city") : null
        );

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.setAttribute("user", new AuthUser(updated.getId(), updated.getName(), updated.getEmail(), updated.getRole()));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Profile updated successfully",
                "user", UserDto.fromEntity(updated)
        ));
    }

    @PatchMapping("/password")
    public ResponseEntity<ApiResponse> changePassword(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        AuthUser authUser = (AuthUser) request.getAttribute("authUser");
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Not authenticated"));
        }

        authService.changePassword(
                authUser.getId(),
                body != null ? body.get("currentPassword") : null,
                body != null ? body.get("newPassword") : null
        );
        return ResponseEntity.ok(ApiResponse.success("Password updated successfully"));
    }
}
