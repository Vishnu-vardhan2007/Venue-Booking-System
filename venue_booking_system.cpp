#include <iostream>
#include <string>
#include <iomanip>

using namespace std;

// Virtual Base Class & Diamond Problem (Multiple Inheritance)
class AuditEntity {
protected:
    string entityId;
public:
    AuditEntity(string id = "AUDIT-001") : entityId(id) {}
    virtual ~AuditEntity() = default;
    string getEntityId() const { return entityId; }
};

class HostProfile : virtual public AuditEntity {
protected:
    string hostLicense;
public:
    HostProfile(string id, string license) : AuditEntity(id), hostLicense(license) {}
};

class VerifiedListing : virtual public AuditEntity {
protected:
    bool isKycVerified;
public:
    VerifiedListing(string id, bool verified) : AuditEntity(id), isKycVerified(verified) {}
};

// Resolving diamond inheritance using virtual base class
class VerifiedVenueOwner : public HostProfile, public VerifiedListing {
public:
    VerifiedVenueOwner(string id, string license, bool verified)
        : AuditEntity(id), HostProfile(id, license), VerifiedListing(id, verified) {}

    void displayDiamondSummary() const {
        cout << "VerifiedVenueOwner [Entity ID: " << entityId
             << " | License: " << hostLicense
             << " | KYC Verified: " << (isKycVerified ? "YES" : "NO") << "]\n";
    }
};

// Operator Overloading, Friend Functions & Stream Operators (<<, >>)
class VenueBudget {
private:
    double amount;

public:
    // Basic-to-Class Type Casting (Conversion Constructor)
    VenueBudget(double val = 0.0) : amount(val < 0.0 ? 0.0 : val) {}

    // Class-to-Basic Type Casting Operator (Java cannot define conversion operators)
    operator double() const {
        return this->amount;
    }

    // Member Operator Overloading (+=) with "this" Pointer Dereferencing (*this)
    VenueBudget& operator+=(const VenueBudget& rhs) {
        this->amount += rhs.amount;
        return *this; // Dereferencing raw "this" pointer
    }

    // Member Operator Overloading (==)
    bool operator==(const VenueBudget& rhs) const {
        return this->amount == rhs.amount;
    }

    // Friend Function 
    friend void inspectPrivateBudget(const VenueBudget& b);

    // Operator Overloading 
    friend VenueBudget operator+(const VenueBudget& lhs, const VenueBudget& rhs);

    friend ostream& operator<<(ostream& os, const VenueBudget& b);

    // Stream Extraction Operator Overloading (>>) using Friend Function
    friend istream& operator>>(istream& is, VenueBudget& b);
};

void inspectPrivateBudget(const VenueBudget& b) {
    cout << "  [Friend Function] Directly accessing private amount: INR " << b.amount << "\n";
}

// Friend function operator+ overloading
VenueBudget operator+(const VenueBudget& lhs, const VenueBudget& rhs) {
    return VenueBudget(lhs.amount + rhs.amount);
}

// Friend function stream operator << overloading
ostream& operator<<(ostream& os, const VenueBudget& b) {
    os << "INR " << fixed << setprecision(2) << b.amount;
    return os;
}

// Friend function stream operator >> overloading
istream& operator>>(istream& is, VenueBudget& b) {
    is >> b.amount;
    return is;
}

// Concept 3: Object Slicing
// In Java, objects are managed by reference, so derived data is never sliced.
// In C++, passing by value slices off derived members, leaving only the base object.
class BaseUser {
protected:
    string name;
public:
    BaseUser(string n = "BaseUser") : name(n) {}
    virtual ~BaseUser() = default;
    virtual void showIdentity() const {
        cout << "BaseUser: " << name << "\n";
    }
};

class PremiumCustomer : public BaseUser {
private:
    string vipTier;
public:
    PremiumCustomer(string n, string tier) : BaseUser(n), vipTier(tier) {}
    void showIdentity() const override {
        cout << "PremiumCustomer: " << name << " | VIP Tier: " << vipTier << "\n";
    }
    string getTier() const { return vipTier; }
};

// Passed by value -> Causes Object Slicing (derived vipTier is sliced off)
void testPassByValueSlicing(BaseUser slicedUser) {
    cout << "  Inside pass-by-value function: ";
    slicedUser.showIdentity(); // Sliced to BaseUser
}

// Passed by reference -> Preserves complete derived object (Polymorphism)
void testPassByReference(const BaseUser& refUser) {
    cout << "  Inside pass-by-reference function: ";
    refUser.showIdentity(); // Full derived object retained
}

int main() {

    // 1. Virtual Base Class & Diamond Problem
    cout << "1. Virtual Base Class (Diamond Problem Resolution):\n";
    VerifiedVenueOwner owner("AUD-901", "LIC-GJ-2026", true);
    owner.displayDiamondSummary();
    cout << "   Note: 'virtual public' prevents duplicate AuditEntity instances.\n\n";

    // 2. Operator Overloading & Friend Functions
    cout << "2. Operator Overloading & Friend Functions:\n";
    VenueBudget venueRent(45000.0);
    VenueBudget catering(30000.0);

    // Friend Function demonstration
    inspectPrivateBudget(venueRent);

    // Operator+ Overloading via Friend Function
    VenueBudget total = venueRent + catering;
    cout << "  Operator+ (Friend): " << venueRent << " + " << catering << " = " << total << "\n";

    // Member Operator+= Overloading with *this pointer dereference
    total += VenueBudget(5000.0);
    cout << "  Operator+= (*this Pointer): Added INR 5000.00 -> Total: " << total << "\n";

    // Stream Insertion Operator << Overloading
    cout << "  Stream Operator << (Friend): Formatted Output: " << total << "\n";

    // Class-to-Basic Type Casting Operator (operator double)
    double rawPrimitive = (double)total;
    cout << "  Class-to-Basic Casting (operator double): " << rawPrimitive << " (primitive double)\n\n";

    // 3. Object Slicing
    cout << "3. Object Slicing (Value vs. Reference):\n";
    PremiumCustomer cust("Aditi Sharma", "Platinum-VIP");
    cout << "  Original Derived Object: ";
    cust.showIdentity();

    cout << "  Pass-by-Value (Slicing): ";
    testPassByValueSlicing(cust); // Derived data is sliced off

    cout << "  Pass-by-Reference (Polymorphic): ";
    testPassByReference(cust);    // Derived data is preserved

    cout << "\n=========================================================\n";
    return 0;
}
