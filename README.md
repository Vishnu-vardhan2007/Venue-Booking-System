# Venue Booking & Management System — Standalone Terminal OOP Suite

An enterprise-grade, interactive terminal-based suite designed to run entirely inside the console with zero external database and zero web server dependencies. It provides the full business capabilities of the Venue Booking System (User Registration, Role-Based Login/Logout, Venue Discovery, Quoting, Availability Checking, Booking, Cancellation, and Admin Controls) using clean **Switch-Case Menu Navigation** with **Rigorous Edge-Case Validation** and **Structured Sequential Identifiers** (`U-001`, `O-001`, `A-001`, `V-001`, `B-001`).

This suite demonstrates every core and advanced Object-Oriented Programming (OOP) and Multithreading concept through two production-ready console implementations:
1. **Java Terminal Engine ([VenueBookingSystemApp.java](file:///c:/Users/bhanu/OneDrive/Desktop/Venue/VenueBookingSystemApp.java))**: All Java-compatible OOP concepts, advanced exception hierarchies, generics, and **multithreading genuinely utilized in the core engine** (not as debug banners).
2. **C++ Terminal Engine ([venue_booking_system.cpp](file:///c:/Users/bhanu/OneDrive/Desktop/Venue/venue_booking_system.cpp))**: Implements concepts exclusive to C++ that cannot be executed in Java (Operator Overloading, Friend Functions, Stream Overloading, Virtual Base Classes / Diamond Inheritance, Object Slicing, and Raw Memory Pointers).

---

## Quick Start: How to Run in VS Code Terminal

### 1. Java Terminal Application
```bash
javac VenueBookingSystemApp.java
java VenueBookingSystemApp
```

### 2. C++ Terminal Application
```bash
g++ -std=c++17 venue_booking_system.cpp -o venue_booking_system.exe
.\venue_booking_system.exe
```

---

## Multithreading in Core Code (No Debug Noise)

Multithreading is **not** an artificial printout—it is genuinely woven into the operational architecture:

1. **Transactional Background Concurrency**:
   - Every booking transaction simultaneously launches:
     - **`AuditThread` (extends `Thread`)**: Asynchronously writes cryptographic transaction records and increments central financial ledgers.
     - **`SyncTask` (implements `Runnable`)**: Asynchronously synchronizes venue availability in memory cache across catalog views.
   - The core coordinator calls `t1.start()`, `t2.start()`, `Thread.yield()`, and `t1.join()`, `t2.join()` to guarantee atomic persistence before issuing the booking confirmation.
2. **Parallel Analytics Engine (Admin Console)**:
   - In Admin Option 4, two background threads calculate platform financial metrics (`RevenueAggregatorThread extends Thread`) and occupancy metrics (`OccupancyWorker implements Runnable`) simultaneously in parallel.
3. **Race Condition Prevention Benchmark (Main Menu Option 5)**:
   - Simulates 10 concurrent threads attempting to book the exact same venue on the exact same date at the exact same millisecond.
   - Protected by `synchronized` critical sections, exactly 1 booking succeeds and 9 threads receive handled collision exceptions, demonstrating zero double-booking in core code.

---

## Comprehensive Edge-Case Validation Handlers

All user inputs are guarded by strict format, range, and type validation:

* **Email Addresses**:
  - Rejects missing `@`, multiple `@`, spaces, missing usernames, and domains without extensions (e.g. `aditi`, `aditi@`, `@gmail.com`, `aditi@gmail`).
  - Requires clean format: `name@domain.com`. Checks against existing registered emails to prevent duplicate accounts.
* **Full Names**:
  - Must be at least 2 characters long.
  - Allows letters, periods, and spaces only. Rejects numbers (`Kavita123`) and symbols (`#`, `@`, `_`).
* **Phone Numbers**:
  - Validates 7 to 15 digits (with optional `+`). Rejects letters or arbitrary symbols.
* **Event Dates (`YYYY-MM-DD`)**:
  - Strictly enforced format: 4-digit year (2026-2035), 2-digit month (01-12), and valid days matching the specific month.
  - Rejects invalid month days (e.g. `2026-02-30` rejected because February has max 28 days; `2026-04-31` rejected).
* **Number of Days**:
  - Must be a positive integer between 1 and 365 (rejects 0, negative numbers, decimals, or > 1 year).
* **Guest Counts**:
  - Must be $\ge 1$. Automatically checked against the venue's maximum capacity with custom `CapacityExceededException`.
* **Venue Price & Capacity**:
  - Price per day must be $\ge \text{INR } 1,000$.
  - Capacity must be $\ge 10$ guests.
* **Discount Percentages**:
  - Strictly bounded between $0.0\%$ and $50.0\%$.
* **Venue ID Lookups**:
  - Invalid IDs (e.g. `V-999`) prompt the user to re-enter or type `0` to cancel without crashing or aborting the workflow.

---

## Structured Sequential Identifiers

All entities follow clean, sequential, zero-collision formats:
* **Customers / Users**: `U-001`, `U-002`, `U-003`, ...
* **Venue Owners**: `O-001`, `O-002`, `O-003`, ...
* **Admins**: `A-001`, `A-002`, ...
* **Venues**: `V-001`, `V-002`, `V-003`, ...
* **Bookings**: `B-001`, `B-002`, `B-003`, ...

---

## Interactive Menu Structure

```
[MAIN MENU] (Range 0 - 5)
 ├── 1. Customer Login       --> [CUSTOMER DASHBOARD] (Range 1 - 8)
 │                                ├── 1. Browse Available Venues
 │                                ├── 2. Search Venues by Location / Category / Budget
 │                                ├── 3. Instant Quoting (Method Overloading)
 │                                ├── 4. Book Venue (Multithreaded Background Sync & Exceptions)
 │                                ├── 5. View My Bookings
 │                                ├── 6. Cancel Booking (Cancellation Policy)
 │                                ├── 7. Type Casting Demo (Basic <-> Class)
 │                                └── 8. Logout
 ├── 2. Venue Owner Login    --> [VENUE OWNER DASHBOARD] (Range 1 - 6)
 │                                ├── 1. View My Venues
 │                                ├── 2. Add New Listing (V-004, V-005...)
 │                                ├── 3. Manage Availability Window (Inner Class)
 │                                ├── 4. View Bookings for My Venues
 │                                ├── 5. Update Pricing ('this' Method Chaining)
 │                                └── 6. Logout
 ├── 3. Admin Login          --> [ADMIN CONTROL CONSOLE] (Range 1 - 5)
 │                                ├── 1. View All Users (Polymorphic Dynamic Dispatch)
 │                                ├── 2. View Platform Metrics & Venues (Static Members)
 │                                ├── 3. View All Platform Bookings
 │                                ├── 4. Run Platform Audit & Reconciliation (Multithreaded Parallel Engine)
 │                                └── 5. Logout
 ├── 4. Register New Account (Customer: U-00X / Venue Owner: O-00X)
 ├── 5. Run High-Concurrency Stress Test (Multithreaded Race-Condition Protection)
 └── 0. Exit Application
```

### Pre-Seeded Test Credentials
| Role | User ID | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | `U-001` | `aditi@gmail.com` | `pass123` | Pre-registered customer profile |
| **Customer** | `U-002` | `aarav@venueverse.com` | `pass123` | Secondary customer profile |
| **Venue Owner** | `O-001` | `ramesh@venueverse.com` | `host123` | Owns `V-001`, `V-002`, `V-003` |
| **Admin** | `A-001` | `admin@venueverse.com` | `admin123` | Platform SuperAdmin with system privileges |
