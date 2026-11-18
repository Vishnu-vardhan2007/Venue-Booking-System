const API_BASE = (window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:5000' : 'http://localhost:5000';

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const raw = sessionStorage.getItem('venueverse_user') || localStorage.getItem('venueverse_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u._id || u.id) headers['X-User-Id'] = u._id || u.id;
    }
  } catch (e) {}
  return headers;
}

function normalizeImagePath(img) {
  if (!img) return '../assets/venue-ballroom.jpg';
  if (img.startsWith('../') || img.startsWith('http') || img.startsWith('data:')) return img;
  return '../' + img;
}

function escapeHtml(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getLocalTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateFriendly(dateVal) {
  if (!dateVal) return 'Date';
  const str = String(dateVal);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [y, m, d] = str.substring(0, 10).split('-').map(Number);
    const local = new Date(y, m - 1, d);
    if (!isNaN(local.getTime())) {
      return local.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toIsoDateKey(dateVal) {
  if (!dateVal) return '';
  const str = String(dateVal);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getVenueStatusMeta(v) {
  const raw = String((v && v.status) || 'approved').trim().toLowerCase();
  const isActive = v && v.isActive !== false;
  if (raw === 'pending') {
    return { raw, isApproved: false, isPending: true, isRejected: false, badgeClass: 'pending', label: 'Pending Admin Approval', cardStatus: 'pending' };
  }
  if (raw === 'rejected') {
    return { raw, isApproved: false, isPending: false, isRejected: true, badgeClass: 'cancelled', label: 'Rejected by Admin', cardStatus: 'draft' };
  }
  return { raw, isApproved: true, isPending: false, isRejected: false, badgeClass: 'approved', label: 'Approved by Admin', cardStatus: isActive ? 'published' : 'draft' };
}

function getBookingStatusDisplay(b) {
  const statusLower = String((b && b.status) || 'confirmed').trim().toLowerCase();
  const cancelledBy = String((b && b.cancelledBy) || '').trim().toLowerCase();
  if (statusLower === 'cancelled') {
    if (cancelledBy === 'admin') return { statusLower, badgeClass: 'cancelled', label: 'Cancelled by Admin' };
    if (cancelledBy === 'user') return { statusLower, badgeClass: 'cancelled', label: 'Cancelled by User' };
    if (cancelledBy === 'host') return { statusLower, badgeClass: 'cancelled', label: 'Cancelled by Owner' };
    return { statusLower, badgeClass: 'cancelled', label: 'Cancelled' };
  }
  if (statusLower === 'rejected') return { statusLower, badgeClass: 'cancelled', label: 'Rejected by Admin' };
  if (statusLower === 'completed') return { statusLower, badgeClass: 'approved', label: 'Completed' };
  if (statusLower === 'pending') return { statusLower, badgeClass: 'pending', label: 'Pending' };
  return { statusLower, badgeClass: 'confirmed', label: 'Confirmed' };
}

const viewTitles = {
  overview: { title: 'Venue Owner Dashboard', subtitle: 'Overview of your venues, bookings & earnings.' },
  venues: { title: 'My Venues Management', subtitle: 'Manage your venue listings, pricing, and availability status.' },
  bookings: { title: 'Bookings Management', subtitle: 'Track all instant reservations placed by customers.' },
  calendar: { title: 'Availability & Calendar', subtitle: 'View confirmed reservations across your venue schedule.' },
  earnings: { title: 'Earnings & Payments', subtitle: 'Track received customer payments and transaction history.' },
  analytics: { title: 'Venue Performance & Analytics', subtitle: 'Booking volume breakdowns and venue popularity.' },
  reviews: { title: 'Customer Reviews & Ratings', subtitle: 'Read verified customer feedback and publish your responses.' },
  notifications: { title: 'Host Notifications', subtitle: 'Alerts on confirmed bookings and listing updates.' },
  settings: { title: 'Host Profile & Settings', subtitle: 'Manage contact details, business profile, and operational preferences.' }
};

async function performOwnerLogout() {
  if (!confirm('Are you sure you want to log out of the Venue Owner Dashboard?')) return;
  const headers = getAuthHeaders();
  ['venueverse_user', 'venueverse_pending_checkout'].forEach(key => {
    try { sessionStorage.removeItem(key); } catch (e) {}
    try { localStorage.removeItem(key); } catch (e) {}
  });
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers,
      credentials: 'include',
      signal: controller.signal
    });
    clearTimeout(timer);
  } catch (e) {}
  window.location.replace('../index.html');
}

function switchDashboardView(viewKey) {
  if (viewKey === 'logout') {
    performOwnerLogout();
    return;
  }

  if (!viewTitles[viewKey]) return;

  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-view') === viewKey);
  });

  document.querySelectorAll('.dashboard-view').forEach(view => {
    view.classList.remove('active');
  });

  const targetView = document.getElementById('view-' + viewKey);
  if (targetView) targetView.classList.add('active');

  const titleEl = document.getElementById('topbarPageTitle');
  const subEl = document.getElementById('topbarPageSubtitle');
  if (titleEl) titleEl.textContent = viewTitles[viewKey].title;
  if (subEl) subEl.textContent = viewTitles[viewKey].subtitle;

  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeMobileSidebar();
}

let hostVenuesList = [];
let hostBookingsList = [];
const venueDataStore = {};
const bookingDataStore = {};
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();
let selectedCalendarVenueId = 'all';

