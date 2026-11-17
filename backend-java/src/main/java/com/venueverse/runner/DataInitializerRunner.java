package com.venueverse.runner;

import com.venueverse.model.User;
import com.venueverse.model.VenueOwner;
import com.venueverse.repository.BookingRepository;
import com.venueverse.repository.UserRepository;
import com.venueverse.repository.VenueRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class DataInitializerRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializerRunner.class);

    private final UserRepository userRepository;
    private final VenueRepository venueRepository;
    private final BookingRepository bookingRepository;

    @Value("${ADMIN_EMAIL:admin@venueverse.com}")
    private String defaultAdminEmail;

    @Value("${ADMIN_PASSWORD:AdminPass123}")
    private String defaultAdminPassword;

    public DataInitializerRunner(UserRepository userRepository,
                                 VenueRepository venueRepository,
                                 BookingRepository bookingRepository) {
        this.userRepository = userRepository;
        this.venueRepository = venueRepository;
        this.bookingRepository = bookingRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        handleCommandLineAdminArgs(args);
        initializeDefaultAccounts();

    }

    private void handleCommandLineAdminArgs(ApplicationArguments args) {
        if (args.containsOption("promote-admin")) {
            List<String> values = args.getOptionValues("promote-admin");
            if (values != null && !values.isEmpty() && !values.get(0).isBlank()) {
                String email = values.get(0).trim().toLowerCase();
                userRepository.findByEmailIgnoreCase(email).ifPresentOrElse(user -> {
                    user.setRole("admin");
                    user.setUpdatedAt(Instant.now());
                    userRepository.save(user);
                    log.info("CLI: User \"{}\" has been successfully promoted to ADMIN.", email);
                }, () -> log.error("CLI: No user found with email \"{}\"", email));
            }
        }

        if (args.containsOption("create-admin")) {
            List<String> values = args.getOptionValues("create-admin");
            if (values != null && !values.isEmpty() && !values.get(0).isBlank()) {
                String[] parts = values.get(0).split(":");
                String email = parts[0].trim().toLowerCase();
                String pass = parts.length > 1 ? parts[1] : "AdminPass123";
                String name = parts.length > 2 ? parts[2] : "Platform Administrator";

                User admin = userRepository.findByEmailIgnoreCase(email).orElse(new User());
                admin.setName(name);
                admin.setEmail(email);
                admin.setPassword(pass);
                admin.setRole("admin");
                admin.setUpdatedAt(Instant.now());
                if (admin.getCreatedAt() == null) {
                    admin.setCreatedAt(Instant.now());
                }
                userRepository.save(admin);
                log.info("CLI: Administrator account \"{}\" created/updated successfully.", email);
            }
        }
    }

    private void initializeDefaultAccounts() {
        String adminEmail = defaultAdminEmail.trim().toLowerCase();
        User existingAdmin = userRepository.findByEmailIgnoreCase(adminEmail).orElse(null);
        if (existingAdmin == null) {
            User admin = new User();
            admin.setName("Platform Administrator");
            admin.setEmail(adminEmail);
            admin.setPassword(defaultAdminPassword);
            admin.setRole("admin");
            admin.setPhone("+91 9999900001");
            admin.setCreatedAt(Instant.now());
            admin.setUpdatedAt(Instant.now());
            userRepository.save(admin);
        } else if (!"admin".equalsIgnoreCase(existingAdmin.getRole())) {
            existingAdmin.setRole("admin");
            existingAdmin.setUpdatedAt(Instant.now());
            userRepository.save(existingAdmin);
        }
        log.info("Synchronized default administrator: {}", adminEmail);

        String hostEmail = "host@venueverse.com";
        User existingHost = userRepository.findByEmailIgnoreCase(hostEmail).orElse(null);
        if (existingHost == null) {
            VenueOwner host = new VenueOwner("Rajesh Patel", hostEmail, "HostPass123", "+91 9825122340");
            host.setCreatedAt(Instant.now());
            host.setUpdatedAt(Instant.now());
            userRepository.save(host);
        } else if (existingHost.getRole() == null || existingHost.getRole().isBlank()) {
            existingHost.setRole("host");
            existingHost.setUpdatedAt(Instant.now());
            userRepository.save(existingHost);
        }
        log.info("Synchronized default demo venue host: {}", hostEmail);

        String userEmail = "user@venueverse.com";
        User existingUser = userRepository.findByEmailIgnoreCase(userEmail).orElse(null);
        if (existingUser == null) {
            User normalUser = new User();
            normalUser.setName("Aarav Sharma");
            normalUser.setEmail(userEmail);
            normalUser.setPassword("UserPass123");
            normalUser.setRole("user");
            normalUser.setPhone("+91 9876543210");
            normalUser.setCreatedAt(Instant.now());
            normalUser.setUpdatedAt(Instant.now());
            userRepository.save(normalUser);
        } else if (existingUser.getRole() == null || existingUser.getRole().isBlank()) {
            existingUser.setRole("user");
            existingUser.setUpdatedAt(Instant.now());
            userRepository.save(existingUser);
        }
        log.info("Synchronized default demo normal user: {}", userEmail);
    }
}
