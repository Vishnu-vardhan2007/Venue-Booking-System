document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const API_BASE = (window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:5000' : 'http://localhost:5000';
  const urlParams = new URLSearchParams(window.location.search);
  const venueId = urlParams.get('id');

  if (!venueId) {
    alert('No venue selected for booking. Redirecting to catalog.');
    window.location.href = '../venues/venues.html';
    return;
  }

  function getLocalTodayStr(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function isCurrentUserOwnerOf(venueObj) {
    if (!venueObj || !venueObj.host) return false;
    try {
      const raw = sessionStorage.getItem('venueverse_user') || localStorage.getItem('venueverse_user');
      if (!raw) return false;
      const u = JSON.parse(raw);
      const uId = String(u._id || u.id || '').trim();
      return Boolean(uId && String(venueObj.host).trim() === uId);
    } catch (e) {
      return false;
    }
  }

  const defaultDateStr = getLocalTodayStr(1);

  let currentBookingDate = urlParams.get('date') || defaultDateStr;
  if (currentBookingDate < getLocalTodayStr(0)) {
    currentBookingDate = defaultDateStr;
  }
  let currentGuestCount = parseInt(urlParams.get('guests'), 10) || 100;

  async function loadCheckoutVenue() {
    try {
      const resp = await fetch(`${API_BASE}/api/venues/${venueId}`);
      if (!resp.ok) {
        alert('Venue not found in database. Redirecting to catalog.');
        window.location.href = '../venues/venues.html';
        return;
      }
      const payload = await resp.json();
      const v = (payload && payload.venue) ? payload.venue : payload;
      const id = v.id || v._id;
      if (!id) {
        alert('Invalid venue details returned by server.');
        window.location.href = '../venues/venues.html';
        return;
      }
      const price = v.pricePerDay || v.price || 0;
      const capacity = v.capacity || 0;
      const city = v.city || v.location || 'Gujarat';
      let img = (v.images && v.images.length > 0) ? v.images[0] : (v.image || '../assets/venue-ballroom.jpg');
      if (img && !img.startsWith('../') && !img.startsWith('http') && !img.startsWith('data:')) {
        img = '../' + img;
      }

      const categoriesList = (Array.isArray(v.categories) && v.categories.length > 0)
        ? v.categories.map(c => String(c || '').trim().toLowerCase()).filter(Boolean)
        : [String(v.category || 'wedding').trim().toLowerCase()];

      const rawItem = {
        id: id,
        _id: id,
        title: v.title,
        category: categoriesList[0] || 'wedding',
        categories: categoriesList,
        price: price,
        basePrice: price,
        capacity: capacity,
        bookedDates: Array.isArray(v.bookedDates) ? v.bookedDates : [],
        host: (v.host && typeof v.host === 'object') ? (v.host._id || v.host.id || v.host.$oid || '') : String(v.host || ''),
        hostName: v.hostName || 'Verified Host',
        rating: (typeof v.rating === 'number' && !isNaN(v.rating)) ? v.rating : 0,
        reviewsCount: (typeof v.reviewsCount === 'number' && !isNaN(v.reviewsCount)) ? v.reviewsCount : 0,
        image: img,
        location: city
      };

      const venue = (window.VenueVerseOOP && typeof window.VenueVerseOOP.createVenueInstance === 'function')
        ? window.VenueVerseOOP.createVenueInstance(rawItem)
        : rawItem;

      if (isCurrentUserOwnerOf(venue)) {
        alert('You own this venue — Venue Owners cannot book their own space. Redirecting to Owner Dashboard to manage/block dates.');
        window.location.replace('../owner-dashboard/owner.html');
        return;
      }

      if (typeof venue.checkAvailability === 'function' && !venue.checkAvailability(currentBookingDate)) {
        alert(`Sorry, ${venue.title} is unavailable on ${currentBookingDate} (already booked or blocked by owner). Please select another date.`);
      }

      startCheckout(venue);
    } catch (err) {
      console.error('Failed to load venue for checkout:', err);
      alert('Unable to connect to Java backend at ' + API_BASE + '.\nPlease ensure the backend server is running.');
      window.location.href = '../venues/venues.html';
    }
  }

  function startCheckout(venue) {
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.href = `../venue-details/venue-details.html?id=${venue.id}`;
    }

  const summaryVenueImg = document.getElementById('summaryVenueImg');
  const summaryCategoryText = document.getElementById('summaryCategoryText');
  const summaryVenueTitle = document.getElementById('summaryVenueTitle');
  const summaryRatingScore = document.getElementById('summaryRatingScore');
  const summaryReviewsCount = document.getElementById('summaryReviewsCount');
  const summaryDateVal = document.getElementById('summaryDateVal');
  const summaryGuestsVal = document.getElementById('summaryGuestsVal');

  const priceBaseLabel = document.getElementById('priceBaseLabel');
  const priceBaseVal = document.getElementById('priceBaseVal');
  const priceAddonVal = document.getElementById('priceAddonVal');
  const priceDiscountVal = document.getElementById('priceDiscountVal');
  const priceTotalDueVal = document.getElementById('priceTotalDueVal');

  const supportedCategories = (Array.isArray(venue.categories) && venue.categories.length > 0)
    ? venue.categories
    : [venue.category || 'wedding'];
  const formatEventLabel = (cat) => {
    const clean = String(cat || '').trim().toLowerCase();
    if (clean === 'corporate') return 'Corporate Event';
    return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'Event';
  };
  const eventOccasionSelect = document.getElementById('eventOccasion');
  if (eventOccasionSelect) {
    const requestedEventType = String(urlParams.get('eventType') || '').trim().toLowerCase();
    eventOccasionSelect.innerHTML = supportedCategories
      .map(cat => `<option value="${cat}">${formatEventLabel(cat)}</option>`)
      .join('');
    if (requestedEventType && supportedCategories.includes(requestedEventType)) {
      eventOccasionSelect.value = requestedEventType;
    } else if (supportedCategories.length > 0) {
      eventOccasionSelect.value = supportedCategories[0];
    }
  }

  if (summaryVenueImg && venue.image) {
    summaryVenueImg.src = venue.image;
    summaryVenueImg.alt = venue.title;
  }
  if (summaryCategoryText) {
    summaryCategoryText.textContent = `Hosts: ${supportedCategories.map(formatEventLabel).join(' • ')}`;
  }
  if (summaryVenueTitle) {
    summaryVenueTitle.textContent = venue.title;
  }
  const maxGuestCapacity = Number(venue.capacity || 0);
  if (!urlParams.get('guests') && maxGuestCapacity > 0 && currentGuestCount > maxGuestCapacity) {
    currentGuestCount = Math.max(10, maxGuestCapacity);
  }

  if (summaryRatingScore) {
    const rNum = Number(venue.rating || 0);
    const cnt = Number(venue.reviewsCount || 0);
    summaryRatingScore.textContent = (rNum > 0 && cnt > 0) ? rNum.toFixed(1) : 'No rating';
  }
  if (summaryReviewsCount) {
    const cnt = Number(venue.reviewsCount) || 0;
    summaryReviewsCount.textContent = `(${cnt} review${cnt === 1 ? '' : 's'})`;
  }

  function formatDateFriendly(dateStr) {
    if (!dateStr) return 'Selected Date';
    const isoDay = String(dateStr).split('T')[0];
    const parts = isoDay.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return dateStr;
  }

  let finalComputedTotal = 0;

  function refreshSummaryPricing() {
    if (summaryDateVal) summaryDateVal.textContent = formatDateFriendly(currentBookingDate);
    if (summaryGuestsVal) {
      if (maxGuestCapacity > 0 && currentGuestCount > maxGuestCapacity) {
        summaryGuestsVal.textContent = `${currentGuestCount} guests (Limit exceeded — Max ${maxGuestCapacity})`;
        summaryGuestsVal.style.color = '#dc2626';
      } else {
        summaryGuestsVal.textContent = `${currentGuestCount} guests`;
        summaryGuestsVal.style.color = '';
      }
    }

    const baseRate = Number(venue.basePrice || venue.price || 0);
    finalComputedTotal = Math.round(baseRate);

    if (priceBaseLabel) priceBaseLabel.textContent = `₹${baseRate.toLocaleString('en-IN')} × 1 day`;
    if (priceBaseVal) priceBaseVal.textContent = `₹${baseRate.toLocaleString('en-IN')}`;
    if (priceTotalDueVal) priceTotalDueVal.textContent = `₹${finalComputedTotal.toLocaleString('en-IN')}`;
  }

  refreshSummaryPricing();

  const btnChangeDates = document.getElementById('btnChangeDates');
  const inlineDateEditor = document.getElementById('inlineDateEditor');
  const inlineDateInput = document.getElementById('inlineDateInput');
  const btnApplyDate = document.getElementById('btnApplyDate');

  if (inlineDateInput) {
    inlineDateInput.min = getLocalTodayStr(0);
    inlineDateInput.value = currentBookingDate;
  }

  if (btnChangeDates && inlineDateEditor) {
    btnChangeDates.addEventListener('click', function () {
      const isVisible = inlineDateEditor.style.display === 'flex';
      inlineDateEditor.style.display = isVisible ? 'none' : 'flex';
    });
  }

  if (btnApplyDate && inlineDateInput) {
    btnApplyDate.addEventListener('click', function () {
      if (!inlineDateInput.value) return;
      if (inlineDateInput.value < getLocalTodayStr(0)) {
        alert('Past dates are unavailable and cannot be booked.');
        return;
      }

      if (typeof venue.checkAvailability === 'function' && !venue.checkAvailability(inlineDateInput.value)) {
        alert(`Sorry, ${venue.title} is unavailable on ${inlineDateInput.value} (booked or blocked by owner). Please choose another date.`);
        return;
      }

      currentBookingDate = inlineDateInput.value;
      inlineDateEditor.style.display = 'none';
      refreshSummaryPricing();
    });
  }

  const btnChangeGuests = document.getElementById('btnChangeGuests');
  const inlineGuestsEditor = document.getElementById('inlineGuestsEditor');
  const inlineGuestsInput = document.getElementById('inlineGuestsInput');
  const btnApplyGuests = document.getElementById('btnApplyGuests');
  const inlineGuestsError = document.getElementById('inlineGuestsError');

  function validateGuestInput(val) {
    if (isNaN(val) || val < 10) {
      if (inlineGuestsError) {
        inlineGuestsError.textContent = 'Minimum 10 guests required.';
        inlineGuestsError.style.display = 'block';
      }
      return false;
    }
    if (maxGuestCapacity > 0 && val > maxGuestCapacity) {
      if (inlineGuestsError) {
        inlineGuestsError.textContent = `Limit exceeded (Max capacity: ${maxGuestCapacity} guests)`;
        inlineGuestsError.style.display = 'block';
      }
      return false;
    }
    if (inlineGuestsError) {
      inlineGuestsError.textContent = '';
      inlineGuestsError.style.display = 'none';
    }
    return true;
  }

  if (inlineGuestsInput) {
    inlineGuestsInput.value = currentGuestCount;
    if (maxGuestCapacity > 0) {
      inlineGuestsInput.max = maxGuestCapacity;
    }
    inlineGuestsInput.addEventListener('input', function () {
      validateGuestInput(parseInt(inlineGuestsInput.value, 10));
    });
  }

  if (btnChangeGuests && inlineGuestsEditor) {
    btnChangeGuests.addEventListener('click', function () {
      const isVisible = inlineGuestsEditor.style.display === 'flex';
      inlineGuestsEditor.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible && inlineGuestsInput) {
        inlineGuestsInput.value = currentGuestCount;
        validateGuestInput(parseInt(inlineGuestsInput.value, 10));
      } else if (isVisible && inlineGuestsError && !(maxGuestCapacity > 0 && currentGuestCount > maxGuestCapacity)) {
        inlineGuestsError.style.display = 'none';
      }
    });
  }

  if (btnApplyGuests && inlineGuestsInput) {
    btnApplyGuests.addEventListener('click', function () {
      const val = parseInt(inlineGuestsInput.value, 10);
      if (!validateGuestInput(val)) {
        return;
      }
      currentGuestCount = val;
      inlineGuestsEditor.style.display = 'none';
      refreshSummaryPricing();
    });
  }

  if (maxGuestCapacity > 0 && currentGuestCount > maxGuestCapacity && inlineGuestsError) {
    inlineGuestsError.textContent = `Limit exceeded (Max capacity: ${maxGuestCapacity} guests). Please click Change to reduce guests.`;
    inlineGuestsError.style.display = 'block';
  }

  const checkoutHostName = document.getElementById('checkoutHostName');
  const checkoutHostAvatar = document.getElementById('checkoutHostAvatar');
  const hostName = venue.hostName || 'Verified Host';
  if (checkoutHostName) checkoutHostName.textContent = hostName;
  if (checkoutHostAvatar) {
    const initials = hostName.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'VH';
    checkoutHostAvatar.textContent = initials;
  }

  const step1Card = document.getElementById('step1Card');
  const step1Body = document.getElementById('step1Body');
  const step1Status = document.getElementById('step1Status');
  const hostMessageText = document.getElementById('hostMessageText');
  const step1Error = document.getElementById('step1Error');
  const btnNextStep1 = document.getElementById('btnNextStep1');
  const step1Summary = document.getElementById('step1Summary');
  const step1PreviewText = document.getElementById('step1PreviewText');
  const editStep1Btn = document.getElementById('editStep1Btn');

  const step2Card = document.getElementById('step2Card');
  const step2Body = document.getElementById('step2Body');
  const step2Status = document.getElementById('step2Status');
  const btnNextStep2 = document.getElementById('btnNextStep2');
  const step2Summary = document.getElementById('step2Summary');
  const step2PreviewText = document.getElementById('step2PreviewText');
  const editStep2Btn = document.getElementById('editStep2Btn');
  const step2Error = document.getElementById('step2Error');

  const step3Card = document.getElementById('step3Card');
  const step3Body = document.getElementById('step3Body');
  const step3Status = document.getElementById('step3Status');

  if (btnNextStep1) {
    btnNextStep1.addEventListener('click', function () {
      const msg = hostMessageText.value.trim();
      if (!msg) {
        step1Error.style.display = 'block';
        hostMessageText.focus();
        return;
      }
      step1Error.style.display = 'none';

      step1Status.className = 'step-number-tag done';
      step1Status.textContent = '✓';
      step1Card.className = 'step-card is-done';
      step1Body.style.display = 'none';
      
      const snippet = msg.length > 70 ? msg.substring(0, 67) + '...' : msg;
      step1PreviewText.textContent = `"${snippet}"`;
      step1Summary.style.display = 'block';
      editStep1Btn.style.display = 'block';

      step2Card.className = 'step-card is-active';
      step2Body.style.display = 'block';
      step2Summary.style.display = 'none';
      editStep2Btn.style.display = 'none';

      step2Card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  if (editStep1Btn) {
    editStep1Btn.addEventListener('click', function () {
      step1Card.className = 'step-card is-active';
      step1Body.style.display = 'block';
      step1Summary.style.display = 'none';
      editStep1Btn.style.display = 'none';
    });
  }

  const organizerName = document.getElementById('organizerName');
  const organizerPhone = document.getElementById('organizerPhone');
  const organizerEmail = document.getElementById('organizerEmail');

  try {
    const rawUser = sessionStorage.getItem('venueverse_user') || localStorage.getItem('venueverse_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (organizerName && u.name && !organizerName.value) organizerName.value = u.name;
      if (organizerEmail && u.email && !organizerEmail.value) organizerEmail.value = u.email;
      if (organizerPhone && u.phone && !organizerPhone.value) organizerPhone.value = u.phone;
    }
  } catch (e) {}

  if (btnNextStep2) {
    btnNextStep2.addEventListener('click', function () {
      const nameVal = organizerName.value.trim();
      const phoneVal = organizerPhone.value.trim();
      const emailVal = organizerEmail.value.trim();

      if (!nameVal || !phoneVal || !emailVal) {
        step2Error.style.display = 'block';
        return;
      }
      step2Error.style.display = 'none';

      step2Status.className = 'step-number-tag done';
      step2Status.textContent = '✓';
      step2Card.className = 'step-card is-done';
      step2Body.style.display = 'none';

      const chosenEventType = eventOccasionSelect ? eventOccasionSelect.value : (supportedCategories[0] || '');
      step2PreviewText.textContent = `${nameVal} • ${formatEventLabel(chosenEventType)} • ${phoneVal} • ${emailVal}`;
      step2Summary.style.display = 'block';
      editStep2Btn.style.display = 'block';

      step3Card.className = 'step-card is-active';
      step3Body.style.display = 'block';

      step3Card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  if (editStep2Btn) {
    editStep2Btn.addEventListener('click', function () {
      step2Card.className = 'step-card is-active';
      step2Body.style.display = 'block';
      step2Summary.style.display = 'none';
      editStep2Btn.style.display = 'none';
    });
  }

  const paymentTiles = document.querySelectorAll('.payment-method-tile');
  const upiInputBox = document.getElementById('upiInputBox');

  paymentTiles.forEach(function (tile) {
    tile.addEventListener('click', function () {
      paymentTiles.forEach(t => t.classList.remove('is-selected'));
      tile.classList.add('is-selected');

      const radio = tile.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        if (upiInputBox) {
          upiInputBox.style.display = radio.value === 'upi' ? 'block' : 'none';
        }
      }
    });
  });

  const agreementCheckbox = document.getElementById('agreementCheckbox');
  const step3Error = document.getElementById('step3Error');
  const btnSubmitBooking = document.getElementById('btnSubmitBooking');

  const bookingSuccessCard = document.getElementById('bookingSuccessCard');
  const receiptBookingId = document.getElementById('receiptBookingId');
  const receiptVenueTitle = document.getElementById('receiptVenueTitle');
  const receiptEventType = document.getElementById('receiptEventType');
  const receiptDate = document.getElementById('receiptDate');
  const receiptGuests = document.getElementById('receiptGuests');
  const receiptTotalAmount = document.getElementById('receiptTotalAmount');

  if (btnSubmitBooking) {
    btnSubmitBooking.addEventListener('click', async function () {
      if (!agreementCheckbox.checked) {
        step3Error.style.display = 'block';
        return;
      }
      step3Error.style.display = 'none';

      let currentUser = null;
      try {
        const rawUser = sessionStorage.getItem('venueverse_user') || localStorage.getItem('venueverse_user');
        if (rawUser) currentUser = JSON.parse(rawUser);
      } catch (e) {}

      if (!currentUser) {
        alert('You must be signed in to submit a booking. Redirecting to login...');
        window.location.href = '../signin/signin.html?returnUrl=' + encodeURIComponent(window.location.href);
        return;
      }

      if (isCurrentUserOwnerOf(venue)) {
        alert('Venue Owners cannot book their own venue. Please use Availability & Calendar in Owner Dashboard to block dates.');
        return;
      }

      if (currentBookingDate < getLocalTodayStr(0)) {
        alert('Past dates are unavailable and cannot be booked.');
        return;
      }

      if (venue.capacity && currentGuestCount > venue.capacity) {
        alert(`Limit exceeded! Guest count (${currentGuestCount}) exceeds this venue's capacity (${venue.capacity}). Please reduce guests.`);
        return;
      }

      const selectedEventType = eventOccasionSelect ? String(eventOccasionSelect.value || '').trim().toLowerCase() : (supportedCategories[0] || '');
      if (!selectedEventType || !supportedCategories.includes(selectedEventType)) {
        alert('Please select one valid event type supported by this venue.');
        return;
      }

      btnSubmitBooking.disabled = true;
      btnSubmitBooking.textContent = 'Confirming reservation with server...';

      try {
        const bookingPayload = {
          venueId: venue.id,
          bookingDate: currentBookingDate,
          endDate: currentBookingDate,
          guests: currentGuestCount,
          eventType: selectedEventType,
          totalPrice: finalComputedTotal,
          contact: (organizerPhone && organizerPhone.value.trim()) || (organizerEmail && organizerEmail.value.trim()) || currentUser.email,
          hostMessage: hostMessageText ? hostMessageText.value.trim() : ''
        };

        const headers = { 'Content-Type': 'application/json' };
        if (currentUser && (currentUser._id || currentUser.id)) {
          headers['X-User-Id'] = currentUser._id || currentUser.id;
        }

        const res = await fetch(`${API_BASE}/api/bookings`, {
          method: 'POST',
          headers: headers,
          credentials: 'include',
          body: JSON.stringify(bookingPayload)
        });

        if (res.status === 401) {
          alert('Session expired. Please sign in again.');
          window.location.href = '../signin/signin.html?returnUrl=' + encodeURIComponent(window.location.href);
          return;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          alert(`Booking rejected by server (${res.status}): ${errData.message || 'Please check dates and guest count.'}`);
          btnSubmitBooking.disabled = false;
          btnSubmitBooking.textContent = 'Confirm & Book';
          return;
        }

        const resData = await res.json();
        const savedBooking = (resData && resData.booking) ? resData.booking : resData;

        step1Card.style.display = 'none';
        step2Card.style.display = 'none';
        step3Card.style.display = 'none';

        if (bookingSuccessCard) {
          receiptBookingId.textContent = savedBooking._id || savedBooking.id || 'CONFIRMED';
          receiptVenueTitle.textContent = savedBooking.venueTitle || venue.title;
          if (receiptEventType) {
            receiptEventType.textContent = formatEventLabel(savedBooking.eventType || selectedEventType);
          }
          receiptDate.textContent = formatDateFriendly(savedBooking.bookingDate || currentBookingDate);
          receiptGuests.textContent = `${savedBooking.guests || currentGuestCount} Guests`;
          receiptTotalAmount.textContent = `₹${(savedBooking.totalPrice || finalComputedTotal).toLocaleString('en-IN')}`;

          bookingSuccessCard.style.display = 'flex';
          bookingSuccessCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (networkErr) {
        console.error('Booking network error:', networkErr);
        alert('Connection error: Cannot reach the Java backend server on port 5000.');
        btnSubmitBooking.disabled = false;
        btnSubmitBooking.textContent = 'Confirm & Book';
      }
    });
  }

  }

  loadCheckoutVenue();

});
