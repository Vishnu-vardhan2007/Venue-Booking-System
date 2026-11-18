(function (global) {
  'use strict';

  class VenueVerseError extends Error {
    #code;
    constructor(message, code = 'VENUEVERSE_ERROR') {
      super(message);
      this.name = this.constructor.name;
      this.#code = code;
    }
    get code() { return this.#code; }
    getDiagnosticSummary() { return `[${this.#code}] ${this.message}`; }
  }

  class BookingValidationError extends VenueVerseError {
    constructor(message, code = 'BOOKING_VALIDATION_ERROR') { super(message, code); }
    getDiagnosticSummary() { return `Validation Failure (${this.code}): ${this.message}`; }
  }

  class CapacityExceededError extends BookingValidationError {
    #requestedGuests;
    #maxCapacity;
    constructor(requestedGuests, maxCapacity) {
      super(`Limit exceeded: ${requestedGuests} guests exceeds max capacity of ${maxCapacity}.`, 'CAPACITY_EXCEEDED');
      this.#requestedGuests = requestedGuests;
      this.#maxCapacity = maxCapacity;
    }
    get requestedGuests() { return this.#requestedGuests; }
    get maxCapacity() { return this.#maxCapacity; }
    getDiagnosticSummary() { return `Capacity Limit (${this.#requestedGuests}/${this.#maxCapacity}): ${this.message}`; }
  }

  class DateUnavailableError extends VenueVerseError {
    #dateStr;
    constructor(message, dateStr = '') {
      super(message, 'DATE_UNAVAILABLE');
      this.#dateStr = dateStr;
    }
    get dateStr() { return this.#dateStr; }
    getDiagnosticSummary() { return `Date Conflict [${this.#dateStr || 'N/A'}]: ${this.message}`; }
  }

  class User {
    static PLATFORM_NAME = 'VenueVerse';
    static totalUsersCreated = 0;

    #id;
    #name;
    #email;
    #role;

    constructor(id, name, email, role = 'User') {
      if (!id || !name || !email) {
        throw new BookingValidationError('User requires id, name, and email.', 'USER_INVALID_INPUT');
      }
      this.#id = id;
      this.#name = name;
      this.#email = email;
      this.#role = role;
      User.totalUsersCreated += 1;
    }

    static getTotalUsersCreated() { return User.totalUsersCreated; }
    static isValidEmail(email) { return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()); }

    get id() { return this.#id; }
    get name() { return this.#name; }
    get email() { return this.#email; }
    get role() { return this.#role; }

    getProfile() {
      return { id: this.#id, name: this.#name, email: this.#email, role: this.#role };
    }
  }

  class Customer extends User {
    #phone;
    constructor(id, name, email, phone = '') {
      super(id, name, email, 'Customer');
      this.#phone = phone;
    }
    get phone() { return this.#phone; }
    getProfile() { return { ...super.getProfile(), phone: this.#phone }; }
  }

  class Admin extends User {
    #adminLevel;
    constructor(id, name, email, adminLevel = 'SuperAdmin') {
      super(id, name, email, 'Admin');
      this.#adminLevel = adminLevel;
    }
    get adminLevel() { return this.#adminLevel; }
    getProfile() { return { ...super.getProfile(), adminLevel: this.#adminLevel }; }
    canManageVenues() { return true; }
    canCancelAnyBooking() { return true; }
  }

  class Venue {
    static totalVenuesCreated = 0;
    static BOOKING_TYPES = Object.freeze({ DIRECT: 'direct' });
    static PLATFORM_POLICY = Object.freeze({ maxGuestsLimit: 50000, currency: 'INR', bookingMode: 'direct' });

    static PriceBreakdown = class PriceBreakdown {
      #dailyRate;
      #days;
      #discountPercent;
      #totalAmount;

      constructor(dailyRate, days = 1, discountPercent = 0) {
        this.#dailyRate = Math.max(0, Number(dailyRate) || 0);
        this.#days = Math.max(1, Number(days) || 1);
        this.#discountPercent = Math.max(0, Math.min(50, Number(discountPercent) || 0));
        this.#totalAmount = Math.round(this.#dailyRate * this.#days * (1 - this.#discountPercent / 100));
        Object.freeze(this);
      }

      get dailyRate() { return this.#dailyRate; }
      get days() { return this.#days; }
      get discountPercent() { return this.#discountPercent; }
      get totalAmount() { return this.#totalAmount; }

      valueOf() { return this.#totalAmount; }
      toString() { return `₹${this.#totalAmount.toLocaleString('en-IN')} (${this.#days} day(s))`; }
    };

    static getTotalVenuesCreated() { return Venue.totalVenuesCreated; }
    static compareByPrice(a, b) { return (a ? a.basePrice : 0) - (b ? b.basePrice : 0); }
    static fromRaw(data) { return createVenueInstance(data || {}); }
    static normalizeCategories(rawCategories, rawCategory) {
      const list = [];
      const pushTokens = (val) => {
        if (!val) return;
        String(val).split(',').forEach(part => {
          const clean = part.trim().toLowerCase();
          if (clean && !list.includes(clean)) list.push(clean);
        });
      };
      if (Array.isArray(rawCategories)) {
        rawCategories.forEach(pushTokens);
      } else if (typeof rawCategories === 'string') {
        pushTokens(rawCategories);
      }
      if (list.length === 0 && rawCategory) {
        pushTokens(rawCategory);
      }
      return list.length > 0 ? list : ['wedding'];
    }

    #id;
    #basePrice;
    #capacity;
    #bookedDates;

    constructor(data = {}) {
      this.#id = data.id || data._id || '';
      this.#basePrice = Number(data.price ?? data.basePrice) || 0;
      this.#capacity = Number(data.capacity) || 0;
      this.#bookedDates = new Set(Array.isArray(data.bookedDates) ? data.bookedDates : []);

      this.title = data.title || 'Untitled Venue';
      this.categories = Venue.normalizeCategories(data.categories, data.category);
      this.category = this.categories[0] || 'wedding';
      this.location = data.location || '';
      this.rating = Number.isFinite(Number(data.rating)) ? Number(data.rating) : 0;
      this.reviewsCount = Number(data.reviewsCount) || 0;
      this.image = data.image || 'assets/venue-ballroom.jpg';
      this.gallery = Array.isArray(data.gallery) && data.gallery.length ? [...data.gallery] : [this.image];
      this.amenities = Array.isArray(data.amenities) ? [...data.amenities] : [];
      this.description = data.description || '';
      this.lat = data.lat ?? 23.0;
      this.lng = data.lng ?? 72.5;
      this.host = data.host ? String(data.host) : '';
      this.hostName = data.hostName || 'Verified Host';
      if (data.locationDisplay) this.locationDisplay = data.locationDisplay;
      if (data.priceLabel) this.priceLabel = data.priceLabel;
      if (data.priceDisplay) this.priceDisplay = data.priceDisplay;
      if (data.capacityText) this.capacityText = data.capacityText;
      if (data.typeText) this.typeText = data.typeText;
      this.isActive = data.isActive !== false;
      this.status = data.status || 'approved';

      Venue.totalVenuesCreated += 1;
    }

    get id() { return this.#id; }
    get basePrice() { return this.#basePrice; }
    get price() { return this.#basePrice; }
    get capacity() { return this.#capacity; }

    checkAvailability(dateStr) {
      if (!dateStr) return true;
      const key = String(dateStr).substring(0, 10);
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      return key >= today && !this.#bookedDates.has(key);
    }

    bookDate(dateStr) {
      if (!dateStr) return false;
      if (this.#bookedDates.has(dateStr)) {
        throw new DateUnavailableError(`Venue "${this.title}" is already booked on ${dateStr}.`, dateStr);
      }
      this.#bookedDates.add(dateStr);
      return true;
    }

    releaseDate(dateStr) {
      return Boolean(dateStr && this.#bookedDates.delete(dateStr));
    }

    calculateQuote(...args) {
      if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
        const { days = 1, guests = 0, discountPercent = 0 } = args[0];
        if (this.#capacity > 0 && guests > this.#capacity) throw new CapacityExceededError(guests, this.#capacity);
        return new Venue.PriceBreakdown(this.#basePrice, days, discountPercent);
      }
      const days = Math.max(1, Number(args[0]) || 1);
      const guests = args.length >= 2 ? (Number(args[1]) || 0) : 0;
      if (this.#capacity > 0 && guests > this.#capacity) throw new CapacityExceededError(guests, this.#capacity);
      return this.calculateTotalPrice(days, guests);
    }

    calculateTotalPrice(days = 1) {
      return this.#basePrice * Math.max(1, Number(days) || 1);
    }

    supportsCategory(targetCategory) {
      if (!targetCategory) return false;
      const target = String(targetCategory).trim().toLowerCase();
      return this.categories.includes(target);
    }

    getCategoryDetails() {
      return { categoryBadge: 'General Venue', specialFeatures: ['Standard Venue Setup', 'Electricity Backup'] };
    }

    toViewModel() {
      return {
        id: this.#id, title: this.title, category: this.category, categories: [...this.categories], location: this.location,
        price: this.#basePrice, capacity: this.#capacity, rating: this.rating,
        reviewsCount: this.reviewsCount, image: this.image, amenities: this.amenities,
        categoryDetails: this.getCategoryDetails()
      };
    }
  }

  class WeddingVenue extends Venue {
    getCategoryDetails() {
      return { categoryBadge: 'Wedding & Reception', specialFeatures: ['Air-Conditioned Bridal Suite', 'Vedic Mandap / Altar Lawn', 'Baraat Entrance'] };
    }
  }

  class BirthdayVenue extends Venue {
    getCategoryDetails() {
      return { categoryBadge: 'Birthday Celebration', specialFeatures: ['Acoustic Sound Setup', 'Neon Party Lighting & DJ Booth', 'Cake & Backdrop Stage'] };
    }
  }

  class ConferenceVenue extends Venue {
    getCategoryDetails() {
      return { categoryBadge: 'Corporate Conference', specialFeatures: ['4K Projector & Smart Screen', 'Gigabit Fiber Wi-Fi', 'Wireless Podium Mics'] };
    }
  }

  class PhotoshootVenue extends Venue {
    getCategoryDetails() {
      return { categoryBadge: 'Studio & Photoshoot', specialFeatures: ['Natural Diffused Lighting', 'C-Stands & Softbox Mounts', 'Green Room & Mirrors'] };
    }
  }

  function createVenueInstance(data = {}) {
    const cats = Venue.normalizeCategories(data.categories, data.category);
    const cat = cats[0] || '';
    if (['wedding', 'reception', 'engagement'].includes(cat)) return new WeddingVenue(data);
    if (['birthday', 'party'].includes(cat)) return new BirthdayVenue(data);
    if (['conference', 'corporate'].includes(cat)) return new ConferenceVenue(data);
    if (cat === 'photoshoot') return new PhotoshootVenue(data);
    return new Venue(data);
  }

  class Booking {
    static totalBookingsCreated = 0;
    static STATUSES = Object.freeze({ CONFIRMED: 'CONFIRMED', CANCELLED: 'CANCELLED', PENDING: 'PENDING' });

    static CancellationPolicy = class CancellationPolicy {
      static calculateRefund(totalAmount, daysBeforeEvent) {
        const amount = Math.max(0, Number(totalAmount) || 0);
        if (daysBeforeEvent >= 7) return amount;
        if (daysBeforeEvent >= 2) return Math.round(amount * 0.5);
        return 0;
      }
    };

    static getTotalBookingsCreated() { return Booking.totalBookingsCreated; }

    #bookingId;
    #venue;
    #customer;
    #bookingDate;
    #guestsCount;
    #days;
    #totalAmount;
    #status;
    #note;
    #createdAt;

    constructor(bookingId, venue, customer, bookingDate, guestsCount = 50, days = 1) {
      if (!bookingId) throw new BookingValidationError('Booking ID is required.', 'BOOKING_ID_REQUIRED');
      if (!(venue instanceof Venue)) throw new BookingValidationError('Invalid Venue instance.', 'INVALID_VENUE');
      if (!(customer instanceof User)) throw new BookingValidationError('Invalid User instance.', 'INVALID_CUSTOMER');
      if (!bookingDate) throw new BookingValidationError('Booking date is required.', 'BOOKING_DATE_REQUIRED');

      const guests = Math.max(1, Number(guestsCount) || 1);
      if (venue.capacity > 0 && guests > venue.capacity) throw new CapacityExceededError(guests, venue.capacity);

      this.#bookingId = bookingId;
      this.#venue = venue;
      this.#customer = customer;
      this.#bookingDate = bookingDate;
      this.#guestsCount = guests;
      this.#days = Math.max(1, Number(days) || 1);
      this.#status = Booking.STATUSES.CONFIRMED;
      this.#note = '';
      this.#createdAt = new Date().toISOString();
      this.#totalAmount = Math.round(this.#venue.calculateTotalPrice(this.#days, guests));

      this.#venue.bookDate(this.#bookingDate);
      Booking.totalBookingsCreated += 1;
    }

    get bookingId() { return this.#bookingId; }
    get venue() { return this.#venue; }
    get customer() { return this.#customer; }
    get bookingDate() { return this.#bookingDate; }
    get guestsCount() { return this.#guestsCount; }
    get days() { return this.#days; }
    get totalAmount() { return this.#totalAmount; }
    get status() { return this.#status; }
    get note() { return this.#note; }
    get createdAt() { return this.#createdAt; }

    withNote(note) {
      this.#note = String(note || '').trim();
      return this;
    }

    cancel() {
      if (this.#status === Booking.STATUSES.CANCELLED) return false;
      this.#status = Booking.STATUSES.CANCELLED;
      this.#venue.releaseDate(this.#bookingDate);
      return true;
    }

    getSummary() {
      return {
        bookingId: this.#bookingId, venueTitle: this.#venue.title, venueCategory: this.#venue.category,
        location: this.#venue.location, customerName: this.#customer.name, customerEmail: this.#customer.email,
        date: this.#bookingDate, guests: this.#guestsCount, days: this.#days,
        totalAmount: this.#totalAmount, status: this.#status, createdAt: this.#createdAt
      };
    }
  }

  Object.defineProperty(Venue, 'BOOKING_TYPES', { writable: false, configurable: false });
  Object.defineProperty(Venue, 'PLATFORM_POLICY', { writable: false, configurable: false });
  Object.defineProperty(Booking, 'STATUSES', { writable: false, configurable: false });

  global.VenueVerseOOP = {
    VenueVerseError, BookingValidationError, CapacityExceededError, DateUnavailableError,
    User, Customer, Admin,
    Venue, WeddingVenue, BirthdayVenue, ConferenceVenue, PhotoshootVenue, createVenueInstance,
    Booking
  };
})(typeof window !== 'undefined' ? window : globalThis);
