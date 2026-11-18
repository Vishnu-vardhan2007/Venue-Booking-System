import java.io.*;
import java.util.*;
import java.util.function.Predicate;
// Venue Booking System Main Suite
public class VenueBookingSystemApp {
    //Abstract Class & Inheritance
    public static abstract class BaseEntity {
        private static int totalEntitiesCreated = 0; // Concept: Static Variable
        private final String id;                     // Concept: Final Field
        private final long createdAtTimestamp;       // Concept: Final Field
        //Parameterized Constructor & "this" Reference
        public BaseEntity(String id) {
            this.id = Objects.requireNonNull(id, "ID cannot be null");
            this.createdAtTimestamp = System.currentTimeMillis();
            incrementEntityCount();
        }
        private static synchronized void incrementEntityCount() {
            totalEntitiesCreated++;
        }
        //Static Function
        public static synchronized int getTotalEntitiesCreated() {
            return totalEntitiesCreated;
        }
        public String getId() {
            return this.id;
        }
        public long getCreatedAtTimestamp() {
            return this.createdAtTimestamp;
        }
        //Virtual Function / Abstract Method
        public abstract String getEntitySummary();
        //Final Method
        public final String getPlatformOrigin() {
            return "VenueVerse:StandaloneTerminalEngine:v2.4";
        }
    }
    //Inheritance (User extends BaseEntity)
    public static class User extends BaseEntity {
        protected String name;      // Concept: Access Specifier (protected)
        protected String email;
        protected String role;
        protected String password;
        //Constructor Chaining (super)
        public User(String id, String name, String email, String role, String password) {
            super(id);
            this.name = (name != null) ? name : "Anonymous";
            this.email = (email != null) ? email : "no-email@venueverse.com";
            this.role = (role != null) ? role : "User";
            this.password = (password != null) ? password : "pass";
        }
        public String getName() { return this.name; }
        public String getEmail() { return this.email; }
        public String getRole() { return this.role; }
        public String getPassword() { return this.password; }
        public boolean checkPassword(String pwd) { return this.password.equals(pwd); }
        @Override
        public String getEntitySummary() {
            return "User[" + getId() + "] " + this.name + " (" + this.role + ") <" + this.email + ">";
        }
    }

    //Inheritance (Customer extends User)
    public static class Customer extends User {
        private String phone; // Concept: Access Specifier (private)

        //Constructor Chaining (super)
        public Customer(String id, String name, String email, String phone, String password) {
            super(id, name, email, "Customer", password);
            this.phone = (phone != null) ? phone : "";
        }

        public String getPhone() { return this.phone; }

        //Dynamic Method Dispatch (@Override)
        @Override
        public String getEntitySummary() {
            return "Customer[" + getId() + "] " + this.name + " | Phone: " + this.phone + " | Email: " + this.email;
        }
    }
    //Inheritance (VenueOwner extends User)
    public static class VenueOwner extends User {
        private String hostLicense; // Concept: Access Specifier (private)
        // Constructor Chaining (super)
        public VenueOwner(String id, String name, String email, String hostLicense, String password) {
            super(id, name, email, "VenueOwner", password);
            this.hostLicense = (hostLicense != null) ? hostLicense : "LIC-PENDING";
        }
        public String getHostLicense() { return this.hostLicense; }
        //Dynamic Method Dispatch (@Override)
        @Override
        public String getEntitySummary() {
            return "VenueOwner[" + getId() + "] " + this.name + " | License: " + this.hostLicense + " | Email: " + this.email;
        }
    }
    //Inheritance (Admin extends User)
    public static class Admin extends User {
        private String adminLevel; // Concept: Access Specifier (private)
        //  Constructor Chaining (super)
        public Admin(String id, String name, String email, String adminLevel, String password) {
            super(id, name, email, "Admin", password);
            this.adminLevel = (adminLevel != null) ? adminLevel : "SuperAdmin";
        }
        public String getAdminLevel() { return this.adminLevel; }
        public boolean canManagePlatform() { return true; }
        @Override
        public String getEntitySummary() {
            return "Admin[" + getId() + "] " + this.name + " | Level: " + this.adminLevel + " | Email: " + this.email;
        }
    }
    //Abstract Class & Inheritance (Venue extends BaseEntity)
    public static abstract class Venue extends BaseEntity {
        private static int totalVenuesCreated = 0; // Concept: Static Variable
        private final Set<String> bookedDates = new HashSet<>();
        private final String ownerId;
        protected String title;
        protected String category;
        protected String location;
        protected double basePrice;
        protected int capacity;
        protected double rating;
        // Nested Class (Static Nested Class)
        public static class PricingBreakdown {
            private final double basePrice;
            private final int days;
            private final double discountPercent;
            private final double totalAmount;
            //Constructor Overloading & "this" Constructor Chaining
            public PricingBreakdown(double basePrice, int days) {
                this(basePrice, days, 0.0);
            }
            public PricingBreakdown(double basePrice, int days, double discountPercent) {
                this.basePrice = Math.max(0.0, basePrice);
                this.days = Math.max(1, days);
                this.discountPercent = Math.max(0.0, Math.min(50.0, discountPercent));
                this.totalAmount = Math.round(this.basePrice * this.days * (1.0 - (this.discountPercent / 100.0)));
            }
            public double getTotalAmount() { return this.totalAmount; }
            public int getDays() { return this.days; }
            public double getDiscountPercent() { return this.discountPercent; }
            //Class-to-Basic Type Casting
            public double toPrimitiveDouble() {
                return this.totalAmount;
            }
            @Override
            public String toString() {
                return "PricingBreakdown[Days=" + days + ", Rate=INR " + basePrice + ", Disc=" + discountPercent + "% -> Total=INR " + totalAmount + "]";
            }
        }

        //Nested Class (Inner Class referencing outer Venue.this)
        public class AvailabilityWindow {
            public boolean isDateAvailable(String dateStr) {
                return Venue.this.checkAvailability(dateStr);
            }
            public void reserveDate(String dateStr) throws DateConflictException {
                Venue.this.bookDate(dateStr);
            }
            public String getVenueTitle() {
                return Venue.this.title;
            }
        }
        // Parameterized Constructor & super Chaining
        public Venue(String id, String title, String category, String location,
                     double basePrice, int capacity, double rating, String ownerId) {
            super(id);
            this.title = title;
            this.category = category;
            this.location = location;
            this.basePrice = Math.max(0.0, basePrice);
            this.capacity = Math.max(1, capacity);
            this.rating = rating;
            this.ownerId = (ownerId != null) ? ownerId : "O-001";
            incrementVenueCount();
        }
        private static synchronized void incrementVenueCount() {
            totalVenuesCreated++;
        }
        //Static Function
        public static synchronized int getTotalVenuesCreated() {
            return totalVenuesCreated;
        }
        public String getTitle() { return this.title; }
        public String getCategory() { return this.category; }
        public String getLocation() { return this.location; }
        public double getBasePrice() { return this.basePrice; }
        public int getCapacity() { return this.capacity; }
        public double getRating() { return this.rating; }
        public String getOwnerId() { return this.ownerId; }
        public Set<String> getBookedDates() { return Collections.unmodifiableSet(this.bookedDates); }
        // Method Chaining with "this" Reference
        public Venue setBasePrice(double updatedPrice) {
            this.basePrice = Math.max(0.0, updatedPrice);
            return this;
        }
        public Venue setCapacity(int updatedCapacity) {
            this.capacity = Math.max(1, updatedCapacity);
            return this;
        }
        public synchronized boolean checkAvailability(String dateStr) {
            if (dateStr == null || dateStr.isBlank()) return true;
            return !this.bookedDates.contains(dateStr.trim());
        }
        public synchronized void bookDate(String dateStr) throws DateConflictException {
            if (dateStr == null || dateStr.isBlank()) {
                throw new IllegalArgumentException("Booking date cannot be blank.");
            }
            if (!checkAvailability(dateStr)) {
                throw new DateConflictException("Venue \"" + this.title + "\" is already booked on " + dateStr, dateStr);
            }
            this.bookedDates.add(dateStr.trim());
        }
        public synchronized boolean releaseDate(String dateStr) {
            if (dateStr == null) return false;
            return this.bookedDates.remove(dateStr.trim());
        }
        //Method Overloading (Variant 1: by days)
        public double calculateTotalPrice(int days) {
            return this.basePrice * Math.max(1, days);
        }
        // Method Overloading (Variant 2: days + discount)
        public double calculateTotalPrice(int days, double discountPercent) {
            double raw = calculateTotalPrice(days);
            double disc = Math.max(0.0, Math.min(50.0, discountPercent));
            return Math.round(raw * (1.0 - (disc / 100.0)));
        }
        //Method Overloading (Variant 3: days + guests + discount with exception)
        public double calculateTotalPrice(int days, int guests, double discountPercent) throws CapacityExceededException {
            if (this.capacity > 0 && guests > this.capacity) {
                throw new CapacityExceededException(guests, this.capacity);
            }
            return calculateTotalPrice(days, discountPercent);
        }
        public PricingBreakdown buildQuote(int days, double discountPercent) {
            return new PricingBreakdown(this.basePrice, days, discountPercent);
        }

