#include <iostream>
#include <iomanip>
#include <sstream>
#include <vector>
#include <string>
#include <set>
#include <stdexcept>
#include <algorithm>
#include <cctype>

using namespace std;

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
        : AuditTrackable(std::move(tag)),
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

class PlatformSignature final {
public:
    static string badge() { return "VenueVerse C++ Domain Engine v2.0"; }
};

class MoneyAmount {
private:
    double amountInr;
public:
    MoneyAmount(double inr = 0.0) {
        this->amountInr = (inr < 0.0) ? 0.0 : inr;
    }

    operator double() const {
        return this->amountInr;
    }

    MoneyAmount& operator+=(const MoneyAmount& rhs) {
        this->amountInr += rhs.amountInr;
        return *this;
    }

    bool operator==(const MoneyAmount& rhs) const {
        return this->amountInr == rhs.amountInr;
    }

    double value() const { return this->amountInr; }

    friend MoneyAmount operator+(const MoneyAmount& lhs, const MoneyAmount& rhs);

    friend ostream& operator<<(ostream& os, const MoneyAmount& money);
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

class User {
protected:
    string id;
    string name;
    string email;
    string role;
public:
    User(string id, string name, string email, string role = "User") {
        this->id = std::move(id);
        this->name = std::move(name);
        this->email = std::move(email);
        this->role = std::move(role);
    }

    virtual ~User() = default;

    string getId() const { return this->id; }
    string getName() const { return this->name; }
    string getEmail() const { return this->email; }
    string getRole() const { return this->role; }

    virtual string describeIdentity() const {
        return "User(" + this->name + ", role=" + this->role + ")";
    }

    virtual void displayProfile() const {
        cout << "User[" << this->id << "] " << this->name << " <" << this->email << ">\n";
    }
};

class Customer : public User {
private:
    string phone;
public:
    Customer(string id, string name, string email, string phone = "")
        : User(std::move(id), std::move(name), std::move(email), "Customer") {
        this->phone = std::move(phone);
    }

    string getPhone() const { return this->phone; }

    string describeIdentity() const override {
        return "Customer(" + this->name + ", phone=" + this->phone + ")";
    }

    void displayProfile() const override {
        cout << "Customer[" << this->id << "] " << this->name << " (" << this->phone << ")\n";
    }
};

class Admin : public User {
private:
    string adminLevel;
public:
    Admin(string id, string name, string email, string level = "SuperAdmin")
        : User(std::move(id), std::move(name), std::move(email), "Admin"),
          adminLevel(std::move(level)) {}

    string describeIdentity() const override {
        return "Admin(" + this->name + ", level=" + this->adminLevel + ")";
    }

    bool canManagePlatform() const { return true; }
};

inline string inspectUserByValueSliced(User slicedCopy) {
    return slicedCopy.describeIdentity();
}

inline string inspectUserByPointer(const User* ptr) {
    return ptr ? ptr->describeIdentity() : "NULL";
}

class Venue {
private:
    static int totalVenuesCreated;
    set<string> bookedDates;

protected:
    string id;
    string title;
    string category;
    string location;
    double basePrice;
    int capacity;
    double rating;

public:
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
          double basePrice, int capacity, double rating = 0.0) {
        this->id = std::move(id);
        this->title = std::move(title);
        this->category = std::move(category);
        this->location = std::move(location);
        this->basePrice = basePrice;
        this->capacity = capacity;
        this->rating = rating;
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

    Venue& setBasePrice(double updatedPrice) {
        this->basePrice = updatedPrice;
        return *this;
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
    os << v.title << " (" << v.category << ", " << v.location
       << ", INR " << fixed << setprecision(0) << v.basePrice << ")";
    return os;
}

class WeddingVenue : public Venue {
public:
    WeddingVenue(string id, string title, string location, double basePrice, int capacity, double rating = 0.0)
        : Venue(std::move(id), std::move(title), "Wedding", std::move(location), basePrice, capacity, rating) {}

    double calculateTotalPrice(int days, int  ) const override final {
        int validDays = max(1, days);
        return this->basePrice * validDays;
    }

    string getWeddingSpecialty() const {
        return "Bridal Suite & Vedic Mandap Included";
    }
};

class BirthdayVenue : public Venue {
public:
    BirthdayVenue(string id, string title, string location, double basePrice, int capacity, double rating = 0.0)
        : Venue(std::move(id), std::move(title), "Birthday", std::move(location), basePrice, capacity, rating) {}

    double calculateTotalPrice(int days, int  ) const override {
        return this->basePrice * max(1, days);
    }
};

class ConferenceVenue : public Venue {
public:
    ConferenceVenue(string id, string title, string location, double basePrice, int capacity, double rating = 0.0)
        : Venue(std::move(id), std::move(title), "Conference", std::move(location), basePrice, capacity, rating) {}

    double calculateTotalPrice(int days, int  ) const override {
        return this->basePrice * max(1, days);
    }
};

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

        v->bookDate(dateStr);

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

    void cancel() {
        if (this->status != "CANCELLED") {
            this->status = "CANCELLED";
            this->venue->releaseDate(this->bookingDate);
        }
    }

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
    os << "Receipt[" << b.bookingId << "] Venue=" << b.venue->getTitle()
       << " | Customer=" << b.customer->getName()
       << " | Date=" << b.bookingDate
       << " | Guests=" << b.guestsCount
       << " | Total=" << b.totalAmount
       << " | Status=" << b.status;
    return os;
}

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
};

