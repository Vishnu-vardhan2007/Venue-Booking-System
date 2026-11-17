(function (global) {
  'use strict';

  const {
    VenueVerseError,
    BookingValidationError,
    CapacityExceededError,
    DateUnavailableError,
    Customer,
    Admin,
    Booking
  } = global.VenueVerseOOP || {};

  const ValidationErr = BookingValidationError || Error;
  const UnavailableErr = DateUnavailableError || Error;

  class VenueSearchService {
    static DEFAULT_STORAGE_KEY = 'venueverse_host_venues';
    static normalizeDateKey(dateStr) { return dateStr ? String(dateStr).trim().substring(0, 10) : ''; }

    #venues = [];

    constructor(venues = []) {
      this.#venues = Array.isArray(venues) ? [...venues] : [];
      try { localStorage.removeItem(VenueSearchService.DEFAULT_STORAGE_KEY); } catch (e) {}
    }

    addVenue(venue) {
      if (!venue || typeof venue.calculateTotalPrice !== 'function') {
        throw new ValidationErr('Invalid venue instance.');
      }
      this.#venues.unshift(venue);
      return true;
    }

    setVenues(venues) { this.#venues = Array.isArray(venues) ? [...venues] : []; }
    getAllVenues() { return [...this.#venues]; }
    getVenueById(id) { return this.#venues.find(v => v.id === id) || null; }

    search(...args) {
      if (args.length === 1 && typeof args[0] === 'string') {
        const q = args[0].trim().toLowerCase();
        if (!q) return this.getAllVenues();
        return this.#venues.filter(v =>
          v.title.toLowerCase().includes(q) ||
          v.location.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q)
        );
      }

      if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
        const [category, location] = args;
        return this.#venues.filter(v => {
          const cats = (Array.isArray(v.categories) && v.categories.length) ? v.categories : [v.category || ''];
          const catMatch = !category || category === 'all' || cats.some(c => String(c || '').toLowerCase() === category.toLowerCase());
          const locMatch = !location || location === 'Everywhere' || v.location.toLowerCase().includes(location.toLowerCase());
          return catMatch && locMatch;
        });
      }

      if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
        const { category = 'all', location = 'Everywhere', maxPrice = Infinity, minCapacity = 0, sortBy = 'recommended', date = null } = args[0];
        const filtered = this.#venues.filter(v => {
          if (category && category !== 'all') {
            const tc = category.toLowerCase();
            const cats = (Array.isArray(v.categories) && v.categories.length) ? v.categories : [v.category || ''];
            const match = cats.some(rawCat => {
              const vc = String(rawCat || '').toLowerCase();
              return vc === tc ||
                (tc === 'wedding' && (vc.includes('banquet') || vc.includes('heritage'))) ||
                (tc === 'party' && vc.includes('rooftop')) ||
                (tc === 'conference' && vc.includes('convention')) ||
                (tc === 'corporate' && vc.includes('conference'));
            });
            if (!match) return false;
          }
          if (location && location !== 'Everywhere' && !(v.location || '').toLowerCase().includes(location.toLowerCase())) return false;
          if (v.basePrice > maxPrice || v.capacity < minCapacity) return false;
          if (date && !v.checkAvailability(date)) return false;
          return true;
        });
        return this.#sort(filtered, sortBy);
      }

      return this.getAllVenues();
    }

    #sort(list, sortBy) {
      const copy = [...list];
      if (sortBy === 'price-asc' || sortBy === 'price-low') return copy.sort((a, b) => a.basePrice - b.basePrice);
      if (sortBy === 'price-desc' || sortBy === 'price-high') return copy.sort((a, b) => b.basePrice - a.basePrice);
      if (sortBy === 'rating') return copy.sort((a, b) => b.rating - a.rating);
      if (sortBy === 'capacity' || sortBy === 'capacity-high') return copy.sort((a, b) => b.capacity - a.capacity);
      return copy;
    }
  }

  class BookingService {
    #bookings = [];
    #currentUser;
    #currentAdmin;
    #searchService;
    #storageKey = 'venueverse_oop_bookings';
    #lastAuditStatus = 'IDLE';

    constructor(venueSearchService) {
      this.#searchService = venueSearchService;
      this.#currentUser = this.#readSessionUser();
      this.#currentAdmin = new Admin('adm_001', 'Administrator', 'admin@venueverse.com');
      try { localStorage.removeItem(this.#storageKey); } catch (e) {}
    }

    #readSessionUser() {
      try {
        const raw = sessionStorage.getItem('venueverse_user') || localStorage.getItem('venueverse_user');
        if (raw) {
          const u = JSON.parse(raw);
          if (u && (u.name || u.email)) {
            return new Customer(u._id || u.id || 'cust_active', u.name || 'User', u.email || '', u.phone || '');
          }
        }
      } catch (e) {}
      return new Customer('cust_guest', 'Guest User', 'guest@venueverse.com', '');
    }

    get currentUser() { return this.#readSessionUser(); }
    get currentAdmin() { return this.#currentAdmin; }
    get lastAuditStatus() { return this.#lastAuditStatus; }

    createBooking({ venueId, bookingDate, guests = 50, days = 1 }) {
      const venue = this.#searchService.getVenueById(venueId);
      if (!venue) throw new ValidationErr(`Venue "${venueId}" not found.`, 'VENUE_NOT_FOUND');

      const dateKey = VenueSearchService.normalizeDateKey(bookingDate) || bookingDate;
      if (!venue.checkAvailability(dateKey)) {
        throw new UnavailableErr(`"${venue.title}" is unavailable on ${bookingDate}.`, dateKey);
      }

      const bookingId = 'BK-' + Date.now().toString(36).toUpperCase();
      const booking = new Booking(bookingId, venue, this.currentUser, dateKey, guests, days);
      this.#bookings.push(booking);
      this.#saveBookings();
      return booking;
    }

    safeCreateBooking(request) {
      let status = 'PENDING';
      try {
        const booking = this.createBooking(request);
        status = 'SUCCEEDED';
        return { success: true, booking, status };
      } catch (err) {
        if (CapacityExceededError && err instanceof CapacityExceededError) {
          status = 'FAILED_CAPACITY';
          return { success: false, errorType: 'CapacityExceededError', diagnostic: err.getDiagnosticSummary(), message: err.message };
        }
        if (BookingValidationError && err instanceof BookingValidationError) {
          status = 'FAILED_VALIDATION';
          return { success: false, errorType: 'BookingValidationError', diagnostic: err.getDiagnosticSummary(), message: err.message };
        }
        if (DateUnavailableError && err instanceof DateUnavailableError) {
          status = 'FAILED_AVAILABILITY';
          return { success: false, errorType: 'DateUnavailableError', diagnostic: err.getDiagnosticSummary(), message: err.message };
        }
        if (VenueVerseError && err instanceof VenueVerseError) {
          status = 'FAILED_DOMAIN';
          return { success: false, errorType: 'VenueVerseError', diagnostic: err.getDiagnosticSummary(), message: err.message };
        }
        status = 'FAILED_UNEXPECTED';
        throw err;
      } finally {
        this.#lastAuditStatus = `${status}@${new Date().toISOString()}`;
      }
    }

    cancelBooking(bookingId) {
      const booking = this.#bookings.find(b => b.bookingId === bookingId);
      if (!booking) throw new ValidationErr(`Booking ${bookingId} not found.`, 'BOOKING_NOT_FOUND');
      const ok = booking.cancel();
      if (ok) this.#saveBookings();
      return ok;
    }

    getAllBookings() { return [...this.#bookings]; }
    getCustomerBookings() { return this.#bookings.filter(b => b.customer.id === this.#currentUser.id); }
    isVenueAvailable(venueId, dateStr) {
      const venue = this.#searchService.getVenueById(venueId);
      return venue ? venue.checkAvailability(dateStr) : false;
    }

    #saveBookings() {
      try {
        const list = this.#bookings.map(b => ({
          bookingId: b.bookingId, venueId: b.venue.id, date: b.bookingDate,
          guests: b.guestsCount, days: b.days, status: b.status, totalAmount: b.totalAmount
        }));
        localStorage.setItem(this.#storageKey, JSON.stringify(list));
      } catch (e) {}
    }
  }

  global.VenueVerseOOP = { ...(global.VenueVerseOOP || {}), VenueSearchService, BookingService };

  const CATEGORIES_DATA = {
    all: {
      id: 'all', name: 'All Venues', title: 'All Event Venues',
      subtitle: 'Discover verified banquet halls, rooftops, lawns, studios, and corporate venues.',
      iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
      badgeColor: '#2563eb', badgeBg: '#eff6ff', bannerImg: 'assets/hero-venue.jpg'
    },
    wedding: {
      id: 'wedding', name: 'Wedding', title: 'Wedding Venues',
      subtitle: 'Grand palaces, banquets, and picturesque lawns for your special day.',
      iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
      badgeColor: '#f01080ff', badgeBg: '#fdf2f8', bannerImg: 'assets/cat-wedding.jpg'
    },
    birthday: {
      id: 'birthday', name: 'Birthday', title: 'Birthday Venues',
      subtitle: 'Celebrate with the people you love.',
      iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><line x1="12" y1="7" x2="12" y2="11"/></svg>`,
      badgeColor: '#f59e0b', badgeBg: '#fffbeb', bannerImg: 'assets/cat-birthday.jpg'
    },
    conference: {
      id: 'conference', name: 'Conference', title: 'Conference & Meeting Venues',
      subtitle: 'Professional spaces for bigger ideas, team offsites, and keynote summits.',
      iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      badgeColor: '#3b82f6', badgeBg: '#eff6ff', bannerImg: 'assets/cat-conference.jpg'
    },
    photoshoot: {
      id: 'photoshoot', name: 'Photoshoot', title: 'Photoshoot & Studio Spaces',
      subtitle: 'Picture perfect locations with natural light, high ceilings, and creative aesthetics.',
      iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
      badgeColor: '#8b5cf6', badgeBg: '#f5f3ff', bannerImg: 'assets/cat-photoshoot.jpg'
    },
    engagement: {
      id: 'engagement', name: 'Engagement', title: 'Engagement & Roka Venues',
      subtitle: 'Intimate banquet halls and romantic garden lawns to celebrate your new beginning.',
      iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
      badgeColor: '#f43f5e', badgeBg: '#fff1f2', bannerImg: 'assets/venue-ballroom.jpg'
    },
    party: {
      id: 'party', name: 'Party', title: 'Party & Celebration Venues',
      subtitle: 'Energetic lounges, rooftop terraces, and villa estates with pool decks.',
      iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
      badgeColor: '#06b6d4', badgeBg: '#ecfeff', bannerImg: 'assets/venue-skyline.jpg'
    },
    reception: {
      id: 'reception', name: 'Reception', title: 'Reception Venues',
      subtitle: 'Elegant ballrooms with grand chandeliers and banquet seating for royal hospitality.',
      iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`,
      badgeColor: '#10b981', badgeBg: '#ecfdf5', bannerImg: 'assets/venue-dining.jpg'
    },
    corporate: {
      id: 'corporate', name: 'Corporate Event', title: 'Corporate Event Spaces',
      subtitle: 'From annual galas to tech hackathons and product launches with first-class infrastructure.',
      iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/></svg>`,
      badgeColor: '#6366f1', badgeBg: '#eef2ff', bannerImg: 'assets/venue-glasshouse.jpg'
    }
  };

  const CITIES_DATA = ['Everywhere', 'Gandhinagar', 'Ahmedabad', 'Rajkot', 'Surat', 'Vadodara'];

  if (typeof global.location !== 'undefined' && global.location.pathname) {
    const path = global.location.pathname.replace(/\\/g, '/');
    if (/\/(venues|venue-details|checkout|owner-dashboard|admin-dashboard|signin)\//.test(path)) {
      Object.values(CATEGORIES_DATA).forEach(c => {
        if (c.bannerImg && !c.bannerImg.startsWith('../') && !c.bannerImg.startsWith('http')) {
          c.bannerImg = '../' + c.bannerImg;
        }
      });
    }
  }

  global.CATEGORIES_DATA = CATEGORIES_DATA;
  global.CITIES_DATA = CITIES_DATA;
  global.venueSearchService = new VenueSearchService([]);
  global.bookingService = new BookingService(global.venueSearchService);
})(typeof window !== 'undefined' ? window : globalThis);
