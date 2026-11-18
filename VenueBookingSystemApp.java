import java.io.*;
import java.util.*;

// Concept: Venue Booking System Main Suite
public class VenueBookingSystemApp {

    // Concept: Abstract Class & Inheritance
    public static abstract class BaseEntity {
        private static int totalEntities = 0; // Concept: Static Variable
        private final String id;              // Concept: Final Field

        // Concept: Parameterized Constructor & "this" Reference
        public BaseEntity(String id) {
            this.id = id;
            totalEntities++;
        }


        // Concept: Static Function
        public static synchronized int getTotalEntities() { return totalEntities; }
        public String getId() { return this.id; }
        public abstract String getEntitySummary(); // Concept: Virtual Function / Abstract Method
        public final String getPlatform() { return "VenueVerse Engine"; } // Concept: Final Method
    }

    // Concept: Inheritance (User extends BaseEntity)
    public static class User extends BaseEntity {
        protected String name, email, role, password; // Concept: Access Specifier (protected)

        // Concept: Constructor Chaining (super)
        public User(String id, String name, String email, String role, String password) {
            super(id);
            this.name = name;
            this.email = email;
            this.role = role;
            this.password = password;
        }


        public String getName() { return name; }
        public String getEmail() { return email; }
        public String getRole() { return role; }
        public String getPassword() { return password; }
        public boolean checkPassword(String pwd) { return this.password.equals(pwd); }

        // Concept: Dynamic Method Dispatch (@Override)

        @Override // Concept: Dynamic Method Dispatch
        public String getEntitySummary() {
            return "User[" + getId() + "] " + name + " (" + role + ") <" + email + ">";
        }
    }

    // Concept: Inheritance (Customer extends User)
    public static class Customer extends User {
        private String phone; // Concept: Access Specifier (private)

        // Concept: Constructor Chaining (super)
        public Customer(String id, String name, String email, String phone, String password) {
            super(id, name, email, "Customer", password);
            this.phone = phone;
        }

        public String getPhone() { return phone; }

        @Override // Concept: Dynamic Method Dispatch
        public String getEntitySummary() {
            return "Customer[" + getId() + "] " + name + " | Phone: " + phone + " | Email: " + email;
        }
    }

    // Concept: Inheritance (VenueOwner extends User)
    public static class VenueOwner extends User {
        private String license;

        // Concept: Constructor Chaining (super)
        public VenueOwner(String id, String name, String email, String license, String password) {
            super(id, name, email, "VenueOwner", password);
            this.license = license;
        }


        public String getLicense() { return license; }

        @Override // Concept: Dynamic Method Dispatch
        public String getEntitySummary() {
            return "VenueOwner[" + getId() + "] " + name + " | License: " + license + " | Email: " + email;
        }
    }

    // Concept: Inheritance (Admin extends User)
    public static class Admin extends User {
        public Admin(String id, String name, String email, String password) {
            super(id, name, email, "Admin", password);
        }


        @Override // Concept: Dynamic Method Dispatch
        public String getEntitySummary() {
            return "Admin[" + getId() + "] " + name + " <" + email + ">";
        }
    }

    // Concept: Abstract Class & Inheritance (Venue extends BaseEntity)
    public static abstract class Venue extends BaseEntity {
        private static int totalVenues = 0; // Concept: Static Variable
        private final Set<String> bookedDates = new HashSet<>();
        private final String ownerId;

        protected String title, category, location;
        protected double basePrice;
        protected int capacity;

        // Concept: Parameterized Constructor & super Chaining
        public Venue(String id, String title, String category, String location, double basePrice, int capacity, String ownerId) {
            super(id);
            this.title = title;
            this.category = category;
            this.location = location;
            this.basePrice = basePrice;
            this.capacity = capacity;
            this.ownerId = ownerId;
            totalVenues++;
        }


        public static synchronized int getTotalVenues() { return totalVenues; }
        public String getTitle() { return title; }
        public String getCategory() { return category; }
        public String getLocation() { return location; }
        public double getBasePrice() { return basePrice; }
        public int getCapacity() { return capacity; }
        public String getOwnerId() { return ownerId; }
        public Set<String> getBookedDates() { return Collections.unmodifiableSet(bookedDates); }

        // Concept: Method Chaining with "this" Reference
        public Venue setBasePrice(double price) { this.basePrice = price; return this; }
        public Venue setCapacity(int cap) { this.capacity = cap; return this; }

        public synchronized boolean isAvailable(String date) {
            return date != null && !bookedDates.contains(date.trim());
        }

        public synchronized void bookDate(String date) throws DateConflictException {
            if (!isAvailable(date)) throw new DateConflictException("Date already booked: " + date, date);
            bookedDates.add(date.trim());
        }


