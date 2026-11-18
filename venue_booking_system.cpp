#include <iostream>
#include <iomanip>
#include <sstream>
#include <vector>
#include <string>
#include <set>
#include <stdexcept>
#include <algorithm>
#include <cctype>
#include <memory>
#include <cstdio>

using namespace std;

/**
 * ============================================================================
 * VENUE BOOKING & MANAGEMENT SYSTEM - C++ STANDALONE OOP SUITE
 * ============================================================================
 * Complete interactive terminal application with switch-case menu navigation.
 * Formatted sequential identifiers:
 *   - Customers:   U-001, U-002, ...
 *   - VenueOwners: O-001, O-002, ...
 *   - Admins:      A-001, A-002, ...
 *   - Venues:      V-001, V-002, ...
 *   - Bookings:    B-001, B-002, ...
 *
 * Implements C++-exclusive and common OOP concepts:
 *  [1]  Inheritance & Polymorphism
 *  [2]  Access Specifiers (private, protected, public)
 *  [3]  Constructors (Parameterized, chained member initializers)
 *  [4]  Method Overloading (search() by keyword, category+loc, or budget+cap)
 *  [5]  Operator Overloading (+=, == on MoneyAmount; == on Venue)
 *  [6]  Operator Overloading using a Friend Function (operator+, operator>)
 *  [7]  Stream Operators Overloading using a Friend Function (<< and >>)
 *  [8]  Nested Class (Venue::PriceQuote)
 *  [9]  Virtual Base Class (Diamond problem resolution with virtual inheritance)
 *  [10] Object Slicing (Pass-by-value User slicing off derived Customer fields)
 *  [11] Static Variables & Static Functions (Venue::totalVenuesCreated)
 *  [12] Final (final class PlatformSignature, final override method)
 *  [13] "this" Pointer (actual memory pointer dereferenced via *this, this->id)
 *  [14] Pointer to Objects & Pointer to Derived Classes (dynamic_cast, base pointers)
 *  [15] Type Casting:
 *         - Basic-to-Class Casting (double -> MoneyAmount)
 *         - Class-to-Basic Casting (MoneyAmount -> double via operator double())
 *         - Class-to-Class Casting (Booking -> BookingReceiptSummary)
 *  [16] Templates (Template Class CatalogStore<T>, Template Function applyTemplateDiscount<T>)
 *  [17] Exception Handling (try, catch, throw, user-defined exceptions,
 *       catching derived before base exceptions)
 * ============================================================================
 */

// ============================================================================
// 1. EXCEPTION HIERARCHY (Base & Derived Classes, User-Defined)
// ============================================================================
class VenueSystemException : public runtime_error {
protected:
    string errorCode;
public:
    explicit VenueSystemException(const string& msg, string code = "SYSTEM_ERR")
        : runtime_error(msg), errorCode(std::move(code)) {}

    virtual string getCategory() const { return "BaseException"; }
    const string& getCode() const { return errorCode; }
};

class CapacityLimitException : public VenueSystemException {
private:
    int requested;
    int maxAllowed;
public:
    CapacityLimitException(int req, int cap)
        : VenueSystemException("Limit exceeded: requested " + to_string(req) +
                               " exceeds max capacity " + to_string(cap), "CAPACITY_LIMIT"),
          requested(req), maxAllowed(cap) {}

    string getCategory() const override { return "CapacityLimitException"; }
    int getRequested() const { return requested; }
    int getMaxAllowed() const { return maxAllowed; }
};

class DateConflictException : public VenueSystemException {
private:
    string conflictDate;
public:
    explicit DateConflictException(const string& dateStr)
        : VenueSystemException("Venue already booked on date: " + dateStr, "DATE_CONFLICT"),
          conflictDate(dateStr) {}

    string getCategory() const override { return "DateConflictException"; }
    const string& getConflictDate() const { return conflictDate; }
};

class AuthenticationException : public VenueSystemException {
public:
    explicit AuthenticationException(const string& msg)
        : VenueSystemException(msg, "AUTH_FAILURE") {}
    string getCategory() const override { return "AuthenticationException"; }
};

// ============================================================================
// 2. VIRTUAL BASE CLASS & DIAMOND INHERITANCE
// ============================================================================
// Diamond Structure:
//              AuditTrackable (Virtual Base Class)
//              /            \
//     HostIdentity        VerifiedListing
//              \            /
//            VerifiedHostProfile
// ============================================================================
class AuditTrackable {
protected:
    string auditTag;
public:
    explicit AuditTrackable(string tag = "TRACKED") : auditTag(std::move(tag)) {}
    virtual ~AuditTrackable() = default;
    const string& getAuditTag() const { return auditTag; }
};

class HostIdentity : virtual public AuditTrackable {
protected:
    string hostLicense;
public:
    HostIdentity(string tag, string license)
        : AuditTrackable(std::move(tag)), hostLicense(std::move(license)) {}
    const string& getHostLicense() const { return hostLicense; }
};

class VerifiedListing : virtual public AuditTrackable {
protected:
    bool kycVerified;
public:
    VerifiedListing(string tag, bool verified)
        : AuditTrackable(std::move(tag)), kycVerified(verified) {}
    bool isKycVerified() const { return kycVerified; }
};

class VerifiedHostProfile : public HostIdentity, public VerifiedListing {
private:
    string city;
public:
    VerifiedHostProfile(string tag, string license, bool verified, string c)
        : AuditTrackable(std::move(tag)), // Single initialization of virtual base
          HostIdentity(tag, std::move(license)),
          VerifiedListing(tag, verified),
          city(std::move(c)) {}

    void printVerificationSummary() const {
        cout << "VerifiedHostProfile[tag=" << auditTag
             << ", license=" << hostLicense
             << ", kyc=" << (kycVerified ? "YES" : "NO")
             << ", city=" << city << "]\n";
    }
};

// ============================================================================
// 3. FINAL CLASS
// ============================================================================
class PlatformSignature final {
public:
    static string badge() { return "VenueVerse C++ Terminal OOP Engine v2.4"; }
};