function filterBookings(filterType, btn) {
  if (btn) {
    document.querySelectorAll('#bookingFilterTabs .filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  const rows = document.querySelectorAll('#bookingsTableTbody tr[data-status]');
  let visibleCount = 0;

  rows.forEach(row => {
    const status = (row.getAttribute('data-status') || '').toLowerCase();
    const show = (filterType === 'all') || (status === filterType);
    row.style.display = show ? '' : 'none';
    if (show) visibleCount++;
  });

  const emptyEl = document.getElementById('bookingTableEmptyState');
  if (emptyEl) emptyEl.style.display = (visibleCount === 0 && rows.length > 0) ? 'block' : 'none';
}

function searchBookings(query) {
  const q = query.trim().toLowerCase();
  const rows = document.querySelectorAll('#bookingsTableTbody tr[data-status]');
  let visibleCount = 0;

  rows.forEach(row => {
    const show = row.textContent.toLowerCase().includes(q);
    row.style.display = show ? '' : 'none';
    if (show) visibleCount++;
  });

  const emptyEl = document.getElementById('bookingTableEmptyState');
  if (emptyEl) emptyEl.style.display = (visibleCount === 0 && rows.length > 0) ? 'block' : 'none';
}

function filterVenues(category, btn) {
  if (btn) {
    document.querySelectorAll('#venueFilterTabs .filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  const cards = document.querySelectorAll('#myVenuesGrid .venue-card');
  cards.forEach(card => {
    const status = card.getAttribute('data-status');
    const show = (category === 'all') || (status === category);
    card.style.display = show ? 'flex' : 'none';
  });
}

function filterCalendarVenue(venueId) {
  selectedCalendarVenueId = venueId || 'all';
  renderCalendar();
}

window.toggleVenuePublish = async function (venueId) {
  try {
    const res = await fetch(`${API_BASE}/api/venues/${encodeURIComponent(venueId)}/toggle-status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.message || 'Failed to update venue status.');
      return;
    }
    const data = await res.json();
    const updatedVenue = (data && data.venue) ? data.venue : data;
    showToast(`Venue is now ${updatedVenue.isActive !== false ? 'Published (visible to users)' : 'Moved to Drafts'}.`);
    loadHostData();
  } catch (e) {
    alert('Connection error updating venue status.');
  }
};

window.toggleVenueBlockedDate = async function (venueId, dateKey, action) {
  try {
    const shouldBlock = action === 'block';
    const res = await fetch(`${API_BASE}/api/venues/${encodeURIComponent(venueId)}/blocked-dates`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ date: dateKey, action, blocked: shouldBlock })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.message || 'Failed to update date availability.');
      return;
    }
    const label = formatDateFriendly(dateKey);
    showToast(action === 'block'
      ? `Blocked ${label} on your venue calendar.`
      : `Unblocked ${label} — customers can book again.`);
    await loadHostData();
    showCalendarDayDetail(dateKey);
  } catch (e) {
    alert('Connection error updating blocked date.');
  }
};

window.deleteHostVenue = async function (venueId, title) {
  if (!confirm(`Are you sure you want to delete "${title}"? This will remove it from the platform.`)) return;
  try {
    const res = await fetch(`${API_BASE}/api/venues/${venueId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) {
      alert('Failed to delete venue.');
      return;
    }
    showToast(`Venue "${title}" deleted.`);
    loadHostData();
  } catch (e) {
    alert('Connection error deleting venue.');
  }
};

async function loadHostData() {
  const headers = getAuthHeaders();
  try {
    const [vRes, bRes, rRes] = await Promise.all([
      fetch(`${API_BASE}/api/venues/my`, { headers, credentials: 'include' }),
      fetch(`${API_BASE}/api/bookings/host`, { headers, credentials: 'include' }),
      fetch(`${API_BASE}/api/reviews/owner`, { headers, credentials: 'include' }).catch(() => null)
    ]);

    if (vRes.status === 401 || bRes.status === 401 || vRes.status === 403 || bRes.status === 403) {
      sessionStorage.removeItem('venueverse_user');
      localStorage.removeItem('venueverse_user');
      window.location.replace('../index.html');
      return;
    }

    let venues = [];
    if (vRes.ok) {
      const vData = await vRes.json();
      venues = Array.isArray(vData) ? vData : (vData && vData.venues ? vData.venues : []);
    }

    let bookings = [];
    if (bRes.ok) {
      const bData = await bRes.json();
      bookings = Array.isArray(bData) ? bData : (bData && bData.bookings ? bData.bookings : []);
    }

    let reviews = [];
    if (rRes && rRes.ok) {
      const rData = await rRes.json();
      reviews = Array.isArray(rData) ? rData : (rData && rData.reviews ? rData.reviews : []);
    }

    hostVenuesList = venues;
    hostBookingsList = bookings;

    renderStats(venues, bookings);
    renderVenuesGrid(venues);
    renderBookingsTables(bookings);
    renderEarnings(bookings);
    renderAnalytics(venues, bookings);
    renderCalendarSelector(venues);
    renderCalendar();
    renderNotifications(venues, bookings);
    renderOwnerReviews(reviews);
  } catch (err) {
    console.error('Error loading host dashboard data:', err);
  }
}

window.submitOwnerReviewReply = async function (reviewId) {
  const input = document.getElementById(`ownerReplyInput-${reviewId}`);
  const text = input ? input.value.trim() : '';
  if (!text) {
    alert('Please write a response before sending.');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/reviews/${encodeURIComponent(reviewId)}/response`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ response: text })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.message || 'Failed to save response.');
      return;
    }
    showToast('Response published!');
    loadHostData();
  } catch (e) {
    alert('Connection error saving review response.');
  }
};

function renderOwnerReviews(reviews) {
  const container = document.getElementById('reviewsContainer');
  if (!container) return;
  if (!Array.isArray(reviews) || reviews.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:32px; color:#6b7280;">No customer reviews received yet. Verified reviews will appear here.</div>';
    return;
  }
  container.innerHTML = reviews.map(r => {
    const rId = String(r._id || r.id || '');
    const stars = '★'.repeat(Math.max(1, Math.min(5, Number(r.rating) || 5))) + '☆'.repeat(5 - Math.max(1, Math.min(5, Number(r.rating) || 5)));
    const dateLabel = formatDateFriendly(r.createdAt);
    return `
      <div class="review-item" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; margin-bottom:8px;">
          <div>
            <strong style="color:#0f172a;">${escapeHtml(r.userName || 'Guest User')}</strong>
            <span style="font-size:0.8rem; color:#64748b; margin-left:8px;">on ${escapeHtml(r.venueTitle || 'Venue')} • ${escapeHtml(dateLabel)}</span>
          </div>
          <span style="color:#f59e0b; font-weight:700; letter-spacing:1px;">${stars} (${Number(r.rating) || 5}/5)</span>
        </div>
        <p style="margin:0 0 10px; color:#334155; font-size:0.9rem; line-height:1.5;">"${escapeHtml(r.comment)}"</p>
        ${r.ownerResponse ? `
          <div class="review-response-box" style="background:#f8fafc; border-left:3px solid #2563eb; padding:10px 12px; border-radius:6px; font-size:0.84rem; color:#1e293b;">
            <strong>Your Reply:</strong> ${escapeHtml(r.ownerResponse)}
          </div>
        ` : `
          <div style="display:flex; gap:8px; margin-top:8px;">
            <input type="text" id="ownerReplyInput-${escapeHtml(rId)}" class="form-control" placeholder="Write a public reply to this review..." style="flex:1; font-size:0.84rem; padding:6px 10px;">
            <button type="button" class="btn-sm btn-primary" onclick="submitOwnerReviewReply('${escapeHtml(rId)}');">Reply</button>
          </div>
        `}
      </div>
    `;
  }).join('');
}

function renderStats(venues, bookings) {
  const activeVenues = venues.filter(v => v.isActive !== false && (v.status || '').toLowerCase() !== 'rejected').length;
  const confirmedBookings = bookings.filter(b => (b.status || '').toLowerCase() === 'confirmed').length;
  const completedBookings = bookings.filter(b => (b.status || '').toLowerCase() === 'completed').length;
  const totalEarnings = bookings
    .filter(b => ['confirmed', 'completed'].includes((b.status || '').toLowerCase()))
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setEl('statTotalVenues', venues.length);
  setEl('statTotalBookings', bookings.length);
  setEl('statUpcomingBookings', confirmedBookings);
  setEl('statActiveVenues', activeVenues);
  setEl('statConfirmedBookings', confirmedBookings + completedBookings);
  setEl('statTotalEarnings', '₹' + totalEarnings.toLocaleString('en-IN'));
}

function renderVenuesGrid(venues) {
  const myVenuesGrid = document.getElementById('myVenuesGrid');
  if (!myVenuesGrid) return;

  myVenuesGrid.innerHTML = '';
  if (venues.length === 0) {
    myVenuesGrid.innerHTML = `
      <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:32px; color:#6b7280; text-align:center; grid-column:1 / -1;">
        You haven't listed any venues yet. Click "+ Add New Venue" above to list your first space.
      </div>
    `;
    return;
  }

  venues.forEach(v => {
    const vId = String(v.id || v._id || '');
    const isActive = v.isActive !== false;
    const statusMeta = getVenueStatusMeta(v);
    const imgSrc = normalizeImagePath((v.images && v.images.length) ? v.images[0] : v.image);
    const catList = (Array.isArray(v.categories) && v.categories.length)
      ? v.categories
      : [v.category || 'venue'];
    const catBadgeText = catList.map(c => String(c || '').toUpperCase()).filter(Boolean).join(' • ') || 'VENUE';

    venueDataStore[vId] = {
      id: vId,
      name: v.title,
      category: catBadgeText,
      location: `${v.address || ''}${v.address && v.city ? ', ' : ''}${v.city || 'Gujarat'}`,
      capacity: `${v.capacity || 100} Guests`,
      price: `₹${(v.pricePerDay || v.price || 0).toLocaleString('en-IN')} / day`,
      amenities: (v.amenities && v.amenities.length) ? v.amenities.join(', ') : 'Standard Amenities',
      desc: v.description || 'Verified event space available for instant booking.'
    };

    const card = document.createElement('div');
    card.className = 'venue-card';
    card.setAttribute('data-id', vId);
    card.setAttribute('data-status', statusMeta.cardStatus);
    card.style.display = 'flex';
    const visibilityBadge = statusMeta.isApproved
      ? `<span class="status-badge ${isActive ? 'published' : 'draft'}">${isActive ? 'Published' : 'Draft'}</span>`
      : '';
    const publishControl = statusMeta.isPending
      ? `<button type="button" class="btn-sm btn-outline" disabled title="Waiting for Admin approval" style="opacity:0.6; cursor:not-allowed;">Awaiting Admin</button>`
      : (statusMeta.isRejected
        ? `<button type="button" class="btn-sm btn-outline" disabled title="Rejected by Admin" style="opacity:0.65; cursor:not-allowed; color:#dc2626; border-color:#fecaca;">Rejected</button>`
        : `<button type="button" class="btn-sm btn-outline" onclick="toggleVenuePublish('${escapeHtml(vId)}');">${isActive ? 'Unpublish' : 'Publish'}</button>`);

    card.innerHTML = `
      <div class="venue-thumbnail-box">
        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(v.title)}" style="width:100%; height:160px; object-fit:cover;">
        <span class="venue-category-badge">${escapeHtml(catBadgeText)}</span>
      </div>
      <div class="venue-card-body">
        <h3 class="venue-name">${escapeHtml(v.title)}</h3>
        <div class="venue-location">
          <span>📍 ${escapeHtml(v.city || 'Gujarat')}</span>
        </div>
        <div class="venue-meta-details">
          <div class="meta-row">
            <span class="meta-label">Capacity &amp; Rate:</span>
            <span class="meta-value">${Number(v.capacity || 100)} Guests • ₹${Number(v.pricePerDay || v.price || 0).toLocaleString('en-IN')}/day</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Booking Mode:</span>
            <span class="meta-value">Instant Confirmation</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Approval &amp; Status:</span>
            <span class="meta-value">
              ${visibilityBadge}
              <span class="status-badge ${statusMeta.badgeClass}" style="${visibilityBadge ? 'margin-left:4px;' : ''}">${escapeHtml(statusMeta.label)}</span>
            </span>
          </div>
        </div>
        <div class="venue-card-actions" style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" class="btn-sm btn-secondary" onclick="viewVenueDetailsModal('${escapeHtml(vId)}');">Details</button>
          ${publishControl}
          <button type="button" class="btn-sm btn-danger" onclick="deleteHostVenue('${escapeHtml(vId)}', '${escapeHtml((v.title || '').replace(/'/g, "\\'"))}');">Delete</button>
        </div>
      </div>
    `;
    myVenuesGrid.appendChild(card);
  });
}

function renderBookingsTables(bookings) {
  const bkgTbody = document.getElementById('bookingsTableTbody');
  const overviewTbody = document.getElementById('overviewRecentBookingsTbody');

  if (bkgTbody) bkgTbody.innerHTML = '';
  if (overviewTbody) overviewTbody.innerHTML = '';

  if (bookings.length === 0) {
    if (bkgTbody) bkgTbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:32px; color:#6b7280;">No reservations recorded yet for your venues.</td></tr>';
    if (overviewTbody) overviewTbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:32px; color:#6b7280;">No recent bookings for your venues.</td></tr>';
    return;
  }

  bookings.forEach((b, idx) => {
    const bId = String(b.id || b._id || '');
    const statusDisp = getBookingStatusDisplay(b);
    const statusLower = statusDisp.statusLower;
    const friendlyDate = formatDateFriendly(b.bookingDate || b.startDate);
    const guestCount = b.guests || b.guestCount || 1;
    const total = b.totalPrice || 0;

    const eventTypeLabel = b.eventType
      ? String(b.eventType).trim().replace(/^./, ch => ch.toUpperCase())
      : '';

    bookingDataStore[bId] = {
      id: bId,
      customer: `${b.userName || 'Customer'}${b.userEmail ? ` (${b.userEmail})` : ''}`,
      venue: eventTypeLabel ? `${b.venueTitle || 'Venue'} (${eventTypeLabel})` : (b.venueTitle || 'Venue'),
      date: friendlyDate,
      guests: `${guestCount} Guests`,
      amount: `₹${Number(total).toLocaleString('en-IN')}`,
      contact: b.contact || b.userEmail || 'N/A',
      message: b.hostMessage || 'No special note added.',
      status: statusDisp.label.toUpperCase()
    };

    const badgeClass = statusDisp.badgeClass;

    if (bkgTbody) {
      const tr = document.createElement('tr');
      tr.setAttribute('data-status', statusLower);
      tr.innerHTML = `
        <td style="font-family:monospace; font-weight:600; color:#2563eb;">#${escapeHtml(bId.substring(0, 8))}</td>
        <td><strong>${escapeHtml(b.userName || 'Customer')}</strong><div style="font-size:0.75rem; color:#6b7280;">${escapeHtml(b.contact || b.userEmail || '')}</div></td>
        <td>${escapeHtml(b.venueTitle || 'Venue')}${eventTypeLabel ? `<div style="font-size:0.74rem; color:#2563eb; font-weight:600;">Event: ${escapeHtml(eventTypeLabel)}</div>` : ''}</td>
        <td>${escapeHtml(friendlyDate)}</td>
        <td>${Number(guestCount)} Guests</td>
        <td><strong>₹${Number(total).toLocaleString('en-IN')}</strong></td>
        <td><span class="status-badge ${statusLower === 'cancelled' ? 'cancelled' : 'confirmed'}">${statusLower === 'cancelled' ? 'Refunded' : 'Paid'}</span></td>
        <td><span class="status-badge ${badgeClass}">${escapeHtml(statusDisp.label)}</span></td>
        <td style="text-align:right;">
          <button type="button" class="btn-sm btn-secondary" onclick="viewBookingDetailsModal('${escapeHtml(bId)}');">Details</button>
        </td>
      `;
      bkgTbody.appendChild(tr);
    }

    if (overviewTbody && idx < 6) {
      const rtr = document.createElement('tr');
      rtr.innerHTML = `
        <td style="font-family:monospace; font-weight:600; color:#2563eb;">#${escapeHtml(bId.substring(0, 8))}</td>
        <td><strong>${escapeHtml(b.userName || 'Customer')}</strong></td>
        <td>${escapeHtml(b.venueTitle || 'Venue')}</td>
        <td>${escapeHtml(friendlyDate)}</td>
        <td><strong>₹${Number(total).toLocaleString('en-IN')}</strong></td>
        <td><span class="status-badge ${badgeClass}">${escapeHtml(statusDisp.label)}</span></td>
        <td style="text-align:right;">
          <button type="button" class="btn-sm btn-secondary" onclick="viewBookingDetailsModal('${escapeHtml(bId)}');">View</button>
        </td>
      `;
      overviewTbody.appendChild(rtr);
    }
  });
}

function renderEarnings(bookings) {
  const received = bookings
    .filter(b => ['confirmed', 'completed'].includes((b.status || '').toLowerCase()))
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const refunded = bookings
    .filter(b => ['cancelled', 'rejected'].includes((b.status || '').toLowerCase()))
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setEl('earnTotalReceived', '₹' + received.toLocaleString('en-IN'));
  setEl('earnPendingDeposits', '₹0');
  setEl('earnTotalRefunded', '₹' + refunded.toLocaleString('en-IN'));

  const tbody = document.getElementById('earningsTransactionsTbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (bookings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:32px; color:#6b7280;">No payment transactions recorded.</td></tr>';
    return;
  }

  bookings.forEach(b => {
    const bId = b.id || b._id || '';
    const statusLower = (b.status || 'confirmed').toLowerCase();
    const isCancelled = statusLower === 'cancelled' || statusLower === 'rejected';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:monospace;">TXN-${bId.substring(0, 6).toUpperCase()}</td>
      <td>#${bId.substring(0, 8)}</td>
      <td>${b.userName || 'Customer'}</td>
      <td>${b.venueTitle || 'Venue'}</td>
      <td>${formatDateFriendly(b.bookingDate || b.startDate)}</td>
      <td><strong>₹${(b.totalPrice || 0).toLocaleString('en-IN')}</strong></td>
      <td><span class="status-badge ${isCancelled ? 'cancelled' : 'confirmed'}">${isCancelled ? 'Refunded' : 'Settled'}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAnalytics(venues, bookings) {
  const total = bookings.length || 0;
  const confirmed = bookings.filter(b => ['confirmed', 'completed'].includes((b.status || '').toLowerCase())).length;
  const cancelled = bookings.filter(b => ['cancelled', 'rejected'].includes((b.status || '').toLowerCase())).length;

  const confPct = total > 0 ? Math.round((confirmed / total) * 100) : 0;
  const cancPct = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  const confCountEl = document.getElementById('analyticsConfirmedCount');
  const confBarEl = document.getElementById('analyticsConfirmedBar');
  const cancCountEl = document.getElementById('analyticsCancelledCount');
  const cancBarEl = document.getElementById('analyticsCancelledBar');

  if (confCountEl) confCountEl.textContent = `${confirmed} Bookings (${confPct}%)`;
  if (confBarEl) confBarEl.style.width = `${confPct}%`;
  if (cancCountEl) cancCountEl.textContent = `${cancelled} Cancelled (${cancPct}%)`;
  if (cancBarEl) cancBarEl.style.width = `${cancPct}%`;

  const topListEl = document.getElementById('ownerTopVenuesList');
  if (!topListEl) return;

  if (venues.length === 0) {
    topListEl.innerHTML = '<div style="color:#6b7280; font-size:0.88rem; padding:12px 0;">No venues listed yet.</div>';
    return;
  }

  const venueStats = venues.map(v => {
    const vId = v.id || v._id;
    const vBookings = bookings.filter(b => b.venue === vId && (b.status || '').toLowerCase() !== 'cancelled');
    const rev = vBookings.reduce((s, b) => s + (b.totalPrice || 0), 0);
    return { title: v.title, count: vBookings.length, rev };
  }).sort((a, b) => b.count - a.count || b.rev - a.rev);

  topListEl.innerHTML = venueStats.slice(0, 5).map((item, idx) => `
    <div class="meta-row">
      <span class="meta-label">${idx + 1}. ${item.title}</span>
      <span class="meta-value">${item.count} booking${item.count === 1 ? '' : 's'} • ₹${item.rev.toLocaleString('en-IN')}</span>
    </div>
  `).join('');
}

function renderCalendarSelector(venues) {
  const calSelect = document.getElementById('calendarVenueSelect');
  if (!calSelect) return;
  const prevVal = selectedCalendarVenueId;
  calSelect.innerHTML = '';
  if (venues.length === 0) {
    calSelect.innerHTML = '<option value="all">No venues listed yet</option>';
    return;
  }
  calSelect.innerHTML = `<option value="all">All My Venues (${venues.length})</option>`;
  venues.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.id || v._id;
    opt.textContent = v.title;
    calSelect.appendChild(opt);
  });
  if (prevVal && calSelect.querySelector(`option[value="${prevVal}"]`)) {
    calSelect.value = prevVal;
  }
}

let selectedCalendarDateKey = null;

function getFilteredCalendarVenues() {
  if (selectedCalendarVenueId === 'all') return hostVenuesList;
  return hostVenuesList.filter(v => String(v.id || v._id || '') === selectedCalendarVenueId);
}

function getConfirmedBookingsForDate(dateKey) {
  return hostBookingsList.filter(b => {
    if (String(b.status || '').toLowerCase() !== 'confirmed') return false;
    const bVenueId = (b.venue && typeof b.venue === 'object')
      ? String(b.venue._id || b.venue.id || b.venue.$oid || '')
      : String(b.venue || '');
    if (selectedCalendarVenueId !== 'all' && bVenueId !== selectedCalendarVenueId) return false;
    return toIsoDateKey(b.bookingDate || b.startDate) === dateKey;
  });
}

function showCalendarDayDetail(dateKey) {
  selectedCalendarDateKey = dateKey;
  const detailBox = document.getElementById('calendarDayDetailBox');
  if (!detailBox) return;

  const todayKey = getLocalTodayKey();
  if (dateKey < todayKey) {
    detailBox.innerHTML = `
      <p style="color:#dc2626; font-size:0.86rem; font-weight:700;">Unavailable — Past Date (${escapeHtml(formatDateFriendly(dateKey))})</p>
      <p style="color:#6b7280; font-size:0.8rem; margin-top:4px;">Past days cannot be booked by guests or modified in your calendar.</p>
    `;
    return;
  }

  const dayBookings = getConfirmedBookingsForDate(dateKey);
  const bookingsHtml = dayBookings.length > 0 ? `
    <p style="font-weight:700; margin-bottom:8px;">Confirmed on ${escapeHtml(formatDateFriendly(dateKey))}:</p>
    ${dayBookings.map(b => `
      <div style="padding:8px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:6px; margin-bottom:8px; font-size:0.82rem;">
        <strong>${escapeHtml(b.venueTitle || 'Venue')}</strong><br>
        <span>${escapeHtml(b.userName || 'Customer')} • ${Number(b.guests || 1)} guests • ₹${Number(b.totalPrice || 0).toLocaleString('en-IN')}</span>
      </div>
    `).join('')}
  ` : `<p style="color:#0f172a; font-size:0.86rem; font-weight:700; margin-bottom:8px;">${escapeHtml(formatDateFriendly(dateKey))}</p>`;

  const targetVenues = getFilteredCalendarVenues();
  let controlsHtml = '';
  if (targetVenues.length === 0) {
    controlsHtml = `<p style="color:#6b7280; font-size:0.8rem;">Add a venue first to block or manage dates.</p>`;
  } else {
    controlsHtml = targetVenues.map(v => {
      const vId = String(v.id || v._id || '');
      const hasBooking = hostBookingsList.some(b => {
        if (String(b.status || '').toLowerCase() !== 'confirmed') return false;
        const bVenueId = (b.venue && typeof b.venue === 'object')
          ? String(b.venue._id || b.venue.id || b.venue.$oid || '')
          : String(b.venue || '');
        return bVenueId === vId && toIsoDateKey(b.bookingDate || b.startDate) === dateKey;
      });
      if (hasBooking) {
        return `<div style="font-size:0.78rem; color:#047857; margin-top:6px;">✓ <strong>${escapeHtml(v.title)}</strong> has a confirmed booking (locked).</div>`;
      }
      const blocked = Array.isArray(v.blockedDates) && v.blockedDates.some(d => toIsoDateKey(d) === dateKey);
      if (blocked) {
        return `
          <div style="margin-top:8px; padding:8px; background:#fef2f2; border:1px solid #fecaca; border-radius:6px;">
            <div style="font-size:0.78rem; font-weight:600; color:#b91c1c; margin-bottom:6px;">Blocked: ${escapeHtml(v.title)}</div>
            <button type="button" class="btn-sm btn-secondary" style="width:100%;" onclick="toggleVenueBlockedDate('${escapeHtml(vId)}', '${escapeHtml(dateKey)}', 'unblock');">Unblock Date</button>
          </div>
        `;
      }
      return `
        <div style="margin-top:8px; padding:8px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px;">
          <div style="font-size:0.78rem; color:#334155; margin-bottom:6px;">Available: <strong>${escapeHtml(v.title)}</strong></div>
          <button type="button" class="btn-sm btn-danger" style="width:100%;" onclick="toggleVenueBlockedDate('${escapeHtml(vId)}', '${escapeHtml(dateKey)}', 'block');">Block Date</button>
        </div>
      `;
    }).join('');
  }

  detailBox.innerHTML = bookingsHtml + controlsHtml;
}

function renderCalendar() {
  const grid = document.getElementById('calendarDaysGrid');
  const titleEl = document.getElementById('calendarMonthTitle');
  if (!grid || !titleEl) return;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  titleEl.textContent = `${monthNames[calendarMonth]} ${calendarYear}`;

  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate();

  const bookingsByDate = {};
  hostBookingsList.forEach(b => {
    if ((b.status || '').toLowerCase() !== 'confirmed') return;
    const bVenueId = (b.venue && typeof b.venue === 'object')
      ? String(b.venue._id || b.venue.id || b.venue.$oid || '')
      : String(b.venue || '');
    if (selectedCalendarVenueId !== 'all' && bVenueId !== selectedCalendarVenueId) return;
    const key = toIsoDateKey(b.bookingDate || b.startDate);
    if (!key) return;
    if (!bookingsByDate[key]) bookingsByDate[key] = [];
    bookingsByDate[key].push(b);
  });

  const blockedByDate = {};
  getFilteredCalendarVenues().forEach(v => {
    const blocked = Array.isArray(v.blockedDates) ? v.blockedDates : [];
    blocked.forEach(rawDate => {
      const key = toIsoDateKey(rawDate);
      if (!key) return;
      if (!blockedByDate[key]) blockedByDate[key] = [];
      blockedByDate[key].push(v);
    });
  });

  grid.innerHTML = '';
  for (let i = firstDay - 1; i >= 0; i--) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell other-month';
    cell.innerHTML = `<span>${daysInPrevMonth - i}</span>`;
    grid.appendChild(cell);
  }

  const todayKey = getLocalTodayKey();
  for (let day = 1; day <= daysInMonth; day++) {
    const mm = String(calendarMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateKey = `${calendarYear}-${mm}-${dd}`;
    const isPast = dateKey < todayKey;
    const dayBookings = bookingsByDate[dateKey] || [];
    const dayBlocked = blockedByDate[dateKey] || [];

    const cell = document.createElement('div');
    let cls = 'calendar-day-cell';
    if (dateKey === todayKey) cls += ' today';
    if (isPast) {
      cls += ' past';
      cell.className = cls;
      cell.title = 'Past dates are unavailable';
      cell.innerHTML = `<span>${day}</span><small style="display:block; font-size:0.62rem; color:#9ca3af;">Past</small>`;
    } else if (dayBookings.length > 0) {
      cell.className = cls;
      cell.style.background = '#ecfdf5';
      cell.style.borderColor = '#10b981';
      cell.style.cursor = 'pointer';
      cell.innerHTML = `<span>${day}</span><small style="display:block; font-size:0.65rem; color:#047857; font-weight:700;">${dayBookings.length} Booked</small>`;
    } else if (dayBlocked.length > 0) {
      cls += ' blocked';
      cell.className = cls;
      cell.style.cursor = 'pointer';
      cell.innerHTML = `<span>${day}</span><small style="display:block; font-size:0.65rem; color:#b91c1c; font-weight:700;">Blocked</small>`;
    } else {
      cell.className = cls;
      cell.style.cursor = 'pointer';
      cell.innerHTML = `<span>${day}</span>`;
    }

    cell.addEventListener('click', () => showCalendarDayDetail(dateKey));
    grid.appendChild(cell);
  }

  const totalCells = firstDay + daysInMonth;
  const trailing = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell other-month';
    cell.innerHTML = `<span>${i}</span>`;
    grid.appendChild(cell);
  }

  if (selectedCalendarDateKey) {
    showCalendarDayDetail(selectedCalendarDateKey);
  }
}

function renderNotifications(venues, bookings) {
  const items = [];
  bookings.slice(0, 5).forEach(b => {
    const disp = getBookingStatusDisplay(b);
    items.push({
      title: `Booking ${disp.label}: ${escapeHtml(b.venueTitle || 'Venue')}`,
      sub: `${escapeHtml(b.userName || 'Customer')} • ${escapeHtml(formatDateFriendly(b.bookingDate || b.startDate))} • ₹${Number(b.totalPrice || 0).toLocaleString('en-IN')}`
    });
  });
  venues.slice(0, 5).forEach(v => {
    const meta = getVenueStatusMeta(v);
    let prefix = 'Listing Approved by Admin';
    let detail = `${escapeHtml(v.city || 'Gujarat')} • ₹${Number(v.pricePerDay || 0).toLocaleString('en-IN')}/day`;
    if (meta.isPending) {
      prefix = 'Pending Admin Approval';
      detail = `${escapeHtml(v.city || 'Gujarat')} • Awaiting Admin approval before publishing`;
    } else if (meta.isRejected) {
      prefix = 'Rejected by Admin';
      detail = `${escapeHtml(v.city || 'Gujarat')} • Hidden from marketplace`;
    }
    items.push({
      title: `${prefix}: ${escapeHtml(v.title)}`,
      sub: detail
    });
  });

  const badge = document.getElementById('notifBadge');
  if (badge) badge.style.display = items.length > 0 ? 'inline-block' : 'none';

  const html = items.length === 0
    ? '<li style="text-align:center; padding:24px; color:#6b7280; font-size:0.85rem;">No notifications yet.</li>'
    : items.map(it => `
        <li class="notification-item" style="padding:12px 16px; border-bottom:1px solid #f1f5f9;">
          <strong style="display:block; font-size:0.84rem; color:#0f172a;">${it.title}</strong>
          <span style="font-size:0.76rem; color:#64748b;">${it.sub}</span>
        </li>
      `).join('');

  const topList = document.getElementById('topbarNotifList');
  const viewList = document.getElementById('notificationsViewList');
  if (topList) topList.innerHTML = html;
  if (viewList) viewList.innerHTML = html;
}

function openAddVenueModal() {
  window.location.href = 'add-venue.html';
}

function viewVenueDetailsModal(venueId) {
  const v = venueDataStore[venueId];
  if (!v) return;
  document.getElementById('viewModalVenueName').textContent = v.name;
  document.getElementById('viewModalVenueCategory').textContent = v.category;
  document.getElementById('viewModalVenueLocation').textContent = v.location;
  document.getElementById('viewModalVenueCapacity').textContent = v.capacity;
  document.getElementById('viewModalVenuePrice').textContent = v.price;
  document.getElementById('viewModalVenueAmenities').textContent = v.amenities;
  document.getElementById('viewModalVenueDesc').textContent = v.desc;
  openModal('venueDetailsModal');
}

function viewBookingDetailsModal(bookingId) {
  const b = bookingDataStore[bookingId];
  if (!b) return;
  document.getElementById('bDetailId').textContent = '#' + b.id.substring(0, 8);
  document.getElementById('bDetailCustomer').textContent = b.customer;
  document.getElementById('bDetailVenue').textContent = b.venue;
  document.getElementById('bDetailDate').textContent = b.date;
  document.getElementById('bDetailGuests').textContent = b.guests;
  document.getElementById('bDetailAmount').textContent = b.amount;
  document.getElementById('bDetailContact').textContent = b.contact;
  document.getElementById('bDetailMessage').textContent = b.message;
  document.getElementById('bDetailStatus').textContent = b.status;
  openModal('bookingDetailsModal');
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modal) {
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

function showToast(message) {
  let toast = document.getElementById('toastNotice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotice';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
    <span>${message}</span>
  `;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function saveStoredUser(updatedUser) {
  if (!updatedUser || typeof updatedUser !== 'object') return;
  let existing = {};
  try {
    const raw = sessionStorage.getItem('venueverse_user') || localStorage.getItem('venueverse_user');
    if (raw) existing = JSON.parse(raw) || {};
  } catch (e) {}

  const merged = {
    ...existing,
    ...updatedUser,
    _id: updatedUser._id || updatedUser.id || existing._id || existing.id || '',
    id: updatedUser.id || updatedUser._id || existing.id || existing._id || ''
  };
  if (merged.name) {
    merged.initials = merged.name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
  const serialized = JSON.stringify(merged);
  try { sessionStorage.setItem('venueverse_user', serialized); } catch (e) {}
  try { localStorage.setItem('venueverse_user', serialized); } catch (e) {}
}

async function loadHostProfileFromBackend() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) return;
    const data = await res.json();
    const user = (data && data.user) ? data.user : data;
    if (user && (user.email || user.name)) {
      saveStoredUser(user);
      bindHostSessionData();
    }
  } catch (e) {}
}

function bindHostSessionData() {
  let currentUser = null;
  try {
    const raw = sessionStorage.getItem('venueverse_user') || localStorage.getItem('venueverse_user');
    if (raw) currentUser = JSON.parse(raw);
  } catch (e) {}

  const dateEl = document.getElementById('ownerDateDisplay');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (currentUser && currentUser.name) {
    const name = currentUser.name;
    const initials = currentUser.initials || name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    viewTitles.overview.subtitle = `Welcome back, ${name}! Overview of your venues, bookings & earnings.`;
    const subEl = document.getElementById('topbarPageSubtitle');
    if (subEl) subEl.textContent = viewTitles.overview.subtitle;

    document.querySelectorAll('.owner-name, .topbar-owner-name').forEach(el => el.textContent = name);
    document.querySelectorAll('.owner-avatar').forEach(el => {
      el.textContent = initials;
      el.title = name;
    });

    const profHostName = document.getElementById('profHostName');
    const profHostEmail = document.getElementById('profHostEmail');
    const profHostPhone = document.getElementById('profHostPhone');
    const profBusinessName = document.getElementById('profBusinessName');
    const profHostCity = document.getElementById('profHostCity');
    if (profHostName) profHostName.value = name;
    if (profHostEmail && currentUser.email) profHostEmail.value = currentUser.email;
    if (profHostPhone) profHostPhone.value = currentUser.phone || '';
    if (profBusinessName) profBusinessName.value = currentUser.businessName || '';
    if (profHostCity) profHostCity.value = currentUser.city || '';
  }
}

function verifyHostSession(showPrompt) {
  let currentUser = null;
  try {
    const raw = sessionStorage.getItem('venueverse_user') || localStorage.getItem('venueverse_user');
    if (raw) currentUser = JSON.parse(raw);
  } catch (e) {}

  if (!currentUser) {
    if (showPrompt) alert('Access Denied: Please sign in with a Venue Owner account to access the Host Portal.');
    window.location.replace('../index.html');
    return null;
  }
  const role = (currentUser.backendRole || currentUser.role || '').trim().toLowerCase();
  const isHost = ['host', 'venue_owner', 'venue owner', 'venue_host', 'venue host', 'owner', 'admin'].includes(role)
    || role.includes('host') || role.includes('organizer');
  if (!isHost) {
    if (showPrompt) alert('Access Restricted: Only Venue Owners can access the Host Portal.');
    window.location.replace('../index.html');
    return null;
  }
  return currentUser;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!verifyHostSession(true)) return;

  window.addEventListener('pageshow', () => verifyHostSession(false));
  window.addEventListener('storage', (e) => {
    if (e.key === 'venueverse_user') verifyHostSession(false);
  });

  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const view = item.getAttribute('data-view');
      if (view) switchDashboardView(view);
    });
  });

  document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal-overlay')));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  const calPrev = document.getElementById('calPrevMonthBtn');
  const calNext = document.getElementById('calNextMonthBtn');
  if (calPrev) {
    calPrev.addEventListener('click', () => {
      calendarMonth--;
      if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
      renderCalendar();
    });
  }
  if (calNext) {
    calNext.addEventListener('click', () => {
      calendarMonth++;
      if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
      renderCalendar();
    });
  }

  const venueForm = document.getElementById('venueForm');
  if (venueForm) {
    venueForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('venueNameInput').value.trim();
      const selectedCategories = Array.from(document.querySelectorAll('input[name="ownerVenueCategories"]:checked'))
        .map(input => String(input.value || '').trim().toLowerCase())
        .filter(Boolean);
      if (selectedCategories.length === 0) {
        alert('Please select at least one event category for this venue.');
        return;
      }
      const location = document.getElementById('venueLocationInput').value.trim();
      const address = document.getElementById('venueAddressInput') ? document.getElementById('venueAddressInput').value.trim() : '';
      const capacity = parseInt(document.getElementById('venueCapacityInput').value, 10) || 100;
      const price = parseInt(document.getElementById('venuePriceInput').value, 10) || 10000;
      const imageChoice = document.getElementById('venueImageInput') ? document.getElementById('venueImageInput').value : 'assets/venue-ballroom.jpg';
      const desc = document.getElementById('venueDescInput').value.trim();

      const payload = {
        title: name,
        category: selectedCategories[0],
        categories: selectedCategories,
        city: location,
        address: address || `${name}, ${location}`,
        capacity: capacity,
        pricePerDay: price,
        bookingType: 'direct',
        description: desc || `${name} located in ${location}`,
        amenities: ['Power Backup', 'Air Conditioning', 'Valet Parking', 'Audio System'],
        images: [imageChoice]
      };

      try {
        const res = await fetch(`${API_BASE}/api/venues`, {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert('Failed to save venue: ' + (err.message || res.statusText));
          return;
        }

        closeModal(document.getElementById('venueModal'));
        venueForm.reset();
        showToast(`Venue "${name}" submitted for Admin approval! It will appear to customers once approved.`);
        loadHostData();
      } catch (netErr) {
        alert('Connection error: Cannot reach the Java backend server on port 5000.');
      }
    });
  }

  const hostProfileForm = document.getElementById('hostProfileForm');
  if (hostProfileForm) {
    hostProfileForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = (document.getElementById('profHostName')?.value || '').trim();
      const phone = (document.getElementById('profHostPhone')?.value || '').trim();
      const businessName = (document.getElementById('profBusinessName')?.value || '').trim();
      const city = (document.getElementById('profHostCity')?.value || '').trim();
      if (!name) {
        alert('Full Name is required.');
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/auth/profile`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify({ name, phone, businessName, city })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert('Failed to update profile: ' + (data.message || res.statusText));
          return;
        }
        const updatedUser = (data && data.user) ? data.user : { name, phone, businessName, city };
        saveStoredUser(updatedUser);
        bindHostSessionData();
        showToast('Profile saved and synced across your venues!');
        loadHostData();
      } catch (netErr) {
        alert('Connection error: Cannot save profile right now.');
      }
    });
  }

  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async e => {
      e.preventDefault();
      const currentPassword = document.getElementById('currentPassInput')?.value || '';
      const newPassword = document.getElementById('newPassInput')?.value || '';
      const confirmPassword = document.getElementById('confirmPassInput')?.value || '';
      if (newPassword.length < 6) {
        alert('New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        alert('New password and confirmation do not match.');
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/auth/password`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(data.message || 'Failed to update password.');
          return;
        }
        changePasswordForm.reset();
        showToast('Password updated successfully!');
      } catch (netErr) {
        alert('Connection error: Cannot update password right now.');
      }
    });
  }

  const mobileBtn = document.getElementById('mobileMenuBtn');
  const sidebarClose = document.getElementById('sidebarCloseBtn');
  const overlay = document.getElementById('sidebarOverlay');
  if (mobileBtn) mobileBtn.addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
    if (overlay) overlay.classList.add('open');
  });
  if (sidebarClose) sidebarClose.addEventListener('click', closeMobileSidebar);
  if (overlay) overlay.addEventListener('click', closeMobileSidebar);

  const notifBtn = document.getElementById('notifBtn');
  const notifPanel = document.getElementById('notifPanel');
  if (notifBtn && notifPanel) {
    notifBtn.addEventListener('click', e => {
      e.stopPropagation();
      notifPanel.classList.toggle('show');
    });
    document.addEventListener('click', e => {
      if (!notifPanel.contains(e.target) && !notifBtn.contains(e.target)) {
        notifPanel.classList.remove('show');
      }
    });
  }

  const clearBtn = document.getElementById('clearNotifBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const notifBadge = document.getElementById('notifBadge');
      if (notifBadge) notifBadge.style.display = 'none';
      showToast('All notifications marked as read.');
    });
  }

  bindHostSessionData();
  loadHostProfileFromBackend();
  loadHostData();
});
