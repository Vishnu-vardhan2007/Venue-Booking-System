# Use Case Specifications

## 1. Use Case: Search Venue

### Primary Actor
Customer / User

### Stakeholders
- Customer
- Venue Owner
- Admin

### Preconditions
- The system is available.
- Venue listings are available in the system.

### Postconditions
- The system displays venues matching the customer's requirements.
- The customer can view details of suitable venues.

### Trigger
The customer wants to find a suitable venue for an event.

### Main Flow
1. Customer opens the **Search Venues** option.
2. System displays search and filter options.
3. Customer enters requirements such as location, date, venue type, capacity, and price.
4. Customer submits the search.
5. System searches the available venue listings.
6. System applies the selected filters.
7. System displays matching venues.
8. Customer selects a venue to view its details.

### Alternate Flows

#### A1. No Matching Venues
1. System finds no venue matching the specified criteria.
2. System displays a message indicating that no matching venues were found.
3. Customer modifies the search criteria and searches again.

#### A2. Some Filters Are Not Provided
1. Customer provides only some search criteria.
2. System searches using the provided criteria.
3. System displays venues matching those criteria.


---

## 2. Use Case: View Venue Owner Contact Details

### Primary Actor
Customer / User

### Stakeholders
- Customer
- Venue Owner

### Preconditions
- Customer has selected a venue.
- Venue Owner's contact details are available in the system.

### Postconditions
- Customer obtains the Venue Owner's contact details.
- Customer can contact the Venue Owner directly to discuss and arrange the booking.

### Trigger
The customer wants to contact the Venue Owner to proceed with booking the venue.

### Main Flow
1. Customer selects a venue from the search results.
2. System displays the venue details.
3. System displays the Venue Owner's contact details.
4. Customer obtains the contact information.
5. Customer contacts the Venue Owner directly.
6. Customer and Venue Owner discuss the booking details.
7. Customer and Venue Owner arrange the booking directly.

### Alternate Flows

#### A1. Contact Details Are Unavailable
1. Customer attempts to view the Venue Owner's contact details.
2. System finds that the contact details are unavailable.
3. System informs the customer.
4. Customer can select another venue or try again later.

#### A2. Customer Decides Not to Contact the Owner
1. Customer views the Venue Owner's contact details.
2. Customer decides not to proceed.
3. Customer returns to the search results and selects another venue.


---

## 3. Use Case: Add / Manage Venue

### Primary Actor
Venue Owner

### Stakeholders
- Venue Owner
- Customer
- Admin

### Preconditions
- Venue Owner is registered in the system.
- Venue Owner is logged in.
- Owner has permission to manage the venue.

### Postconditions
- Venue information is added or updated.
- Facilities, pricing, and availability information are maintained.
- Updated venue information is available in the system.

### Trigger
The Venue Owner wants to add a new venue or update an existing venue.

### Main Flow
1. Venue Owner logs into the system.
2. Owner selects **Add / Manage Venue**.
3. System displays venue management options.
4. Owner enters or updates venue information such as venue name, location, venue type, capacity, facilities, pricing, and available dates.
5. Owner submits the changes.
6. System validates the information.
7. System saves the venue information.
8. Updated venue information is made available in the system.

### Alternate Flows

#### A1. Invalid or Incomplete Information
1. Owner submits the venue information.
2. System detects missing or invalid information.
3. System displays an appropriate error message.
4. Owner corrects the information and submits it again.

#### A2. Venue Already Exists
1. Owner attempts to add a venue that already exists.
2. System detects the existing venue.
3. System informs the owner.
4. Owner can update the existing venue instead.