// ============================================================================
// 4. MONEY AMOUNT (Operator Overloading, Friend Functions, Stream Overloading,
//    Basic-to-Class and Class-to-Basic Type Casting)
// ============================================================================
class MoneyAmount {
private:
    double amountInr;
public:
    // Basic-to-Class Type Casting (Conversion Constructor)
    MoneyAmount(double inr = 0.0) {
        this->amountInr = (inr < 0.0) ? 0.0 : inr; // "this" pointer
    }

    // Class-to-Basic Type Casting (User-Defined Conversion Operator)
    operator double() const {
        return this->amountInr;
    }

    // Member Operator Overloading (+=)
    MoneyAmount& operator+=(const MoneyAmount& rhs) {
        this->amountInr += rhs.amountInr;
        return *this; // Dereferencing "this" pointer
    }

    // Member Operator Overloading (==)
    bool operator==(const MoneyAmount& rhs) const {
        return this->amountInr == rhs.amountInr;
    }

    double value() const { return this->amountInr; }

    // Friend Function: Binary Operator + Overload
    friend MoneyAmount operator+(const MoneyAmount& lhs, const MoneyAmount& rhs);

    // Friend Function: Stream Insertion Operator << Overload
    friend ostream& operator<<(ostream& os, const MoneyAmount& money);

    // Friend Function: Stream Extraction Operator >> Overload
    friend istream& operator>>(istream& is, MoneyAmount& money);
};

MoneyAmount operator+(const MoneyAmount& lhs, const MoneyAmount& rhs) {
    return MoneyAmount(lhs.amountInr + rhs.amountInr);
}

ostream& operator<<(ostream& os, const MoneyAmount& money) {
    os << "INR " << fixed << setprecision(2) << money.amountInr;
    return os;
}

istream& operator>>(istream& is, MoneyAmount& money) {
    double val = 0.0;
    if (is >> val) {
        money.amountInr = (val < 0.0) ? 0.0 : val;
    }
    return is;
}

// ============================================================================
// 5. USER HIERARCHY & OBJECT SLICING
// ============================================================================
class User {
protected:
    string id;
    string name;
    string email;
    string role;
    string password;
public:
    User(string id, string name, string email, string role = "User", string pwd = "password") {
        this->id = std::move(id);       // "this" pointer
        this->name = std::move(name);
        this->email = std::move(email);
        this->role = std::move(role);
        this->password = std::move(pwd);
    }

    virtual ~User() = default;

    string getId() const { return this->id; }
    string getName() const { return this->name; }
    string getEmail() const { return this->email; }
    string getRole() const { return this->role; }
    bool checkPassword(const string& pwd) const { return this->password == pwd; }

    virtual string describeIdentity() const {
        return "User(" + this->name + " [" + this->id + "], role=" + this->role + ")";
    }

    virtual void displayProfile() const {
        cout << "User[" << this->id << "] " << this->name << " (" << this->role << ") <" << this->email << ">\n";
    }
};

class Customer : public User {
private:
    string phone;
public:
    Customer(string id, string name, string email, string phone = "", string pwd = "password")
        : User(std::move(id), std::move(name), std::move(email), "Customer", std::move(pwd)) {
        this->phone = std::move(phone);
    }

    string getPhone() const { return this->phone; }

    string describeIdentity() const override {
        return "Customer(" + this->name + " [" + this->id + "], phone=" + this->phone + ")";
    }

    void displayProfile() const override {
        cout << "Customer[" << this->id << "] " << this->name << " | Phone: " << this->phone << " <" << this->email << ">\n";
    }
};

class VenueOwner : public User {
private:
    string hostLicense;
public:
    VenueOwner(string id, string name, string email, string license = "LIC-GEN-01", string pwd = "password")
        : User(std::move(id), std::move(name), std::move(email), "VenueOwner", std::move(pwd)),
          hostLicense(std::move(license)) {}

    string getHostLicense() const { return this->hostLicense; }

    string describeIdentity() const override {
        return "VenueOwner(" + this->name + " [" + this->id + "], license=" + this->hostLicense + ")";
    }

    void displayProfile() const override {
        cout << "VenueOwner[" << this->id << "] " << this->name << " | License: " << this->hostLicense << "\n";
    }
};

class Admin : public User {
private:
    string adminLevel;
public:
    Admin(string id, string name, string email, string level = "SuperAdmin", string pwd = "password")
        : User(std::move(id), std::move(name), std::move(email), "Admin", std::move(pwd)),
          adminLevel(std::move(level)) {}

    string describeIdentity() const override {
        return "Admin(" + this->name + " [" + this->id + "], level=" + this->adminLevel + ")";
    }

    bool canManagePlatform() const { return true; }
};

// --- OBJECT SLICING DEMONSTRATION ---
inline string inspectUserByValueSliced(User slicedCopy) {
    return slicedCopy.describeIdentity(); // Sliced to User base!
}

inline string inspectUserByPointer(const User* ptr) {
    return ptr ? ptr->describeIdentity() : "NULL"; // Polymorphic dispatch preserved!
}

// ============================================================================
// 6. VENUE HIERARCHY, NESTED CLASS & STREAM OVERLOADING
// ============================================================================
class Venue {
private:
    static int totalVenuesCreated; // Static variable
    set<string> bookedDates;

protected:
    string id;
    string title;
    string category;
    string location;
    double basePrice;
    int capacity;
    double rating;
    string ownerId;

public:
    // --- Nested Class: PriceQuote ---
    class PriceQuote {
    private:
        int days;
        MoneyAmount total;
    public:
        PriceQuote(int d, double amount) : days(max(1, d)), total(amount) {}
        int getDays() const { return this->days; }
        MoneyAmount getTotal() const { return this->total; }
    };

    Venue(string id, string title, string category, string location,
          double basePrice, int capacity, double rating = 0.0, string owner = "O-001") {
        this->id = std::move(id);
        this->title = std::move(title);
        this->category = std::move(category);
        this->location = std::move(location);
        this->basePrice = basePrice;
        this->capacity = capacity;
        this->rating = rating;
        this->ownerId = std::move(owner);
        totalVenuesCreated++;
    }

