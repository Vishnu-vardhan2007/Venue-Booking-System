# VenueVerse Spring Boot Backend (Java)

This is the simplified Java Spring Boot backend for **VenueVerse**, specifically streamlined for college project evaluation and viva presentation.

---

## 🎯 Scope of Features

1. **User Registration & Login**:
   - Safe registration (always assigns default `user` role; public registration cannot grant host/admin privileges).
   - Direct password storage and verification (plain text; no BCrypt).
   - Stateful session authentication with `HttpSession` (no JWT or JWT secrets).
2. **Object-Oriented Programming (OOP) Demonstration**:
   - `User`: Base entity for standard users.
   - `VenueOwner extends User`: Inherits from `User` with host-specific business methods (`isAuthorizedHost()`, `ownsVenue()`).
   - Polymorphic handling in `AuthService` and `PromoteToHostRunner`.
3. **Venue Creation & MongoDB Persistence**:
   - `Venue` document model saved into MongoDB Atlas.
   - Protected endpoint: Only authenticated `VenueOwner` users (role `"host"` or `"admin"`) can add venues (`POST /api/venues`).

---

## 🛠️ Technology Stack

- **Java**: 21 / 25
- **Framework**: Spring Boot 3.4.3 (Spring Web MVC, Spring Data MongoDB)
- **Database**: MongoDB Atlas (`users` and `venues` collections)
- **Authentication**: HTTP Sessions (`JSESSIONID`) with CORS credentials enabled
- **Build Tool**: Maven Wrapper (`mvnw` / `mvnw.cmd`)

---

## 📁 Project Structure

```text
backend-java/
├── .mvn/wrapper/                  # Maven Wrapper binaries
├── mvnw & mvnw.cmd                # Maven Wrapper execution scripts
├── pom.xml                        # Clean Maven dependencies (no JWT)
└── src/
    ├── main/
    │   ├── java/com/venueverse/
    │   │   ├── VenueverseBackendApplication.java  # Main entry point + GET /api/health
    │   │   ├── config/
    │   │   │   └── AppConfig.java                 # CORS & Session Interceptor config
    │   │   ├── controller/
    │   │   │   ├── AuthController.java            # POST /register, /login, /logout, GET /me
    │   │   │   └── VenueController.java           # POST /api/venues (VenueOwner only)
    │   │   ├── dto/
    │   │   │   ├── ApiResponse.java               # Standard API response wrapper
    │   │   │   ├── AuthResponse.java              # Auth response with UserDto
    │   │   │   ├── CreateVenueRequest.java        # Venue input request POJO
    │   │   │   ├── LoginRequest.java              # Email & password POJO
    │   │   │   ├── RegisterRequest.java           # Registration POJO
    │   │   │   └── UserDto.java                   # Safe user profile DTO
    │   │   ├── exception/
    │   │   │   └── GlobalExceptionHandler.java    # Centralized REST error handling
    │   │   ├── model/
    │   │   │   ├── User.java                      # Base entity in MongoDB
    │   │   │   ├── VenueOwner.java                # Extends User (OOP Inheritance)
    │   │   │   └── Venue.java                     # Venue entity in MongoDB
    │   │   ├── repository/
    │   │   │   ├── UserRepository.java            # Spring Data MongoDB repository for Users
    │   │   │   └── VenueRepository.java           # Spring Data MongoDB repository for Venues
    │   │   ├── runner/
    │   │   │   └── PromoteToHostRunner.java       # CLI tool to promote user to VenueOwner
    │   │   ├── security/
    │   │   │   ├── AuthUser.java                  # Lightweight session object
    │   │   │   └── SessionAuthInterceptor.java    # Protects endpoints & enforces VenueOwner role
    │   │   └── service/
    │   │       ├── AuthService.java               # Registration, Login & VenueOwner promotion
    │   │       └── VenueService.java              # Validates and creates Venue in MongoDB
    │   └── resources/
    │       └── application.properties             # Port, MongoDB URI, CORS
    └── test/                                      # Unit tests (AuthServiceTest, VenueServiceTest)
```

---

## 🚀 How to Run the Backend

### 1. Start the Server
From PowerShell inside `backend-java`:
```powershell
.\mvnw.cmd spring-boot:run
```
*(The server starts on port `5000`)*

### 2. Run All Tests
```powershell
.\mvnw.cmd test
```
*(All 10 unit tests pass with `BUILD SUCCESS`)*

---

## 🧪 Testing the Complete Workflow

You can test the entire workflow using any HTTP tool (cURL, Postman, Thunder Client, or browser):

### Step 1: Health Check
```powershell
curl http://localhost:5000/api/health
```
Response:
```json
{ "status": "success", "message": "VenueVerse API is running" }
```

### Step 2: Register a New User
```powershell
curl -X POST http://localhost:5000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"name":"Aarav Sharma","email":"aarav@venueverse.com","password":"Password123","phone":"+91 9999999999"}'
```
Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "...",
    "name": "Aarav Sharma",
    "email": "aarav@venueverse.com",
    "role": "user",
    "phone": "+91 9999999999"
  }
}
```

### Step 3: Promote User to Venue Owner (Host)
Run the built-in CLI runner command:
```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.arguments="--promote=aarav@venueverse.com"
```
Output:
```text
Success: User "aarav@venueverse.com" has been promoted to venue owner (host).
```

### Step 4: Login as Venue Owner & Save Session Cookie
```powershell
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"aarav@venueverse.com","password":"Password123"}'
```
Response:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "name": "Aarav Sharma",
    "email": "aarav@venueverse.com",
    "role": "host"
  }
}
```
*(The session cookie `JSESSIONID` is now saved in `cookies.txt`)*

### Step 5: Add a Venue (Authenticated Venue Owner)
```powershell
curl -b cookies.txt -X POST http://localhost:5000/api/venues `
  -H "Content-Type: application/json" `
  -d '{
    "title": "Royal Palm Banquet Hall",
    "description": "Luxurious air-conditioned hall with parking and catering.",
    "category": "Banquet Hall",
    "city": "Hyderabad",
    "address": "Banjara Hills, Road No 10",
    "capacity": 600,
    "pricePerDay": 85000,
    "images": ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3"],
    "amenities": ["Air Conditioning", "Valet Parking", "In-house Catering", "Stage & Audio"]
  }'
```
Response (`201 CREATED`):
```json
{
  "success": true,
  "message": "Venue added successfully",
  "venue": {
    "_id": "670da...",
    "title": "Royal Palm Banquet Hall",
    "description": "Luxurious air-conditioned hall with parking and catering.",
    "category": "Banquet Hall",
    "city": "Hyderabad",
    "address": "Banjara Hills, Road No 10",
    "capacity": 600,
    "pricePerDay": 85000.0,
    "host": "...",
    "status": "pending",
    "isActive": true
  }
}
```

### Step 6: Verify Access Control
If a user is **not logged in**:
```powershell
curl -X POST http://localhost:5000/api/venues -H "Content-Type: application/json" -d '{"title":"Test"}'
```
Returns: `401 Unauthorized` (`"Access denied. Please log in first."`).

If logged in as a **regular user** (`role: "user"`):
Returns: `403 Forbidden` (`"Forbidden. Only venue owners can add venues."`).
