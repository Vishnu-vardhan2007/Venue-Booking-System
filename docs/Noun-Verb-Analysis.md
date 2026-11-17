# Noun–Verb Analysis
### Venue Booking & Management System

---

## 1. Raw Candidate List


### Use Case 1 — Search Venue

| No. | Raw Candidate |
|---|---|
| 1 | Customer |
| 2 | User |
| 3 | System |
| 4 | Venue |
| 5 | Venue listings |
| 6 | Requirements |
| 7 | Location |
| 8 | Date |
| 9 | Venue type |
| 10 | Capacity |
| 11 | Price |
| 12 | Search |
| 13 | Filters |
| 14 | Message |
| 15 | Details |
| 16 | Matching venues |
| 17 | Search results |
| 18 | Event |

### Use Case 2 — View Venue Owner Contact Details

| No. | Raw Candidate |
|---|---|
| 1 | Customer |
| 2 | User |
| 3 | System |
| 4 | Venue |
| 5 | Venue details |
| 6 | Venue Owner |
| 7 | Contact details |
| 8 | Contact information |
| 9 | Booking |
| 10 | Booking details |
| 11 | Search results |
| 12 | Message |

### Use Case 3 — Add / Manage Venue

| No. | Raw Candidate |
|---|---|
| 1 | Venue Owner |
| 2 | Owner |
| 3 | System |
| 4 | Venue |
| 5 | Venue information |
| 6 | Venue name |
| 7 | Location |
| 8 | Venue type |
| 9 | Capacity |
| 10 | Facilities |
| 11 | Pricing |
| 12 | Available dates |
| 13 | Permission |
| 14 | Information |
| 15 | Changes |


### Combined Raw Candidate List

| No. | Raw Candidate | No. | Raw Candidate |
|---|---|---|---|
| 1 | Customer | 18 | Venue Details |
| 2 | User | 19 | Search Results |
| 3 | Venue Owner | 20 | Event |
| 4 | Owner | 21 | Message |
| 5 | Admin | 22 | Contact Details |
| 6 | System | 23 | Contact Information |
| 7 | Venue | 24 | Booking |
| 8 | Venue Listing | 25 | Booking Details |
| 9 | Requirements | 26 | Venue Information |
| 10 | Location | 27 | Venue Name |
| 11 | Date | 28 | Facilities |
| 12 | Venue Type | 29 | Pricing |
| 13 | Capacity | 30 | Available Dates |
| 14 | Price | 31 | Permission |
| 15 | Search | 
| 16 | Filters | 
| 17 | Information |


---

## 2. Apply the Four Filters

Each candidate is evaluated against four filters to determine whether it deserves to become a class in the domain model.

- **Filter 1 — Redundant / Duplicate:** represents the same concept as another candidate.
- **Filter 2 — Irrelevant / Outside the Domain Model:** not a domain entity that needs modeling.
- **Filter 3 — Attribute Rather Than Class:** describes a property of another object rather than being a class itself.
- **Filter 4 — Operation / Action:** represents something an object/system *does*, not an entity.

### Filter 1 — Redundant / Duplicate

| Candidate | Reason |
|---|---|
| User | Same person as Customer ("Customer / User" used interchangeably) — keep **Customer** |
| Owner | Same person as Venue Owner — keep **VenueOwner** |
| Contact Information | Same concept as Contact Details |

### Filter 2 — Irrelevant / Outside the Domain Model

| Candidate | Reason |
|---|---|
| System | Represented by the system boundary in the use-case diagram, not a domain class |
| Event | Provides context for the search but no Event objects are maintained in these specs |
| Message | Displayed system output, not a business entity |
| Permission | An authorization condition, not an independently managed object |
| Admin | An actor in the overall project but does not participate in these three specs |
| Information | Generic concept, not a domain entity |

### Filter 3 — Attribute Rather Than Class