    virtual ~Venue() = default;

    static int getTotalVenuesCreated() {
        return totalVenuesCreated;
    }

    string getId() const { return this->id; }
    string getTitle() const { return this->title; }
    string getCategory() const { return this->category; }
    string getLocation() const { return this->location; }
    double getBasePrice() const { return this->basePrice; }
    int getCapacity() const { return this->capacity; }
    double getRating() const { return this->rating; }
    string getOwnerId() const { return this->ownerId; }
    const set<string>& getBookedDates() const { return this->bookedDates; }

    Venue& setBasePrice(double updatedPrice) {
        this->basePrice = updatedPrice;
        return *this; // Dereference "this" pointer
    }

    bool checkAvailability(const string& dateStr) const {
        return bookedDates.find(dateStr) == bookedDates.end();
    }

    void bookDate(const string& dateStr) {
        if (!checkAvailability(dateStr)) {
            throw DateConflictException(dateStr);
        }
        bookedDates.insert(dateStr);
    }

    void releaseDate(const string& dateStr) {
        bookedDates.erase(dateStr);
    }

    virtual double calculateTotalPrice(int days, int guests) const = 0;

    virtual PriceQuote buildQuote(int days, int guests) const {
        return PriceQuote(days, calculateTotalPrice(days, guests));
    }

    virtual void displayDetails() const {
        cout << "  [" << this->id << "] " << this->title << " | " << this->category
             << " | " << this->location << " | INR " << fixed << setprecision(0)
             << this->basePrice << "/day | Cap: " << this->capacity << "\n";
    }

    bool operator==(const Venue& other) const {
        return this->id == other.id;
    }

    friend bool operator>(const Venue& a, const Venue& b);
    friend ostream& operator<<(ostream& os, const Venue& v);
};

int Venue::totalVenuesCreated = 0;

bool operator>(const Venue& a, const Venue& b) {
    return a.basePrice > b.basePrice;
}

ostream& operator<<(ostream& os, const Venue& v) {
    os << v.title << " [" << v.id << "] (" << v.category << ", " << v.location
       << ", INR " << fixed << setprecision(0) << v.basePrice << "/day, Cap: " << v.capacity << ")";
    return os;
}

class WeddingVenue : public Venue {
public:
    WeddingVenue(string id, string title, string location, double basePrice, int capacity, double rating = 0.0, string owner = "O-001")
        : Venue(std::move(id), std::move(title), "Wedding", std::move(location), basePrice, capacity, rating, std::move(owner)) {}

    double calculateTotalPrice(int days, int) const override final {
        int validDays = max(1, days);
        return this->basePrice * validDays;
    }

    string getWeddingSpecialty() const {
        return "Bridal Suite & Vedic Mandap Included";
    }
};

class BirthdayVenue : public Venue {
public:
    BirthdayVenue(string id, string title, string location, double basePrice, int capacity, double rating = 0.0, string owner = "O-001")
        : Venue(std::move(id), std::move(title), "Birthday", std::move(location), basePrice, capacity, rating, std::move(owner)) {}

    double calculateTotalPrice(int days, int) const override {
        return this->basePrice * max(1, days);
    }
};

class ConferenceVenue : public Venue {
public:
    ConferenceVenue(string id, string title, string location, double basePrice, int capacity, double rating = 0.0, string owner = "O-001")
        : Venue(std::move(id), std::move(title), "Conference", std::move(location), basePrice, capacity, rating, std::move(owner)) {}

    double calculateTotalPrice(int days, int) const override {
        return this->basePrice * max(1, days);
    }
};

// ============================================================================
// 7. BOOKING & CLASS-TO-CLASS TYPE CASTING
// ============================================================================
struct BookingReceiptSummary {
    string bookingId;
    string venueTitle;
    string customerName;
    double totalInr;
};

class Booking {
private:
    string bookingId;
    Venue* venue;
    Customer* customer;
    string bookingDate;
    int guestsCount;
    int days;
    MoneyAmount totalAmount;
    string status;

public:
    Booking(string id, Venue* v, Customer* c, string dateStr, int guests = 50, int numDays = 1) {
        if (!v || !c) {
            throw VenueSystemException("Venue and Customer pointers are required.", "NULL_ENTITY");
        }
        if (guests < 1) {
            throw VenueSystemException("Guest count must be at least 1.", "INVALID_GUESTS");
        }
        if (guests > v->getCapacity()) {
            throw CapacityLimitException(guests, v->getCapacity());
        }

        v->bookDate(dateStr); // May throw DateConflictException

        this->bookingId = std::move(id);
        this->venue = v;
        this->customer = c;
        this->bookingDate = std::move(dateStr);
        this->guestsCount = guests;
        this->days = max(1, numDays);
        this->totalAmount = MoneyAmount(this->venue->calculateTotalPrice(this->days, this->guestsCount));
        this->status = "CONFIRMED";
    }

    string getBookingId() const { return this->bookingId; }
    string getStatus() const { return this->status; }
    MoneyAmount getTotalAmount() const { return this->totalAmount; }
    Venue* getVenue() const { return this->venue; }
    Customer* getCustomer() const { return this->customer; }

    void cancel() {
        if (this->status != "CANCELLED") {
            this->status = "CANCELLED";
            this->venue->releaseDate(this->bookingDate);
        }
    }

    // Class-to-Class Type Casting (Conversion Operator)
    operator BookingReceiptSummary() const {
        return BookingReceiptSummary{
            this->bookingId,
            this->venue->getTitle(),
            this->customer->getName(),
            static_cast<double>(this->totalAmount)
        };
    }

    void displayReceipt() const {
        cout << *this << "\n";
    }

    friend ostream& operator<<(ostream& os, const Booking& b);
};