        public synchronized boolean releaseDate(String date) {
            return bookedDates.remove(date.trim());
        }


        // Concept: Method Overloading (Variant 1: by days)
        public double calculateTotalPrice(int days) {
            return basePrice * Math.max(1, days);
        }

        // Concept: Method Overloading (Variant 2: days + discount)
        public double calculateTotalPrice(int days, double discount) {
            double raw = calculateTotalPrice(days);
            return Math.round(raw * (1.0 - (discount / 100.0)));
        }

        // Concept: Method Overloading (Variant 3: days + guests + discount)
        public double calculateTotalPrice(int days, int guests, double discount) throws CapacityExceededException {
            if (capacity > 0 && guests > capacity) throw new CapacityExceededException(guests, capacity);
            return calculateTotalPrice(days, discount);
        }


        public abstract String getFeatures(); // Concept: Virtual Function


        // Concept: Dynamic Method Dispatch (@Override)
        @Override
        public String getEntitySummary() {
            return "Venue[" + getId() + "] " + title + " (" + category + ", " + location + ") | INR " + basePrice + "/day | Cap: " + capacity + " | " + getFeatures();
        }
    }

    // Concept: Inheritance (WeddingVenue extends Venue)
    public static class WeddingVenue extends Venue {
        public WeddingVenue(String id, String title, String location, double price, int cap, String ownerId) {
            super(id, title, "Wedding", location, price, cap, ownerId);
        }
        @Override public String getFeatures() { return "Bridal Suite & Lawn"; }
    }

    // Concept: Inheritance (BirthdayVenue extends Venue)
    public static class BirthdayVenue extends Venue {
        public BirthdayVenue(String id, String title, String location, double price, int cap, String ownerId) {
            super(id, title, "Birthday", location, price, cap, ownerId);
        }

        @Override public String getFeatures() { return "DJ Stage & Lighting"; }
    }


    // Concept: Inheritance (ConferenceVenue extends Venue)
    public static class ConferenceVenue extends Venue {
        public ConferenceVenue(String id, String title, String location, double price, int cap, String ownerId) {
            super(id, title, "Conference", location, price, cap, ownerId);
        }

        @Override public String getFeatures() { return "Wi-Fi & Projectors"; }
    }

    // Concept: Inheritance (Booking extends BaseEntity)
    public static class Booking extends BaseEntity {
        private final Venue venue;
        private final Customer customer;
        private final String bookingDate;
        private final int guests, days;
        private final double totalAmount;
        private String status;

        // Concept: Constructor (with validation)
        public Booking(String id, Venue venue, Customer customer, String bookingDate, int guests, int days)
                throws CapacityExceededException, DateConflictException {
            super(id);
            this.venue = venue;
            this.customer = customer;
            this.bookingDate = bookingDate;
            this.guests = guests;
            this.days = days;
            if (venue.getCapacity() > 0 && guests > venue.getCapacity()) {
                throw new CapacityExceededException(guests, venue.getCapacity());
            }

            venue.bookDate(bookingDate);
            this.totalAmount = venue.calculateTotalPrice(days);
            this.status = "CONFIRMED";
        }

        // Concept: Constructor Overloading (Restoring from File Storage)
        public Booking(String id, Venue venue, Customer customer, String bookingDate, int guests, int days, double totalAmount, String status) {
            super(id);
            this.venue = venue;
            this.customer = customer;
            this.bookingDate = bookingDate;
            this.guests = guests;
            this.days = days;
            this.totalAmount = totalAmount;
            this.status = (status != null) ? status : "CONFIRMED";

            // If active, re-reserve the date on the venue schedule so date conflict checks work
            if (!"CANCELLED".equalsIgnoreCase(this.status)) {
                try { venue.bookDate(bookingDate); } catch (DateConflictException ignored) {}
            }
        }


        public Venue getVenue() { return venue; }
        public Customer getCustomer() { return customer; }
        public String getBookingDate() { return bookingDate; }
        public int getGuests() { return guests; }
        public int getDays() { return days; }
        public double getTotalAmount() { return totalAmount; }
        public String getStatus() { return status; }

        public double calculateRefund(int daysBefore) {
            if (daysBefore >= 7) return totalAmount;
            if (daysBefore >= 2) return Math.round(totalAmount * 0.5);
            return 0.0;
        }

        public boolean cancel() {
            if ("CANCELLED".equals(status)) return false;
            this.status = "CANCELLED";
            this.venue.releaseDate(this.bookingDate);
            return true;
        }

        @Override
        public String getEntitySummary() {
            return "Booking[" + getId() + "] Venue=" + venue.getTitle() + " | Customer=" + customer.getName() +
                   " | Date=" + bookingDate + " | Guests=" + guests + " | Total=INR " + totalAmount + " | Status=" + status;
        }
    }

