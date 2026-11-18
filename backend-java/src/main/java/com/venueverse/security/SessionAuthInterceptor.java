package com.venueverse.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.venueverse.model.User;
import com.venueverse.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;

@Component
public class SessionAuthInterceptor implements HandlerInterceptor {

    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;

    public SessionAuthInterceptor(ObjectMapper objectMapper, UserRepository userRepository) {
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();
        String method = request.getMethod();

        AuthUser authUser = resolveAuthUser(request);
        if (authUser != null) {
            request.setAttribute("authUser", authUser);
        }

        if (isPublicEndpoint(path, method)) {
            return true;
        }

        if (authUser == null) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Access denied. Please log in first.");
            return false;
        }

        if (path.startsWith("/api/admin")) {
            if (!"admin".equalsIgnoreCase(authUser.getRole())) {
                sendError(response, HttpServletResponse.SC_FORBIDDEN, "Access denied. Administrator privileges required.");
                return false;
            }
        }

        return true;
    }

    private boolean isPublicEndpoint(String path, String method) {
        if (path.startsWith("/api/auth/")) {
            return true;
        }

        if ("GET".equalsIgnoreCase(method) && path.equals("/api/reviews/top")) {
            return true;
        }

        if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/venues")) {
            if (path.equals("/api/venues") || path.equals("/api/venues/")) {
                return true;
            }
            if (!path.startsWith("/api/venues/my")) {
                return true;
            }
        }

        return false;
    }

    private AuthUser resolveAuthUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null && session.getAttribute("user") != null) {
            return (AuthUser) session.getAttribute("user");
        }

        String userId = request.getHeader("X-User-Id");
        if (userId != null && !userId.isBlank()) {
            Optional<User> userOpt = userRepository.findById(userId.trim());
            if (userOpt.isPresent()) {
                User u = userOpt.get();
                AuthUser authUser = new AuthUser(
                        u.getId(),
                        u.getName(),
                        u.getEmail(),
                        com.venueverse.model.VenueOwner.normalizeRole(u.getRole()));
                HttpSession newSession = request.getSession(true);
                newSession.setAttribute("user", authUser);
                return authUser;
            }
        }

        return null;
    }

    private void sendError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        Map<String, Object> errorMap = Map.of(
                "success", false,
                "message", message
        );
        response.getWriter().write(objectMapper.writeValueAsString(errorMap));
    }
}