ostream& operator<<(ostream& os, const Booking& b) {
    os << "Receipt[" << b.bookingId << "] Venue=" << b.venue->getTitle() << " (" << b.venue->getId() << ")"
       << " | Customer=" << b.customer->getName() << " (" << b.customer->getId() << ")"
       << " | Date=" << b.bookingDate
       << " | Guests=" << b.guestsCount
       << " | Total=" << b.totalAmount
       << " | Status=" << b.status;
    return os;
}

// ============================================================================
// 8. TEMPLATES (Class Template & Function Template)
// ============================================================================
template <typename T>
class CatalogStore {
private:
    vector<T*> items;
public:
    void add(T* item) {
        if (item) items.push_back(item);
    }

    size_t count() const { return items.size(); }
    const vector<T*>& getAll() const { return items; }

    T* findById(const string& id) const {
        for (T* item : items) {
            if (item->getId() == id) return item;
        }
        return nullptr;
    }
};

template <typename T>
T applyTemplateDiscount(T amount, double percent) {
    double factor = 1.0 - max(0.0, min(50.0, percent)) / 100.0;
    return static_cast<T>(amount * factor);
}

// ============================================================================
// 9. SEARCH SERVICE (Method Overloading)
// ============================================================================
class VenueSearchService {
private:
    vector<Venue*> repository;

    static string toLowerStr(string s) {
        transform(s.begin(), s.end(), s.begin(), [](unsigned char c) { return static_cast<char>(tolower(c)); });
        return s;
    }

public:
    explicit VenueSearchService(vector<Venue*> venues) : repository(std::move(venues)) {}

    vector<Venue*> search(const string& keyword) const {
        string q = toLowerStr(keyword);
        vector<Venue*> matches;
        for (Venue* v : repository) {
            if (toLowerStr(v->getTitle()).find(q) != string::npos ||
                toLowerStr(v->getLocation()).find(q) != string::npos ||
                toLowerStr(v->getCategory()).find(q) != string::npos) {
                matches.push_back(v);
            }
        }
        return matches;
    }

    vector<Venue*> search(const string& category, const string& location) const {
        string cat = toLowerStr(category);
        string loc = toLowerStr(location);
        vector<Venue*> matches;
        for (Venue* v : repository) {
            bool matchCat = (cat == "all" || toLowerStr(v->getCategory()) == cat);
            bool matchLoc = (loc == "everywhere" || toLowerStr(v->getLocation()).find(loc) != string::npos);
            if (matchCat && matchLoc) matches.push_back(v);
        }
        return matches;
    }

    vector<Venue*> search(double maxBudget, int minCapacity) const {
        vector<Venue*> matches;
        for (Venue* v : repository) {
            if (v->getBasePrice() <= maxBudget && v->getCapacity() >= minCapacity) {
                matches.push_back(v);
            }
        }
        return matches;
    }
};

// ============================================================================
// 10. INTERACTIVE TERMINAL APP CLASS (Edge-Case Handled Input)
// ============================================================================
class TerminalVenueBookingApp {
private:
    CatalogStore<Venue> venueCatalog;
    CatalogStore<User> userCatalog;
    vector<unique_ptr<Booking>> bookingRecords;
    User* currentUser = nullptr;

    int userCounter = 0;
    int ownerCounter = 0;
    int adminCounter = 0;
    int venueCounter = 0;
    int bookingCounter = 0;

    string nextUserId() {
        char buf[16];
        snprintf(buf, sizeof(buf), "U-%03d", ++userCounter);
        return string(buf);
    }

    string nextOwnerId() {
        char buf[16];
        snprintf(buf, sizeof(buf), "O-%03d", ++ownerCounter);
        return string(buf);
    }

    string nextAdminId() {
        char buf[16];
        snprintf(buf, sizeof(buf), "A-%03d", ++adminCounter);
        return string(buf);
    }

    string nextVenueId() {
        char buf[16];
        snprintf(buf, sizeof(buf), "V-%03d", ++venueCounter);
        return string(buf);
    }

    string nextBookingId() {
        char buf[16];
        snprintf(buf, sizeof(buf), "B-%03d", ++bookingCounter);
        return string(buf);
    }

    void printHeader(const string& title) {
        cout << "\n================================================================================\n";
        cout << "  " + title + "\n";
        cout << "================================================================================\n";
    }

    int readIntChoice(int minVal, int maxVal) {
        while (true) {
            cout << "Enter choice [" << minVal << "-" << maxVal << "]: ";
            string s;
            if (!getline(cin, s)) return 0;
            if (s.empty()) {
                cout << "[!] Input cannot be empty. Please enter a number between " << minVal << " and " << maxVal << ".\n";
                continue;
            }
            try {
                int val = stoi(s);
                if (val >= minVal && val <= maxVal) {
                    return val;
                }
                cout << "[!] Invalid choice (" << val << "). Please enter a number between " << minVal << " and " << maxVal << ".\n";
            } catch (...) {
                cout << "[!] Invalid input. Please enter a valid whole number between " << minVal << " and " << maxVal << ".\n";
            }
        }
    }

    string readValidEmail(const string& prompt) {
        while (true) {
            cout << prompt;
            string email;
            if (!getline(cin, email)) return "user@venueverse.com";
            if (email.empty()) {
                cout << "[!] Email cannot be empty.\n";
                continue;
            }
            if (email.find(' ') != string::npos) {
                cout << "[!] Invalid email: Cannot contain spaces.\n";
                continue;
            }
            size_t atIdx = email.find('@');
            size_t lastAt = email.rfind('@');
            if (atIdx == string::npos) {
                cout << "[!] Invalid email: Missing '@' symbol (e.g. name@example.com).\n";
                continue;
            }
            if (atIdx != lastAt) {
                cout << "[!] Invalid email: Multiple '@' symbols found.\n";
                continue;
            }
            if (atIdx == 0 || atIdx == email.length() - 1) {
                cout << "[!] Invalid email: Username and domain required around '@'.\n";
                continue;
            }
            string domain = email.substr(atIdx + 1);
            if (domain.find('.') == string::npos || domain.front() == '.' || domain.back() == '.') {
                cout << "[!] Invalid email: Domain must contain a valid dot extension (e.g. .com, .in).\n";
                continue;
            }
            return email;
        }
    }