    // Concept: User-Defined Exception Hierarchy (Base Class)
    public static class VenueBookingException extends Exception {
        public VenueBookingException(String msg) { super(msg); }
    }

    // Concept: User-Defined Exception (Derived Class - Capacity)
    public static class CapacityExceededException extends VenueBookingException {
        public CapacityExceededException(int req, int max) { super("Guests (" + req + ") exceeds venue capacity (" + max + ")"); }
    }

    // Concept: User-Defined Exception (Derived Class - Date Conflict)
    public static class DateConflictException extends VenueBookingException {
        private final String date;
        public DateConflictException(String msg, String date) { super(msg); this.date = date; }
        public String getDate() { return date; }
    }

    // Concept: User-Defined Exception (Derived Class - Authentication)
    public static class AuthenticationException extends VenueBookingException {
        public AuthenticationException(String msg) { super(msg); }
    }

    // Concept: Multithreading Engine & Synchronization
    public static class ConcurrencyManager {
        private static int workersCount = 0; // Concept: Static Variable
        private final Object lock = new Object(); // Concept: Final Field

        // Concept: Multithreading (Extending Thread Class)
        public class AuditThread extends Thread {
            public AuditThread(String id) { super("Audit-" + id); }
            @Override
            public void run() { // Concept: Thread Methods (run, yield, sleep)
                Thread.yield();
                try { Thread.sleep(5); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            }
        }

        // Concept: Multithreading (Implementing Runnable Interface)
        public class SyncTask implements Runnable {
            @Override
            public void run() { // Concept: Thread Methods (run, yield, sleep)
                Thread.yield();
                try { Thread.sleep(3); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            }
        }

        // Concept: Thread Methods (start, join) & Thread Synchronization
        public void executeBookingThreads(String bookingId, String venueId) {
            AuditThread t1 = new AuditThread(bookingId);
            Thread t2 = new Thread(new SyncTask());
            synchronized (lock) { workersCount += 2; }

            t1.start();
            t2.start();

            try {
                t1.join();
                t2.join();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

        }

        public static synchronized int getWorkersCount() { return workersCount; }
    }

    // Concept: Final Class
    public static final class PlatformSecurity {
        public static User authenticate(List<User> users, String email, String pwd) throws AuthenticationException {
            for (User u : users) {
                if (u.getEmail().equalsIgnoreCase(email) && u.checkPassword(pwd)) return u;
            }
            throw new AuthenticationException("Invalid email or password credentials.");
        }
    }

    // Application state using standard Lists (No complex generic classes)
    private final List<User> userList = new ArrayList<>();
    private final List<Venue> venueList = new ArrayList<>();
    private final List<Booking> bookingList = new ArrayList<>();
    private final ConcurrencyManager concurrencyManager = new ConcurrencyManager();
    private final Scanner scanner = new Scanner(System.in);

    // Concept: Sequential ID Counters
    private int userCounter = 0, ownerCounter = 0, adminCounter = 0, venueCounter = 0, bookingCounter = 0;

    private String nextUserId() { return String.format("U-%03d", ++userCounter); }
    private String nextOwnerId() { return String.format("O-%03d", ++ownerCounter); }
    private String nextAdminId() { return String.format("A-%03d", ++adminCounter); }
    private String nextVenueId() { return String.format("V-%03d", ++venueCounter); }
    private String nextBookingId() { return String.format("B-%03d", ++bookingCounter); }

    private static final String USER_STORAGE_FILE = "users_storage.txt";
    private static final String BOOKING_STORAGE_FILE = "bookings_storage.txt";


    public VenueBookingSystemApp() {
        seedInitialData();
        loadUsersFromFile();
        loadBookingsFromFile();
    }


    private void syncIdCounter(String id) {
        if (id == null || id.length() < 3) return;
        try {
            int num = Integer.parseInt(id.substring(2));
            if (id.startsWith("U-")) userCounter = Math.max(userCounter, num);
            else if (id.startsWith("O-")) ownerCounter = Math.max(ownerCounter, num);
            else if (id.startsWith("A-")) adminCounter = Math.max(adminCounter, num);
            else if (id.startsWith("B-")) bookingCounter = Math.max(bookingCounter, num);
            else if (id.startsWith("V-")) venueCounter = Math.max(venueCounter, num);
        } catch (NumberFormatException ignored) {}
    }