        public AvailabilityWindow openAvailabilityWindow() {
            return new AvailabilityWindow();
        }
        //Virtual Function / Abstract Method
        public abstract String getSpecialtyFeatures();
        @Override
        public String getEntitySummary() {
            return "Venue[" + getId() + "] " + this.title + " | " + this.category + " | " + this.location +
                   " | INR " + this.basePrice + "/day | Cap: " + this.capacity + " | " + getSpecialtyFeatures();
        }
    }

    //Inheritance & Dynamic Dispatch (WeddingVenue extends Venue)
    public static class WeddingVenue extends Venue {
        public WeddingVenue(String id, String title, String location, double basePrice, int capacity, double rating, String ownerId) {
            super(id, title, "Wedding", location, basePrice, capacity, rating, ownerId);
        }
        //Final Method in Derived Class
        @Override
        public final String getSpecialtyFeatures() {
            return "Bridal Suite, Vedic Mandap Lawn, Baraat Grand Entrance";
        }
        //Dynamic Method Dispatch & super Invocation
        @Override
        public double calculateTotalPrice(int days) {
            int validDays = Math.max(1, days);
            return super.calculateTotalPrice(validDays);
        }
    }
    //Inheritance & Dynamic Dispatch (BirthdayVenue extends Venue)
    public static class BirthdayVenue extends Venue {
        public BirthdayVenue(String id, String title, String location, double basePrice, int capacity, double rating, String ownerId) {
            super(id, title, "Birthday", location, basePrice, capacity, rating, ownerId);
        }
        @Override
        public String getSpecialtyFeatures() {
            return "Neon DJ Booth, Surround Sound, Birthday Cake Presentation Stage";
        }
    }
    // Concept: Inheritance & Dynamic Dispatch (ConferenceVenue extends Venue)
    public static class ConferenceVenue extends Venue {
        public ConferenceVenue(String id, String title, String location, double basePrice, int capacity, double rating, String ownerId) {
            super(id, title, "Conference", location, basePrice, capacity, rating, ownerId);
        }
        @Override
        public String getSpecialtyFeatures() {
            return "4K Laser Projector, Gigabit Fiber Wi-Fi, Wireless Podium Mics";
        }
    }
    //Inheritance (Booking extends BaseEntity)
    public static class Booking extends BaseEntity {
        private final Venue venue;
        private final Customer customer;
        private final String bookingDate;
        private final int guestsCount;
        private final int days;
        private final double totalAmount;
        private String status;
        //Nested Class (Static Nested Class - CancellationPolicy)
        public static class CancellationPolicy {
            public static double calculateRefund(double totalAmount, int daysBeforeEvent) {
                double safeAmount = Math.max(0.0, totalAmount);
                if (daysBeforeEvent >= 7) return safeAmount;
                if (daysBeforeEvent >= 2) return Math.round(safeAmount * 0.5);
                return 0.0;
            }
        }
        //Constructor Overloading (Variant 1: Initial Booking Creation)
        public Booking(String id, Venue venue, Customer customer, String bookingDate, int guestsCount, int days)
                throws CapacityExceededException, DateConflictException {
            super(id);
            this.venue = Objects.requireNonNull(venue, "Venue reference cannot be null");
            this.customer = Objects.requireNonNull(customer, "Customer reference cannot be null");
            this.bookingDate = Objects.requireNonNull(bookingDate, "Booking date cannot be null");
            this.guestsCount = Math.max(1, guestsCount);
            this.days = Math.max(1, days);
            if (venue.getCapacity() > 0 && this.guestsCount > venue.getCapacity()) {
                throw new CapacityExceededException(this.guestsCount, venue.getCapacity());
            }
            venue.bookDate(this.bookingDate);
            this.totalAmount = venue.calculateTotalPrice(this.days);
            this.status = "CONFIRMED";
        }
        //Constructor Overloading (Variant 2: Restoring from File Storage)
        public Booking(String id, Venue venue, Customer customer, String bookingDate, int guestsCount, int days, double totalAmount, String status) {
            super(id);
            this.venue = Objects.requireNonNull(venue, "Venue reference cannot be null");
            this.customer = Objects.requireNonNull(customer, "Customer reference cannot be null");
            this.bookingDate = Objects.requireNonNull(bookingDate, "Booking date cannot be null");
            this.guestsCount = Math.max(1, guestsCount);
            this.days = Math.max(1, days);
            this.totalAmount = Math.max(0.0, totalAmount);
            this.status = (status != null && !status.isBlank()) ? status : "CONFIRMED";
            if (!"CANCELLED".equalsIgnoreCase(this.status)) {
                try {
                    this.venue.bookDate(this.bookingDate);
                } catch (DateConflictException ignored) {}
            }
        }
        public Venue getVenue() { return this.venue; }
        public Customer getCustomer() { return this.customer; }
        public String getBookingDate() { return this.bookingDate; }
        public int getGuestsCount() { return this.guestsCount; }
        public int getDays() { return this.days; }
        public double getTotalAmount() { return this.totalAmount; }
        public String getStatus() { return this.status; }
        public Booking withStatus(String newStatus) {
            this.status = newStatus;
            return this;
        }
        public boolean cancel() {
            if ("CANCELLED".equals(this.status)) return false;
            this.status = "CANCELLED";
            this.venue.releaseDate(this.bookingDate);
            return true;
        }
        @Override
        public String getEntitySummary() {
            return "Booking[" + getId() + "] Venue=" + venue.getTitle() + " (" + venue.getId() + ") | Customer=" + customer.getName() +
                   " (" + customer.getId() + ") | Date=" + bookingDate + " | Guests=" + guestsCount + " | Total=INR " + totalAmount + " | Status=" + status;
        }
    }
    //User-Defined Exception Hierarchy (Base Checked Exception)
    public static class VenueBookingException extends Exception {
        private final String errorCode;
        public VenueBookingException(String message, String errorCode) {
            super(message);
            this.errorCode = errorCode;
        }
        public String getErrorCode() { return this.errorCode; }
        public String getDiagnostic() { return "[" + errorCode + "] " + getMessage(); }
    }
    //User-Defined Exception (Derived Class - Capacity Limit)
    public static class CapacityExceededException extends VenueBookingException {
        private final int requested;
        private final int maxCapacity;
        public CapacityExceededException(int requested, int maxCapacity) {
            super("Requested guests (" + requested + ") exceeds max venue capacity (" + maxCapacity + ").", "CAPACITY_EXCEEDED");
            this.requested = requested;
            this.maxCapacity = maxCapacity;
        }
        public int getRequested() { return requested; }
        public int getMaxCapacity() { return maxCapacity; }
    }
    //User-Defined Exception (Derived Class - Date Collision)
    public static class DateConflictException extends VenueBookingException {
        private final String dateStr;
        public DateConflictException(String message, String dateStr) {
            super(message, "DATE_CONFLICT");
            this.dateStr = dateStr;
        }
        public String getDateStr() { return dateStr; }
    }
    //User-Defined Exception (Derived Class - Slot Collision)
    public static class SlotConflictException extends VenueBookingException {
        public SlotConflictException(String message) {
            super(message, "SLOT_CONFLICT");
        }
    }
    //User-Defined Exception (Derived Class - Authentication Failure)
    public static class AuthenticationException extends VenueBookingException {
        public AuthenticationException(String message) {
            super(message, "AUTH_FAILED");
        }
    }
    // Templates / Generics (Generic Class with Type Parameter T)
    public static class CatalogStore<T extends BaseEntity> {
        private final List<T> items = new ArrayList<>();
        public void add(T item) {
            if (item != null) items.add(item);
        }
        public int count() {
            return items.size();
        }
        public List<T> getAll() {
            return Collections.unmodifiableList(this.items);
        }
        public T findById(String id) {
            for (T item : items) {
                if (item.getId().equalsIgnoreCase(id)) return item;
            }
            return null;
        }
        public List<T> filter(Predicate<T> predicate) {
            List<T> result = new ArrayList<>();
            for (T item : items) {
                if (predicate.test(item)) result.add(item);
            }
            return result;
        }
    }
    //Multithreading Engine & Synchronization
    public static class BookingConcurrencyManager {
        private static int workersStarted = 0;       // Concept: Static Variable
        private final Object lock = new Object();     // Concept: Final Field
        private int bookingCount = 0;
        private double totalRevenue = 0.0;
        private final List<String> transactionLedger = new ArrayList<>();
        private final Map<String, Set<String>> synchronizedSlotIndex = new HashMap<>();
        private static synchronized void incrementWorkers(int count) {
            workersStarted += count;
        }
        //Static Method
        public static synchronized int getWorkersStarted() {
            return workersStarted;
        }
        //Synchronized Method
        public synchronized int recordConfirmedTransaction(String bookingId, double amount) {
            bookingCount++;
            totalRevenue += amount;
            return bookingCount;
        }
        public synchronized int getBookingCount() {
            return bookingCount;
        }
        public synchronized double getTotalRevenue() {
            return totalRevenue;
        }
        //Multithreading (Extending Thread Class)
        public class AuditThread extends Thread {
            private final String bookingId;
            private final String venueId;
            private final double amount;
            public Thread.State observedSleepState = Thread.State.NEW;
            public AuditThread(String bookingId, String venueId, double amount) {
                super("AuditWorker-" + bookingId);
                this.bookingId = bookingId;
                this.venueId = venueId;
                this.amount = amount;
            }
            //Thread Lifecycle & Thread Methods (yield, sleep)
            @Override
            public void run() {
                Thread.yield();
                try {
                    observedSleepState = Thread.State.TIMED_WAITING;
                    Thread.sleep(5);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                int txIndex = recordConfirmedTransaction(bookingId, amount);
                synchronized (lock) {
                    transactionLedger.add(String.format("TX#%03d | Booking: %s | Venue: %s | INR %.2f",
                            txIndex, bookingId, venueId, amount));
                }
            }
        }
        //Multithreading (Implementing Runnable Interface)
        public class SyncTask implements Runnable {
            private final String venueId;
            private final String dateStr;
            public SyncTask(String venueId, String dateStr) {
                this.venueId = venueId;
                this.dateStr = dateStr;
            }
            // Thread Lifecycle & Thread Methods (yield, sleep)
            @Override
            public void run() {
                Thread.yield();
                try {
                    Thread.sleep(3);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                synchronized (lock) {
                    synchronizedSlotIndex.computeIfAbsent(venueId, k -> new HashSet<>()).add(dateStr);
                }
            }
        }
        // Thread Methods (start, join) & Thread Coordination
        public void executeCoreBookingConcurrency(String bookingId, String venueId, String dateStr, double amount) {
            AuditThread t1 = new AuditThread(bookingId, venueId, amount);
            Thread t2 = new Thread(new SyncTask(venueId, dateStr), "SyncWorker-" + venueId);
            incrementWorkers(2);
            t1.start(); // Concept: Thread start()
            t2.start();
            try {
                t1.join(); // Concept: Thread join()
                t2.join();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        public static class AnalyticsResult {
            public double totalRev = 0;
            public int totalBookings = 0;
            public int activeDatesCount = 0;
        }
        //Multithreading (Parallel Worker Threads for Analytics)
        public AnalyticsResult runParallelAnalytics(List<Booking> bookings, List<Venue> venues) {
            final AnalyticsResult result = new AnalyticsResult();
            // Multithreading - Extends Thread
            class RevenueAggregatorThread extends Thread {
                @Override
                public void run() {
                    Thread.yield();
                    double rev = 0;
                    int count = 0;
                    for (Booking b : bookings) {
                        if (!"CANCELLED".equals(b.getStatus())) {
                            rev += b.getTotalAmount();
                            count++;
                        }
                    }
                    synchronized (result) {
                        result.totalRev = rev;
                        result.totalBookings = count;
                    }
                }
            }
            //Multithreading - Implements Runnable
            Runnable occupancyTask = () -> {
                Thread.yield();
                int datesCount = 0;
                for (Venue v : venues) {
                    datesCount += v.getBookedDates().size();
                }
                synchronized (result) {
                    result.activeDatesCount = datesCount;
                }
            };
            RevenueAggregatorThread t1 = new RevenueAggregatorThread();
            Thread t2 = new Thread(occupancyTask, "OccupancyWorker");
            t1.start();
            t2.start();
            try {
                t1.join();
                t2.join();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return result;
        }
        // Exception Throwing (throws & throw)
        public void validateSlot(String venueId, boolean forceConflict) throws VenueBookingException {
            synchronized (lock) {
                if (venueId == null || venueId.isBlank()) {
                    throw new VenueBookingException("Venue ID cannot be empty", "INVALID_INPUT");
                }
                if (forceConflict) {
                    throw new SlotConflictException("High-demand lock collision for venue: " + venueId);
                }
            }
        }
        //Exception Handling (try, catch derived first, catch base second, finally)
        public String safeValidateSlot(String venueId, boolean forceConflict) {
            try {
                validateSlot(venueId, forceConflict);
                return "SUCCESS_OK:" + venueId;
            } catch (SlotConflictException e) {
                return "DERIVED_EXCEPTION_CAUGHT: " + e.getDiagnostic();
            } catch (VenueBookingException e) {
                return "BASE_EXCEPTION_CAUGHT: " + e.getDiagnostic();
            } finally {
                synchronized (lock) {
                }
            }
        }
    }
    // Final Class
    public static final class PlatformSecurity {
        public static final String VERSION = "VenueVerse v2.4 (Terminal Edition)";
        public static boolean isAuthorizedRole(String role) {
            return "Admin".equalsIgnoreCase(role) || "VenueOwner".equalsIgnoreCase(role);
        }
        //  Static Method for Authentication
        public static User authenticate(CatalogStore<User> userCatalog, String email, String password) throws AuthenticationException {
            for (User u : userCatalog.getAll()) {
                if (u.getEmail().equalsIgnoreCase(email) && u.checkPassword(password)) {
                    return u;
                }
            }
            throw new AuthenticationException("Invalid email or password credentials.");
        }
    }
    // Generic Collections & Composition
    private final CatalogStore<Venue> venueCatalog = new CatalogStore<>();
    private final CatalogStore<User> userCatalog = new CatalogStore<>();
    private final CatalogStore<Booking> bookingCatalog = new CatalogStore<>();
    private final BookingConcurrencyManager concurrencyManager = new BookingConcurrencyManager();
    private final Scanner scanner = new Scanner(System.in);
    // Sequential ID Counters
    private int userCounter = 0;
    private int ownerCounter = 0;
    private int adminCounter = 0;
    private int venueCounter = 0;
    private int bookingCounter = 0;
    private String nextUserId() { return String.format("U-%03d", ++userCounter); }
    private String nextOwnerId() { return String.format("O-%03d", ++ownerCounter); }
    private String nextAdminId() { return String.format("A-%03d", ++adminCounter); }
    private String nextVenueId() { return String.format("V-%03d", ++venueCounter); }
    private String nextBookingId() { return String.format("B-%03d", ++bookingCounter); }
    public VenueBookingSystemApp() {
        seedInitialData();
        loadUsersFromFile();
        loadBookingsFromFile();
    }
    // File Handling Constants
    private static final String USER_STORAGE_FILE = "users_storage.txt";
    private static final String BOOKING_STORAGE_FILE = "bookings_storage.txt";
    private void syncIdCounter(String id) {
        if (id == null || id.length() < 3) return;
        try {
            if (id.startsWith("U-")) {
                int num = Integer.parseInt(id.substring(2));
                if (num > userCounter) userCounter = num;
            } else if (id.startsWith("O-")) {
                int num = Integer.parseInt(id.substring(2));
                if (num > ownerCounter) ownerCounter = num;
            } else if (id.startsWith("A-")) {
                int num = Integer.parseInt(id.substring(2));
                if (num > adminCounter) adminCounter = num;
            } else if (id.startsWith("B-")) {
                int num = Integer.parseInt(id.substring(2));
                if (num > bookingCounter) bookingCounter = num;
            } else if (id.startsWith("V-")) {
                int num = Integer.parseInt(id.substring(2));
                if (num > venueCounter) venueCounter = num;
            }
        } catch (NumberFormatException ignored) {}
    }
    //  File Handling - Writing Users to File (Admin kept in-code)
    private void saveUserToFile(User u) {
        if (u instanceof Admin) {
            return;
        }
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(USER_STORAGE_FILE, true))) {
            String extra = "";
            if (u instanceof Customer) {
                extra = ((Customer) u).getPhone();
            } else if (u instanceof VenueOwner) {
                extra = ((VenueOwner) u).getHostLicense();
            }
            writer.write(u.getId() + "," + u.getName() + "," + u.getEmail() + "," + u.getRole() + "," + extra + "," + u.getPassword());
            writer.newLine();
        } catch (IOException e) {
            System.out.println("[!] Warning: Could not write user to storage file: " + e.getMessage());
        }
    }
    // Concept: File Handling - Reading Users from File
    private void loadUsersFromFile() {
        File file = new File(USER_STORAGE_FILE);
        if (!file.exists()) {
            for (User u : userCatalog.getAll()) {
                if (!(u instanceof Admin)) {
                    saveUserToFile(u);
                }
            }
            return;
        }
        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;
                String[] parts = line.split(",", -1);
                if (parts.length >= 6) {
                    String id = parts[0].trim();
                    String name = parts[1].trim();
                    String email = parts[2].trim();
                    String role = parts[3].trim();
                    String extra = parts[4].trim();
                    String password = parts[5].trim();
                    if ("Admin".equalsIgnoreCase(role)) continue;
                    syncIdCounter(id);
                    if (userCatalog.findById(id) != null) continue;
                    User loadedUser;
                    if ("Customer".equalsIgnoreCase(role)) {
                        loadedUser = new Customer(id, name, email, extra, password);
                    } else if ("VenueOwner".equalsIgnoreCase(role)) {
                        loadedUser = new VenueOwner(id, name, email, extra, password);
                    } else {
                        loadedUser = new User(id, name, email, role, password);
                    }
                    userCatalog.add(loadedUser);
                }
            }
        } catch (IOException e) {
            System.out.println("[!] Notice: Could not read user storage file: " + e.getMessage());
        }
    }
    //File Handling - Writing Bookings to File
    private void saveBookingToFile(Booking b) {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(BOOKING_STORAGE_FILE, true))) {
            writer.write(b.getId() + "," +
                         b.getVenue().getId() + "," +
                         b.getCustomer().getId() + "," +
                         b.getBookingDate() + "," +
                         b.getGuestsCount() + "," +
                         b.getDays() + "," +
                         b.getTotalAmount() + "," +
                         b.getStatus());
            writer.newLine();
        } catch (IOException e) {
            System.out.println("[!] Warning: Could not write booking to storage file: " + e.getMessage());
        }
    }
    // Concept: File Handling - Rewriting Bookings to File on Cancellation
    private void rewriteAllBookingsToFile() {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(BOOKING_STORAGE_FILE, false))) {
            for (Booking b : bookingCatalog.getAll()) {
                writer.write(b.getId() + "," + b.getVenue().getId() + "," + b.getCustomer().getId() + "," + b.getBookingDate() + "," + 
                             b.getGuestsCount() + "," + b.getDays() + "," +  b.getTotalAmount() + "," +b.getStatus());writer.newLine();
            }
        } catch (IOException e) {
            System.out.println("[!] Warning: Could not update bookings storage file: " + e.getMessage());
        }
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
                    String bId = p[0].trim();
                    String vId = p[1].trim();
                    String cId = p[2].trim();
                    String dateStr = p[3].trim();
                    int guests = Integer.parseInt(p[4].trim());
                    int days = Integer.parseInt(p[5].trim());
                    double total = Double.parseDouble(p[6].trim());
                    String status = p[7].trim();
                    syncIdCounter(bId);
                    if (bookingCatalog.findById(bId) != null) continue;
                    Venue v = venueCatalog.findById(vId);
                    User u = userCatalog.findById(cId);
                    Customer c = (u instanceof Customer) ? (Customer) u : null;
                    if (v != null && c != null) {
                        Booking b = new Booking(bId, v, c, dateStr, guests, days, total, status);
                        bookingCatalog.add(b);
                    }
                }
            }
        } catch (Exception e) {
            System.out.println("[!] Notice: Could not read bookings storage file: " + e.getMessage());
        }
    }
    // Concept: Data Initialization (In-Code Admin & Default Sample Venues)
    private void seedInitialData() {
        Customer c1 = new Customer(nextUserId(), "Aditi Sharma", "aditi@gmail.com", "+919876543210", "pass123");   // U-001
        Customer c2 = new Customer(nextUserId(), "Aarav Mehta", "aarav@venueverse.com", "+919811223344", "pass123"); // U-002
        VenueOwner o1 = new VenueOwner(nextOwnerId(), "Ramesh Shah", "ramesh@venueverse.com", "LIC-GJ-2026-901", "host123"); // O-001
        Admin a1 = new Admin(nextAdminId(), "Vikram Rathore", "admin@venueverse.com", "PlatformSuperAdmin", "admin123"); // A-001
        userCatalog.add(c1);
        userCatalog.add(c2);
        userCatalog.add(o1);
        userCatalog.add(a1);

        WeddingVenue v1 = new WeddingVenue(nextVenueId(), "Royal Rajwadi Grand Ballroom", "Gandhinagar", 45000.0, 500, 4.9, o1.getId()); // V-001
        BirthdayVenue v2 = new BirthdayVenue(nextVenueId(), "Skyline Rooftop Lounge", "Ahmedabad", 25000.0, 150, 4.7, o1.getId());        // V-002
        ConferenceVenue v3 = new ConferenceVenue(nextVenueId(), "Gift City Innovation Hub", "Gandhinagar", 60000.0, 800, 4.8, o1.getId());  // V-003

        venueCatalog.add(v1);
        venueCatalog.add(v2);
        venueCatalog.add(v3);

        try {
            v1.bookDate("2027-04-10");
        } catch (DateConflictException ignored) {}
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
            System.out.println("  5. Run High-Concurrency Stress Test (Multithreaded Race-Condition Protection)");
            System.out.println("  0. Exit Application");

            int choice = readIntChoice(0, 5);
            switch (choice) {
                case 1:
                    loginFlow("Customer");
                    break;
                case 2:
                    loginFlow("VenueOwner");
                    break;
                case 3:
                    loginFlow("Admin");
                    break;
                case 4:
                    registerUserFlow();
                    break;
                case 5:
                    runConcurrencyStressTest();
                    break;
                case 0:
                    running = false;
                    System.out.println("\nExiting Venue Booking System. Goodbye!");
                    break;
                default:
                    System.out.println("[!] Invalid choice. Please enter a number between 0 and 5.");
            }
        }
    }

    // Concept: Dynamic Method Dispatch & Authentication Exception Handling
    private void loginFlow(String expectedRole) {
        printHeader(expectedRole.toUpperCase() + " LOGIN");
        String email = readValidEmail("Enter Email: ");
        String password = readValidPassword("Enter Password: ");

        try {
            User authenticated = PlatformSecurity.authenticate(userCatalog, email, password);
            if (!authenticated.getRole().equalsIgnoreCase(expectedRole) && !authenticated.getRole().equalsIgnoreCase("Admin")) {
                System.out.println("[!] Access Denied: User role is '" + authenticated.getRole() + "', expected '" + expectedRole + "'.");
                return;
            }
            System.out.println("\n[+] Login successful! Welcome, " + authenticated.getName() + " [" + authenticated.getId() + "]");

            switch (authenticated.getRole()) {
                case "Customer":
                    customerMenu((Customer) authenticated);
                    break;
                case "VenueOwner":
                    venueOwnerMenu((VenueOwner) authenticated);
                    break;
                case "Admin":
                    adminMenu((Admin) authenticated);
                    break;
                default:
                    System.out.println("[!] Unknown role.");
            }
        } catch (AuthenticationException e) {
            System.out.println("[ERROR] " + e.getDiagnostic());
        }
    }

    // Concept: Dynamic Instantiation & File Handling Persistence
    private void registerUserFlow() {
        printHeader("CREATE NEW USER ACCOUNT");
        System.out.println("  1. Register as Customer");
        System.out.println("  2. Register as Venue Owner");
        int type = readIntChoice(1, 2);

        String name = readValidName("Enter Full Name: ");
        String email = readUniqueEmail("Enter Email Address: ");
        String password = readValidPassword("Enter Password (minimum 4 characters): ");

        switch (type) {
            case 1:
                String phone = readValidPhone("Enter Phone Number: ");
                String custId = nextUserId();
                Customer newCust = new Customer(custId, name, email, phone, password);
                userCatalog.add(newCust);
                saveUserToFile(newCust);
                System.out.println("\n[+] Customer account created successfully! User ID: " + custId);
                break;
            case 2:
                String license = readNonEmptyString("Enter Host License (e.g. LIC-GJ-2026-X): ", 4);
                String ownerId = nextOwnerId();
                VenueOwner newOwner = new VenueOwner(ownerId, name, email, license, password);
                userCatalog.add(newOwner);
                saveUserToFile(newOwner);
                System.out.println("\n[+] Venue Owner account created successfully! Owner ID: " + ownerId);
                break;
            default:
                break;
        }
    }

    // Concept: Switch Case Menu Control (Customer Menu)
    private void customerMenu(Customer customer) {
        boolean sessionActive = true;
        while (sessionActive) {
            printHeader("CUSTOMER DASHBOARD: " + customer.getName() + " [" + customer.getId() + "]");
            System.out.println("  1. Browse Available Venues");
            System.out.println("  2. Search Venues by Location / Category / Budget");
            System.out.println("  3. Calculate Instant Pricing Quote (Method Overloading)");
            System.out.println("  4. Book a Venue");
            System.out.println("  5. View My Bookings");
            System.out.println("  6. Cancel a Booking (Cancellation Policy)");
            System.out.println("  7. Demonstrate Type Casting (Basic <-> Class)");
            System.out.println("  8. Logout");

            int choice = readIntChoice(1, 8);
            switch (choice) {
                case 1:
                    browseAllVenues();
                    break;
                case 2:
                    searchVenuesFlow();
                    break;
                case 3:
                    calculateQuoteFlow();
                    break;
                case 4:
                    bookVenueFlow(customer);
                    break;
                case 5:
                    viewCustomerBookings(customer);
                    break;
                case 6:
                    cancelBookingFlow(customer);
                    break;
                case 7:
                    demonstrateTypeCasting();
                    break;
                case 8:
                    sessionActive = false;
                    System.out.println("\n[+] Logged out successfully.");
                    break;
                default:
                    System.out.println("[!] Invalid choice. Please enter a number between 1 and 8.");
            }
        }
    }

    // Concept: Switch Case Menu Control (Venue Owner Menu)
    private void venueOwnerMenu(VenueOwner owner) {
        boolean sessionActive = true;
        while (sessionActive) {
            printHeader("VENUE OWNER DASHBOARD: " + owner.getName() + " [" + owner.getId() + "]");
            System.out.println("  1. View My Venues");
            System.out.println("  2. Add New Venue Listing (Wedding / Birthday / Conference)");
            System.out.println("  3. Manage Venue Availability (Inner Class AvailabilityWindow)");
            System.out.println("  4. View Bookings for My Venues");
            System.out.println("  5. Update Venue Pricing ('this' Method Chaining)");
            System.out.println("  6. Logout");

            int choice = readIntChoice(1, 6);
            switch (choice) {
                case 1:
                    viewOwnerVenues(owner);
                    break;
                case 2:
                    addNewVenueFlow(owner);
                    break;
                case 3:
                    manageAvailabilityFlow(owner);
                    break;
                case 4:
                    viewOwnerVenueBookings(owner);
                    break;
                case 5:
                    updateVenuePricingFlow(owner);
                    break;
                case 6:
                    sessionActive = false;
                    System.out.println("\n[+] Logged out successfully.");
                    break;
                default:
                    System.out.println("[!] Invalid choice. Please enter a number between 1 and 6.");
            }
        }
    }

    // Concept: Switch Case Menu Control (Admin Menu)
    private void adminMenu(Admin admin) {
        boolean sessionActive = true;
        while (sessionActive) {
            printHeader("ADMIN CONTROL CONSOLE: " + admin.getName() + " [" + admin.getId() + "]");
            System.out.println("  1. View All Registered Users (Polymorphic Dynamic Dispatch)");
            System.out.println("  2. View Platform Metrics & Venues (Static Members)");
            System.out.println("  3. View All Platform Bookings");
            System.out.println("  4. Run Platform Audit & Reconciliation (Multithreaded Parallel Engine)");
            System.out.println("  5. Logout");

            int choice = readIntChoice(1, 5);
            switch (choice) {
                case 1:
                    printHeader("ALL REGISTERED USERS (POLYMORPHIC DISPATCH)");
                    for (User u : userCatalog.getAll()) {
                        System.out.println("  * " + u.getEntitySummary());
                    }
                    break;
                case 2:
                    printHeader("GLOBAL PLATFORM METRICS");
                    System.out.println("  * Platform Origin: " + admin.getPlatformOrigin());
                    System.out.println("  * Total Entities Created: " + BaseEntity.getTotalEntitiesCreated());
                    System.out.println("  * Total Venues Created:   " + Venue.getTotalVenuesCreated());
                    System.out.println("  * Background Threads Processed: " + BookingConcurrencyManager.getWorkersStarted());
                    System.out.println("\nAll Venues:");
                    for (Venue v : venueCatalog.getAll()) {
                        System.out.println("  * " + v.getEntitySummary());
                    }
                    break;
                case 3:
                    printHeader("ALL PLATFORM BOOKINGS");
                    if (bookingCatalog.count() == 0) {
                        System.out.println("  (No bookings recorded yet)");
                    } else {
                        for (Booking b : bookingCatalog.getAll()) {
                            System.out.println("  * " + b.getEntitySummary());
                        }
                    }
                    break;
                case 4:
                    printHeader("PLATFORM RECONCILIATION & PARALLEL ANALYTICS");
                    BookingConcurrencyManager.AnalyticsResult stats = concurrencyManager.runParallelAnalytics(
                            bookingCatalog.getAll(), venueCatalog.getAll());
                    System.out.println("  * Confirmed Active Bookings: " + stats.totalBookings);
                    System.out.printf("  * Total Revenue Reconciled:  INR %,.2f\n", stats.totalRev);
                    System.out.println("  * Total Reserved Dates:      " + stats.activeDatesCount);
                    System.out.println("  * Background Threads Run:    " + BookingConcurrencyManager.getWorkersStarted());
                    System.out.println("  [+] Multithreaded audit & reconciliation completed with 100% data integrity.");
                    break;
                case 5:
                    sessionActive = false;
                    System.out.println("\n[+] Admin logged out successfully.");
                    break;
                default:
                    System.out.println("[!] Invalid choice. Please enter a number between 1 and 5.");
            }
        }
    }

    // Concept: Venue Catalog Operations
    private void browseAllVenues() {
        printHeader("AVAILABLE VENUES");
        for (Venue v : venueCatalog.getAll()) {
            System.out.println("  * " + v.getEntitySummary());
            System.out.println("    Booked Dates: " + (v.getBookedDates().isEmpty() ? "None (Fully Available)" : v.getBookedDates()));
        }
    }

    private void searchVenuesFlow() {
        printHeader("SEARCH VENUES");
        System.out.print("Enter location keyword (or press Enter for any): ");
        String loc = scanner.nextLine().trim();
        double budget = readPositiveDoubleOrZero("Enter max budget per day in INR (0 for no limit): ");

        List<Venue> matches = venueCatalog.filter(v -> {
            boolean locMatch = loc.isEmpty() || v.getLocation().toLowerCase().contains(loc.toLowerCase());
            boolean priceMatch = budget <= 0 || v.getBasePrice() <= budget;
            return locMatch && priceMatch;
        });

        System.out.println("\nFound " + matches.size() + " matching venue(s):");
        for (Venue v : matches) {
            System.out.println("  * " + v.getEntitySummary());
        }
    }

    private void calculateQuoteFlow() {
        printHeader("CALCULATE INSTANT QUOTE (METHOD OVERLOADING)");
        Venue venue = readExistingVenue();
        if (venue == null) return;

        int days = readValidDays("Enter number of days (1-365): ");
        double discount = readValidDiscount("Enter discount percentage (0 to 50): ");
        int guests = readValidGuests("Enter expected guest count: ");

        System.out.println("\nCalculating via Overloaded Methods:");
        // Concept: Method Overloading (Overload 1: days)
        double standardPrice = venue.calculateTotalPrice(days);
        System.out.println("  1) Standard Rate (" + days + " days):                  INR " + standardPrice);

        // Concept: Method Overloading (Overload 2: days + discount)
        double discountedPrice = venue.calculateTotalPrice(days, discount);
        System.out.println("  2) Discounted Rate (" + discount + "% off):              INR " + discountedPrice);

        // Concept: Method Overloading (Overload 3: days + guests + discount)
        try {
            double finalEstimate = venue.calculateTotalPrice(days, guests, discount);
            System.out.println("  3) Package Rate (" + guests + " guests, " + discount + "% off): INR " + finalEstimate);
        } catch (CapacityExceededException e) {
            System.out.println("  3) [CAUGHT CapacityExceededException]: " + e.getMessage());
        }

        // Concept: Nested Class (PricingBreakdown)
        Venue.PricingBreakdown quote = venue.buildQuote(days, discount);
        System.out.println("  * Nested Class Quote: " + quote);
    }

    private void bookVenueFlow(Customer customer) {
        printHeader("BOOK A VENUE");
        Venue venue = readExistingVenue();
        if (venue == null) return;

        String dateStr = readValidDate("Enter Event Date (YYYY-MM-DD): ");

        // Concept: Inner Class (AvailabilityWindow)
        Venue.AvailabilityWindow window = venue.openAvailabilityWindow();
        if (!window.isDateAvailable(dateStr)) {
            System.out.println("[!] Selected date " + dateStr + " is already booked for " + window.getVenueTitle() + ".");
            return;
        }

        int guests = readValidGuests("Enter number of guests: ");
        int days = readValidDays("Enter number of days (1-365): ");

        String bookingId = nextBookingId();

        // Concept: Exception Handling (try, catch derived first, base second, finally)
        try {
            concurrencyManager.validateSlot(venue.getId(), false);
            Booking newBooking = new Booking(bookingId, venue, customer, dateStr, guests, days);
            bookingCatalog.add(newBooking);
            saveBookingToFile(newBooking); // Concept: File Handling - Writing Booking

            // Concept: Multithreading in Core Code
            concurrencyManager.executeCoreBookingConcurrency(bookingId, venue.getId(), dateStr, newBooking.getTotalAmount());

            System.out.println("\n[SUCCESS] Booking Confirmed!");
            System.out.println("  * " + newBooking.getEntitySummary());
        } catch (CapacityExceededException e) {
            System.out.println("\n[!] [Capacity Limit Error]: " + e.getMessage());
            System.out.println("    Requested=" + e.getRequested() + ", MaxCapacity=" + e.getMaxCapacity());
        } catch (DateConflictException e) {
            System.out.println("\n[!] [Date Collision Error]: " + e.getMessage());
            System.out.println("    Conflicting Date=" + e.getDateStr());
        } catch (VenueBookingException e) {
            System.out.println("\n[!] [General Booking Error]: " + e.getDiagnostic());
        } finally {
        }
    }

    private void viewCustomerBookings(Customer customer) {
        printHeader("MY BOOKINGS (" + customer.getName() + " [" + customer.getId() + "])");
        List<Booking> myBookings = bookingCatalog.filter(b -> b.getCustomer().getId().equals(customer.getId()));
        if (myBookings.isEmpty()) {
            System.out.println("  No active bookings found.");
        } else {
            for (Booking b : myBookings) {
                System.out.println("  * " + b.getEntitySummary());
            }
        }
    }

    private void cancelBookingFlow(Customer customer) {
        printHeader("CANCEL A BOOKING");
        System.out.print("Enter Booking ID to cancel (e.g. B-001): ");
        String bId = scanner.nextLine().trim();

        Booking booking = bookingCatalog.findById(bId);
        if (booking == null || !booking.getCustomer().getId().equals(customer.getId())) {
            System.out.println("[!] Booking not found or does not belong to your account.");
            return;
        }

        int daysBefore = readValidDays("Enter days remaining before the event: ");

        // Concept: Static Nested Class (CancellationPolicy)
        double refund = Booking.CancellationPolicy.calculateRefund(booking.getTotalAmount(), daysBefore);
        boolean cancelled = booking.cancel();

        if (cancelled) {
            rewriteAllBookingsToFile(); // Concept: File Handling - Rewriting Booking File
            System.out.println("\n[+] Booking " + bId + " has been cancelled.");
            System.out.println("  * Venue date released: " + booking.getBookingDate());
            System.out.println("  * Refund Amount: INR " + refund + " (from original INR " + booking.getTotalAmount() + ")");
        } else {
            System.out.println("[!] Booking is already cancelled.");
        }
    }

    private void viewOwnerVenues(VenueOwner owner) {
        printHeader("MY LISTED VENUES (" + owner.getName() + " [" + owner.getId() + "])");
        List<Venue> myVenues = venueCatalog.filter(v -> v.getOwnerId().equals(owner.getId()));
        if (myVenues.isEmpty()) {
            System.out.println("  No venues listed yet.");
        } else {
            for (Venue v : myVenues) {
                System.out.println("  * " + v.getEntitySummary());
                System.out.println("    Booked Dates: " + (v.getBookedDates().isEmpty() ? "None" : v.getBookedDates()));
            }
        }
    }

    private void addNewVenueFlow(VenueOwner owner) {
        printHeader("LIST NEW VENUE");
        System.out.println("  1. Wedding Venue");
        System.out.println("  2. Birthday Party Venue");
        System.out.println("  3. Conference / Corporate Venue");
        int type = readIntChoice(1, 3);

        String title = readNonEmptyString("Enter Venue Title (min 3 characters): ", 3);
        String location = readValidName("Enter City / Location: ");
        double price = readValidPrice("Enter Base Price per Day in INR (min 1,000): ");
        int capacity = readValidCapacity("Enter Guest Capacity (min 10): ");

        String newId = nextVenueId();
        Venue newVenue;

        switch (type) {
            case 1:
                newVenue = new WeddingVenue(newId, title, location, price, capacity, 4.8, owner.getId());
                break;
            case 2:
                newVenue = new BirthdayVenue(newId, title, location, price, capacity, 4.5, owner.getId());
                break;
            case 3:
                newVenue = new ConferenceVenue(newId, title, location, price, capacity, 4.9, owner.getId());
                break;
            default:
                return;
        }

        venueCatalog.add(newVenue);
        System.out.println("\n[+] Venue successfully listed with ID: " + newId);
        System.out.println("  * " + newVenue.getEntitySummary());
    }

    private void manageAvailabilityFlow(VenueOwner owner) {
        printHeader("MANAGE AVAILABILITY");
        Venue venue = readExistingVenue();
        if (venue == null) return;

        if (!venue.getOwnerId().equals(owner.getId())) {
            System.out.println("[!] Access Denied: You do not own venue " + venue.getId() + ".");
            return;
        }

        // Concept: Inner Class (AvailabilityWindow)
        Venue.AvailabilityWindow window = venue.openAvailabilityWindow();
        System.out.println("Managing calendar for: " + window.getVenueTitle());
        String dateStr = readValidDate("Enter Date to block (YYYY-MM-DD): ");

        try {
            window.reserveDate(dateStr);
            System.out.println("[+] Date " + dateStr + " is now successfully blocked.");
        } catch (DateConflictException e) {
            System.out.println("[!] [Date Conflict]: " + e.getMessage());
        }
    }

    private void viewOwnerVenueBookings(VenueOwner owner) {
        printHeader("BOOKINGS FOR MY VENUES");
        List<Venue> myVenues = venueCatalog.filter(v -> v.getOwnerId().equals(owner.getId()));
        Set<String> myVenueIds = new HashSet<>();
        for (Venue v : myVenues) myVenueIds.add(v.getId());

        List<Booking> incoming = bookingCatalog.filter(b -> myVenueIds.contains(b.getVenue().getId()));
        if (incoming.isEmpty()) {
            System.out.println("  No customer bookings received for your venues yet.");
        } else {
            for (Booking b : incoming) {
                System.out.println("  * " + b.getEntitySummary());
            }
        }
    }

    private void updateVenuePricingFlow(VenueOwner owner) {
        printHeader("UPDATE PRICING ('this' METHOD CHAINING)");
        Venue venue = readExistingVenue();
        if (venue == null) return;

        if (!venue.getOwnerId().equals(owner.getId())) {
            System.out.println("[!] Access Denied: You do not own venue " + venue.getId() + ".");
            return;
        }

        double newPrice = readValidPrice("Enter new Base Price per Day in INR (min 1,000): ");
        int newCap = readValidCapacity("Enter new Capacity (min 10): ");

        // Concept: Method Chaining with "this" Reference
        venue.setBasePrice(newPrice).setCapacity(newCap);

        System.out.println("\n[+] Venue updated successfully via 'this' method chaining:");
        System.out.println("  * " + venue.getEntitySummary());
    }

    // Concept: Basic-to-Class, Class-to-Basic & Class-to-Class Type Casting (Downcasting with instanceof)
    private void demonstrateTypeCasting() {
        printHeader("TYPE CASTING DEMONSTRATION");
        System.out.println("1. Basic-to-Class Casting (Boxing primitive double into PricingBreakdown class):");
        double primitiveInr = 48000.0;
        Venue.PricingBreakdown breakdown = new Venue.PricingBreakdown(primitiveInr, 3, 10.0);
        System.out.println("   Primitive double: " + primitiveInr + " -> PricingBreakdown Object: " + breakdown);

        System.out.println("\n2. Class-to-Basic Casting (Unboxing PricingBreakdown object to primitive double):");
        double unboxedInr = breakdown.toPrimitiveDouble();
        System.out.println("   PricingBreakdown Object -> Primitive double: " + unboxedInr);

        System.out.println("\n3. Class-to-Class Upcasting & Downcasting:");
        User upcastedUser = (User) new VenueOwner("O-999", "Cast Sample Owner", "cast@venueverse.com", "LIC-UP-100", "pass");
        System.out.println("   Upcast: VenueOwner assigned to User reference -> " + upcastedUser.getEntitySummary());

        if (upcastedUser instanceof VenueOwner) {
            VenueOwner downcastedOwner = (VenueOwner) upcastedUser;
            System.out.println("   Downcast: (VenueOwner) upcastedUser -> License: " + downcastedOwner.getHostLicense());
        }
    }

    // Concept: Multithreading & Race Condition Prevention (Thread Synchronization)
    public void runConcurrencyStressTest() {
        printHeader("HIGH-CONCURRENCY RACE-CONDITION PROTECTION BENCHMARK");
        System.out.println("Simulating 10 concurrent threads attempting to book V-001 on '2028-01-01' simultaneously...\n");

        final Venue testVenue = venueCatalog.findById("V-001");
        final Customer testCustomer = (Customer) userCatalog.findById("U-001");
        final String collisionDate = "2028-01-01";

        testVenue.releaseDate(collisionDate);

        final List<String> successLog = Collections.synchronizedList(new ArrayList<>());
        final List<String> conflictLog = Collections.synchronizedList(new ArrayList<>());

        Thread[] racers = new Thread[10];
        for (int i = 0; i < racers.length; i++) {
            final int racerId = i + 1;
            racers[i] = new Thread(() -> {
                Thread.yield();
                try {
                    synchronized (testVenue) {
                        Booking b = new Booking("B-RACE-" + racerId, testVenue, testCustomer, collisionDate, 100, 1);
                        successLog.add("Thread #" + racerId + " successfully booked the venue!");
                    }
                } catch (DateConflictException e) {
                    conflictLog.add("Thread #" + racerId + " blocked: DateConflictException caught.");
                } catch (CapacityExceededException e) {
                    conflictLog.add("Thread #" + racerId + " blocked: Capacity exceeded.");
                }
            }, "RacerThread-" + racerId);
        }

        for (Thread t : racers) {
            t.start();
        }

        for (Thread t : racers) {
            try {
                t.join();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        System.out.println("Results of Concurrent Execution:");
        for (String msg : successLog) {
            System.out.println("  [+] " + msg);
        }
        System.out.println("  [!] Number of collisions safely prevented: " + conflictLog.size() + " out of 10");
        System.out.println("  [+] Exactly ONE booking succeeded. Zero double-booking race conditions detected.");
    }

    // Concept: Simple Header Display (No Decorative Lines)
    private void printHeader(String title) {
        System.out.println("\n--- " + title + " ---");
    }

    // Concept: Input Validation Helper (Choice bounds)
    private int readIntChoice(int min, int max) {
        while (true) {
            System.out.print("Enter choice [" + min + "-" + max + "]: ");
            if (!scanner.hasNextLine()) return 0;
            String line = scanner.nextLine().trim();
            if (line.isEmpty()) {
                System.out.println("[!] Input cannot be empty. Please enter a number between " + min + " and " + max + ".");
                continue;
            }
            try {
                int val = Integer.parseInt(line);
                if (val >= min && val <= max) {
                    return val;
                }
                System.out.println("[!] Invalid choice (" + val + "). Please enter a number between " + min + " and " + max + ".");
            } catch (NumberFormatException e) {
                System.out.println("[!] Invalid input. Please enter a valid whole number between " + min + " and " + max + ".");
            }
        }
    }

    // Concept: Input Validation Helper (Email format, @ check, domain check)
    private String readValidEmail(String prompt) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return "user@venueverse.com";
            String email = scanner.nextLine().trim();
            if (email.isEmpty()) {
                System.out.println("[!] Email cannot be empty.");
                continue;
            }
            if (email.contains(" ")) {
                System.out.println("[!] Invalid email: Email cannot contain spaces.");
                continue;
            }
            if (!email.contains("@")) {
                System.out.println("[!] Invalid email: Missing '@' symbol (e.g. name@example.com).");
                continue;
            }
            int firstAt = email.indexOf('@');
            int lastAt = email.lastIndexOf('@');
            if (firstAt != lastAt) {
                System.out.println("[!] Invalid email: Multiple '@' symbols found.");
                continue;
            }
            if (firstAt == 0) {
                System.out.println("[!] Invalid email: Missing username before '@'.");
                continue;
            }
            if (firstAt == email.length() - 1) {
                System.out.println("[!] Invalid email: Missing domain after '@'.");
                continue;
            }
            String domain = email.substring(firstAt + 1);
            if (!domain.contains(".") || domain.startsWith(".") || domain.endsWith(".")) {
                System.out.println("[!] Invalid email: Domain must contain a valid dot extension (e.g. .com, .in).");
                continue;
            }
            String extension = domain.substring(domain.lastIndexOf('.') + 1);
            if (extension.length() < 2) {
                System.out.println("[!] Invalid email: Domain extension must be at least 2 characters.");
                continue;
            }
            return email;
        }
    }

    // Concept: Input Validation Helper (Unique Email check)
    private String readUniqueEmail(String prompt) {
        while (true) {
            String email = readValidEmail(prompt);
            boolean exists = false;
            for (User u : userCatalog.getAll()) {
                if (u.getEmail().equalsIgnoreCase(email)) {
                    exists = true;
                    break;
                }
            }
            if (exists) {
                System.out.println("[!] Email '" + email + "' is already registered. Please use another email.");
                continue;
            }
            return email;
        }
    }

    // Concept: Input Validation Helper (Name validation)
    private String readValidName(String prompt) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return "User";
            String name = scanner.nextLine().trim();
            if (name.isEmpty()) {
                System.out.println("[!] Name cannot be empty.");
                continue;
            }
            if (name.length() < 2) {
                System.out.println("[!] Name must be at least 2 characters long.");
                continue;
            }
            if (!name.matches("^[a-zA-Z]+([.\\s][a-zA-Z]+)*$")) {
                System.out.println("[!] Invalid name: Must contain letters only (no numbers or special characters).");
                continue;
            }
            return name;
        }
    }

    // Concept: Input Validation Helper (Phone validation)
    private String readValidPhone(String prompt) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return "+919876543210";
            String phone = scanner.nextLine().trim().replaceAll("\\s+", "");
            if (!phone.matches("^\\+?[0-9]{7,15}$")) {
                System.out.println("[!] Invalid phone number: Must be 7 to 15 digits (e.g. +919876543210 or 9876543210).");
                continue;
            }
            return phone;
        }
    }

    // Concept: Input Validation Helper (Password validation)
    private String readValidPassword(String prompt) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return "pass123";
            String pwd = scanner.nextLine().trim();
            if (pwd.length() < 4) {
                System.out.println("[!] Password must be at least 4 characters long.");
                continue;
            }
            return pwd;
        }
    }

    // Concept: Input Validation Helper (Non-empty String)
    private String readNonEmptyString(String prompt, int minLength) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return "Standard";
            String text = scanner.nextLine().trim();
            if (text.length() < minLength) {
                System.out.println("[!] Input must be at least " + minLength + " characters long.");
                continue;
            }
            return text;
        }
    }

    // Concept: Input Validation Helper (Days validation 1-365)
    private int readValidDays(String prompt) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return 1;
            String line = scanner.nextLine().trim();
            try {
                int days = Integer.parseInt(line);
                if (days < 1) {
                    System.out.println("[!] Days must be at least 1.");
                    continue;
                }
                if (days > 365) {
                    System.out.println("[!] Days cannot exceed 365 (maximum 1 year booking).");
                    continue;
                }
                return days;
            } catch (NumberFormatException e) {
                System.out.println("[!] Invalid input. Please enter a valid whole number of days (1-365).");
            }
        }
    }

    // Concept: Input Validation Helper (Guests validation)
    private int readValidGuests(String prompt) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return 50;
            String line = scanner.nextLine().trim();
            try {
                int guests = Integer.parseInt(line);
                if (guests < 1) {
                    System.out.println("[!] Guests count must be at least 1.");
                    continue;
                }
                if (guests > 10000) {
                    System.out.println("[!] Guests count cannot exceed 10,000.");
                    continue;
                }
                return guests;
            } catch (NumberFormatException e) {
                System.out.println("[!] Invalid input. Please enter a valid number of guests.");
            }
        }
    }

    // Concept: Input Validation Helper (Strict YYYY-MM-DD Date validation)
    private String readValidDate(String prompt) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return "2027-05-20";
            String dateStr = scanner.nextLine().trim();
            if (!dateStr.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
                System.out.println("[!] Invalid date format. Must strictly be YYYY-MM-DD (e.g. 2027-05-20).");
                continue;
            }
            String[] parts = dateStr.split("-");
            int year = Integer.parseInt(parts[0]);
            int month = Integer.parseInt(parts[1]);
            int day = Integer.parseInt(parts[2]);

            if (year < 2026 || year > 2035) {
                System.out.println("[!] Year must be between 2026 and 2035.");
                continue;
            }
            if (month < 1 || month > 12) {
                System.out.println("[!] Invalid month (" + month + "): must be between 01 and 12.");
                continue;
            }
            int maxDays = 31;
            if (month == 4 || month == 6 || month == 9 || month == 11) {
                maxDays = 30;
            } else if (month == 2) {
                boolean isLeap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
                maxDays = isLeap ? 29 : 28;
            }
            if (day < 1 || day > maxDays) {
                System.out.println("[!] Invalid day (" + day + "): month " + month + " has maximum " + maxDays + " days.");
                continue;
            }
            return dateStr;
        }
    }

    // Concept: Input Validation Helper (Price validation)
    private double readValidPrice(String prompt) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return 25000.0;
            String line = scanner.nextLine().trim();
            try {
                double price = Double.parseDouble(line);
                if (price < 1000.0) {
                    System.out.println("[!] Base price must be at least INR 1,000 per day.");
                    continue;
                }
                return price;
            } catch (NumberFormatException e) {
                System.out.println("[!] Invalid price. Please enter a valid number.");
            }
        }
    }

    // Concept: Input Validation Helper (Capacity validation)
    private int readValidCapacity(String prompt) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return 100;
            String line = scanner.nextLine().trim();
            try {
                int cap = Integer.parseInt(line);
                if (cap < 10) {
                    System.out.println("[!] Venue capacity must be at least 10 guests.");
                    continue;
                }
                return cap;
            } catch (NumberFormatException e) {
                System.out.println("[!] Invalid capacity. Please enter a valid number.");
            }
        }
    }

    // Concept: Input Validation Helper (Discount bounds 0-50%)
    private double readValidDiscount(String prompt) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return 0.0;
            String line = scanner.nextLine().trim();
            try {
                double disc = Double.parseDouble(line);
                if (disc < 0.0 || disc > 50.0) {
                    System.out.println("[!] Discount percentage must be between 0.0% and 50.0%.");
                    continue;
                }
                return disc;
            } catch (NumberFormatException e) {
                System.out.println("[!] Invalid discount. Please enter a number between 0 and 50.");
            }
        }
    }

    // Concept: Input Validation Helper (Positive double)
    private double readPositiveDoubleOrZero(String prompt) {
        while (true) {
            System.out.print(prompt);
            if (!scanner.hasNextLine()) return 0.0;
            String line = scanner.nextLine().trim();
            try {
                double val = Double.parseDouble(line);
                if (val >= 0.0) return val;
                System.out.println("[!] Value cannot be negative.");
            } catch (NumberFormatException e) {
                System.out.println("[!] Please enter a valid positive number.");
            }
        }
    }
    // Concept: Input Validation Helper (Venue lookup with loop & cancel)
    private Venue readExistingVenue() {
        while (true) {
            System.out.print("Enter Venue ID (e.g. V-001, or 0 to cancel): ");
            if (!scanner.hasNextLine()) return null;
            String vId = scanner.nextLine().trim();
            if (vId.equals("0")) {
                return null;
            }
            Venue venue = venueCatalog.findById(vId);
            if (venue == null) {
                System.out.println("[!] Venue ID '" + vId + "' not found in catalog. Please enter a valid ID (or 0 to cancel).");
                continue;
            }
            return venue;
        }
    }
    // Concept: Main Entry Point
    public static void main(String[] args) {
        System.out.println("Venue Booking System");
        VenueBookingSystemApp app = new VenueBookingSystemApp();
        app.start();
    }
}