    string readValidName(const string& prompt) {
        while (true) {
            cout << prompt;
            string name;
            if (!getline(cin, name)) return "User";
            if (name.length() < 2) {
                cout << "[!] Name must be at least 2 characters long.\n";
                continue;
            }
            bool valid = true;
            for (char c : name) {
                if (!isalpha(static_cast<unsigned char>(c)) && c != ' ' && c != '.') {
                    valid = false;
                    break;
                }
            }
            if (!valid) {
                cout << "[!] Invalid name: Must contain letters only (no numbers or special characters).\n";
                continue;
            }
            return name;
        }
    }

    string readValidPhone(const string& prompt) {
        while (true) {
            cout << prompt;
            string phone;
            if (!getline(cin, phone)) return "+919876543210";
            string digits;
            for (char c : phone) {
                if (c != ' ' && c != '-') digits += c;
            }
            bool valid = true;
            size_t start = (digits.front() == '+') ? 1 : 0;
            if (digits.length() - start < 7 || digits.length() - start > 15) valid = false;
            for (size_t i = start; i < digits.length(); i++) {
                if (!isdigit(static_cast<unsigned char>(digits[i]))) {
                    valid = false;
                    break;
                }
            }
            if (!valid) {
                cout << "[!] Invalid phone: Must be 7 to 15 digits (e.g. +919876543210).\n";
                continue;
            }
            return digits;
        }
    }

    string readValidDate(const string& prompt) {
        while (true) {
            cout << prompt;
            string dateStr;
            if (!getline(cin, dateStr)) return "2027-05-20";
            if (dateStr.length() != 10 || dateStr[4] != '-' || dateStr[7] != '-') {
                cout << "[!] Invalid date format. Must strictly be YYYY-MM-DD (e.g. 2027-05-20).\n";
                continue;
            }
            try {
                int y = stoi(dateStr.substr(0, 4));
                int m = stoi(dateStr.substr(5, 2));
                int d = stoi(dateStr.substr(8, 2));
                if (y < 2026 || y > 2035) {
                    cout << "[!] Year must be between 2026 and 2035.\n";
                    continue;
                }
                if (m < 1 || m > 12) {
                    cout << "[!] Invalid month: Must be between 01 and 12.\n";
                    continue;
                }
                int maxDays = 31;
                if (m == 4 || m == 6 || m == 9 || m == 11) maxDays = 30;
                else if (m == 2) {
                    bool leap = (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0);
                    maxDays = leap ? 29 : 28;
                }
                if (d < 1 || d > maxDays) {
                    cout << "[!] Invalid day: month " << m << " has max " << maxDays << " days.\n";
                    continue;
                }
                return dateStr;
            } catch (...) {
                cout << "[!] Invalid date.\n";
            }
        }
    }

    int readValidDays(const string& prompt) {
        while (true) {
            cout << prompt;
            string s;
            if (!getline(cin, s)) return 1;
            try {
                int val = stoi(s);
                if (val < 1) {
                    cout << "[!] Days must be at least 1.\n";
                    continue;
                }
                if (val > 365) {
                    cout << "[!] Days cannot exceed 365.\n";
                    continue;
                }
                return val;
            } catch (...) {
                cout << "[!] Please enter a valid number of days (1-365).\n";
            }
        }
    }

    int readValidGuests(const string& prompt) {
        while (true) {
            cout << prompt;
            string s;
            if (!getline(cin, s)) return 50;
            try {
                int val = stoi(s);
                if (val < 1) {
                    cout << "[!] Guests must be at least 1.\n";
                    continue;
                }
                return val;
            } catch (...) {
                cout << "[!] Please enter a valid number of guests.\n";
            }
        }
    }

    double readPositiveDouble(const string& prompt) {
        while (true) {
            cout << prompt;
            string s;
            if (!getline(cin, s)) return 0.0;
            try {
                double val = stod(s);
                if (val >= 0.0) return val;
                cout << "[!] Value cannot be negative.\n";
            } catch (...) {
                cout << "[!] Please enter a valid number.\n";
            }
        }
    }

    Venue* readExistingVenue() {
        while (true) {
            cout << "Enter Venue ID (e.g. V-001, or 0 to cancel): ";
            string id;
            if (!getline(cin, id) || id == "0") return nullptr;
            Venue* v = venueCatalog.findById(id);
            if (!v) {
                cout << "[!] Venue ID '" << id << "' not found. Please try again (or 0 to cancel).\n";
                continue;
            }
            return v;
        }
    }

    void seedData() {
        string c1Id = nextUserId(); // U-001
        string c2Id = nextUserId(); // U-002
        string o1Id = nextOwnerId(); // O-001
        string a1Id = nextAdminId(); // A-001

        userCatalog.add(new Customer(c1Id, "Aarav Mehta", "aarav@venueverse.com", "+919876543210", "pass123"));
        userCatalog.add(new Customer(c2Id, "Pooja Patel", "pooja@gmail.com", "+919822334455", "pass123"));
        userCatalog.add(new VenueOwner(o1Id, "Ramesh Shah", "ramesh@venueverse.com", "LIC-GJ-2026-901", "host123"));
        userCatalog.add(new Admin(a1Id, "Vikram SuperAdmin", "admin@venueverse.com", "Tier-1", "admin123"));

        venueCatalog.add(new WeddingVenue(nextVenueId(), "Royal Rajwadi Grand Ballroom", "Gandhinagar", 45000, 500, 4.9, o1Id)); // V-001
        venueCatalog.add(new BirthdayVenue(nextVenueId(), "Skyline Rooftop Lounge", "Ahmedabad", 25000, 150, 4.7, o1Id));        // V-002
        venueCatalog.add(new ConferenceVenue(nextVenueId(), "Gift City Innovation Hub", "Gandhinagar", 60000, 800, 4.8, o1Id));  // V-003
    }

public:
    TerminalVenueBookingApp() {
        seedData();
    }