| Candidate | Reason |
|---|---|
| Location | Attribute of Venue |
| Date | Search/booking input value |
| Venue Type | Attribute of Venue |
| Capacity | Attribute of Venue |
| Price | Attribute of Venue |
| Venue Name | Attribute of Venue |
| Facilities | Attribute of Venue |
| Pricing | Attribute of Venue |
| Available Dates | Availability attribute of Venue |
| Venue Details | Information about Venue |
| Venue Information | Information about Venue |
| Contact Details | Information/attribute of Venue Owner |
| Booking Details | Information/attributes of Booking |
| Requirements | Search criteria |

### Filter 4 — Operation / Action

| Candidate | Reason |
|---|---|
| Search | Operation/action |
| Filters | Part of the search operation |
| Search Results | Result of the search operation |
| Changes | Result of an update operation |
| Venue Listing | Representation/result of listing venues, not a separate entity |

---

## 3. Final Filter Table

| Candidate | Decision | Filter / Reason |
|---|---|---|
| Customer | **Survives** | Meaningful domain entity |
| User | Discarded | Filter 1 — Redundant with Customer |
| Venue Owner | **Survives** | Meaningful domain entity |
| Owner | Discarded | Filter 1 — Redundant with Venue Owner |
| Admin | Discarded | Filter 2 — Not relevant to these three specs |
| System | Discarded | Filter 2 — System boundary, not a domain entity |
| Venue | **Survives** | Central domain entity |
| Venue Listing | Discarded | Filter 1/4 — Representation/result of Venue, not a separate entity |
| Requirements | Discarded | Filter 3 — Search information/criteria |
| Location | Discarded | Filter 3 — Attribute of Venue |
| Date | Discarded | Filter 3 — Search/booking value |
| Venue Type | Discarded | Filter 3 — Attribute of Venue |
| Capacity | Discarded | Filter 3 — Attribute of Venue |
| Price | Discarded | Filter 3 — Attribute of Venue |
| Search | Discarded | Filter 4 — Operation/Action |
| Filters | Discarded | Filter 4 — Part of search operation |
| Criteria | Discarded | Filter 3 — Search information |
| Venue Details | Discarded | Filter 3 — Information about Venue |
| Search Results | Discarded | Filter 4 — Result of search operation |
| Event | Discarded | Filter 2 — Context, not modeled in these specs |
| Message | Discarded | Filter 2 — System output, not a domain entity |
| Contact Details | Discarded | Filter 3 — Attribute/information of Venue Owner |
| Contact Information | Discarded | Filter 1 — Duplicate of Contact Details |
| Booking | **Survives** | Meaningful domain entity |
| Booking Details | Discarded | Filter 3 — Information/attributes of Booking |
| Venue Information | Discarded | Filter 3 — Information about Venue |
| Venue Name | Discarded | Filter 3 — Attribute of Venue |
| Facilities | Discarded | Filter 3 — Venue attribute |
| Pricing | Discarded | Filter 3 — Venue attribute |
| Available Dates | Discarded | Filter 3 — Availability information of Venue |
| Permission | Discarded | Filter 2 — Authorization concept, not a domain entity |
| Information | Discarded | Filter 2 — Generic concept, not a domain entity |
| Error Message | Discarded | Filter 2 — System output, not a domain entity |
| Changes | Discarded | Filter 4 — Result of update operation |

---

## 4. Surviving Classes

| Surviving Class | Why It Survives |
|---|---|
| **Customer** | Real domain entity that searches for, selects, and contacts venues. Has attributes such as `customerId`, `name`, `email`, `phone`. |
| **VenueOwner** | Real domain entity associated with venues; provides contact details. Has attributes such as `ownerId`, `name`, `email`, `phone`. |
| **Venue** | Central domain entity being searched, viewed, and managed. Has attributes such as `venueId`, `name`, `location`, `type`, `capacity`, `price`, `facilities`, `availableDates`. |
| **Booking** | Represents the arrangement between a Customer and a VenueOwner. Has attributes such as `bookingId`, `date`, `time`, `status`. |
