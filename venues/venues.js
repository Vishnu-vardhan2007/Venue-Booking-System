document.addEventListener('DOMContentLoaded', function () {

  const urlParams = new URLSearchParams(window.location.search);
  const rawCatParam = (urlParams.get('category') || '').toLowerCase();
  const initialCategory = (rawCatParam && CATEGORIES_DATA[rawCatParam]) ? rawCatParam : 'all';
  const initialLocationParam = (urlParams.get('location') || '').trim();
  const initialGuestsParam = parseInt(urlParams.get('guests') || '0', 10) || 0;
  const initialDateParam = (urlParams.get('date') || '').trim();

  const API_BASE = (window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:5000' : 'http://localhost:5000';

  const appState = {
    category: initialCategory,
    location: initialLocationParam && !initialLocationParam.toLowerCase().includes('current') ? initialLocationParam : 'Everywhere',
    maxPrice: 500000,
    minCapacity: initialGuestsParam,
    date: initialDateParam || null,
    sortBy: 'recommended',
    venues: [],
    filteredVenues: []
  };

  function getFallbackCoords(city) {
    const c = (city || '').toLowerCase();
    if (c.includes('gandhinagar')) return { lat: 23.2156, lng: 72.6369 };
    if (c.includes('surat')) return { lat: 21.1702, lng: 72.8311 };
    if (c.includes('rajkot')) return { lat: 22.3039, lng: 70.8022 };
    if (c.includes('vadodara')) return { lat: 22.3072, lng: 73.1812 };
    return { lat: 23.0225, lng: 72.5714 };
  }

  async function loadVenuesFromBackend() {
    try {
      const resp = await fetch(`${API_BASE}/api/venues`);
      if (!resp.ok) {
        throw new Error(`HTTP error ${resp.status}`);
      }
      const data = await resp.json();
      const venuesList = Array.isArray(data) ? data : (data && data.venues ? data.venues : []);

      const mapped = venuesList.map(function (v) {
        const id = v.id || v._id;
        const price = v.pricePerDay || v.price || 0;
        const capacity = v.capacity || 0;
        const city = v.city || v.location || 'Gujarat';
        let img = (v.images && v.images.length > 0) ? v.images[0] : (v.image || '../assets/venue-ballroom.jpg');
        if (img && !img.startsWith('../') && !img.startsWith('http') && !img.startsWith('data:')) {
          img = '../' + img;
        }
        const fallbackCoords = getFallbackCoords(city);

        const categoriesList = (Array.isArray(v.categories) && v.categories.length > 0)
          ? v.categories.map(c => String(c || '').trim().toLowerCase()).filter(Boolean)
          : [String(v.category || 'wedding').trim().toLowerCase()];

        const rawItem = {
          id: id,
          _id: id,
          title: v.title,
          description: v.description,
          category: categoriesList[0] || 'wedding',
          categories: categoriesList,
          location: city,
          locationDisplay: `${v.title} in ${city}`,
          price: price,
          priceLabel: `₹${(price / 1000).toFixed(1)}k`,
          priceDisplay: `₹${price.toLocaleString('en-IN')} / day`,
          capacity: capacity,
          capacityText: `Up to ${capacity} guests`,
          typeText: 'Instant Booking',
          rating: (typeof v.rating === 'number' && !isNaN(v.rating)) ? v.rating : 0,
          reviewsCount: (typeof v.reviewsCount === 'number' && !isNaN(v.reviewsCount)) ? v.reviewsCount : 0,
          image: img,
          gallery: (v.images && v.images.length) ? v.images.map(i => (!i.startsWith('../') && !i.startsWith('http') && !i.startsWith('data:')) ? '../' + i : i) : [img],
          amenities: v.amenities || ['Power Backup', 'Air Conditioning', 'Parking'],
          host: (v.host && typeof v.host === 'object') ? (v.host._id || v.host.id || v.host.$oid || '') : String(v.host || ''),
          hostName: v.hostName || 'Verified Host',
          bookedDates: Array.isArray(v.bookedDates) ? v.bookedDates : [],
          lat: v.lat || fallbackCoords.lat,
          lng: v.lng || fallbackCoords.lng,
          isActive: v.isActive !== false,
          status: v.status || 'approved'
        };

        if (window.VenueVerseOOP && typeof window.VenueVerseOOP.createVenueInstance === 'function') {
          return window.VenueVerseOOP.createVenueInstance(rawItem);
        }
        return rawItem;
      });

      appState.venues = mapped;
      if (window.VenueVerseOOP && typeof window.VenueVerseOOP.VenueSearchService === 'function') {
        window.venueSearchService = new window.VenueVerseOOP.VenueSearchService(mapped);
      }
      filterAndRenderVenues();
    } catch (err) {
      console.error('Failed to load real venues from backend:', err);
      appState.venues = [];
      if (venuesCardsGrid) {
        venuesCardsGrid.style.display = 'none';
      }
      if (emptyVenuesState) {
        emptyVenuesState.style.display = 'flex';
        const emptyTitle = emptyVenuesState.querySelector('h3');
        const emptyDesc = emptyVenuesState.querySelector('p');
        if (emptyTitle) emptyTitle.textContent = 'Backend Service Unavailable';
        if (emptyDesc) emptyDesc.textContent = 'Could not load venues from the Java backend at ' + API_BASE + '. Please verify the backend server is running on port 5000.';
      }
    }
  }

  const categoryHeroBg = document.getElementById('categoryHeroBg');
  const crumbCategoryName = document.getElementById('crumbCategoryName');
  const categoryIconBubble = document.getElementById('categoryIconBubble');
  const categoryHeroTitle = document.getElementById('categoryHeroTitle');
  const categoryHeroSubtitle = document.getElementById('categoryHeroSubtitle');
  const categoryTabsTrack = document.getElementById('categoryTabsTrack');

  const currentLocationLabel = document.getElementById('currentLocationLabel');
  const currentLocationSub = document.getElementById('currentLocationSub');
  const changeLocationBtn = document.getElementById('changeLocationBtn');

  const priceRangeSlider = document.getElementById('priceRangeSlider');
  const priceCurrentVal = document.getElementById('priceCurrentVal');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const emptyResetBtn = document.getElementById('emptyResetBtn');

  const venuesCardsGrid = document.getElementById('venuesCardsGrid');
  const venueCountNumber = document.getElementById('venueCountNumber');
  const venueCountCategory = document.getElementById('venueCountCategory');
  const sortDropdown = document.getElementById('sortDropdown');
  const emptyVenuesState = document.getElementById('emptyVenuesState');

  const locationModal = document.getElementById('locationModal');
  const closeLocationModal = document.getElementById('closeLocationModal');
  const citiesSelectGrid = document.getElementById('citiesSelectGrid');

  const venueDetailsModal = document.getElementById('venueDetailsModal');
  const closeVenueModal = document.getElementById('closeVenueModal');
  const modalVenueTitle = document.getElementById('modalVenueTitle');
  const modalVenueLocation = document.getElementById('modalVenueLocation');
  const modalVenueImg = document.getElementById('modalVenueImg');
  const modalVenueCapacity = document.getElementById('modalVenueCapacity');
  const modalVenueRating = document.getElementById('modalVenueRating');
  const modalVenueDesc = document.getElementById('modalVenueDesc');
  const modalVenueAmenities = document.getElementById('modalVenueAmenities');
  const modalVenuePrice = document.getElementById('modalVenuePrice');
  const modalBookNowBtn = document.getElementById('modalBookNowBtn');

  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', function () {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('is-open');
    });
  }

  let mapInstance = null;
  let mapMarkers = [];

  function initLeafletMap() {
    const mapContainer = document.getElementById('venuesMap');
    if (!mapContainer || typeof L === 'undefined') return;

    mapInstance = L.map('venuesMap', {
      zoomControl: true,
      scrollWheelZoom: false
    }).setView([22.8, 71.8], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);
  }

  initLeafletMap();

  function renderCategoryHeader() {
    const catData = CATEGORIES_DATA[appState.category];
    if (!catData) return;

    crumbCategoryName.textContent = catData.name;
    categoryHeroTitle.textContent = catData.title;
    categoryHeroSubtitle.textContent = catData.subtitle;

    categoryIconBubble.innerHTML = catData.iconSvg;
    categoryIconBubble.style.backgroundColor = catData.badgeBg;
    const svgIcon = categoryIconBubble.querySelector('svg');
    if (svgIcon) svgIcon.style.stroke = catData.badgeColor;

    if (categoryHeroBg) {
      categoryHeroBg.style.backgroundImage = `url('${catData.bannerImg}')`;
    }

    venueCountCategory.textContent = catData.name;
  }

  function renderCategoryTabs() {
    if (!categoryTabsTrack) return;
    categoryTabsTrack.innerHTML = '';

    Object.keys(CATEGORIES_DATA).forEach(function (catKey) {
      const cat = CATEGORIES_DATA[catKey];
      const tabBtn = document.createElement('button');
      tabBtn.type = 'button';
      tabBtn.className = 'category-tab-btn' + (catKey === appState.category ? ' active' : '');
      tabBtn.setAttribute('data-category', catKey);

      tabBtn.innerHTML = `${cat.iconSvg}<span>${cat.name}</span>`;

      if (catKey === appState.category) {
        tabBtn.style.backgroundColor = cat.badgeColor;
        tabBtn.style.borderColor = cat.badgeColor;
      }

      tabBtn.addEventListener('click', function () {
        if (appState.category === catKey) return;

        appState.category = catKey;

        const newUrl = `${window.location.pathname}?category=${catKey}`;
        window.history.pushState({ category: catKey }, '', newUrl);

        renderCategoryHeader();
        renderCategoryTabs();

        filterAndRenderVenues();
      });

      categoryTabsTrack.appendChild(tabBtn);
    });
  }

  function filterAndRenderVenues() {
    let list = [];

    const effectiveMaxPrice = appState.maxPrice >= 500000 ? Infinity : appState.maxPrice;

    if (window.venueSearchService) {
      list = window.venueSearchService.search({
        category: appState.category,
        location: appState.location,
        maxPrice: effectiveMaxPrice,
        minCapacity: appState.minCapacity,
        date: appState.date,
        sortBy: appState.sortBy
      });
    } else {
      list = appState.venues.filter(function (v) {
        if (appState.category === 'all') return true;
        const cats = (Array.isArray(v.categories) && v.categories.length) ? v.categories : [v.category];
        return cats.includes(appState.category);
      });
      if (appState.location !== 'Everywhere') {
        list = list.filter(function (v) {
          return (v.location || '').toLowerCase().includes(appState.location.toLowerCase());
        });
      }
      list = list.filter(function (v) {
        return (v.basePrice || v.price || 0) <= effectiveMaxPrice;
      });
      if (appState.minCapacity > 0) {
        list = list.filter(function (v) {
          return v.capacity >= appState.minCapacity;
        });
      }
    }

    appState.filteredVenues = list;

    if (venueCountNumber) venueCountNumber.textContent = list.length;
    if (venueCountCategory && CATEGORIES_DATA[appState.category]) {
      venueCountCategory.textContent = appState.category === 'all' ? '' : CATEGORIES_DATA[appState.category].name;
    }

    renderVenueCards(list);
    updateMapMarkers(list);
  }

  function renderVenueCards(venues) {
    if (!venuesCardsGrid) return;
    venuesCardsGrid.innerHTML = '';

    if (venues.length === 0) {
      venuesCardsGrid.style.display = 'none';
      if (emptyVenuesState) {
        emptyVenuesState.style.display = 'flex';
        const emptyTitle = emptyVenuesState.querySelector('h3');
        const emptyDesc = emptyVenuesState.querySelector('p');
        const resetBtn = document.getElementById('emptyResetBtn');
        if (appState.venues.length === 0) {
          if (emptyTitle) emptyTitle.textContent = 'No Venues Added Yet';
          if (emptyDesc) emptyDesc.textContent = 'There are no venues listed right now. Once a venue owner adds a venue, it will appear here.';
          if (resetBtn) resetBtn.style.display = 'none';
        } else {
          if (emptyTitle) emptyTitle.textContent = 'No Venues Found';
          if (emptyDesc) emptyDesc.textContent = 'Try increasing your price slider, selecting "Any" capacity, or switching your location to "Everywhere".';
          if (resetBtn) resetBtn.style.display = '';
        }
      }
      return;
    }

    venuesCardsGrid.style.display = 'grid';
    if (emptyVenuesState) emptyVenuesState.style.display = 'none';

    venues.forEach(function (venue) {
      const card = document.createElement('article');
      card.className = 'feed-venue-card';
      card.setAttribute('data-id', venue.id);

      const amenitiesHtml = (venue.amenities || []).slice(0, 2).map(function (item) {
        return `<span class="amenity-chip">${item}</span>`;
      }).join('');
      const basePrice = venue.basePrice || venue.price || 0;
      const priceLabel = venue.priceLabel || `₹${(basePrice / 1000).toFixed(1)}k`;
      const priceDisplay = venue.priceDisplay || `₹${basePrice.toLocaleString('en-IN')} / day`;
      const capacityText = venue.capacityText || `Up to ${venue.capacity || 0} guests`;
      const locationDisplay = venue.locationDisplay || `${venue.title} in ${venue.location || 'Gujarat'}`;
      const venueCats = (Array.isArray(venue.categories) && venue.categories.length)
        ? venue.categories
        : [venue.category || 'event'];
      const catsLabel = venueCats.map(c => c === 'corporate' ? 'Corporate Event' : (String(c || '').charAt(0).toUpperCase() + String(c || '').slice(1))).join(' • ');

      card.innerHTML = `
        <div class="card-img-box">
          <img src="${venue.image}" alt="${venue.title}" class="card-venue-photo" loading="lazy">
          <span class="badge-available">● Available</span>
          <button type="button" class="btn-card-favorite" aria-label="Save to favorites">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </button>
        </div>
        <div class="card-content-box">
          <span class="card-location-text">${locationDisplay}</span>
          <h3 class="card-venue-title">${venue.title}</h3>
          <p class="card-specs-text">${capacityText} &bull; ${catsLabel}</p>
          <div class="card-amenities-pills">
            ${amenitiesHtml}
          </div>
          <div class="card-bottom-row">
            <span class="card-price-text">${priceDisplay}</span>
            <span class="card-rating-badge">${(Number(venue.rating) > 0 && Number(venue.reviewsCount || 0) > 0) ? `&#9733; ${Number(venue.rating).toFixed(1)} (${venue.reviewsCount})` : 'No rating'}</span>
          </div>
        </div>
      `;

      const favBtn = card.querySelector('.btn-card-favorite');
      if (favBtn) {
        favBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          favBtn.classList.toggle('is-liked');
        });
      }

      card.addEventListener('mouseenter', function () {
        highlightMapMarker(venue.id, true);
      });

      card.addEventListener('mouseleave', function () {
        highlightMapMarker(venue.id, false);
      });

      card.addEventListener('click', function () {
        window.location.href = `../venue-details/venue-details.html?id=${venue.id}`;
      });

      venuesCardsGrid.appendChild(card);
    });
  }

  function updateMapMarkers(venues) {
    if (!mapInstance || typeof L === 'undefined') return;

    mapMarkers.forEach(function (m) {
      mapInstance.removeLayer(m);
    });
    mapMarkers = [];

    if (venues.length === 0) return;

    const bounds = [];

    venues.forEach(function (venue) {
      if (!venue.lat || !venue.lng) return;

      bounds.push([venue.lat, venue.lng]);

      const basePrice = venue.basePrice || venue.price || 0;
      const priceLabel = venue.priceLabel || `₹${(basePrice / 1000).toFixed(1)}k`;
      const priceDisplay = venue.priceDisplay || `₹${basePrice.toLocaleString('en-IN')} / day`;

      const customPriceIcon = L.divIcon({
        className: 'custom-map-price-icon-wrap',
        html: `<div class="custom-map-price-badge" id="map-pin-${venue.id}">${priceLabel}</div>`,
        iconSize: [60, 28],
        iconAnchor: [30, 14]
      });

      const marker = L.marker([venue.lat, venue.lng], { icon: customPriceIcon });

      const popupHtml = `
        <a href="../venue-details/venue-details.html?id=${venue.id}" class="map-popup-card" style="text-decoration:none;color:inherit;display:block;">
          <img src="${venue.image}" alt="${venue.title}" class="map-popup-img">
          <div class="map-popup-body">
            <strong class="map-popup-title">${venue.title}</strong>
            <span class="map-popup-price">${priceDisplay}</span>
            <span style="font-size:0.75rem;color:var(--primary);font-weight:700;display:block;margin-top:4px;">View Venue Details &rarr;</span>
          </div>
        </a>
      `;

      marker.bindPopup(popupHtml, { offset: [0, -10] });

      marker.on('click', function () {
        const matchingCard = document.querySelector(`.feed-venue-card[data-id="${venue.id}"]`);
        if (matchingCard) {
          matchingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          matchingCard.classList.add('is-highlighted');
          setTimeout(function () {
            matchingCard.classList.remove('is-highlighted');
          }, 1800);
        }
      });

      marker.on('mouseover', function () {
        const matchingCard = document.querySelector(`.feed-venue-card[data-id="${venue.id}"]`);
        if (matchingCard) matchingCard.classList.add('is-highlighted');
      });

      marker.on('mouseout', function () {
        const matchingCard = document.querySelector(`.feed-venue-card[data-id="${venue.id}"]`);
        if (matchingCard) matchingCard.classList.remove('is-highlighted');
      });

      marker.venueId = venue.id;
      marker.addTo(mapInstance);
      mapMarkers.push(marker);
    });

    if (bounds.length > 0) {
      mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }

  function highlightMapMarker(venueId, isHighlighted) {
    const pin = document.getElementById(`map-pin-${venueId}`);
    if (pin) {
      if (isHighlighted) {
        pin.classList.add('active-marker');
      } else {
        pin.classList.remove('active-marker');
      }
    }
  }

  if (priceRangeSlider) {
    priceRangeSlider.addEventListener('input', function () {
      appState.maxPrice = parseInt(this.value, 10);
      priceCurrentVal.textContent = appState.maxPrice >= 500000
        ? 'Max: Any'
        : `Max: ₹${appState.maxPrice.toLocaleString('en-IN')}`;
      filterAndRenderVenues();
    });
  }

  const capacityRadios = document.querySelectorAll('input[name="capacityFilter"]');
  capacityRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (this.checked) {
        appState.minCapacity = this.value === 'any' ? 0 : parseInt(this.value, 10);
        filterAndRenderVenues();
      }
    });
  });

  if (sortDropdown) {
    sortDropdown.addEventListener('change', function () {
      appState.sortBy = this.value;
      filterAndRenderVenues();
    });
  }

  function resetAllFilters() {
    appState.maxPrice = 500000;
    appState.minCapacity = 0;
    appState.date = null;
    appState.sortBy = 'recommended';
    appState.location = 'Everywhere';

    if (priceRangeSlider) priceRangeSlider.value = 500000;
    if (priceCurrentVal) priceCurrentVal.textContent = 'Max: Any';

    const anyCapRadio = document.querySelector('input[name="capacityFilter"][value="any"]');
    if (anyCapRadio) anyCapRadio.checked = true;

    if (sortDropdown) sortDropdown.value = 'recommended';

    currentLocationLabel.textContent = 'Everywhere';
    currentLocationSub.textContent = 'All locations';

    filterAndRenderVenues();
  }

  if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetAllFilters);
  if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetAllFilters);

  function renderCitiesGrid() {
    if (!citiesSelectGrid) return;
    citiesSelectGrid.innerHTML = '';

    CITIES_DATA.forEach(function (city) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'city-select-btn' + (city === appState.location ? ' active' : '');
      btn.innerHTML = `<span>${city}</span><span>&rarr;</span>`;

      btn.addEventListener('click', function () {
        appState.location = city;
        currentLocationLabel.textContent = city;
        currentLocationSub.textContent = city === 'Everywhere' ? 'All locations' : `${city}, Gujarat`;

        locationModal.classList.remove('is-open');
        renderCitiesGrid();
        filterAndRenderVenues();
      });

      citiesSelectGrid.appendChild(btn);
    });
  }

  if (changeLocationBtn && locationModal) {
    changeLocationBtn.addEventListener('click', function () {
      renderCitiesGrid();
      locationModal.classList.add('is-open');
    });
  }

  if (closeLocationModal && locationModal) {
    closeLocationModal.addEventListener('click', function () {
      locationModal.classList.remove('is-open');
    });
  }

  let activeVenueInstance = null;

  const modalCategoryBadge = document.getElementById('modalCategoryBadge');
  const modalSpecialFeaturesList = document.getElementById('modalSpecialFeaturesList');
  const modalBookingDate = document.getElementById('modalBookingDate');
  const modalBookingGuests = document.getElementById('modalBookingGuests');
  const modalAvailabilityPill = document.getElementById('modalAvailabilityPill');
  const modalAvailabilityText = document.getElementById('modalAvailabilityText');
  const bdBasePrice = document.getElementById('bdBasePrice');
  const bdCategoryAddonName = document.getElementById('bdCategoryAddonName');
  const bdCategoryAddonPrice = document.getElementById('bdCategoryAddonPrice');
  const bdDiscountRow = document.getElementById('bdDiscountRow');
  const bdDiscountAmount = document.getElementById('bdDiscountAmount');

  const myBookingsNavBtn = document.getElementById('myBookingsNavBtn');
  const myBookingsCountBadge = document.getElementById('myBookingsCountBadge');
  const myBookingsModal = document.getElementById('myBookingsModal');
  const closeMyBookingsModal = document.getElementById('closeMyBookingsModal');
  const myBookingsContainer = document.getElementById('myBookingsContainer');

  const openOopInspectorBtn = document.getElementById('openOopInspectorBtn');
  const oopInspectorModal = document.getElementById('oopInspectorModal');
  const closeOopInspectorModal = document.getElementById('closeOopInspectorModal');

  function getLocalTodayString(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function isCurrentUserOwnerOf(venue) {
    if (!venue || !venue.host) return false;
    try {
      const raw = sessionStorage.getItem('venueverse_user') || localStorage.getItem('venueverse_user');
      if (!raw) return false;
      const u = JSON.parse(raw);
      const uId = String(u._id || u.id || '').trim();
      return Boolean(uId && String(venue.host).trim() === uId);
    } catch (e) {
      return false;
    }
  }

  function refreshPricingAndAvailability() {
    if (!activeVenueInstance) return;

    const selectedDate = modalBookingDate ? modalBookingDate.value : '';
    const guests = modalBookingGuests ? parseInt(modalBookingGuests.value, 10) || 50 : 50;
    const cap = Number(activeVenueInstance.capacity || 0);
    const overCapacity = cap > 0 && guests > cap;
    const todayStr = getLocalTodayString(0);
    const isOwner = isCurrentUserOwnerOf(activeVenueInstance);

    const setBookBtnEnabled = (enabled) => {
      if (!modalBookNowBtn) return;
      modalBookNowBtn.disabled = !enabled;
      modalBookNowBtn.style.opacity = enabled ? '1' : '0.5';
      modalBookNowBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
    };

    if (isOwner && modalAvailabilityPill && modalAvailabilityText) {
      modalAvailabilityPill.className = 'availability-status-pill booked';
      modalAvailabilityText.textContent = 'You own this venue — Venue Owners cannot book their own space. Block dates from Owner Dashboard.';
      setBookBtnEnabled(false);
    } else if (overCapacity && modalAvailabilityPill && modalAvailabilityText) {
      modalAvailabilityPill.className = 'availability-status-pill booked';
      modalAvailabilityText.textContent = `❌ Limit exceeded (Max capacity: ${cap} guests)`;
      setBookBtnEnabled(false);
    } else if (selectedDate && modalAvailabilityPill && modalAvailabilityText) {
      if (selectedDate < todayStr) {
        modalAvailabilityPill.className = 'availability-status-pill booked';
        modalAvailabilityText.textContent = `❌ Past dates (${selectedDate}) are unavailable.`;
        setBookBtnEnabled(false);
      } else {
        const isAvailable = (typeof activeVenueInstance.checkAvailability === 'function')
          ? activeVenueInstance.checkAvailability(selectedDate)
          : true;

        if (isAvailable) {
          modalAvailabilityPill.className = 'availability-status-pill available';
          modalAvailabilityText.textContent = `✓ Available for reservation on ${selectedDate}`;
          setBookBtnEnabled(true);
        } else {
          modalAvailabilityPill.className = 'availability-status-pill booked';
          modalAvailabilityText.textContent = `❌ Unavailable on ${selectedDate} (Booked or Blocked by Owner). Please select another date.`;
          setBookBtnEnabled(false);
        }
      }
    } else if (modalAvailabilityPill && modalAvailabilityText) {
      modalAvailabilityPill.className = 'availability-status-pill available';
      modalAvailabilityText.textContent = 'Select date to verify availability';
      setBookBtnEnabled(true);
    }

    const baseRate = Number(activeVenueInstance.basePrice || activeVenueInstance.price || 0);
    const finalTotal = Math.round(baseRate);

    if (bdBasePrice) bdBasePrice.textContent = `₹${baseRate.toLocaleString('en-IN')}`;
    if (modalVenuePrice) {
      modalVenuePrice.textContent = `₹${finalTotal.toLocaleString('en-IN')}`;
    }
  }

  function openVenueDetailsModal(venue) {
    if (!venueDetailsModal) return;
    activeVenueInstance = venue;

    modalVenueTitle.textContent = venue.title;
    modalVenueLocation.textContent = venue.locationDisplay || venue.location;
    modalVenueImg.src = venue.image;
    modalVenueImg.alt = venue.title;
    modalVenueCapacity.textContent = venue.capacityText || `Up to ${venue.capacity} guests`;
    const revNum = Number(venue.reviewsCount) || 0;
    const hasRatings = Number(venue.rating) > 0 && revNum > 0;
    modalVenueRating.textContent = hasRatings
      ? `★ ${Number(venue.rating).toFixed(1)} (${revNum} review${revNum === 1 ? '' : 's'})`
      : 'No rating (0 reviews)';
    const modalReadReviewsLink = document.getElementById('modalReadReviewsLink');
    if (modalReadReviewsLink) {
      modalReadReviewsLink.href = `../venue-details/venue-details.html?id=${encodeURIComponent(venue.id)}#reviewsSection`;
    }
    modalVenueDesc.textContent = venue.description;

    if (modalCategoryBadge && modalSpecialFeaturesList) {
      const details = (typeof venue.getCategoryDetails === 'function')
        ? venue.getCategoryDetails()
        : { categoryBadge: 'Verified Venue', specialFeatures: ['Standard Setup', 'Electricity Backup'] };

      modalCategoryBadge.textContent = details.categoryBadge || 'Special Category';
      modalSpecialFeaturesList.innerHTML = (details.specialFeatures || []).map(function (feat) {
        return `<li>${feat}</li>`;
      }).join('');
    }

    if (modalVenueAmenities) {
      modalVenueAmenities.innerHTML = (venue.amenities || []).map(function (amenity) {
        return `<li>✓ ${amenity}</li>`;
      }).join('');
    }

    if (modalBookingDate) {
      const today = getLocalTodayString(0);
      modalBookingDate.min = today;
      if (!modalBookingDate.value || modalBookingDate.value < today) {
        modalBookingDate.value = getLocalTodayString(1);
      }
    }
    if (modalBookingGuests) {
      const cap = Number(venue.capacity || 0);
      if (cap > 0) {
        modalBookingGuests.max = cap;
        const curVal = parseInt(modalBookingGuests.value, 10) || 100;
        if (curVal > cap) modalBookingGuests.value = Math.max(10, cap);
      } else {
        modalBookingGuests.removeAttribute('max');
      }
    }

    refreshPricingAndAvailability();
    venueDetailsModal.classList.add('is-open');
  }

  if (modalBookingDate) {
    modalBookingDate.addEventListener('change', refreshPricingAndAvailability);
  }
  if (modalBookingGuests) {
    modalBookingGuests.addEventListener('input', refreshPricingAndAvailability);
  }

  if (closeVenueModal && venueDetailsModal) {
    closeVenueModal.addEventListener('click', function () {
      venueDetailsModal.classList.remove('is-open');
    });
  }

  if (modalBookNowBtn) {
    modalBookNowBtn.addEventListener('click', function () {
      if (!activeVenueInstance || !window.bookingService) {
        alert('Booking service is initializing. Please try again.');
        return;
      }

      if (isCurrentUserOwnerOf(activeVenueInstance)) {
        alert('You own this venue. Venue Owners cannot book their own venue — manage/block dates from Owner Dashboard.');
        return;
      }

      const selectedDate = modalBookingDate ? modalBookingDate.value : '';
      if (!selectedDate) {
        alert('Please choose an event date before booking.');
        return;
      }
      if (selectedDate < getLocalTodayString(0)) {
        alert('Past dates are unavailable and cannot be booked.');
        return;
      }

      const guestsCount = modalBookingGuests ? parseInt(modalBookingGuests.value, 10) || 50 : 50;
      const cap = Number(activeVenueInstance.capacity || 0);
      if (cap > 0 && guestsCount > cap) {
        alert(`Limit exceeded! Maximum guest capacity for this venue is ${cap}.`);
        return;
      }

      try {
        const newBooking = window.bookingService.createBooking({
          venueId: activeVenueInstance.id,
          bookingDate: selectedDate,
          guests: guestsCount,
          days: 1
        });

        refreshMyBookingsBadge();
        venueDetailsModal.classList.remove('is-open');

        alert(`🎉 RESERVATION CONFIRMED!\n\n` +
          `• Booking ID: ${newBooking.bookingId}\n` +
          `• Venue: ${activeVenueInstance.title}\n` +
          `• Customer: ${newBooking.customer.name}\n` +
          `• Date: ${newBooking.bookingDate}\n` +
          `• Guests: ${newBooking.guestsCount}\n` +
          `• Total Amount: ₹${newBooking.totalAmount.toLocaleString('en-IN')}`
        );

      } catch (err) {
        if (window.VenueVerseOOP && err instanceof window.VenueVerseOOP.CapacityExceededError) {
          alert(`❌ Limit Exceeded: ${err.message}`);
        } else if (window.VenueVerseOOP && err instanceof window.VenueVerseOOP.DateUnavailableError) {
          alert(`❌ Unavailable: ${err.message}`);
        } else if (window.VenueVerseOOP && err instanceof window.VenueVerseOOP.VenueVerseError) {
          alert(`❌ Booking Error [${err.code}]: ${err.message}`);
        } else {
          alert(`❌ Booking Failed: ${err.message}`);
        }
      }
    });
  }

  function refreshMyBookingsBadge() {
    if (!window.bookingService || !myBookingsCountBadge) return;
    const activeBookings = window.bookingService.getCustomerBookings().filter(function (b) {
      return b.status === 'CONFIRMED';
    });
    myBookingsCountBadge.textContent = activeBookings.length;
  }

  function renderMyBookings() {
    if (!myBookingsContainer || !window.bookingService) return;
    myBookingsContainer.innerHTML = '';

    const bookings = window.bookingService.getCustomerBookings();

    if (bookings.length === 0) {
      myBookingsContainer.innerHTML = `
        <div class="empty-bookings-box">
          <p>📅 <strong>No bookings created yet.</strong></p>
          <p>Browse our venues, select a date, and click "Confirm &amp; Book" to create your first OOP Booking instance!</p>
        </div>
      `;
      return;
    }

    bookings.slice().reverse().forEach(function (booking) {
      const card = document.createElement('div');
      const isCancelled = booking.status === 'CANCELLED';
      card.className = 'booking-card-item' + (isCancelled ? ' is-cancelled' : '');

      card.innerHTML = `
        <div class="booking-card-top">
          <div class="booking-card-title-group">
            <h4>${booking.venue.title}</h4>
            <span class="booking-card-meta">${booking.venue.location} &bull; ${booking.venue.category.toUpperCase()}</span>
          </div>
          <span class="booking-status-tag ${booking.status.toLowerCase()}">${booking.status}</span>
        </div>
        <div class="booking-card-details-grid">
          <div class="booking-card-stat">
            <span class="booking-card-stat-label">Booking ID</span>
            <span class="booking-card-stat-val">${booking.bookingId}</span>
          </div>
          <div class="booking-card-stat">
            <span class="booking-card-stat-label">Event Date</span>
            <span class="booking-card-stat-val">${booking.bookingDate}</span>
          </div>
          <div class="booking-card-stat">
            <span class="booking-card-stat-label">Guests</span>
            <span class="booking-card-stat-val">${booking.guestsCount}</span>
          </div>
          <div class="booking-card-stat">
            <span class="booking-card-stat-label">Total Amount</span>
            <span class="booking-card-stat-val">₹${booking.totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div class="booking-card-actions">
          ${!isCancelled ? `<button type="button" class="btn-cancel-booking" data-id="${booking.bookingId}">Cancel Booking</button>` : `<span style="font-size:0.8rem;color:#94a3b8;">Date released back to venue</span>`}
        </div>
      `;

      const cancelBtn = card.querySelector('.btn-cancel-booking');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', function () {
          const bId = this.getAttribute('data-id');
          if (confirm(`Are you sure you want to cancel booking ${bId}?`)) {
            window.bookingService.cancelBooking(bId);
            refreshMyBookingsBadge();
            renderMyBookings();
            filterAndRenderVenues();
            alert(`Booking ${bId} has been cancelled. The venue date is now free!`);
          }
        });
      }

      myBookingsContainer.appendChild(card);
    });
  }

  window.addEventListener('click', function (e) {
    if (e.target === locationModal) locationModal.classList.remove('is-open');
    if (e.target === venueDetailsModal) venueDetailsModal.classList.remove('is-open');
  });

  const searchAreaBtn = document.getElementById('searchAreaBtn');
  if (searchAreaBtn) {
    searchAreaBtn.addEventListener('click', function () {
      loadVenuesFromBackend();
      searchAreaBtn.innerHTML = '<span>Refreshed area venues!</span>';
      setTimeout(function () {
        searchAreaBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span>Search this area</span>
        `;
      }, 1500);
    });
  }

  if (appState.location !== 'Everywhere' && currentLocationLabel && currentLocationSub) {
    currentLocationLabel.textContent = appState.location;
    currentLocationSub.textContent = `${appState.location}, Gujarat`;
  }
  renderCategoryHeader();
  renderCategoryTabs();
  loadVenuesFromBackend();
  if (window.VenueVerseAuth && typeof window.VenueVerseAuth.refreshBookingsBadge === 'function') {
    window.VenueVerseAuth.refreshBookingsBadge();
  }

});