template <typename T>
T applyTemplateDiscount(T amount, double percent) {
    double factor = 1.0 - max(0.0, min(50.0, percent)) / 100.0;
    return static_cast<T>(amount * factor);
}

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

inline void runOopConceptsVerificationShowcase(CatalogStore<Venue>& store, Customer& customer) {
    cout << "\n================ " << PlatformSignature::badge() << " ================\n";
    cout << "[Static Variable/Method] Total Venues Created: " << Venue::getTotalVenuesCreated() << "\n";

    VerifiedHostProfile hostProfile("HOST-01", "GJ-9988", true, "Gandhinagar");
    cout << "[Virtual Base Class] ";
    hostProfile.printVerificationSummary();

    const auto& venues = store.getAll();
    if (!venues.empty()) {
        Venue* basePtr = venues.front();
        cout << "[Friend Stream <<] First Venue: " << *basePtr << "\n";
        WeddingVenue* derivedPtr = dynamic_cast<WeddingVenue*>(basePtr);
        if (derivedPtr) {
            cout << "[Pointer to Derived Class] " << derivedPtr->getWeddingSpecialty() << "\n";
        }
        if (venues.size() >= 2) {
            cout << "[Friend Operator >] Venue 0 > Venue 1? "
                 << ((*venues[0] > *venues[1]) ? "true" : "false") << "\n";
        }
        Venue::PriceQuote q = basePtr->buildQuote(2, 100);
        cout << "[Nested Class + Friend <<] 2-day Quote: " << q.getTotal() << "\n";
    }

    cout << "[Object Slicing (Pass by Value User)] " << inspectUserByValueSliced(customer) << "\n";
    cout << "[Polymorphic Pointer (User*)]        " << inspectUserByPointer(&customer) << "\n";

    MoneyAmount deposit = 15000.0;
    MoneyAmount balance(25000.0);
    MoneyAmount combined = deposit + balance;
    combined += MoneyAmount(5000.0);
    double rawDouble = combined;
    cout << "[Type Casting & Operators] Basic->Class->Basic = " << combined << " (" << rawDouble << ")\n";

    istringstream mockInput("12000");
    MoneyAmount parsedInput;
    mockInput >> parsedInput;
    cout << "[Friend Stream >>] Parsed input amount: " << parsedInput << "\n";
    cout << "[Function Template] 10% discounted: " << applyTemplateDiscount<double>(rawDouble, 10.0) << "\n";

    try {
        if (!venues.empty()) {
            Booking sample("BK-DEMO", venues.front(), &customer, "2027-06-15", 100, 1);
            BookingReceiptSummary receipt = sample;
            cout << "[Class-to-Class Cast] Summary ID=" << receipt.bookingId
                 << ", Venue=" << receipt.venueTitle << ", Total=" << receipt.totalInr << "\n";
            Booking overLimit("BK-ERR", venues.front(), &customer, "2027-06-20", 999999, 1);
        }
    } catch (const CapacityLimitException& capEx) {
        cout << "[Exception Derived Catch] " << capEx.getCategory() << " -> " << capEx.what() << "\n";
    } catch (const VenueSystemException& baseEx) {
        cout << "[Exception Base Catch] " << baseEx.getCategory() << " -> " << baseEx.what() << "\n";
    }

    try {
        if (!venues.empty()) {
            Booking duplicateDate("BK-DUP", venues.front(), &customer, "2027-06-15", 50, 1);
        }
    } catch (const DateConflictException& dateEx) {
        cout << "[Exception Derived Catch] " << dateEx.getCategory() << " -> " << dateEx.what() << "\n";
    } catch (const VenueSystemException& baseEx) {
        cout << "[Exception Base Catch] " << baseEx.what() << "\n";
    }
}

