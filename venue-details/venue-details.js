document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const API_BASE = (window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:5000' : 'http://localhost:5000';
  const urlParams = new URLSearchParams(window.location.search);
  const venueId = urlParams.get('id');

  if (!venueId) {
    alert('No venue selected. Redirecting to venue directory.');
    window.location.href = '../venues/venues.html';
    return;
  }

  async function loadVenueDetails() {
    try {
      const resp = await fetch(`${API_BASE}/api/venues/${venueId}`);
      if (!resp.ok) {
        if (resp.status === 404) {
          alert('Venue not found in database. Redirecting to venue catalog.');
          window.location.href = '../venues/venues.html';
          return;
        }
        throw new Error(`HTTP error ${resp.status}`);
      }

      const payload = await resp.json();
      const v = (payload && payload.venue) ? payload.venue : payload;
      const id = v.id || v._id;
      if (!id) {
        throw new Error('Invalid venue payload from server');
      }
      const price = v.pricePerDay || v.price || 0;
      const capacity = v.capacity || 0;
      const city = v.city || v.location || 'Gujarat';
      let img = (v.images && v.images.length > 0) ? v.images[0] : (v.image || '../assets/venue-ballroom.jpg');
      if (img && !img.startsWith('../') && !img.startsWith('http') && !img.startsWith('data:')) {
        img = '../' + img;
      }
      const gallery = (v.images && v.images.length)
        ? v.images.map(i => (!i.startsWith('../') && !i.startsWith('http') && !i.startsWith('data:')) ? '../' + i : i)
        : [img];

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
        address: v.address || `${v.title}, ${city}`,
        price: price,
        basePrice: price,
        capacity: capacity,
        bookedDates: Array.isArray(v.bookedDates) ? v.bookedDates : [],
        rating: (typeof v.rating === 'number' && !isNaN(v.rating)) ? v.rating : 0,
        reviewsCount: (typeof v.reviewsCount === 'number' && !isNaN(v.reviewsCount)) ? v.reviewsCount : 0,
        image: img,
        gallery: gallery,
        amenities: (v.amenities && v.amenities.length) ? v.amenities : ['Power Backup', 'Air Conditioning', 'Valet Parking', 'Audio System'],
        host: (v.host && typeof v.host === 'object') ? (v.host._id || v.host.id || v.host.$oid || '') : String(v.host || ''),
        hostName: v.hostName || 'Verified Host',
        lat: v.lat || 23.0225,
        lng: v.lng || 72.5714,
        isActive: v.isActive !== false,
        status: v.status || 'approved'
      };

      const venue = (window.VenueVerseOOP && typeof window.VenueVerseOOP.createVenueInstance === 'function')
        ? window.VenueVerseOOP.createVenueInstance(rawItem)
        : rawItem;

      bindVenueDetails(venue);
    } catch (err) {
      console.error('Error fetching venue details:', err);
      alert('Unable to load venue details from the Java backend at ' + API_BASE + '.\nPlease ensure the backend server is running on port 5000.');
      window.location.href = '../venues/venues.html';
    }
  }

  function bindVenueDetails(venue) {
    document.title = `${venue.title} | VenueVerse`;

    const supportedCategories = (Array.isArray(venue.categories) && venue.categories.length > 0)
      ? venue.categories
      : [venue.category || 'wedding'];
    const categoryLabel = (cat) => {
      const clean = String(cat || '').trim().toLowerCase();
      if (clean === 'corporate') return 'Corporate Event';
      return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'Event';
    };

    const bcCategoryLink = document.getElementById('bcCategoryLink');
    const bcVenueTitle = document.getElementById('bcVenueTitle');
    if (bcCategoryLink) {
      const catName = supportedCategories[0] || 'venues';
      bcCategoryLink.href = `../venues/venues.html?category=${encodeURIComponent(catName)}`;
      bcCategoryLink.textContent = categoryLabel(catName);
    }
    if (bcVenueTitle) {
      bcVenueTitle.textContent = venue.title;
    }

    const galleryLeadPhoto = document.getElementById('galleryLeadPhoto');
    const galleryPhoto2 = document.getElementById('galleryPhoto2');
    const galleryPhoto3 = document.getElementById('galleryPhoto3');
    const galleryPhoto4 = document.getElementById('galleryPhoto4');
    const galleryPhoto5 = document.getElementById('galleryPhoto5');

    const photosList = Array.isArray(venue.gallery) && venue.gallery.length 
      ? venue.gallery 
      : [venue.image];

    if (galleryLeadPhoto && photosList[0]) {
      galleryLeadPhoto.src = photosList[0];
      galleryLeadPhoto.alt = venue.title;
    }
    [galleryPhoto2, galleryPhoto3, galleryPhoto4, galleryPhoto5].forEach((el, idx) => {
      if (!el) return;
      const src = photosList[idx + 1] || photosList[0];
      if (src) {
        el.src = src;
        el.alt = venue.title;
      }
    });

    const venueTitle = document.getElementById('venueTitle');
    const venueRatingScore = document.getElementById('venueRatingScore');
    const venueReviewsCount = document.getElementById('venueReviewsCount');
    const venueLocationText = document.getElementById('venueLocationText');
    const venueAddressDetail = document.getElementById('venueAddressDetail');
    const venueDescriptionText = document.getElementById('venueDescriptionText');
    const hostTitle = document.getElementById('hostTitle');
    const hostSpecs = document.getElementById('hostSpecs');
    const reviewsHeaderTitle = document.getElementById('reviewsHeaderTitle');

    const reviewsNum = Number(venue.reviewsCount) || 0;
    const ratingStr = (Number(venue.rating) > 0 && reviewsNum > 0) ? Number(venue.rating).toFixed(1) : 'No rating';

    if (venueTitle) venueTitle.textContent = venue.title;
    if (venueRatingScore) venueRatingScore.textContent = ratingStr;
    if (venueReviewsCount) venueReviewsCount.textContent = `(${reviewsNum} review${reviewsNum === 1 ? '' : 's'})`;
    if (venueLocationText) venueLocationText.textContent = `${venue.location || 'Gujarat'}, India`;
    if (venueAddressDetail) venueAddressDetail.textContent = venue.address || `${venue.location || 'Gujarat'} • Prime event venue.`;
    
    if (venueDescriptionText && venue.description) {
      venueDescriptionText.innerHTML = `<p>${venue.description}</p>`;
    }

    if (hostTitle) {
      const hostDisplayName = venue.hostName || 'Verified Host';
      hostTitle.textContent = `Entire event venue hosted by ${hostDisplayName}`;
      const hostAvatar = document.getElementById('hostAvatar');
      if (hostAvatar) {
        const parts = hostDisplayName.trim().split(/\s+/);
        const initials = parts.map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'H';
        hostAvatar.textContent = initials;
      }
    }
    if (hostSpecs) {
      const hostedEventsText = supportedCategories.map(categoryLabel).join(', ');
      hostSpecs.textContent = `Up to ${venue.capacity} guests • Hosts: ${hostedEventsText} • Instant Booking`;
    }
    function escapeHtml(val) {
      return String(val === null || val === undefined ? '' : val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    const locationHighlightTitle = document.getElementById('locationHighlightTitle');
    const locationHighlightSubtitle = document.getElementById('locationHighlightSubtitle');

    function updateRatingUI(ratingVal, countVal) {
      const rNum = Number(ratingVal) || 0;
      const cNum = Number(countVal) || 0;
      const hasRating = rNum > 0 && cNum > 0;
      const rStr = hasRating ? rNum.toFixed(1) : 'No rating';
      const rWord = `${cNum} review${cNum === 1 ? '' : 's'}`;
      if (venueRatingScore) venueRatingScore.textContent = rStr;
      if (venueReviewsCount) venueReviewsCount.textContent = `(${rWord})`;
      if (reviewsHeaderTitle) reviewsHeaderTitle.textContent = `${rStr} • ${rWord}`;
      if (cardRatingScore) cardRatingScore.textContent = rStr;
      if (cardReviewsCount) cardReviewsCount.textContent = `• ${rWord}`;
      if (locationHighlightTitle) {
        locationHighlightTitle.textContent = hasRating ? `Rated ${rNum.toFixed(1)} out of 5` : 'No rating';
      }
      if (locationHighlightSubtitle) {
        locationHighlightSubtitle.textContent = hasRating
          ? `Rating updated automatically from ${cNum} verified review${cNum === 1 ? '' : 's'}.`
          : 'No reviews yet for this venue. Ratings update after every review.';
      }
    }

    async function loadVenueReviews() {
      const cardsGrid = document.getElementById('reviewsCardsGrid');
      if (!cardsGrid) return;
      try {
        const res = await fetch(`${API_BASE}/api/venues/${encodeURIComponent(venue.id)}/reviews`);
        const data = res.ok ? await res.json() : { reviews: [] };
        const list = Array.isArray(data.reviews) ? data.reviews : [];
        if (list.length === 0) {
          cardsGrid.innerHTML = '<p style="color:#64748b; grid-column: 1 / -1; margin: 8px 0;">No reviews submitted yet for this venue. Be the first to share your feedback!</p>';
          return;
        }
        cardsGrid.innerHTML = list.map(r => {
          const stars = '★'.repeat(Math.max(1, Math.min(5, Number(r.rating) || 5))) + '☆'.repeat(5 - Math.max(1, Math.min(5, Number(r.rating) || 5)));
          const name = r.userName || 'Verified User';
          const initials = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
          const dStr = r.createdAt
            ? new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Recent';
          return `
            <article class="review-box">
              <div class="reviewer-meta-box">
                <div class="reviewer-avatar-img">${escapeHtml(initials)}</div>
                <div class="reviewer-info">
                  <strong>${escapeHtml(name)}</strong>
                  <span>${escapeHtml(dStr)}</span>
                </div>
              </div>
              <div class="review-stars-line">${stars}</div>
              <p class="review-text-content">"${escapeHtml(r.comment)}"</p>
              ${r.ownerResponse ? `
                <div style="margin-top:8px; padding:8px 10px; background:#f8fafc; border-left:3px solid #2563eb; border-radius:6px; font-size:0.82rem; color:#334155;">
                  <strong>Owner Reply:</strong> ${escapeHtml(r.ownerResponse)}
                </div>
              ` : ''}
            </article>
          `;
        }).join('');
      } catch (e) {
        cardsGrid.innerHTML = '<p style="color:#64748b; grid-column: 1 / -1; margin: 8px 0;">Unable to load reviews right now.</p>';
      }
    }

    function setupReviewForm() {
      const starBtns = document.querySelectorAll('#reviewStarPicker .star-pick-btn');
      const ratingInput = document.getElementById('reviewRatingInput');
      const ratingLabel = document.getElementById('selectedRatingLabel');
      const form = document.getElementById('venueReviewForm');
      const commentInput = document.getElementById('venueReviewComment');
      const statusMsg = document.getElementById('venueReviewStatusMsg');
      const submitBtn = document.getElementById('btnSubmitVenueReview');

      const paintStars = (val) => {
        starBtns.forEach(btn => {
          const r = Number(btn.getAttribute('data-rating'));
          btn.style.color = r <= val ? '#f59e0b' : '#cbd5e1';
        });
        if (ratingLabel) ratingLabel.textContent = `${val} / 5 Star${val === 1 ? '' : 's'}`;
      };

      starBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const val = Number(btn.getAttribute('data-rating')) || 5;
          if (ratingInput) ratingInput.value = String(val);
          paintStars(val);
        });
      });

      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          let currentUser = null;
          try {
            const raw = sessionStorage.getItem('venueverse_user') || localStorage.getItem('venueverse_user');
            if (raw) currentUser = JSON.parse(raw);
          } catch (err) {}

          if (!currentUser || !(currentUser._id || currentUser.id)) {
            alert('Please sign in to submit a review.');
            window.location.href = '../signin/signin.html?returnUrl=' + encodeURIComponent(window.location.href);
            return;
          }

          const rating = Number(ratingInput ? ratingInput.value : 5) || 5;
          const comment = commentInput ? commentInput.value.trim() : '';
          if (comment.length < 3) {
            if (statusMsg) statusMsg.textContent = 'Please enter at least 3 characters.';
            return;
          }

          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
          }
          if (statusMsg) statusMsg.textContent = '';

          try {
            const res = await fetch(`${API_BASE}/api/venues/${encodeURIComponent(venue.id)}/reviews`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'X-User-Id': currentUser._id || currentUser.id
              },
              body: JSON.stringify({ rating, comment })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              if (statusMsg) statusMsg.textContent = data.message || 'Could not submit review.';
              return;
            }
            if (commentInput) commentInput.value = '';
            if (ratingInput) ratingInput.value = '5';
            paintStars(5);
            if (statusMsg) {
              statusMsg.style.color = '#059669';
              statusMsg.textContent = 'Review added! Thank you for your feedback.';
            }
            updateRatingUI(data.venueRating, data.venueReviewsCount);
            await loadVenueReviews();
          } catch (err) {
            if (statusMsg) statusMsg.textContent = 'Connection error while saving review.';
          } finally {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Submit Review';
            }
          }
        });
      }
    }

    loadVenueReviews();
    setupReviewForm();

    const amenitiesGrid = document.getElementById('amenitiesGrid');
    if (amenitiesGrid && Array.isArray(venue.amenities) && venue.amenities.length > 0) {
      amenitiesGrid.innerHTML = venue.amenities.map(item => `
        <div class="amenity-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="amenity-svg"><polyline points="20 6 9 17 4 12"/></svg>
          <span>${item}</span>
        </div>
      `).join('');
    }

    const cardPriceValue = document.getElementById('cardPriceValue');
    const cardRatingScore = document.getElementById('cardRatingScore');
    const cardReviewsCount = document.getElementById('cardReviewsCount');

    const bookingDateInput = document.getElementById('bookingDateInput');
    const bookingEventTypeSelect = document.getElementById('bookingEventTypeSelect');
    const bookingGuestsInput = document.getElementById('bookingGuestsInput');

    if (bookingEventTypeSelect) {
      const requestedCategory = String(urlParams.get('category') || '').trim().toLowerCase();
      bookingEventTypeSelect.innerHTML = supportedCategories
        .map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(categoryLabel(cat))}</option>`)
        .join('');
      if (requestedCategory && supportedCategories.includes(requestedCategory)) {
        bookingEventTypeSelect.value = requestedCategory;
      } else if (supportedCategories.length > 0) {
        bookingEventTypeSelect.value = supportedCategories[0];
      }
    }
    const btnMinusGuest = document.getElementById('btnMinusGuest');
    const btnPlusGuest = document.getElementById('btnPlusGuest');

    const availabilityPill = document.getElementById('availabilityPill');
    const availabilityText = document.getElementById('availabilityText');

    const breakdownBaseLabel = document.getElementById('breakdownBaseLabel');
    const breakdownBaseVal = document.getElementById('breakdownBaseVal');
    const breakdownTotalVal = document.getElementById('breakdownTotalVal');
    const btnReserveVenue = document.getElementById('btnReserveVenue');

    updateRatingUI(venue.rating, venue.reviewsCount);

    function getLocalTodayStr(offsetDays = 0) {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function isCurrentUserVenueOwner() {
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

    if (bookingDateInput) {
      const today = getLocalTodayStr(0);
      bookingDateInput.min = today;
      bookingDateInput.value = getLocalTodayStr(1);
    }

    const maxGuests = Number(venue.capacity || 0);
    const guestLimitWarning = document.getElementById('guestLimitWarning');
    if (bookingGuestsInput && maxGuests > 0) {
      bookingGuestsInput.max = maxGuests;
      const initGuests = parseInt(bookingGuestsInput.value, 10) || 100;
      if (initGuests > maxGuests) {
        bookingGuestsInput.value = Math.max(10, maxGuests);
      }
    }

    if (btnMinusGuest && bookingGuestsInput) {
      btnMinusGuest.addEventListener('click', function () {
        const current = parseInt(bookingGuestsInput.value, 10) || 50;
        if (current > 10) {
          bookingGuestsInput.value = maxGuests > 0 ? Math.min(current - 10, maxGuests) : (current - 10);
          updateBookingSummary();
        }
      });
    }

    if (btnPlusGuest && bookingGuestsInput) {
      btnPlusGuest.addEventListener('click', function () {
        const current = parseInt(bookingGuestsInput.value, 10) || 50;
        const nextVal = current + 10;
        if (maxGuests > 0 && nextVal > maxGuests) {
          if (current < maxGuests) {
            bookingGuestsInput.value = maxGuests;
            updateBookingSummary();
          } else {
            if (guestLimitWarning) {
              guestLimitWarning.textContent = `Limit exceeded (Max: ${maxGuests} guests)`;
              guestLimitWarning.style.display = 'block';
            }
            if (availabilityPill && availabilityText) {
              availabilityPill.className = 'availability-badge booked';
              availabilityText.textContent = `Limit exceeded (Max capacity: ${maxGuests} guests)`;
            }
          }
          return;
        }
        bookingGuestsInput.value = nextVal;
        updateBookingSummary();
      });
    }

    function setReserveEnabled(enabled) {
      if (!btnReserveVenue) return;
      btnReserveVenue.disabled = !enabled;
      btnReserveVenue.style.opacity = enabled ? '1' : '0.5';
      btnReserveVenue.style.cursor = enabled ? 'pointer' : 'not-allowed';
    }

    function updateBookingSummary() {
      const selectedDate = bookingDateInput ? bookingDateInput.value : '';
      const guests = parseInt(bookingGuestsInput ? bookingGuestsInput.value : 50, 10) || 50;
      const todayStr = getLocalTodayStr(0);
      const isOwner = isCurrentUserVenueOwner();
      const overCapacity = maxGuests > 0 && guests > maxGuests;

      if (guestLimitWarning) {
        if (overCapacity) {
          guestLimitWarning.textContent = `Limit exceeded (Max: ${maxGuests} guests)`;
          guestLimitWarning.style.display = 'block';
        } else {
          guestLimitWarning.style.display = 'none';
        }
      }

      if (isOwner && availabilityPill && availabilityText) {
        availabilityPill.className = 'availability-badge booked';
        availabilityText.textContent = 'You own this venue — Owners cannot book their own space. Block dates in Owner Dashboard.';
        if (btnReserveVenue) {
          btnReserveVenue.disabled = true;
          btnReserveVenue.style.opacity = '0.55';
          btnReserveVenue.style.cursor = 'not-allowed';
          btnReserveVenue.textContent = 'Owner Cannot Book Own Venue';
        }
        if (!document.getElementById('ownerManageDatesHint')) {
          const link = document.createElement('a');
          link.id = 'ownerManageDatesHint';
          link.href = '../owner-dashboard/owner.html';
          link.style.cssText = 'display:block; margin-top:10px; text-align:center; padding:10px 14px; border-radius:10px; background:#eff6ff; color:#1d4ed8; font-weight:600; font-size:0.86rem; text-decoration:none; border:1px solid #bfdbfe;';
          link.textContent = 'Manage / Block Dates in Owner Dashboard →';
          if (btnReserveVenue && btnReserveVenue.parentNode) {
            btnReserveVenue.parentNode.insertBefore(link, btnReserveVenue.nextSibling);
          }
        }
      } else if (overCapacity && availabilityPill && availabilityText) {
        availabilityPill.className = 'availability-badge booked';
        availabilityText.textContent = `Limit exceeded (Max capacity: ${maxGuests} guests)`;
        setReserveEnabled(false);
      } else if (selectedDate && availabilityPill && availabilityText) {
        const isPast = selectedDate < todayStr;
        const isAvailable = (typeof venue.checkAvailability === 'function')
          ? venue.checkAvailability(selectedDate)
          : true;

        if (isPast) {
          availabilityPill.className = 'availability-badge booked';
          availabilityText.textContent = `Past date (${selectedDate}) is unavailable`;
          setReserveEnabled(false);
        } else if (!isAvailable) {
          availabilityPill.className = 'availability-badge booked';
          availabilityText.textContent = `Unavailable on ${selectedDate} (Booked or Blocked by Owner)`;
          setReserveEnabled(false);
        } else {
          availabilityPill.className = 'availability-badge available';
          availabilityText.textContent = `Available on ${selectedDate} • Instant Confirmation`;
          setReserveEnabled(true);
        }
      } else if (availabilityPill && availabilityText) {
        availabilityPill.className = 'availability-badge available';
        availabilityText.textContent = 'Select date to verify availability';
        setReserveEnabled(true);
      }

      const baseRate = Number(venue.basePrice || venue.price || 0);
      const finalTotal = Math.round(baseRate);

      if (cardPriceValue) cardPriceValue.textContent = baseRate.toLocaleString('en-IN');
      if (breakdownBaseLabel) breakdownBaseLabel.textContent = `₹${baseRate.toLocaleString('en-IN')} × 1 day`;
      if (breakdownBaseVal) breakdownBaseVal.textContent = `₹${baseRate.toLocaleString('en-IN')}`;
      if (breakdownTotalVal) breakdownTotalVal.textContent = `₹${finalTotal.toLocaleString('en-IN')}`;
    }

    if (bookingDateInput) bookingDateInput.addEventListener('change', updateBookingSummary);
    if (bookingGuestsInput) bookingGuestsInput.addEventListener('input', updateBookingSummary);

    if (btnReserveVenue) {
      btnReserveVenue.addEventListener('click', function () {
        if (isCurrentUserVenueOwner()) {
          alert('Venue Owners cannot book their own venue. Use Availability & Calendar in Owner Dashboard to block dates.');
          window.location.href = '../owner-dashboard/owner.html';
          return;
        }
        const dateVal = bookingDateInput ? bookingDateInput.value : '';
        if (!dateVal) {
          alert('Please select an event date before proceeding.');
          return;
        }
        if (dateVal < getLocalTodayStr(0)) {
          alert('Past dates are unavailable and cannot be booked.');
          return;
        }

        const guestsVal = parseInt(bookingGuestsInput ? bookingGuestsInput.value : 100, 10) || 100;
        if (maxGuests > 0 && guestsVal > maxGuests) {
          alert(`Limit exceeded! Maximum allowed guests for this venue is ${maxGuests}.`);
          return;
        }
        const eventTypeVal = bookingEventTypeSelect ? bookingEventTypeSelect.value : (supportedCategories[0] || '');
        window.location.href = `../checkout/checkout.html?id=${venue.id}&date=${dateVal}&guests=${guestsVal}&eventType=${encodeURIComponent(eventTypeVal)}`;
      });
    }

    updateBookingSummary();

    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', function () {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
          const originalText = shareBtn.querySelector('span').textContent;
          shareBtn.querySelector('span').textContent = 'Link Copied!';
          setTimeout(function () {
            shareBtn.querySelector('span').textContent = originalText;
          }, 2000);
        } else {
          alert('Venue link: ' + window.location.href);
        }
      });
    }

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        const svg = saveBtn.querySelector('svg');
        const isSaved = saveBtn.classList.toggle('is-saved');
        if (svg) {
          svg.style.fill = isSaved ? '#e61e4d' : 'none';
          svg.style.stroke = isSaved ? '#e61e4d' : 'currentColor';
        }
        saveBtn.querySelector('span').textContent = isSaved ? 'Saved' : 'Save';
      });
    }

    const mapContainer = document.getElementById('venueDetailMap');
    if (mapContainer && typeof L !== 'undefined') {
      const lat = venue.lat || 23.2156;
      const lng = venue.lng || 72.6369;

      const map = L.map('venueDetailMap', {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([lat, lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup(`<strong>${venue.title}</strong><br>${venue.location || 'Gujarat'}`).openPopup();
    }
  }

  loadVenueDetails();

});
