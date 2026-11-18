document.addEventListener('DOMContentLoaded', function () {

  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', function () {
      mobileToggle.classList.toggle('is-active');
      navMenu.classList.toggle('is-active');

      const isExpanded = mobileToggle.classList.contains('is-active');
      mobileToggle.setAttribute('aria-expanded', isExpanded);
    });

    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mobileToggle.classList.remove('is-active');
        navMenu.classList.remove('is-active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const locationInput = document.getElementById('locationInput');
  const locationDropdown = document.getElementById('locationDropdown');
  const locationSegment = document.getElementById('locationSegment');
  const cityChoices = document.querySelectorAll('.city-choice');

  if (locationInput && locationDropdown) {
    locationInput.addEventListener('focus', function () {
      locationDropdown.classList.add('is-open');
    });

    locationInput.addEventListener('click', function (e) {
      e.stopPropagation();
      locationDropdown.classList.add('is-open');
    });

    cityChoices.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const chosenCity = btn.getAttribute('data-city');
        locationInput.value = chosenCity;
        locationDropdown.classList.remove('is-open');
      });
    });

    document.addEventListener('click', function (event) {
      if (locationSegment && !locationSegment.contains(event.target)) {
        locationDropdown.classList.remove('is-open');
      }
    });
  }

  const dateInput = document.getElementById('dateInput');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }

  const tagChips = document.querySelectorAll('.tag-chip');
  const eventTypeSelect = document.getElementById('eventTypeSelect');

  if (eventTypeSelect) {
    eventTypeSelect.value = 'all';
    window.addEventListener('pageshow', function (event) {
      if (event.persisted) {
        eventTypeSelect.value = 'all';
      }
    });
  }

  tagChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      const selectedCategory = chip.getAttribute('data-category');
      if (eventTypeSelect && selectedCategory) {
        eventTypeSelect.value = selectedCategory;
        eventTypeSelect.focus();
      }
    });
  });

  const searchForm = document.getElementById('venueSearchForm');

  if (searchForm) {
    searchForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const location = locationInput ? locationInput.value.trim() : '';
      const eventType = eventTypeSelect ? eventTypeSelect.value : 'all';
      const eventDate = dateInput ? dateInput.value : '';
      const guests = document.getElementById('guestsInput') ? document.getElementById('guestsInput').value.trim() : '';

      const params = new URLSearchParams();
      params.set('category', eventType || 'all');
      if (location) params.set('location', location);
      if (eventDate) params.set('date', eventDate);
      if (guests) params.set('guests', guests);

      window.location.href = `venues/venues.html?${params.toString()}`;
    });
  }

  const featuredVenuesGrid = document.getElementById('featuredVenuesGrid');
  function renderEmptyFeaturedState() {
    if (!featuredVenuesGrid) return;
    featuredVenuesGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding:40px 20px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:16px; color:#64748b;">
        <p style="font-size:1rem; font-weight:600; color:#0f172a; margin-bottom:6px;">No venues added yet</p>
        <p style="font-size:0.88rem; margin-bottom:0;">Venues added by hosts will appear here once approved and published.</p>
      </div>
    `;
  }

  if (featuredVenuesGrid) {
    const apiBase = (window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:5000' : 'http://localhost:5000';
    fetch(`${apiBase}/api/venues`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) {
          renderEmptyFeaturedState();
          return;
        }
        const venues = Array.isArray(data) ? data : (data.venues || []);
        if (venues.length === 0) {
          renderEmptyFeaturedState();
          return;
        }

        featuredVenuesGrid.innerHTML = '';
        venues.slice(0, 4).forEach(v => {
          const vId = v._id || v.id;
          let img = (v.images && v.images.length) ? v.images[0] : 'assets/venue-ballroom.jpg';
          if (img.startsWith('../')) img = img.replace(/^\.\.\//, '');
          const price = v.pricePerDay || v.price || 0;
          const rNum = Number(v.rating || 0);
          const cNum = Number(v.reviewsCount || 0);
          const ratingLabel = (rNum > 0 && (v.reviewsCount === undefined || cNum > 0)) ? `★ ${rNum.toFixed(1)}` : 'No rating';
          const card = document.createElement('article');
          card.className = 'featured-item-card';
          card.style.cursor = 'pointer';
          card.innerHTML = `
            <div class="item-media-box">
              <img src="${img}" alt="${v.title}" class="item-photo" loading="lazy">
            </div>
            <div class="item-info-box">
              <div class="item-title-row">
                <h3 class="item-name">${v.title}</h3>
                <span class="item-rating">${ratingLabel}</span>
              </div>
              <p class="item-location">${v.city || 'Gujarat'}, India</p>
              <div class="item-price-row">
                <span class="item-price">₹${price.toLocaleString('en-IN')} <small>/ day</small></span>
                <span class="item-capacity">Up to ${v.capacity || 100} guests</span>
              </div>
            </div>
          `;
          card.addEventListener('click', () => {
            window.location.href = `venue-details/venue-details.html?id=${vId}`;
          });
          featuredVenuesGrid.appendChild(card);
        });
      })
      .catch(() => {
        renderEmptyFeaturedState();
      });
  }

  const categoryCards = document.querySelectorAll('.cat-photo-card');

  categoryCards.forEach(function (card) {
    card.addEventListener('click', function () {
      const selectedCategory = card.getAttribute('data-category') || 'birthday';
      window.location.href = `venues/venues.html?category=${selectedCategory}`;
    });
  });

  const featuredCards = document.querySelectorAll('.featured-item-card');
  featuredCards.forEach(function (card) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function () {
      window.location.href = 'venues/venues.html?category=all';
    });
  });

  const favoriteButtons = document.querySelectorAll('.btn-item-favorite, .btn-favorite');

  favoriteButtons.forEach(function (btn) {
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();

      btn.classList.toggle('is-liked');

      const isLiked = btn.classList.contains('is-liked');
      btn.setAttribute('aria-label', isLiked ? 'Remove from favorites' : 'Save to favorites');
    });
  });

  const navTrackLinks = document.querySelectorAll('.nav-link');
  const sectionsToTrack = [
    document.getElementById('explore'),
    document.getElementById('categories'),
    document.getElementById('featuredVenues'),
    document.getElementById('how-it-works')
  ].filter(Boolean);

  let isClickScrolling = false;
  let clickScrollTimer = null;

  function updateActiveNavLink() {
    if (isClickScrolling) return;

    const scrollY = window.pageYOffset || window.scrollY;
    const headerHeight = 85;
    const triggerPos = scrollY + headerHeight + 60;

    let currentSectionId = '';

    for (let i = sectionsToTrack.length - 1; i >= 0; i--) {
      const section = sectionsToTrack[i];
      if (triggerPos >= section.offsetTop) {
        currentSectionId = section.getAttribute('id');
        break;
      }
    }

    if (scrollY < 140 && sectionsToTrack.length > 0) {
      currentSectionId = sectionsToTrack[0].getAttribute('id');
    }

    if (window.innerHeight + scrollY >= document.body.offsetHeight - 50) {
      currentSectionId = sectionsToTrack[sectionsToTrack.length - 1].getAttribute('id');
    }

    if (currentSectionId) {
      navTrackLinks.forEach(function (link) {
        const href = link.getAttribute('href');
        if (href === '#' + currentSectionId) {
          link.classList.add('active');
        } else if (href && href.startsWith('#')) {
          link.classList.remove('active');
        }
      });
    }
  }

  window.addEventListener('scroll', updateActiveNavLink, { passive: true });

  navTrackLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      const targetHref = link.getAttribute('href');
      if (targetHref && targetHref.startsWith('#')) {
        const targetSection = document.querySelector(targetHref);
        if (targetSection) {
          e.preventDefault();

          isClickScrolling = true;
          if (clickScrollTimer) clearTimeout(clickScrollTimer);

          navTrackLinks.forEach(function (l) { l.classList.remove('active'); });
          link.classList.add('active');

          const headerHeight = 80;
          const targetY = targetSection.getBoundingClientRect().top + window.pageYOffset - headerHeight;

          window.scrollTo({
            top: targetY,
            behavior: 'smooth'
          });

          clickScrollTimer = setTimeout(function () {
            isClickScrolling = false;
          }, 800);
        }
      }
    });
  });

  updateActiveNavLink();

  const reviewsCarousel = document.getElementById('reviewsCarousel');
  const reviewsTrack = document.getElementById('reviewsTrack');
  const reviewPrevBtn = document.getElementById('reviewPrevBtn');
  const reviewNextBtn = document.getElementById('reviewNextBtn');
  const reviewsWrapper = document.getElementById('reviewsWrapper');
  const carouselDotsContainer = document.getElementById('carouselDots');

  function escHtml(val) {
    return String(val === null || val === undefined ? '' : val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function initReviewsCarouselControls() {
    if (!reviewsCarousel) return;
    const reviewCards = reviewsCarousel.querySelectorAll('.review-card');
    if (reviewCards.length === 0) {
      if (reviewPrevBtn) reviewPrevBtn.style.display = 'none';
      if (reviewNextBtn) reviewNextBtn.style.display = 'none';
      if (carouselDotsContainer) carouselDotsContainer.innerHTML = '';
      return;
    }

    if (reviewPrevBtn) reviewPrevBtn.style.display = '';
    if (reviewNextBtn) reviewNextBtn.style.display = '';

    let autoScrollTimer = null;
    const AUTO_SCROLL_DELAY = 3500;

    function getScrollAmount() {
      const firstCard = reviewCards[0];
      return firstCard ? (firstCard.offsetWidth + 24) : 380;
    }

    function slideNext() {
      const maxScrollLeft = reviewsCarousel.scrollWidth - reviewsCarousel.clientWidth;
      if (reviewsCarousel.scrollLeft >= maxScrollLeft - 15) {
        reviewsCarousel.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        reviewsCarousel.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
      }
    }

    function slidePrev() {
      if (reviewsCarousel.scrollLeft <= 15) {
        const maxScrollLeft = reviewsCarousel.scrollWidth - reviewsCarousel.clientWidth;
        reviewsCarousel.scrollTo({ left: maxScrollLeft, behavior: 'smooth' });
      } else {
        reviewsCarousel.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
      }
    }

    if (reviewNextBtn) reviewNextBtn.addEventListener('click', slideNext);
    if (reviewPrevBtn) reviewPrevBtn.addEventListener('click', slidePrev);

    function startAutoScroll() {
      if (!autoScrollTimer && reviewCards.length > 1) {
        autoScrollTimer = setInterval(slideNext, AUTO_SCROLL_DELAY);
      }
    }

    function stopAutoScroll() {
      if (autoScrollTimer) {
        clearInterval(autoScrollTimer);
        autoScrollTimer = null;
      }
    }

    if (reviewsWrapper) {
      reviewsWrapper.addEventListener('mouseenter', stopAutoScroll);
      reviewsWrapper.addEventListener('mouseleave', startAutoScroll);
      reviewsWrapper.addEventListener('touchstart', stopAutoScroll, { passive: true });
      reviewsWrapper.addEventListener('touchend', startAutoScroll, { passive: true });
    }

    if (carouselDotsContainer) {
      carouselDotsContainer.innerHTML = '';
      reviewCards.forEach(function (_, index) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = index === 0 ? 'carousel-dot active' : 'carousel-dot';
        dot.setAttribute('aria-label', `Go to review ${index + 1}`);
        dot.addEventListener('click', function () {
          reviewsCarousel.scrollTo({ left: index * getScrollAmount(), behavior: 'smooth' });
        });
        carouselDotsContainer.appendChild(dot);
      });

      reviewsCarousel.addEventListener('scroll', function () {
        const dots = carouselDotsContainer.querySelectorAll('.carousel-dot');
        const scrollStep = getScrollAmount();
        const activeIndex = Math.min(Math.round(reviewsCarousel.scrollLeft / scrollStep), dots.length - 1);
        dots.forEach((dot, i) => dot.classList.toggle('active', i === activeIndex));
      }, { passive: true });
    }

    startAutoScroll();
  }

  function renderEmptyReviewsBanner() {
    if (!reviewsTrack) return;
    reviewsTrack.innerHTML = `
      <div style="width:100%; text-align:center; padding:36px 20px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:16px; color:#64748b;">
        <p style="font-size:1rem; font-weight:600; color:#0f172a; margin-bottom:6px;">No venue reviews yet</p>
        <p style="font-size:0.88rem; margin:0;">Open any venue page to submit the first verified customer review.</p>
      </div>
    `;
    initReviewsCarouselControls();
  }

  if (reviewsCarousel && reviewsTrack) {
    const apiBase = (window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:5000' : 'http://localhost:5000';
    fetch(`${apiBase}/api/reviews/top?limit=6`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const reviews = data && Array.isArray(data.reviews) ? data.reviews : [];
        if (reviews.length === 0) {
          renderEmptyReviewsBanner();
          return;
        }
        const displayReviews = shuffleArray(reviews);
        reviewsTrack.innerHTML = displayReviews.map(r => {
          const starsCount = Math.max(1, Math.min(5, Number(r.rating) || 5));
          const starsStr = '★'.repeat(starsCount) + '☆'.repeat(5 - starsCount);
          const initials = (r.userName || 'U').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
          const venueLink = r.venueId ? `venue-details/venue-details.html?id=${encodeURIComponent(r.venueId)}#reviewsSection` : 'venues/venues.html';
          const metaLabel = [r.venueTitle || 'Verified Venue', r.venueCity || ''].filter(Boolean).join(' • ');
          return `
            <article class="review-card" style="cursor:pointer;" onclick="window.location.href='${venueLink}';">
              <div class="review-card-layout">
                <div class="reviewer-avatar-box" style="display:flex; align-items:center; justify-content:center; background:#eff6ff; color:#1d4ed8; font-weight:700; font-size:1.1rem;">
                  ${escHtml(initials)}
                </div>
                <div class="review-card-body">
                  <div class="review-stars" aria-label="${starsCount} out of 5 stars">${starsStr}</div>
                  <p class="review-quote">"${escHtml(r.comment)}"</p>
                  <div class="reviewer-meta">
                    <h3 class="reviewer-name">${escHtml(r.userName || 'Verified User')}</h3>
                    <span class="reviewer-event">${escHtml(metaLabel)}</span>
                  </div>
                </div>
              </div>
            </article>
          `;
        }).join('');
        initReviewsCarouselControls();
      })
      .catch(() => {
        renderEmptyReviewsBanner();
      });
  }

});