int main() {
    CatalogStore<Venue> catalogStore;
    catalogStore.add(new WeddingVenue("w1", "Royal Rajwadi Palace", "Gandhinagar", 125000, 800, 4.9));
    catalogStore.add(new BirthdayVenue("b1", "Skyline Rooftop Lounge", "Ahmedabad", 45000, 200, 4.7));
    catalogStore.add(new ConferenceVenue("c1", "Gift City Innovation Hub", "Gandhinagar", 85000, 500, 4.8));

    VenueSearchService searchService(catalogStore.getAll());
    Customer customer("u1", "Aarav Mehta", "aarav@venueverse.com", "+91 9876543210");
    vector<Booking> bookingsHistory;

    int choice = 0;
    while (true) {
        cout << "\n--- VENUEVERSE C++ OOP SYSTEM ---\n"
             << "1. View All Venues\n"
             << "2. Search Venues (Method Overloading)\n"
             << "3. Create Booking\n"
             << "4. View Booking History\n"
             << "5. Cancel Booking\n"
             << "6. Exit\n"
             << "7. Run Complete OOP Concepts Showcase\n"
             << "Choose option: ";

        if (!(cin >> choice)) {
            break;
        }

        if (choice == 6) {
            cout << "Exiting VenueVerse C++ Engine. Goodbye!\n";
            break;
        }

        switch (choice) {
            case 1:
                for (Venue* v : catalogStore.getAll()) v->displayDetails();
                break;
            case 2: {
                cout << "1=Keyword, 2=Category+City, 3=Budget+Cap: ";
                int mode;
                cin >> mode;
                vector<Venue*> results;
                if (mode == 1) {
                    string kw;
                    cout << "Keyword: ";
                    cin >> kw;
                    results = searchService.search(kw);
                } else if (mode == 2) {
                    string cat, loc;
                    cout << "Category City: ";
                    cin >> cat >> loc;
                    results = searchService.search(cat, loc);
                } else {
                    double b;
                    int c;
                    cout << "MaxBudget MinCapacity: ";
                    cin >> b >> c;
                    results = searchService.search(b, c);
                }
                for (Venue* r : results) r->displayDetails();
                break;
            }
            case 3: {
                try {
                    string vId, date;
                    int guests;
                    cout << "Venue ID (w1/b1/c1): ";
                    cin >> vId;
                    Venue* target = nullptr;
                    for (Venue* v : catalogStore.getAll()) {
                        if (v->getId() == vId) { target = v; break; }
                    }
                    if (!target) {
                        throw VenueSystemException("Venue not found: " + vId, "NOT_FOUND");
                    }
                    cout << "Date (YYYY-MM-DD) & Guests: ";
                    cin >> date >> guests;
                    string bkId = "BK-" + to_string(1001 + bookingsHistory.size());
                    Booking b(bkId, target, &customer, date, guests, 1);
                    b.displayReceipt();
                    bookingsHistory.push_back(b);
                } catch (const CapacityLimitException& capEx) {
                    cout << "Capacity Error: " << capEx.what() << "\n";
                } catch (const DateConflictException& dateEx) {
                    cout << "Availability Error: " << dateEx.what() << "\n";
                } catch (const VenueSystemException& ex) {
                    cout << "Booking Error: " << ex.what() << "\n";
                }
                break;
            }
            case 4:
                for (const auto& b : bookingsHistory) b.displayReceipt();
                break;
            case 5: {
                string bId;
                cout << "Booking ID to cancel: ";
                cin >> bId;
                for (auto& b : bookingsHistory) {
                    if (b.getBookingId() == bId) b.cancel();
                }
                break;
            }
            case 7:
                runOopConceptsVerificationShowcase(catalogStore, customer);
                break;
            default:
                cout << "Invalid option.\n";
        }
    }

    for (Venue* v : catalogStore.getAll()) {
        delete v;
    }
    return 0;
}