    ~TerminalVenueBookingApp() {
        for (Venue* v : venueCatalog.getAll()) delete v;
        for (User* u : userCatalog.getAll()) delete u;
    }

    void run() {
        bool running = true;
        while (running) {
            printHeader("MAIN MENU - VENUE BOOKING SYSTEM (C++ CONSOLE)");
            cout << "  1. Customer Login\n";
            cout << "  2. Venue Owner Login\n";
            cout << "  3. Admin Login\n";
            cout << "  4. Register New User\n";
            cout << "  5. Run C++ OOP Concepts Showcase\n";
            cout << "  0. Exit Application\n";

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
                    runCPlusPlusOopVerificationShowcase();
                    break;
                case 0:
                    running = false;
                    cout << "\nExiting Venue Booking System C++ Suite. Goodbye!\n";
                    break;
                default:
                    cout << "[!] Invalid choice. Please enter a number between 0 and 5.\n";
            }
        }
    }

    void loginFlow(const string& expectedRole) {
        printHeader(expectedRole + " LOGIN");
        string email = readValidEmail("Enter Email: ");
        cout << "Enter Password: ";
        string pwd; getline(cin, pwd);

        User* matched = nullptr;
        for (User* u : userCatalog.getAll()) {
            if (u->getEmail() == email && u->checkPassword(pwd)) {
                matched = u;
                break;
            }
        }

        if (!matched) {
            cout << "[!] Authentication failed: invalid email or password.\n";
            return;
        }

        if (matched->getRole() != expectedRole && matched->getRole() != "Admin") {
            cout << "[!] Role mismatch: user is " << matched->getRole() << ", expected " << expectedRole << ".\n";
            return;
        }

        currentUser = matched;
        cout << "\n[+] Successfully logged in as " << matched->getName() << " [" << matched->getId() << "]\n";

        if (matched->getRole() == "Customer") {
            customerMenu(dynamic_cast<Customer*>(matched));
        } else if (matched->getRole() == "VenueOwner") {
            venueOwnerMenu(dynamic_cast<VenueOwner*>(matched));
        } else if (matched->getRole() == "Admin") {
            adminMenu(dynamic_cast<Admin*>(matched));
        }
    }

    void registerUserFlow() {
        printHeader("REGISTER NEW USER");
        cout << "  1. Register as Customer\n";
        cout << "  2. Register as Venue Owner\n";
        int type = readIntChoice(1, 2);

        string name = readValidName("Enter Full Name: ");
        string email = readValidEmail("Enter Email Address: ");
        cout << "Enter Password: ";
        string pwd; getline(cin, pwd);

        switch (type) {
            case 1: {
                string phone = readValidPhone("Enter Phone Number: ");
                string id = nextUserId(); // U-00X
                userCatalog.add(new Customer(id, name, email, phone, pwd));
                cout << "[+] Customer registered successfully with ID: " << id << "\n";
                break;
            }
            case 2: {
                cout << "Enter Host License (e.g. LIC-GJ-2026-X): ";
                string lic; getline(cin, lic);
                string id = nextOwnerId(); // O-00X
                userCatalog.add(new VenueOwner(id, name, email, lic, pwd));
                cout << "[+] Venue Owner registered successfully with ID: " << id << "\n";
                break;
            }
            default:
                break;
        }
    }

    void browseVenues() {
        printHeader("AVAILABLE VENUES (STREAM << OVERLOAD)");
        for (Venue* v : venueCatalog.getAll()) {
            cout << "  * " << *v << "\n"; // Invoking friend ostream& operator<<
        }
    }

    void searchVenuesFlow() {
        printHeader("SEARCH VENUES (METHOD OVERLOADING)");
        cout << "  1. Search by Keyword (Overload #1)\n";
        cout << "  2. Search by Category & Location (Overload #2)\n";
        cout << "  3. Search by Max Budget & Min Capacity (Overload #3)\n";
        int sType = readIntChoice(1, 3);

        VenueSearchService service(venueCatalog.getAll());
        vector<Venue*> results;

        switch (sType) {
            case 1: {
                cout << "Enter keyword: ";
                string kw; getline(cin, kw);
                results = service.search(kw);
                break;
            }
            case 2: {
                cout << "Enter Category (Wedding/Birthday/Conference/all): ";
                string cat; getline(cin, cat);
                cout << "Enter Location keyword (or everywhere): ";
                string loc; getline(cin, loc);
                results = service.search(cat, loc);
                break;
            }
            case 3: {
                double b = readPositiveDouble("Enter Max Budget (INR): ");
                int c = readValidGuests("Enter Min Capacity: ");
                results = service.search(b, c);
                break;
            }
            default:
                return;
        }

        cout << "\nFound " << results.size() << " match(es):\n";
        for (Venue* v : results) {
            cout << "  * " << *v << "\n";
        }
    }

    // ========================================================================
    // CUSTOMER MENU (Switch Case)
    // ========================================================================
    void customerMenu(Customer* cust) {
        if (!cust) return;
        bool active = true;
        while (active) {
            printHeader("CUSTOMER DASHBOARD: " + cust->getName() + " [" + cust->getId() + "]");
            cout << "  1. Browse Venues\n";
            cout << "  2. Search Venues (Method Overloading)\n";
            cout << "  3. Calculate Quote & Compare (Friend operator >)\n";
            cout << "  4. Book a Venue\n";
            cout << "  5. View My Bookings\n";
            cout << "  6. Enter Custom Deposit (Stream Extraction >> Friend Function)\n";
            cout << "  7. Logout\n";

            int ch = readIntChoice(1, 7);
            switch (ch) {
                case 1:
                    browseVenues();
                    break;
                case 2:
                    searchVenuesFlow();
                    break;
                case 3:
                    quoteAndCompareFlow();
                    break;
                case 4:
                    bookVenueFlow(cust);
                    break;
                case 5:
                    viewCustomerBookings(cust);
                    break;
                case 6:
                    testStreamExtraction();
                    break;
                case 7:
                    active = false;
                    currentUser = nullptr;
                    cout << "[+] Logged out.\n";
                    break;
                default:
                    cout << "[!] Invalid choice. Please enter a number between 1 and 7.\n";
            }
        }
    }

    void quoteAndCompareFlow() {
        printHeader("QUOTE & VENUE COMPARISON");
        Venue* v = readExistingVenue();
        if (!v) return;

        int days = readValidDays("Enter number of days (1-365): ");
        int guests = readValidGuests("Enter expected guests: ");

        Venue::PriceQuote quote = v->buildQuote(days, guests);
        cout << "Nested Class Quote for " << quote.getDays() << " day(s): " << quote.getTotal() << "\n";

        const auto& all = venueCatalog.getAll();
        if (all.size() >= 2) {
            cout << "\nComparing Venue 0 (" << all[0]->getTitle() << ") > Venue 1 (" << all[1]->getTitle() << "):\n";
            bool isGreater = (*all[0] > *all[1]); // Friend function operator>
            cout << "  -> " << (isGreater ? "Venue 0 is pricier" : "Venue 1 is pricier or equal") << "\n";
        }
    }

    void bookVenueFlow(Customer* cust) {
        printHeader("BOOK VENUE (EXCEPTION HANDLING & TYPE CASTING)");
        Venue* v = readExistingVenue();
        if (!v) return;

        string dateStr = readValidDate("Enter Event Date (YYYY-MM-DD): ");
        int guests = readValidGuests("Enter Guests Count: ");
        int days = readValidDays("Enter Days (1-365): ");

        string bookingId = nextBookingId(); // B-001, B-002...

        try {
            auto b = make_unique<Booking>(bookingId, v, cust, dateStr, guests, days);

            // Class-to-Class Type Casting
            BookingReceiptSummary summary = *b;
            cout << "\n[+] Booking Confirmed!\n";
            cout << "  * Class-to-Class Cast (ReceiptSummary): "
                 << summary.bookingId << " | " << summary.venueTitle
                 << " | Total: INR " << fixed << setprecision(2) << summary.totalInr << "\n";

            bookingRecords.push_back(std::move(b));

        } catch (const CapacityLimitException& capEx) {
            cout << "\n[!] [CAUGHT CapacityLimitException]: " << capEx.what() << "\n";
        } catch (const DateConflictException& dateEx) {
            cout << "\n[!] [CAUGHT DateConflictException]: " << dateEx.what() << "\n";
        } catch (const VenueSystemException& baseEx) {
            cout << "\n[!] [CAUGHT Base VenueSystemException]: " << baseEx.what() << "\n";
        }
    }

    void viewCustomerBookings(Customer* cust) {
        printHeader("MY BOOKINGS (" + cust->getName() + " [" + cust->getId() + "])");
        int count = 0;
        for (const auto& b : bookingRecords) {
            if (b->getCustomer()->getId() == cust->getId()) {
                cout << "  * " << *b << "\n";
                count++;
            }
        }
        if (count == 0) cout << "  No bookings found.\n";
    }

    void testStreamExtraction() {
        printHeader("STREAM EXTRACTION OPERATOR >> (FRIEND FUNCTION)");
        cout << "Enter payment amount in INR (e.g. 15000): ";
        MoneyAmount userAmount;
        if (cin >> userAmount) { // Using friend istream& operator>>
            cout << "[+] Parsed into MoneyAmount object: " << userAmount << "\n";
            double discounted = applyTemplateDiscount<double>(userAmount.value(), 10.0);
            cout << "    With 10% promotional template discount: INR " << discounted << "\n";
        }
        cin.clear();
        string dummy;
        getline(cin, dummy); // Flush line
    }

    // ========================================================================
    // VENUE OWNER MENU (Switch Case)
    // ========================================================================
    void venueOwnerMenu(VenueOwner* owner) {
        if (!owner) return;
        bool active = true;
        while (active) {
            printHeader("VENUE OWNER DASHBOARD: " + owner->getName() + " [" + owner->getId() + "]");
            cout << "  1. View My Venues\n";
            cout << "  2. Add New Venue Listing (Inheritance & Virtual Methods)\n";
            cout << "  3. Update Pricing ('this' Pointer Chaining)\n";
            cout << "  4. Logout\n";

            int ch = readIntChoice(1, 4);
            switch (ch) {
                case 1: {
                    printHeader("MY VENUES");
                    for (Venue* v : venueCatalog.getAll()) {
                        if (v->getOwnerId() == owner->getId()) {
                            cout << "  * " << *v << "\n";
                        }
                    }
                    break;
                }
                case 2:
                    addNewVenueFlow(owner);
                    break;
                case 3:
                    updateVenuePricingFlow(owner);
                    break;
                case 4:
                    active = false;
                    currentUser = nullptr;
                    cout << "[+] Logged out.\n";
                    break;
                default:
                    cout << "[!] Invalid choice. Please enter a number between 1 and 4.\n";
            }
        }
    }

    void addNewVenueFlow(VenueOwner* owner) {
        printHeader("LIST NEW VENUE");
        cout << "  1. Wedding Venue\n";
        cout << "  2. Birthday Venue\n";
        cout << "  3. Conference Venue\n";
        int t = readIntChoice(1, 3);

        string title = readValidName("Enter Title: ");
        string loc = readValidName("Enter Location: ");
        double price = readPositiveDouble("Enter Base Price per Day: ");
        int cap = readValidGuests("Enter Guest Capacity: ");

        string id = nextVenueId(); // V-004, V-005...
        Venue* nv = nullptr;

        switch (t) {
            case 1:
                nv = new WeddingVenue(id, title, loc, price, cap, 4.8, owner->getId());
                break;
            case 2:
                nv = new BirthdayVenue(id, title, loc, price, cap, 4.6, owner->getId());
                break;
            case 3:
                nv = new ConferenceVenue(id, title, loc, price, cap, 4.9, owner->getId());
                break;
            default:
                return;
        }

        venueCatalog.add(nv);
        cout << "\n[+] Successfully added venue: " << *nv << "\n";
        cout << "    Total Venues Created: " << Venue::getTotalVenuesCreated() << "\n";
    }

    void updateVenuePricingFlow(VenueOwner* owner) {
        printHeader("UPDATE PRICING ('this' POINTER METHOD CHAINING)");
        Venue* v = readExistingVenue();
        if (!v) return;

        if (v->getOwnerId() != owner->getId()) {
            cout << "[!] Access Denied: You do not own venue " << v->getId() << ".\n";
            return;
        }

        double newP = readPositiveDouble("Enter new base price: ");

        // Method returning *this
        v->setBasePrice(newP);
        cout << "[+] Venue updated via *this: " << *v << "\n";
    }

    // ========================================================================
    // ADMIN MENU (Switch Case)
    // ========================================================================
    void adminMenu(Admin* admin) {
        if (!admin) return;
        bool active = true;
        while (active) {
            printHeader("ADMIN CONTROL CONSOLE: " + admin->getName() + " [" + admin->getId() + "]");
            cout << "  1. View All Registered Users (Polymorphic Pointer Iteration)\n";
            cout << "  2. View Platform Statistics & Venues (Static Members)\n";
            cout << "  3. View All Bookings\n";
            cout << "  4. Logout\n";

            int ch = readIntChoice(1, 4);
            switch (ch) {
                case 1: {
                    printHeader("ALL USERS (POLYMORPHIC DISPLAY)");
                    for (User* u : userCatalog.getAll()) {
                        u->displayProfile();
                    }
                    break;
                }
                case 2: {
                    printHeader("GLOBAL PLATFORM METRICS");
                    cout << "  * Platform Badge: " << PlatformSignature::badge() << "\n";
                    cout << "  * Total Venues Created (Static): " << Venue::getTotalVenuesCreated() << "\n";
                    cout << "  * Total Users in Catalog: " << userCatalog.count() << "\n";
                    cout << "  * Total Bookings Logged:  " << bookingRecords.size() << "\n";
                    cout << "\n--- All Venues ---\n";
                    for (Venue* v : venueCatalog.getAll()) {
                        cout << "  * " << *v << "\n";
                    }
                    break;
                }
                case 3: {
                    printHeader("ALL PLATFORM BOOKINGS");
                    for (const auto& b : bookingRecords) {
                        cout << "  * " << *b << "\n";
                    }
                    break;
                }
                case 4:
                    active = false;
                    currentUser = nullptr;
                    cout << "[+] Admin logged out.\n";
                    break;
                default:
                    cout << "[!] Invalid choice. Please enter a number between 1 and 4.\n";
            }
        }
    }

    // ========================================================================
    // C++ CONCEPTS VERIFICATION SHOWCASE
    // ========================================================================
    void runCPlusPlusOopVerificationShowcase() {
        printHeader("C++ ADVANCED OOP SHOWCASE");

        cout << "[1] VIRTUAL BASE CLASS & DIAMOND INHERITANCE:\n";
        VerifiedHostProfile hostProfile("HOST-01", "GJ-9988-LIC", true, "Gandhinagar");
        cout << "  * ";
        hostProfile.printVerificationSummary();
        cout << "  -> Only ONE shared instance of AuditTrackable exists in VerifiedHostProfile.\n\n";

        cout << "[2] OBJECT SLICING DEMONSTRATION:\n";
        Customer sampleCust("U-999", "Slicing Tester", "slice@test.com", "+919000000000");
        cout << "  * Passed BY VALUE to User parameter (SLICED):   " << inspectUserByValueSliced(sampleCust) << "\n";
        cout << "  * Passed BY POINTER to User* parameter (POLY):   " << inspectUserByPointer(&sampleCust) << "\n\n";

        cout << "[3] OPERATOR OVERLOADING & FRIEND FUNCTION:\n";
        MoneyAmount fee1 = 12000.0;
        MoneyAmount fee2 = 8000.0;
        MoneyAmount totalFee = fee1 + fee2; // Friend operator+
        totalFee += MoneyAmount(3000.0);    // Member operator+=
        cout << "  * " << fee1 << " + " << fee2 << " + INR 3000 = " << totalFee << "\n\n";

        cout << "[4] TYPE CASTING (Basic-to-Class & Class-to-Basic):\n";
        double rawInr = totalFee; // Class-to-Basic via operator double()
        cout << "  * Unboxed MoneyAmount to primitive double: " << rawInr << "\n";
        MoneyAmount boxed(rawInr); // Basic-to-Class
        cout << "  * Boxed primitive double back to MoneyAmount: " << boxed << "\n\n";

        cout << "[5] FUNCTION TEMPLATE & TEMPLATE CLASS:\n";
        double discVal = applyTemplateDiscount<double>(rawInr, 15.0);
        cout << "  * applyTemplateDiscount<double>(rawInr, 15%): INR " << discVal << "\n";
        cout << "  * CatalogStore<Venue>::count(): " << venueCatalog.count() << " venues stored.\n\n";

        cout << "[6] DYNAMIC CASTING & POINTER TO DERIVED CLASS:\n";
        if (venueCatalog.count() > 0) {
            Venue* basePtr = venueCatalog.getAll().front();
            cout << "  * Base Venue Pointer: " << *basePtr << "\n";
            WeddingVenue* weddingPtr = dynamic_cast<WeddingVenue*>(basePtr);
            if (weddingPtr) {
                cout << "  * Successfully downcasted to WeddingVenue*: " << weddingPtr->getWeddingSpecialty() << "\n";
            }
        }
        cout << "\n[+] C++ Showcase executed successfully.\n";
    }
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================
int main() {
    cout << "********************************************************************************\n";
    cout << "*       " << PlatformSignature::badge() << "           *\n";
    cout << "********************************************************************************\n";

    TerminalVenueBookingApp app;
    app.run();

    return 0;
}