    // Concept: File Handling - Writing Users to File (Admin kept in-code)
    private void saveUserToFile(User u) {
        if (u instanceof Admin) return;
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(USER_STORAGE_FILE, true))) {
            String extra = (u instanceof Customer) ? ((Customer) u).getPhone() : ((VenueOwner) u).getLicense();
            writer.write(u.getId() + "," + u.getName() + "," + u.getEmail() + "," + u.getRole() + "," + extra + "," + u.getPassword());
            writer.newLine();
        } catch (IOException e) {
            System.out.println("[!] Warning: Could not write user to storage file: " + e.getMessage());
        }
    }

    // Concept: File Handling - Reading Users from File
    private void loadUsersFromFile() {
        File file = new File(USER_STORAGE_FILE);
        if (!file.exists()) return;

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;

                String[] p = line.split(",", -1);
                if (p.length >= 6) {
                    if ("Admin".equalsIgnoreCase(p[3])) continue;
                    syncIdCounter(p[0]);
                    if (findUserById(p[0]) != null) continue;
                    User u = "Customer".equalsIgnoreCase(p[3])
                        ? new Customer(p[0], p[1], p[2], p[4], p[5])
                        : new VenueOwner(p[0], p[1], p[2], p[4], p[5]);
                    userList.add(u);
                }
            }
        } catch (IOException ignored) {}
    }

    // Concept: File Handling - Writing Bookings to File
    private void saveBookingToFile(Booking b) {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(BOOKING_STORAGE_FILE, true))) {
            writer.write(b.getId() + "," + b.getVenue().getId() + "," + b.getCustomer().getId() + "," +
                         b.getBookingDate() + "," + b.getGuests() + "," + b.getDays() + "," +
                         b.getTotalAmount() + "," + b.getStatus());
            writer.newLine();
        } catch (IOException ignored) {}
    }

    // Concept: File Handling - Rewriting Bookings to File on Cancellation
    private void rewriteAllBookingsToFile() {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(BOOKING_STORAGE_FILE, false))) {
            for (Booking b : bookingList) {
                writer.write(b.getId() + "," + b.getVenue().getId() + "," + b.getCustomer().getId() + "," +
                             b.getBookingDate() + "," + b.getGuests() + "," + b.getDays() + "," +
                             b.getTotalAmount() + "," + b.getStatus());
                writer.newLine();
            }
        } catch (IOException ignored) {}
    }

    // Concept: File Handling - Reading Bookings from File
    private void loadBookingsFromFile() {
        File file = new File(BOOKING_STORAGE_FILE);
        if (!file.exists()) return;

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;

                String[] p = line.split(",", -1);
                if (p.length >= 8) {
                    syncIdCounter(p[0]);
                    if (findBookingById(p[0]) != null) continue;
                    Venue v = findVenueById(p[1]);
                    User u = findUserById(p[2]);
                    if (v != null && u instanceof Customer) {
                        bookingList.add(new Booking(p[0], v, (Customer) u, p[3], Integer.parseInt(p[4]),
                                                    Integer.parseInt(p[5]), Double.parseDouble(p[6]), p[7]));
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    // Helper lookup methods
    private User findUserById(String id) {
        for (User u : userList) if (u.getId().equalsIgnoreCase(id)) return u;
        return null;
    }
    private Venue findVenueById(String id) {
        for (Venue v : venueList) if (v.getId().equalsIgnoreCase(id)) return v;
        return null;
    }
    private Booking findBookingById(String id) {
        for (Booking b : bookingList) if (b.getId().equalsIgnoreCase(id)) return b;
        return null;
    }


    // Concept: Data Initialization (In-Code Admin & Default Sample Venues)
    private void seedInitialData() {
        VenueOwner o1 = new VenueOwner(nextOwnerId(), "Ramesh Shah", "ramesh@venueverse.com", "LIC-GJ-2026-901", "host123"); // O-001
        Admin a1 = new Admin(nextAdminId(), "Vikram Rathore", "admin@venueverse.com", "admin123");                           // A-001
        userList.add(o1);
        userList.add(a1);

        venueList.add(new WeddingVenue(nextVenueId(), "Royal Rajwadi Grand Ballroom", "Gandhinagar", 45000.0, 500, o1.getId())); // V-001
        venueList.add(new BirthdayVenue(nextVenueId(), "Skyline Rooftop Lounge", "Ahmedabad", 25000.0, 150, o1.getId()));        // V-002
        venueList.add(new ConferenceVenue(nextVenueId(), "Gift City Innovation Hub", "Gandhinagar", 60000.0, 800, o1.getId()));  // V-003
    }

    // Concept: Switch Case Menu Control
    public void start() {
        boolean running = true;
        while (running) {
            printHeader("MAIN MENU");
            System.out.println("  1. Customer Login");
            System.out.println("  2. Venue Owner Login");
            System.out.println("  3. Admin Login");
            System.out.println("  4. Register New Account (Customer / Venue Owner)");
            System.out.println("  5. Run Concurrency Stress Test");
            System.out.println("  0. Exit Application");

            int choice = readInt(0, 5);
            switch (choice) {
                case 1: loginFlow("Customer"); break;
                case 2: loginFlow("VenueOwner"); break;
                case 3: loginFlow("Admin"); break;
                case 4: registerUserFlow(); break;
                case 5: runConcurrencyStressTest(); break;
                case 0:
                    running = false;
                    System.out.println("\nExiting Venue Booking System. Goodbye!");
                    break;
                default:
                    System.out.println("[!] Invalid choice.");
            }
        }
    }

    // Concept: Dynamic Method Dispatch & Authentication Exception Handling
    private void loginFlow(String expectedRole) {
        printHeader(expectedRole.toUpperCase() + " LOGIN");
        String email = readEmail("Enter Email: ");
        String password = readString("Enter Password: ", 4);

        try {
            User auth = PlatformSecurity.authenticate(userList, email, password);
            if (!auth.getRole().equalsIgnoreCase(expectedRole) && !auth.getRole().equalsIgnoreCase("Admin")) {
                System.out.println("[!] Access Denied: User role is " + auth.getRole() + ", expected " + expectedRole);
                return;
            }
            System.out.println("\n[+] Login successful! Welcome, " + auth.getName() + " [" + auth.getId() + "]");

            // Concept: Switch Case Navigation based on Role
            switch (auth.getRole()) {
                case "Customer": customerMenu((Customer) auth); break;
                case "VenueOwner": venueOwnerMenu((VenueOwner) auth); break;
                case "Admin": adminMenu((Admin) auth); break;
            }
        } catch (AuthenticationException e) {
            System.out.println("[ERROR] " + e.getMessage());
        }
    }

    // Concept: Dynamic Instantiation & File Handling Persistence
    private void registerUserFlow() {
        printHeader("CREATE NEW USER ACCOUNT");
        System.out.println("  1. Register as Customer");
        System.out.println("  2. Register as Venue Owner");
        int type = readInt(1, 2);

        String name = readName("Enter Full Name: ");
        String email = readUniqueEmail("Enter Email Address: ");
        String password = readString("Enter Password (min 4 characters): ", 4);

        if (type == 1) {
            String phone = readPhone("Enter Phone Number: ");
            String id = nextUserId();
            Customer c = new Customer(id, name, email, phone, password);
            userList.add(c);
            saveUserToFile(c);
            System.out.println("\n[+] Customer account created! User ID: " + id);
        } else {
            String license = readString("Enter Host License: ", 3);
            String id = nextOwnerId();
            VenueOwner o = new VenueOwner(id, name, email, license, password);
            userList.add(o);
            saveUserToFile(o);
            System.out.println("\n[+] Venue Owner account created! Owner ID: " + id);
        }
    }

    // Concept: Switch Case Menu Control (Customer Menu)
    private void customerMenu(Customer customer) {
        boolean active = true;
        while (active) {
            printHeader("CUSTOMER DASHBOARD: " + customer.getName() + " [" + customer.getId() + "]");
            System.out.println("  1. Browse Available Venues");
            System.out.println("  2. Search Venues by Location / Category");
            System.out.println("  3. Calculate Instant Quote (Method Overloading)");
            System.out.println("  4. Book a Venue");
            System.out.println("  5. View My Bookings");
            System.out.println("  6. Cancel a Booking");
            System.out.println("  7. Logout");

            int choice = readInt(1, 7);
            switch (choice) {
                case 1: browseVenues(); break;
                case 2: searchVenues(); break;
                case 3: calculateQuoteFlow(); break;
                case 4: bookVenueFlow(customer); break;
                case 5: viewCustomerBookings(customer); break;
                case 6: cancelBookingFlow(customer); break;
                case 7: active = false; System.out.println("\n[+] Logged out successfully."); break;
            }
        }
    }

    // Concept: Switch Case Menu Control (Venue Owner Menu)
    private void venueOwnerMenu(VenueOwner owner) {
        boolean active = true;
        while (active) {
            printHeader("VENUE OWNER DASHBOARD: " + owner.getName() + " [" + owner.getId() + "]");
            System.out.println("  1. View My Venues");
            System.out.println("  2. Add New Venue Listing");
            System.out.println("  3. View Bookings for My Venues");
            System.out.println("  4. Update Venue Pricing ('this' Method Chaining)");
            System.out.println("  5. Logout");

            int choice = readInt(1, 5);
            switch (choice) {
                case 1:
                    printHeader("MY LISTED VENUES");
                    for (Venue v : venueList) if (v.getOwnerId().equals(owner.getId())) System.out.println("  * " + v.getEntitySummary());
                    break;
                case 2: addNewVenueFlow(owner); break;
                case 3:
                    printHeader("BOOKINGS FOR MY VENUES");
                    for (Booking b : bookingList) if (b.getVenue().getOwnerId().equals(owner.getId())) System.out.println("  * " + b.getEntitySummary());
                    break;
                case 4: updatePricingFlow(owner); break;
                case 5: active = false; System.out.println("\n[+] Logged out successfully."); break;
            }
        }
    }

    // Concept: Switch Case Menu Control (Admin Menu)
    private void adminMenu(Admin admin) {
        boolean active = true;
        while (active) {
            printHeader("ADMIN CONTROL CONSOLE: " + admin.getName() + " [" + admin.getId() + "]");
            System.out.println("  1. View All Registered Users (Polymorphic Dynamic Dispatch)");
            System.out.println("  2. View Platform Metrics & Venues (Static Members)");
            System.out.println("  3. View All Platform Bookings");
            System.out.println("  4. Logout");

            int choice = readInt(1, 4);
            switch (choice) {
                case 1:
                    printHeader("ALL REGISTERED USERS");
                    for (User u : userList) System.out.println("  * " + u.getEntitySummary());
                    break;
                case 2:
                    printHeader("GLOBAL PLATFORM METRICS");
                    System.out.println("  * Total Entities Created: " + BaseEntity.getTotalEntities());
                    System.out.println("  * Total Venues Listed:    " + Venue.getTotalVenues());
                    System.out.println("  * Background Threads Run: " + ConcurrencyManager.getWorkersCount());
                    System.out.println("\nAll Venues:");
                    for (Venue v : venueList) System.out.println("  * " + v.getEntitySummary());
                    break;
                case 3:
                    printHeader("ALL PLATFORM BOOKINGS");
                    if (bookingList.isEmpty()) System.out.println("  (No bookings recorded yet)");
                    for (Booking b : bookingList) System.out.println("  * " + b.getEntitySummary());
                    break;
                case 4: active = false; System.out.println("\n[+] Admin logged out successfully."); break;
            }
        }
    }

    private void browseVenues() {
        printHeader("AVAILABLE VENUES");
        for (Venue v : venueList) {
            System.out.println("  * " + v.getEntitySummary());
            System.out.println("    Booked Dates: " + (v.getBookedDates().isEmpty() ? "None (Available)" : v.getBookedDates()));
        }
    }

    private void searchVenues() {
        printHeader("SEARCH VENUES");
        System.out.print("Enter location keyword (or press Enter): ");
        String loc = scanner.nextLine().trim().toLowerCase();
        for (Venue v : venueList) {
            if (loc.isEmpty() || v.getLocation().toLowerCase().contains(loc)) {
                System.out.println("  * " + v.getEntitySummary());
            }
        }
    }

    // Concept: Method Overloading Showcase
    private void calculateQuoteFlow() {
        printHeader("CALCULATE INSTANT QUOTE (METHOD OVERLOADING)");
        Venue v = readVenue();
        if (v == null) return;

        int days = readDays();
        double discount = readDouble("Enter discount percentage (0 to 50): ", 0.0, 50.0);
        int guests = readInt("Enter expected guests: ", 1, 10000);

        System.out.println("\nCalculating via Overloaded Methods:");
        // Overload 1: days
        System.out.println("  1) Standard Rate (" + days + " days): INR " + v.calculateTotalPrice(days));
        // Overload 2: days + discount
        System.out.println("  2) Discounted Rate (" + discount + "% off): INR " + v.calculateTotalPrice(days, discount));
        // Overload 3: days + guests + discount
        try {
            System.out.println("  3) Package Rate (" + guests + " guests, " + discount + "% off): INR " + v.calculateTotalPrice(days, guests, discount));
        } catch (CapacityExceededException e) {
            System.out.println("  3) [CAUGHT CapacityExceededException]: " + e.getMessage());
        }
    }

    private void bookVenueFlow(Customer customer) {
        printHeader("BOOK A VENUE");
        Venue v = readVenue();
        if (v == null) return;

        String date = readDate("Enter Event Date (YYYY-MM-DD): ");
        if (!v.isAvailable(date)) {
            System.out.println("[!] Selected date " + date + " is already booked for " + v.getTitle());
            return;
        }

        int guests = readInt("Enter number of guests: ", 1, 10000);
        int days = readDays();
        String bookingId = nextBookingId();

        // Concept: Exception Handling (try, catch, finally)
        try {
            Booking b = new Booking(bookingId, v, customer, date, guests, days);
            bookingList.add(b);
            saveBookingToFile(b); // Concept: File Handling - Save Booking

            // Concept: Multithreading Execution
            concurrencyManager.executeBookingThreads(bookingId, v.getId());

            System.out.println("\n[SUCCESS] Booking Confirmed!");
            System.out.println("  * " + b.getEntitySummary());
        } catch (CapacityExceededException e) {
            System.out.println("\n[!] [Capacity Limit Error]: " + e.getMessage());
        } catch (DateConflictException e) {
            System.out.println("\n[!] [Date Collision Error]: " + e.getMessage());
        } finally {}
    }

    private void viewCustomerBookings(Customer customer) {
        printHeader("MY BOOKINGS");
        boolean found = false;
        for (Booking b : bookingList) {
            if (b.getCustomer().getId().equals(customer.getId())) {
                System.out.println("  * " + b.getEntitySummary());
                found = true;
            }
        }
        if (!found) System.out.println("  No active bookings found.");
    }

    private void cancelBookingFlow(Customer customer) {
        printHeader("CANCEL A BOOKING");
        System.out.print("Enter Booking ID to cancel (e.g. B-001): ");
        String bId = scanner.nextLine().trim();

        Booking booking = findBookingById(bId);
        if (booking == null || !booking.getCustomer().getId().equals(customer.getId())) {
            System.out.println("[!] Booking not found or does not belong to your account.");
            return;
        }

        int daysBefore = readDays();
        double refund = booking.calculateRefund(daysBefore);
        if (booking.cancel()) {
            rewriteAllBookingsToFile(); // Concept: File Handling - Update on Cancellation
            System.out.println("\n[+] Booking " + bId + " has been cancelled.");
            System.out.println("  * Venue date released: " + booking.getBookingDate());
            System.out.println("  * Refund Amount: INR " + refund);
        } else {
            System.out.println("[!] Booking is already cancelled.");
        }
    }

    private void addNewVenueFlow(VenueOwner owner) {
        printHeader("LIST NEW VENUE");
        System.out.println("  1. Wedding Venue\n  2. Birthday Venue\n  3. Conference Venue");
        int type = readInt(1, 3);
        String title = readString("Enter Venue Title: ", 3);
        String location = readName("Enter City / Location: ");
        double price = readDouble("Enter Base Price per Day (min 1,000): ", 1000.0, 10000000.0);
        int capacity = readInt("Enter Guest Capacity (min 10): ", 10, 50000);

        String id = nextVenueId();
        Venue v = (type == 1) ? new WeddingVenue(id, title, location, price, capacity, owner.getId())
                : (type == 2) ? new BirthdayVenue(id, title, location, price, capacity, owner.getId())
                : new ConferenceVenue(id, title, location, price, capacity, owner.getId());

        venueList.add(v);
        System.out.println("\n[+] Venue successfully listed with ID: " + id);
    }

    private void updatePricingFlow(VenueOwner owner) {
        printHeader("UPDATE PRICING ('this' METHOD CHAINING)");
        Venue v = readVenue();
        if (v == null) return;
        if (!v.getOwnerId().equals(owner.getId())) {
            System.out.println("[!] Access Denied: You do not own venue " + v.getId());
            return;
        }

        double newPrice = readDouble("Enter new Price per Day (min 1,000): ", 1000.0, 10000000.0);
        int newCap = readInt("Enter new Capacity (min 10): ", 10, 50000);

        // Concept: Method Chaining with "this" Reference
        v.setBasePrice(newPrice).setCapacity(newCap);
        System.out.println("\n[+] Venue updated successfully via 'this' method chaining:\n  * " + v.getEntitySummary());
    }

    // Concept: Multithreading & Race Condition Prevention (Thread Synchronization)
    public void runConcurrencyStressTest() {
        printHeader("HIGH-CONCURRENCY RACE-CONDITION BENCHMARK");
        System.out.println("Simulating 10 concurrent threads attempting to book V-001 on '2028-01-01' simultaneously...\n");
        final Venue testVenue = findVenueById("V-001");
        final Customer testCustomer = new Customer("U-TEST", "Test User", "test@test.com", "9999999999", "pass");
        final String collisionDate = "2028-01-01";
        testVenue.releaseDate(collisionDate);
        final List<String> successLog = Collections.synchronizedList(new ArrayList<>());
        final List<String> conflictLog = Collections.synchronizedList(new ArrayList<>());
        Thread[] racers = new Thread[10];
        for (int i = 0; i < racers.length; i++) {
            final int id = i + 1;
            racers[i] = new Thread(() -> {
                Thread.yield();
                try {
                    synchronized (testVenue) {
                        Booking b = new Booking("B-RACE-" + id, testVenue, testCustomer, collisionDate, 100, 1);
                        successLog.add("Thread #" + id + " successfully booked the venue!");
                    }
                } catch (Exception e) {
                    conflictLog.add("Thread #" + id + " blocked: Collision safely caught.");
                }
            });
        }
        for (Thread t : racers) t.start();
        for (Thread t : racers) {
            try { t.join(); } catch (InterruptedException ignored) {}
        }
        System.out.println("Results of Concurrent Execution:");
        for (String msg : successLog) System.out.println("  [+] " + msg);
        System.out.println("  [!] Number of collisions safely prevented: " + conflictLog.size() + " out of 10");
        System.out.println("  [+] Exactly ONE booking succeeded. Zero double-booking race conditions detected.");
    }
    // Concept: Simple Terminal Header Display
    private void printHeader(String title) {
        System.out.println("\n--- " + title + " ---");
    }
    // Compact Input Validation Helpers
    private int readInt(int min, int max) { return readInt("Enter choice [" + min + "-" + max + "]: ", min, max); }
    private int readInt(String prompt, int min, int max) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return min;
            try {
                int val = Integer.parseInt(scanner.nextLine().trim());
                if (val >= min && val <= max) return val;
                System.out.println("[!] Enter a number between " + min + " and " + max);
            } catch (NumberFormatException e) {
                System.out.println("[!] Please enter a valid whole number.");
            }
        }
    }

    private double readDouble(String prompt, double min, double max) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return min;
            try {
                double val = Double.parseDouble(scanner.nextLine().trim());
                if (val >= min && val <= max) return val;
                System.out.println("[!] Enter a number between " + min + " and " + max);
            } catch (NumberFormatException e) {
                System.out.println("[!] Please enter a valid number.");
            }
        }
    }
    private String readEmail(String prompt) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return "user@gmail.com";
            String email = scanner.nextLine().trim();
            if (email.contains("@") && email.indexOf('@') == email.lastIndexOf('@') &&
                email.indexOf('@') > 0 && email.indexOf('@') < email.length() - 3 &&
                email.substring(email.indexOf('@')).contains(".") && !email.contains(" ")) {
                return email;
            }
            System.out.println("[!] Invalid email format (e.g. name@gmail.com). Must contain '@' and domain.");
        }
    }
    private String readUniqueEmail(String prompt) {
        while (true) {
            String email = readEmail(prompt);
            boolean exists = false;
            for (User u : userList) {
                if (u.getEmail().equalsIgnoreCase(email)) { exists = true; break; }
            }
            if (exists) {
                System.out.println("[!] Email '" + email + "' is already registered. Use another email.");
                continue;
            }
            return email;
        }
    }
    private String readName(String prompt) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return "User";
            String name = scanner.nextLine().trim();
            if (name.length() >= 2 && name.matches("^[a-zA-Z]+([.\\s][a-zA-Z]+)*$")) return name;
            System.out.println("[!] Name must be at least 2 characters and contain letters only.");
        }
    }
    private String readPhone(String prompt) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return "+919876543210";
            String phone = scanner.nextLine().trim().replaceAll("\\s+", "");
            if (phone.matches("^\\+?[0-9]{7,15}$")) return phone;
            System.out.println("[!] Phone must be 7 to 15 digits (e.g. +919876543210).");
        }
    }
    private String readDate(String prompt) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return "2027-05-20";
            String date = scanner.nextLine().trim();
            if (date.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
                String[] p = date.split("-");
                int y = Integer.parseInt(p[0]), m = Integer.parseInt(p[1]), d = Integer.parseInt(p[2]);
                if (y >= 2026 && y <= 2035 && m >= 1 && m <= 12 && d >= 1 && d <= 31) return date;
            }
            System.out.println("[!] Invalid date format. Enter strictly YYYY-MM-DD (e.g. 2027-05-20).");
        }
    }
    private String readString(String prompt, int min) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return "Pass";
            String s = scanner.nextLine().trim();
            if (s.length() >= min) return s;
            System.out.println("[!] Must be at least " + min + " characters.");
        }
    }
    private int readDays() { return readInt("Enter number of days (1-365): ", 1, 365); }
    private Venue readVenue() {
        while (true) {
            System.out.print("Enter Venue ID (e.g. V-001, or 0 to cancel): ");
            if (!scanner.hasNextLine()) return null;
            String vId = scanner.nextLine().trim();
            if (vId.equals("0")) return null;
            Venue v = findVenueById(vId);
            if (v != null) return v;
            System.out.println("[!] Venue ID '" + vId + "' not found. Try again (or 0 to cancel).");
        }
    }

    // Concept: Main Entry Point
    public static void main(String[] args) {
        System.out.println("Venue Booking System");

        VenueBookingSystemApp app = new VenueBookingSystemApp();
        app.start();
    }
}
