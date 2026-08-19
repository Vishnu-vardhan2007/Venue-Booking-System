# CRC Cards

## 1. CRC Card — Customer

| Class | Customer |
|---|---|
| Responsibilities | 1. Search for suitable venues using requirements such as location, date, venue type, capacity, and price.<br>2. Provide and modify search criteria.<br>3. View matching venue listings.<br>4. Select a venue and view its details.<br>5. View the Venue Owner's contact details.<br>6. Contact the Venue Owner to discuss and arrange a booking. |
| Collaborators | - **Venue** — to search for and view suitable venue information.<br>- **VenueOwner** — to obtain contact details and discuss the booking.<br>- **Booking** — to arrange the booking associated with the selected venue. |

## 2. CRC Card — VenueOwner

| Class | VenueOwner |
|---|---|
| Responsibilities | 1. Add a new venue.<br>2. Manage existing venue information.<br>3. Enter and update venue information such as venue name, location, venue type, capacity, facilities, pricing, and available dates.<br>4. Submit venue information for validation and saving.<br>5. Correct invalid or incomplete venue information.<br>6. Update an existing venue when the venue already exists.<br>7. Provide contact details that can be viewed by customers. |
| Collaborators | - **Venue** — to add and manage venue information, facilities, pricing, and availability.<br>- **Customer** — to provide contact details and discuss booking arrangements.<br>- **Booking** — to discuss and arrange booking details. |

## 3. CRC Card — Venue

| Class | Venue |
|---|---|
| Responsibilities | 1. Maintain venue information.<br>2. Store venue name, location, venue type, and capacity.<br>3. Maintain facilities and pricing information.<br>4. Maintain available dates and availability information.<br>5. Provide venue information for searching and filtering.<br>6. Provide venue details for customers to view. |
| Collaborators | - **Customer** — to search for and view venue information.<br>- **VenueOwner** — to add and manage venue information.<br>- **Booking** — to associate a booking with the selected venue. |

## 4. CRC Card — Booking

| Class | Booking |
|---|---|
| Responsibilities | 1. Maintain booking details.<br>2. Associate the customer with the selected venue.<br>3. Support the arrangement of booking details between the customer and Venue Owner. |
| Collaborators | - **Customer** — to arrange a booking.<br>- **Venue** — to associate the booking with the selected venue.<br>- **VenueOwner** — to discuss and arrange the booking. |
