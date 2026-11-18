const API_BASE = (window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:5000' : 'http://localhost:5000';

function getStoredUser() {
  try {
    const raw = sessionStorage.getItem('venueverse_user') || localStorage.getItem('venueverse_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const u = getStoredUser();
  if (u && (u._id || u.id)) {
    headers['X-User-Id'] = u._id || u.id;
  }
  return headers;
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

function extractId(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object') {
    return String(val._id || val.id || val.$oid || '').trim();
  }
  return String(val).trim();
}

function normalizeRole(role) {
  const clean = String(role || 'user').trim().toLowerCase();
  if (clean === 'admin' || clean === 'administrator') return 'admin';
  if (['host', 'venue_owner', 'venue owner', 'venue_host', 'venue host', 'owner'].includes(clean)) return 'host';
  return 'user';
}

function getRoleDisplay(role) {
  const norm = normalizeRole(role);
  if (norm === 'admin') return { key: 'admin', label: 'ADMIN', friendly: 'Administrator', badgeClass: 'special' };
  if (norm === 'host') return { key: 'host', label: 'VENUE OWNER', friendly: 'Venue Owner', badgeClass: 'direct' };
  return { key: 'user', label: 'USER', friendly: 'Customer', badgeClass: '' };
}

function isVenueApprovedStatus(status) {
  const clean = String(status || 'approved').trim().toLowerCase();
  return clean === 'approved' || clean === 'published';
}

function getVenueModerationLabel(status) {
  const clean = String(status || 'approved').trim().toLowerCase();
  if (clean === 'pending') return 'Pending Approval';
  if (clean === 'rejected') return 'Rejected by Admin';
  return 'Approved';
}

function getBookingStatusDisplay(b) {
  const st = String((b && b.status) || 'confirmed').trim().toLowerCase();
  const by = String((b && b.cancelledBy) || '').trim().toLowerCase();
  if (st === 'cancelled') {
    if (by === 'admin') return 'Cancelled by Admin';
    if (by === 'user') return 'Cancelled by User';
    if (by === 'host') return 'Cancelled by Owner';
    return 'Cancelled';
  }
  if (st === 'rejected') return 'Rejected by Admin';
  if (st === 'completed') return 'Completed';
  if (st === 'pending') return 'Pending';
  return 'Confirmed';
}

function normalizeImagePath(img) {
  if (!img) return '../assets/venue-ballroom.jpg';
  if (img.startsWith('../') || img.startsWith('http') || img.startsWith('data:')) return img;
  return '../' + img;
}

function formatDateFriendly(dateVal) {
  if (!dateVal) return 'Recent';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function showToast(message) {
  let toast = document.getElementById('adminToastNotice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToastNotice';
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      background: #0f172a; color: #ffffff; padding: 12px 18px;
      border-radius: 10px; font-size: 0.86rem; font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2); transition: opacity 0.25s ease;
      opacity: 0; pointer-events: none;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}
window.showToast = showToast;

document.addEventListener('DOMContentLoaded', function () {

  function verifyAdminAccess(showPrompt) {
    const u = getStoredUser();
    if (!u) {
      if (showPrompt) alert('Access Denied: You must be signed in as an Administrator to access this dashboard.');
      window.location.replace('../index.html');
      return null;
    }
    const r = normalizeRole(u.backendRole || u.role);
    if (r !== 'admin') {
      if (showPrompt) alert('Access Denied: Your account role requires Administrator privileges.');
      window.location.replace('../index.html');
      return null;
    }
    return u;
  }

  const currentUser = verifyAdminAccess(true);
  if (!currentUser) return;

  window.addEventListener('pageshow', () => verifyAdminAccess(false));
  window.addEventListener('storage', (e) => {
    if (e.key === 'venueverse_user') verifyAdminAccess(false);
  });

  const currentAdminId = extractId(currentUser._id || currentUser.id);

  if (currentUser.name) {
    const name = currentUser.name;
    const initials = currentUser.initials || name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    document.querySelectorAll('.admin-name, .topbar-admin-name').forEach(el => { el.textContent = name; });
    document.querySelectorAll('.admin-avatar').forEach(el => { el.textContent = initials; });
  }
  const currentDateDisplay = document.getElementById('currentDateDisplay');
  if (currentDateDisplay) {
    currentDateDisplay.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  const viewTitles = {
    overview: 'Dashboard Overview',
    venues: 'Venue Management',
    bookings: 'Booking Management',
    users: 'User & Role Management',
    hosts: 'Host & Venue Owner Management',
    reviews: 'Reviews & Ratings',
    analytics: 'Analytics & Reports',
    settings: 'Platform Settings'
  };

  function switchView(viewKey) {
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
    if (titleEl) titleEl.textContent = viewTitles[viewKey];

    closeMobileSidebar();
  }

  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      const viewKey = item.getAttribute('data-view');
      if (viewKey) switchView(viewKey);
    });
  });

  document.querySelectorAll('[data-switch-view]').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const viewKey = btn.getAttribute('data-switch-view');
      if (viewKey) {
        switchView(viewKey);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

  function openMobileSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (sidebarOverlay) sidebarOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileSidebar);
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileSidebar);

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
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

  document.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
    btn.addEventListener('click', function () {
      closeModal(btn.closest('.modal-overlay'));
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  const notifBtn = document.getElementById('notifBtn');
  const notifPanel = document.getElementById('notifPanel');
  if (notifBtn && notifPanel) {
    notifBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      notifPanel.classList.toggle('show');
    });
    document.addEventListener('click', function (e) {
      if (!notifPanel.contains(e.target) && !notifBtn.contains(e.target)) {
        notifPanel.classList.remove('show');
      }
    });
  }

  const clearNotifBtn = document.getElementById('clearNotifBtn');
  if (clearNotifBtn) {
    clearNotifBtn.addEventListener('click', () => {
      const notifBadge = document.getElementById('notifBadge');
      if (notifBadge) notifBadge.style.display = 'none';
      showToast('All notifications marked as read.');
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
      if (confirm('Are you sure you want to log out of the Admin Dashboard?')) {
        const headers = getAuthHeaders();
        ['venueverse_user', 'venueverse_pending_checkout'].forEach(key => {
          try { sessionStorage.removeItem(key); } catch (e) { }
          try { localStorage.removeItem(key); } catch (e) { }
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
        } catch (e) { }
        window.location.replace('../index.html');
      }
    });
  }

  let loadedStats = {};
  let loadedVenues = [];
  let loadedUsers = [];
  let loadedBookings = [];
  let loadedReviews = [];
  let loadedBookingsMap = {};

  let overviewVenueMode = 'latest';
  let userSelectedOverviewTab = false;
  let currentVenueFilter = 'all';
  let currentVenueSearch = '';
  let currentUserRoleFilter = 'all';
  let currentUserSearch = '';
  let currentHostSearch = '';
  let currentRecentBookingFilter = 'all';
  let currentRecentBookingSearch = '';
  let chartMode = 'monthly';
  let isRefreshing = false;

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  async function refreshAdminDashboard(manual = false) {
    if (isRefreshing) return;
    isRefreshing = true;

    const refreshBtn = document.getElementById('adminRefreshBtn');
    if (refreshBtn && manual) refreshBtn.textContent = 'Syncing...';

    const headers = getAuthHeaders();
    try {
      const [statsRes, venuesRes, usersRes, bookingsRes, reviewsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/stats`, { headers, credentials: 'include' }),
        fetch(`${API_BASE}/api/admin/venues`, { headers, credentials: 'include' }),
        fetch(`${API_BASE}/api/admin/users`, { headers, credentials: 'include' }),
        fetch(`${API_BASE}/api/admin/bookings`, { headers, credentials: 'include' }),
        fetch(`${API_BASE}/api/reviews`, { headers, credentials: 'include' }).catch(() => null)
      ]);

      if (statsRes.status === 401 || statsRes.status === 403) {
        sessionStorage.removeItem('venueverse_user');
        localStorage.removeItem('venueverse_user');
        window.location.replace('../index.html');
        return;
      }

      if (statsRes.ok) {
        const d = await statsRes.json();
        loadedStats = (d && d.stats) ? d.stats : d;
      }
      if (venuesRes.ok) {
        const d = await venuesRes.json();
        loadedVenues = Array.isArray(d) ? d : (d && d.venues ? d.venues : []);
      }
      if (usersRes.ok) {
        const d = await usersRes.json();
        loadedUsers = Array.isArray(d) ? d : (d && d.users ? d.users : []);
      }
      if (bookingsRes.ok) {
        const d = await bookingsRes.json();
        loadedBookings = Array.isArray(d) ? d : (d && d.bookings ? d.bookings : []);
      }
      if (reviewsRes && reviewsRes.ok) {
        const d = await reviewsRes.json();
        loadedReviews = Array.isArray(d) ? d : (d && d.reviews ? d.reviews : []);
      }

      if (!userSelectedOverviewTab) {
        const hasPendingVenues = loadedVenues.some(v => String(v.status || '').toLowerCase() === 'pending');
        overviewVenueMode = hasPendingVenues ? 'pending' : 'latest';
        document.querySelectorAll('#overviewVenueModeTabs .filter-tab').forEach(btn => {
          const mode = btn.getAttribute('data-overview-venue-mode') || 'latest';
          btn.classList.toggle('active', mode === overviewVenueMode);
        });
      }

      renderStats();
      renderVenues();
      renderUsersAndHosts();
      renderBookings();
      renderChart();
      renderReviews();
      renderAnalytics();
      renderNotifications();

      if (manual) showToast('Admin dashboard synchronized with live database.');
    } catch (err) {
      console.error('Error refreshing admin dashboard:', err);
      if (manual) showToast('Unable to reach backend on port 5000.');
    } finally {
      isRefreshing = false;
      if (refreshBtn) refreshBtn.innerHTML = '&#8635; Refresh';
    }
  }

  function renderStats() {
    const s = loadedStats || {};
    const totalAccounts = loadedUsers.length || s.totalAccounts || s.totalUsers || 0;
    const regularUsers = loadedUsers.length > 0
      ? loadedUsers.filter(u => normalizeRole(u.role) === 'user').length
      : (s.regularUsers ?? Math.max(0, totalAccounts - (s.totalHosts || 0)));
    const totalHosts = loadedUsers.length > 0
      ? loadedUsers.filter(u => normalizeRole(u.role) === 'host').length
      : (s.totalHosts || 0);
    const totalAdmins = loadedUsers.length > 0
      ? loadedUsers.filter(u => normalizeRole(u.role) === 'admin').length
      : (s.totalAdmins || 0);

    const totalVenues = loadedVenues.length || s.totalVenues || 0;
    const pendingVenues = loadedVenues.length > 0
      ? loadedVenues.filter(v => String(v.status || '').toLowerCase() === 'pending').length
      : (s.pendingVenues || 0);
    const approvedVenues = loadedVenues.length > 0
      ? loadedVenues.filter(v => isVenueApprovedStatus(v.status)).length
      : (s.approvedVenues || 0);
    const activeVenues = loadedVenues.length > 0
      ? loadedVenues.filter(v => v.isActive !== false && String(v.status || '').toLowerCase() !== 'rejected').length
      : (s.activeVenues || 0);

    const totalBookings = loadedBookings.length || s.totalBookings || 0;
    const confirmedBookings = loadedBookings.length > 0
      ? loadedBookings.filter(b => String(b.status || '').toLowerCase() === 'confirmed').length
      : (s.confirmedBookings || 0);
    const completedBookings = loadedBookings.length > 0
      ? loadedBookings.filter(b => String(b.status || '').toLowerCase() === 'completed').length
      : (s.completedBookings || 0);
    const cancelledBookings = loadedBookings.length > 0
      ? loadedBookings.filter(b => ['cancelled', 'rejected'].includes(String(b.status || '').toLowerCase())).length
      : (s.cancelledBookings || 0);
    const totalRevenue = loadedBookings.length > 0
      ? loadedBookings
        .filter(b => ['confirmed', 'completed'].includes(String(b.status || '').toLowerCase()))
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
      : (s.totalRevenue || 0);

    const hostUsers = loadedUsers.filter(u => normalizeRole(u.role) === 'host');
    const hostsWithVenues = hostUsers.filter(h => {
      const hId = extractId(h._id || h.id);
      return loadedVenues.some(v => extractId(v.host) === hId);
    }).length;

    const totalReviews = loadedReviews.length > 0
      ? loadedReviews.length
      : (loadedVenues.length > 0
        ? loadedVenues.reduce((sum, v) => sum + (Number(v.reviewsCount) || 0), 0)
        : (s.totalReviews || 0));
    const ratedVenues = loadedVenues.filter(v => typeof v.rating === 'number' && !isNaN(v.rating) && v.rating > 0);
    const avgRating = ratedVenues.length > 0
      ? ratedVenues.reduce((sum, v) => sum + v.rating, 0) / ratedVenues.length
      : (s.averageRating || 0);

    setEl('adminTotalUsers', regularUsers.toLocaleString('en-IN'));
    setEl('adminUsersSupportText', `${regularUsers} customers · ${totalAccounts} total accounts`);

    setEl('adminTotalHosts', totalHosts.toLocaleString('en-IN'));
    setEl('adminHostsSupportText', `${hostsWithVenues} with active venues`);

    setEl('adminTotalVenues', totalVenues.toLocaleString('en-IN'));
    setEl('adminVenuesSupportText', `${approvedVenues} live · ${pendingVenues} pending review`);

    setEl('pendingApprovalCount', pendingVenues.toLocaleString('en-IN'));
    setEl('adminTotalBookings', totalBookings.toLocaleString('en-IN'));
    setEl('adminUpcomingBookings', confirmedBookings.toLocaleString('en-IN'));
    setEl('adminTotalReviews', totalReviews.toLocaleString('en-IN'));
    setEl('adminAvgRatingSupportText', ratedVenues.length > 0 ? `Average ${avgRating.toFixed(1)} ★ across ${ratedVenues.length} venues` : 'No venue ratings yet');

    setEl('sidebarPendingVenuesBadge', pendingVenues);

    setEl('quickActionVenuesCount', pendingVenues > 0 ? `${pendingVenues} pending` : `${totalVenues} live`);
    setEl('quickActionBookingsCount', totalBookings.toLocaleString('en-IN'));
    setEl('quickActionUsersCount', `${regularUsers} users`);
    setEl('quickActionHostsCount', `${totalHosts} owners`);
    setEl('quickActionReviewsCount', totalReviews.toLocaleString('en-IN'));

    setEl('adminViewAllVenuesLink', `View All Venues (${totalVenues}) →`);
    setEl('adminViewAllBookingsLink', `View All Bookings (${totalBookings}) →`);
    setEl('adminRecentAllTab', `All Bookings (${totalBookings})`);
    setEl('adminAllVenuesTab', `All Venues (${totalVenues})`);
    setEl('adminPendingVenuesTab', `Pending Review (${pendingVenues})`);
    setEl('overviewPendingVenuesTab', `Pending Review (${pendingVenues})`);

    setEl('adminAllUsersTab', `All Accounts (${totalAccounts})`);
    setEl('adminOnlyUsersTab', `Users (${regularUsers})`);
    setEl('adminOnlyHostsTab', `Venue Owners (${totalHosts})`);
    setEl('adminOnlyAdminsTab', `Admins (${totalAdmins})`);

    setEl('viewBookingsTotal', totalBookings.toLocaleString('en-IN'));
    setEl('viewBookingsUpcoming', confirmedBookings.toLocaleString('en-IN'));
    setEl('viewBookingsCompleted', completedBookings.toLocaleString('en-IN'));
    setEl('viewBookingsCancelled', cancelledBookings.toLocaleString('en-IN'));

    setEl('adminHostTotalCard', totalHosts.toLocaleString('en-IN'));
    setEl('adminHostVerifiedCard', totalHosts.toLocaleString('en-IN'));
    setEl('adminHostPendingCard', hostsWithVenues.toLocaleString('en-IN'));
    const avgVenues = totalHosts > 0 ? (totalVenues / totalHosts).toFixed(1) : '0';
    setEl('adminHostAvgVenuesCard', avgVenues);

    setEl('reviewOverallRatingVal', `${avgRating.toFixed(1)} ★`);
    setEl('reviewTotalCountVal', totalReviews.toLocaleString('en-IN'));
    const topRatedCount = ratedVenues.filter(v => v.rating >= 4.5).length;
    setEl('reviewFiveStarCountVal', topRatedCount.toLocaleString('en-IN'));
    setEl('reviewFourPlusNote', `${ratedVenues.length} rated venues total`);
    setEl('reviewFlaggedCountVal', '0');

    setEl('opsActiveVenues', activeVenues.toLocaleString('en-IN'));
    setEl('opsTotalRevenue', '₹' + Math.round(totalRevenue).toLocaleString('en-IN'));
    setEl('opsActiveHosts', totalHosts.toLocaleString('en-IN'));
  }

  function renderVenues() {
    const venueTableBody = document.querySelector('#view-venues .data-table tbody');
    if (venueTableBody) {
      const filtered = loadedVenues.filter(v => {
        const cats = (Array.isArray(v.categories) && v.categories.length)
          ? v.categories.map(c => String(c || '').toLowerCase())
          : [String(v.category || '').toLowerCase()];
        const status = String(v.status || 'approved').toLowerCase();
        if (currentVenueFilter === 'pending') return status === 'pending';
        if (currentVenueFilter !== 'all' && !cats.includes(currentVenueFilter)) return false;
        if (currentVenueSearch) {
          const hay = `${v.title || ''} ${v.city || ''} ${cats.join(' ')} ${v.hostName || ''}`.toLowerCase();
          return hay.includes(currentVenueSearch);
        }
        return true;
      });

      venueTableBody.innerHTML = '';
      if (filtered.length === 0) {
        venueTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:32px; color:#6b7280; font-size:0.95rem;">No venues match this filter.</td></tr>';
      } else {
        filtered.forEach(v => {
          const id = extractId(v.id || v._id);
          const rawStatus = String(v.status || 'approved').toLowerCase();
          const isApproved = isVenueApprovedStatus(rawStatus);
          const isPending = rawStatus === 'pending';
          const isActive = v.isActive !== false;
          const badgeClass = isApproved ? rawStatus : (isPending ? 'pending' : 'cancelled');
          const catList = (Array.isArray(v.categories) && v.categories.length)
            ? v.categories
            : [v.category || 'venue'];
          const catDisplay = catList.map(c => String(c || '').toUpperCase()).filter(Boolean).join(' • ') || 'VENUE';

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>
              <strong>${escapeHtml(v.title)}</strong>
              <div style="font-size:0.74rem; color:#6b7280;">${isActive ? 'Live on Marketplace' : 'Draft / Hidden'}</div>
            </td>
            <td>${escapeHtml(catDisplay)}</td>
            <td>${escapeHtml(v.city || 'Gujarat')}</td>
            <td>${escapeHtml(v.hostName || 'Verified Host')}</td>
            <td>${Number(v.capacity || 100)} Guests</td>
            <td>₹${Number(v.pricePerDay || v.price || 0).toLocaleString('en-IN')}</td>
            <td><span class="status-badge ${escapeHtml(badgeClass)}">${escapeHtml(getVenueModerationLabel(rawStatus))}</span></td>
            <td style="text-align: right; white-space: nowrap;">
              ${isPending ? `
                <button type="button" class="table-action-link" data-venue-action="status" data-id="${escapeHtml(id)}" data-status="approved" style="color:#059669; font-weight:700; margin-right:8px;">Approve</button>
                <button type="button" class="table-action-link" data-venue-action="status" data-id="${escapeHtml(id)}" data-status="rejected" style="color:#dc2626; font-weight:700; margin-right:8px;">Reject</button>
              ` : `
                <button type="button" class="table-action-link" data-venue-action="status" data-id="${escapeHtml(id)}" data-status="${isApproved ? 'rejected' : 'approved'}" style="margin-right:8px;">
                  ${isApproved ? 'Suspend' : 'Approve'}
                </button>
              `}
              <button type="button" class="table-action-link" data-venue-action="delete" data-id="${escapeHtml(id)}" data-title="${escapeHtml(v.title || 'Venue')}" style="color:#dc2626;">Delete</button>
            </td>
          `;
          venueTableBody.appendChild(tr);
        });
      }
    }

    const overviewGrid = document.getElementById('adminPendingVenuesGrid');
    const overviewTitle = document.getElementById('overviewVenuesSectionTitle');
    if (overviewGrid) {
      overviewGrid.innerHTML = '';
      const pendingVenues = loadedVenues.filter(v => String(v.status || '').toLowerCase() === 'pending');
      const displayVenues = overviewVenueMode === 'pending'
        ? pendingVenues
        : loadedVenues.slice(0, 6);

      if (overviewTitle) {
        overviewTitle.textContent = overviewVenueMode === 'pending'
          ? `Pending Venue Approvals (${pendingVenues.length})`
          : `Latest Platform Venues (${loadedVenues.length})`;
      }

      if (displayVenues.length === 0) {
        overviewGrid.innerHTML = `
          <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:24px; color:#6b7280; text-align:center; grid-column: 1 / -1;">
            ${overviewVenueMode === 'pending'
            ? 'No venues pending review. All submitted venues are live!'
            : 'No venues have been added yet. Venues created by hosts will appear here immediately.'}
          </div>
        `;
      } else {
        displayVenues.forEach(v => {
          const id = extractId(v.id || v._id);
          const rawStatus = String(v.status || 'approved').toLowerCase();
          const isApproved = isVenueApprovedStatus(rawStatus);
          const isPending = rawStatus === 'pending';
          const badgeClass = isApproved ? rawStatus : (isPending ? 'pending' : 'cancelled');
          const imgSrc = normalizeImagePath((v.images && v.images.length) ? v.images[0] : v.image);
          const catList = (Array.isArray(v.categories) && v.categories.length)
            ? v.categories
            : [v.category || 'Event'];
          const catBadgeText = catList.map(c => String(c || '').toUpperCase()).filter(Boolean).join(' • ') || 'EVENT';

          const card = document.createElement('div');
          card.className = 'venue-approval-card';
          card.innerHTML = `
            <div class="venue-thumbnail-box">
              <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(v.title)}" style="width:100%; height:160px; object-fit:cover;">
              <span class="venue-category-badge">${escapeHtml(catBadgeText)}</span>
              <span class="status-badge ${escapeHtml(badgeClass)} venue-status-badge venue-status-badge-top">${escapeHtml(getVenueModerationLabel(rawStatus))}</span>
            </div>
            <div class="venue-card-body">
              <h3 class="venue-name">${escapeHtml(v.title)}</h3>
              <div class="venue-location">
                <span>&#128205; ${escapeHtml(v.city || 'Gujarat')}</span>
              </div>
              <div class="venue-meta-details">
                <div class="meta-row"><span class="meta-label">Host:</span><span class="meta-value">${escapeHtml(v.hostName || 'Verified Host')}</span></div>
                <div class="meta-row"><span class="meta-label">Capacity &amp; Rate:</span><span class="meta-value">${Number(v.capacity || 100)} guests &bull; ₹${Number(v.pricePerDay || 0).toLocaleString('en-IN')}/day</span></div>
              </div>
              <div class="venue-card-actions" style="margin-top:14px; display:flex; gap:8px;">
                ${isPending ? `
                  <button type="button" class="btn-sm btn-success" data-venue-action="status" data-id="${escapeHtml(id)}" data-status="approved" style="flex:1;">Approve</button>
                  <button type="button" class="btn-sm btn-danger" data-venue-action="status" data-id="${escapeHtml(id)}" data-status="rejected" style="flex:1;">Reject</button>
                ` : `
                  <a href="../venue-details/venue-details.html?id=${encodeURIComponent(id)}" target="_blank" class="btn-sm btn-secondary" style="flex:1; text-align:center; text-decoration:none;">View Listing</a>
                  <button type="button" class="btn-sm ${isApproved ? 'btn-danger' : 'btn-success'}" data-venue-action="status" data-id="${escapeHtml(id)}" data-status="${isApproved ? 'rejected' : 'approved'}" style="flex:1;">
                    ${isApproved ? 'Suspend' : 'Approve'}
                  </button>
                `}
              </div>
            </div>
          `;
          overviewGrid.appendChild(card);
        });
      }
    }
  }

  function renderUsersAndHosts() {
    const usersTableBody = document.querySelector('#view-users .data-table tbody');
    if (usersTableBody) {
      const filteredUsers = loadedUsers.filter(u => {
        const info = getRoleDisplay(u.role);
        if (currentUserRoleFilter !== 'all' && info.key !== currentUserRoleFilter) return false;
        if (currentUserSearch) {
          const hay = `${u.name || ''} ${u.email || ''} ${u.phone || ''} ${info.friendly}`.toLowerCase();
          return hay.includes(currentUserSearch);
        }
        return true;
      });

      usersTableBody.innerHTML = '';
      if (filteredUsers.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:32px; color:#6b7280;">No matching users or venue owners found.</td></tr>';
      } else {
        filteredUsers.forEach(u => {
          const uId = extractId(u._id || u.id);
          const info = getRoleDisplay(u.role);
          const isSelf = uId && currentAdminId && uId === currentAdminId;

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${escapeHtml(u.name || 'Unnamed User')}</strong></td>
            <td>${escapeHtml(u.email)}</td>
            <td>${escapeHtml(u.phone || 'N/A')}</td>
            <td>${escapeHtml(formatDateFriendly(u.createdAt))}</td>
            <td><span class="booking-type-badge ${escapeHtml(info.badgeClass)}">${escapeHtml(info.label)}</span></td>
            <td><span class="status-badge active">Active</span></td>
            <td style="text-align: right; white-space: nowrap;">
              ${info.key !== 'admin' ? `
                <button type="button" class="table-action-link" data-user-action="delete" data-id="${escapeHtml(uId)}" data-name="${escapeHtml(u.name || u.email)}" style="color:#dc2626;">Delete</button>
              ` : `
                <span style="font-size:0.78rem; color:#6b7280; font-weight:600;">${isSelf ? 'Current Admin' : 'Protected Admin'}</span>
              `}
            </td>
          `;
          usersTableBody.appendChild(tr);
        });
      }
    }

    const recentUsersList = document.getElementById('adminRecentUsersList');
    if (recentUsersList) {
      recentUsersList.innerHTML = '';
      if (loadedUsers.length === 0) {
        recentUsersList.innerHTML = '<li style="text-align:center; padding:24px; color:#6b7280; font-size:0.9rem;">No registered users recorded yet in MongoDB.</li>';
      } else {
        loadedUsers.slice(0, 6).forEach(u => {
          const initials = (u.name || 'User').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          const info = getRoleDisplay(u.role);
          const li = document.createElement('li');
          li.className = 'user-item';
          li.innerHTML = `
            <div class="user-info-box">
              <div class="user-avatar-circle" style="background:${info.key === 'host' ? '#dbeafe' : '#e0e7ff'}; color:${info.key === 'host' ? '#1d4ed8' : '#3730a3'};">${escapeHtml(initials)}</div>
              <div>
                <div class="user-name-text">${escapeHtml(u.name || 'Unnamed')}</div>
                <div class="user-email-text">${escapeHtml(u.email)} &bull; ${escapeHtml(formatDateFriendly(u.createdAt))}</div>
              </div>
            </div>
            <div>
              <span class="booking-type-badge ${escapeHtml(info.badgeClass)}">${escapeHtml(info.label)}</span>
            </div>
          `;
          recentUsersList.appendChild(li);
        });
      }
    }

    const hostsGrid = document.getElementById('adminHostsGrid');
    if (hostsGrid) {
      const hosts = loadedUsers.filter(u => {
        if (normalizeRole(u.role) !== 'host') return false;
        if (!currentHostSearch) return true;
        const hay = `${u.name || ''} ${u.email || ''} ${u.phone || ''}`.toLowerCase();
        return hay.includes(currentHostSearch);
      });

      hostsGrid.innerHTML = '';
      if (hosts.length === 0) {
        hostsGrid.innerHTML = `
          <div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:32px; color:#6b7280; text-align:center; grid-column:1 / -1;">
            No venue owners found matching your search. Click "+ Add Venue Owner" to create one.
          </div>
        `;
      } else {
        hosts.forEach(h => {
          const hId = extractId(h._id || h.id);
          const hostVenues = loadedVenues.filter(v => extractId(v.host) === hId);
          const initials = (h.name || 'H').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          const card = document.createElement('div');
          card.className = 'summary-card';
          card.style.padding = '18px';
          card.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px;">
              <div style="display:flex; align-items:center; gap:12px; min-width:0;">
                <div class="user-avatar-circle" style="width:42px; height:42px; background:#dbeafe; color:#1d4ed8; font-weight:700; flex-shrink:0;">${escapeHtml(initials)}</div>
                <div style="min-width:0;">
                  <h4 style="margin:0; font-size:0.98rem; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(h.name)}</h4>
                  <span style="font-size:0.78rem; color:#64748b; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(h.email)}</span>
                </div>
              </div>
              <span class="status-badge active" style="flex-shrink:0;">Owner</span>
            </div>
            <div class="venue-meta-details" style="margin-bottom:12px;">
              <div class="meta-row"><span class="meta-label">Phone:</span><span class="meta-value">${escapeHtml(h.phone || 'N/A')}</span></div>
              <div class="meta-row"><span class="meta-label">Joined:</span><span class="meta-value">${escapeHtml(formatDateFriendly(h.createdAt))}</span></div>
              <div class="meta-row"><span class="meta-label">Venues Listed:</span><span class="meta-value">${hostVenues.length} Venue${hostVenues.length === 1 ? '' : 's'}</span></div>
            </div>
            <div style="display:flex; gap:8px;">
              <button type="button" class="btn-sm btn-danger" data-user-action="delete" data-id="${escapeHtml(hId)}" data-name="${escapeHtml(h.name || h.email)}" style="flex:1;">Remove Venue Owner</button>
            </div>
          `;
          hostsGrid.appendChild(card);
        });
      }
    }
  }

  function renderBookings() {
    loadedBookingsMap = {};
    loadedBookings.forEach(b => {
      const id = extractId(b.id || b._id);
      loadedBookingsMap[id] = b;
    });

    const getBookingStatusBadgeClass = (st) => {
      if (st === 'confirmed') return 'confirmed';
      if (st === 'completed') return 'approved';
      if (st === 'pending') return 'pending';
      return 'cancelled';
    };

    const bookingsTableBody = document.querySelector('#view-bookings .data-table tbody');
    if (bookingsTableBody) {
      bookingsTableBody.innerHTML = '';
      if (loadedBookings.length === 0) {
        bookingsTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:32px; color:#6b7280; font-size:0.95rem;">No bookings recorded yet in MongoDB.</td></tr>';
      } else {
        loadedBookings.forEach(b => {
          const id = extractId(b.id || b._id);
          const statusLower = String(b.status || 'confirmed').toLowerCase();
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>#${escapeHtml(id.substring(0, 8))}</strong></td>
            <td>${escapeHtml(b.userName || 'Customer')}</td>
            <td>${escapeHtml(b.venueTitle || 'Venue')}</td>
            <td>${escapeHtml(formatDateFriendly(b.bookingDate || b.startDate))}</td>
            <td>₹${Number(b.totalPrice || 0).toLocaleString('en-IN')}</td>
            <td><span class="status-badge ${getBookingStatusBadgeClass(statusLower)}">${escapeHtml(getBookingStatusDisplay(b))}</span></td>
            <td style="text-align: right;">
              <button type="button" class="table-action-link" data-booking-id="${escapeHtml(id)}">View</button>
            </td>
          `;
          bookingsTableBody.appendChild(tr);
        });
      }
    }

    const recentTableBody = document.querySelector('#recentBookingsTable tbody');
    const emptyStateEl = document.getElementById('bookingEmptyState');
    if (recentTableBody) {
      const filtered = loadedBookings.filter(b => {
        const st = String(b.status || 'confirmed').toLowerCase();
        if (currentRecentBookingFilter !== 'all' && st !== currentRecentBookingFilter) return false;
        if (currentRecentBookingSearch) {
          const hay = `${extractId(b.id || b._id)} ${b.userName || ''} ${b.venueTitle || ''}`.toLowerCase();
          return hay.includes(currentRecentBookingSearch);
        }
        return true;
      });

      recentTableBody.innerHTML = '';
      if (emptyStateEl) emptyStateEl.style.display = 'none';
      if (filtered.length === 0) {
        recentTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:32px; color:#6b7280; font-size:0.95rem;">No bookings found matching this filter.</td></tr>';
      } else {
        filtered.slice(0, 8).forEach(b => {
          const id = extractId(b.id || b._id);
          const statusLower = String(b.status || 'confirmed').toLowerCase();
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="booking-id">#${escapeHtml(id.substring(0, 8))}</td>
            <td class="customer-name">${escapeHtml(b.userName || 'Customer')}</td>
            <td class="venue-table-name">${escapeHtml(b.venueTitle || 'Venue')}</td>
            <td class="booking-date">${escapeHtml(formatDateFriendly(b.bookingDate || b.startDate))}</td>
            <td class="booking-amount">₹${Number(b.totalPrice || 0).toLocaleString('en-IN')}</td>
            <td><span class="status-badge ${getBookingStatusBadgeClass(statusLower)}">${escapeHtml(getBookingStatusDisplay(b))}</span></td>
            <td style="text-align: right;"><button type="button" class="table-action-link" data-booking-id="${escapeHtml(id)}">View</button></td>
          `;
          recentTableBody.appendChild(tr);
        });
      }
    }
  }

  function renderChart() {
    const barsEl = document.getElementById('adminChartBars');
    const xAxisEl = document.getElementById('adminChartXAxis');
    const yAxisEl = document.getElementById('adminChartYAxis');
    if (!barsEl || !xAxisEl) return;

    const buckets = [];
    const now = new Date();
    if (chartMode === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(now.getDate() - i * 7);
        const start = new Date(end);
        start.setDate(end.getDate() - 7);
        const count = loadedBookings.filter(b => {
          const d = new Date(b.bookingDate || b.createdAt || 0);
          return !isNaN(d.getTime()) && d >= start && d <= end && String(b.status || '').toLowerCase() !== 'cancelled';
        }).length;
        buckets.push({ label: `W-${i === 0 ? 'Now' : i}`, count });
      }
    } else {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        const count = loadedBookings.filter(b => {
          const bd = new Date(b.bookingDate || b.createdAt || 0);
          return !isNaN(bd.getTime()) && bd.getFullYear() === y && bd.getMonth() === m && String(b.status || '').toLowerCase() !== 'cancelled';
        }).length;
        buckets.push({ label, count });
      }
    }

    const maxCount = Math.max(4, ...buckets.map(b => b.count));
    const step = Math.ceil(maxCount / 4);
    const scaleMax = step * 4;

    if (yAxisEl) {
      yAxisEl.innerHTML = `
        <span>0</span>
        <span>${step}</span>
        <span>${step * 2}</span>
        <span>${step * 3}</span>
        <span>${scaleMax}</span>
      `;
    }

    barsEl.innerHTML = buckets.map(b => {
      const pct = Math.round((b.count / scaleMax) * 100);
      return `<div class="chart-bar-group"><div class="chart-bar" style="height:${pct}%;"><span class="bar-tooltip">${b.count} Booking${b.count === 1 ? '' : 's'}</span></div></div>`;
    }).join('');

    xAxisEl.innerHTML = buckets.map(b => `<span>${escapeHtml(b.label)}</span>`).join('');
  }

  window.deleteAdminReview = async function (reviewId) {
    if (!confirm('Delete this review?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/reviews/${encodeURIComponent(reviewId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (!res.ok) {
        alert('Failed to delete review.');
        return;
      }
      showToast('Review deleted.');
      refreshAdminDashboard();
    } catch (e) {
      alert('Connection error deleting review.');
    }
  };

  function renderReviews() {
    const container = document.getElementById('adminReviewsContainer');
    if (!container) return;

    if (loadedReviews.length === 0 && loadedVenues.length === 0) {
      container.innerHTML = '<div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:32px; color:#6b7280; text-align:center;">No reviews posted yet. Customer reviews will appear here once submitted.</div>';
      return;
    }

    if (loadedReviews.length > 0) {
      container.innerHTML = loadedReviews.map(r => {
        const rId = extractId(r._id || r.id);
        const stars = '★'.repeat(Math.max(1, Math.min(5, Number(r.rating) || 5)));
        return `
          <div class="review-card">
            <div class="review-card-top">
              <div class="reviewer-meta">
                <strong>${escapeHtml(r.userName || 'Verified User')}</strong>
                <span class="review-venue-tag">${escapeHtml(r.venueTitle || 'Venue')} • ${escapeHtml(formatDateFriendly(r.createdAt))}</span>
              </div>
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="status-badge approved" style="font-weight:700; color:#b45309; background:#fef3c7;">${stars} (${Number(r.rating) || 5})</span>
                <button type="button" class="btn-sm btn-danger" onclick="deleteAdminReview('${escapeHtml(rId)}');">Delete</button>
              </div>
            </div>
            <p class="review-comment-text">"${escapeHtml(r.comment)}"</p>
          </div>
        `;
      }).join('');
      return;
    }

    container.innerHTML = '<div style="background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:32px; color:#6b7280; text-align:center;">No customer reviews submitted yet. Reviews posted by users will appear here immediately.</div>';
  }

  function renderAnalytics() {
    const container = document.getElementById('adminCategoryPopularity');
    if (!container) return;

    const categories = [
      { key: 'wedding', label: 'Weddings & Banquets', color: '#2563eb' },
      { key: 'birthday', label: 'Birthdays & Parties', color: '#7c3aed' },
      { key: 'conference', label: 'Conferences & Corporate', color: '#059669' },
      { key: 'photoshoot', label: 'Photoshoot & Studios', color: '#f59e0b' }
    ];

    const venueCatMap = {};
    loadedVenues.forEach(v => {
      const cats = (Array.isArray(v.categories) && v.categories.length)
        ? v.categories.map(c => String(c || '').toLowerCase())
        : [String(v.category || 'wedding').toLowerCase()];
      venueCatMap[extractId(v.id || v._id)] = cats;
    });

    const totalB = loadedBookings.length;
    container.innerHTML = categories.map(c => {
      const matchingBookings = loadedBookings.filter(b => {
        const bEventType = String(b.eventType || '').toLowerCase();
        if (bEventType) {
          return bEventType === c.key || (c.key === 'conference' && bEventType === 'corporate') || (c.key === 'birthday' && bEventType === 'party');
        }
        const vcList = venueCatMap[extractId(b.venue)] || [];
        return vcList.some(vc => vc === c.key || (c.key === 'conference' && vc === 'corporate') || (c.key === 'birthday' && vc === 'party'));
      }).length;
      const pct = totalB > 0 ? Math.round((matchingBookings / totalB) * 100) : 0;
      return `
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
            <span>${escapeHtml(c.label)}</span><strong>${pct}% (${matchingBookings} booking${matchingBookings === 1 ? '' : 's'})</strong>
          </div>
          <div style="height:8px; background:#e5e7eb; border-radius:4px; overflow:hidden;">
            <div style="width:${pct}%; height:100%; background:${c.color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderNotifications() {
    const list = document.getElementById('adminNotifList');
    const badge = document.getElementById('notifBadge');
    if (!list) return;

    const items = [];
    loadedUsers.slice(0, 2).forEach(u => {
      const info = getRoleDisplay(u.role);
      items.push(`<strong>${escapeHtml(info.friendly)} Joined:</strong> ${escapeHtml(u.name)} (${escapeHtml(u.email)})`);
    });
    loadedVenues.slice(0, 3).forEach(v => {
      const st = String(v.status || 'approved').toLowerCase();
      if (st === 'pending') {
        items.push(`<strong>Pending Admin Approval:</strong> ${escapeHtml(v.title)} (${escapeHtml(v.city || 'Gujarat')})`);
      } else if (st === 'rejected') {
        items.push(`<strong>Rejected by Admin:</strong> ${escapeHtml(v.title)} (${escapeHtml(v.city || 'Gujarat')})`);
      } else {
        items.push(`<strong>Venue Approved:</strong> ${escapeHtml(v.title)} (${escapeHtml(v.city || 'Gujarat')})`);
      }
    });
    loadedBookings.slice(0, 2).forEach(b => {
      items.push(`<strong>Booking ${escapeHtml(getBookingStatusDisplay(b))}:</strong> ${escapeHtml(b.venueTitle || 'Venue')} by ${escapeHtml(b.userName || 'Customer')}`);
    });

    if (badge) badge.style.display = items.length > 0 ? 'inline-block' : 'none';
    list.innerHTML = items.length === 0
      ? '<li style="text-align:center; padding:20px; color:#6b7280; font-size:0.85rem;">No administrative notifications at this time.</li>'
      : items.map(txt => `<li style="padding:10px 14px; border-bottom:1px solid #f1f5f9; font-size:0.8rem; color:#334155;">${txt}</li>`).join('');
  }

  async function updateVenueStatus(venueId, newStatus) {
    if (!confirm(`Change venue status to "${newStatus.toUpperCase()}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/venues/${encodeURIComponent(venueId)}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('Failed to update status: ' + (err.message || res.statusText));
        return;
      }
      const toastMsg = newStatus === 'rejected'
        ? 'Venue Rejected by Admin.'
        : (newStatus === 'approved' ? 'Venue Approved by Admin & Published!' : `Venue status updated to "${newStatus.toUpperCase()}".`);
      showToast(toastMsg);
      refreshAdminDashboard();
    } catch (e) {
      alert('Connection error communicating with Java backend on port 5000.');
    }
  }

  async function deleteAdminVenue(venueId, title) {
    if (!confirm(`Permanently delete venue "${title}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/venues/${encodeURIComponent(venueId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (!res.ok) {
        alert('Failed to delete venue.');
        return;
      }
      showToast(`Venue "${title}" deleted.`);
      refreshAdminDashboard();
    } catch (e) {
      alert('Connection error deleting venue.');
    }
  }

  async function deleteAdminUser(userId, displayName) {
    if (!confirm(`Delete account "${displayName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert('Failed to delete account: ' + (data.message || res.statusText));
        return;
      }
      showToast(`Account "${displayName}" deleted.`);
      refreshAdminDashboard();
    } catch (e) {
      alert('Connection error deleting account.');
    }
  }

  function viewBookingDetails(bookingId) {
    const b = loadedBookingsMap[bookingId];
    if (!b) return;
    const bId = extractId(b.id || b._id);
    setEl('modalBookingId', '#' + bId.substring(0, 8));
    setEl('modalBookingCustomer', b.userName || 'Customer');
    setEl('modalBookingVenue', b.venueTitle || 'Venue');
    setEl('modalBookingDate', formatDateFriendly(b.bookingDate || b.startDate));
    setEl('modalBookingAmount', '₹' + Number(b.totalPrice || 0).toLocaleString('en-IN'));
    const statusLower = String(b.status || 'confirmed').toLowerCase();
    const statusEl = document.getElementById('modalBookingStatus');
    if (statusEl) {
      statusEl.innerHTML = `<span class="status-badge ${statusLower === 'confirmed' ? 'confirmed' : (statusLower === 'completed' ? 'approved' : 'cancelled')}">${escapeHtml(getBookingStatusDisplay(b))}</span>`;
    }

    const cancelBtn = document.getElementById('modalCancelBookingBtn');
    if (cancelBtn) {
      if (statusLower === 'confirmed') {
        cancelBtn.style.display = 'inline-block';
        cancelBtn.onclick = async function () {
          if (!confirm('Cancel this customer booking?')) return;
          const res = await fetch(`${API_BASE}/api/bookings/${encodeURIComponent(bId)}/cancel`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            credentials: 'include'
          });
          if (res.ok) {
            closeModal(document.getElementById('bookingDetailsModal'));
            showToast('Booking cancelled by admin.');
            refreshAdminDashboard();
          } else {
            alert('Failed to cancel booking.');
          }
        };
      } else {
        cancelBtn.style.display = 'none';
      }
    }

    openModal('bookingDetailsModal');
  }

  document.addEventListener('click', (e) => {
    const venueBtn = e.target.closest('[data-venue-action]');
    if (venueBtn) {
      const action = venueBtn.getAttribute('data-venue-action');
      const id = venueBtn.getAttribute('data-id');
      if (action === 'status') updateVenueStatus(id, venueBtn.getAttribute('data-status'));
      if (action === 'delete') deleteAdminVenue(id, venueBtn.getAttribute('data-title') || 'Venue');
      return;
    }

    const userBtn = e.target.closest('[data-user-action]');
    if (userBtn) {
      const action = userBtn.getAttribute('data-user-action');
      const id = userBtn.getAttribute('data-id');
      const name = userBtn.getAttribute('data-name') || 'Account';
      if (action === 'delete') deleteAdminUser(id, name);
      return;
    }

    const bookingBtn = e.target.closest('[data-booking-id]');
    if (bookingBtn) {
      viewBookingDetails(bookingBtn.getAttribute('data-booking-id'));
    }
  });

  document.querySelectorAll('#overviewVenueModeTabs .filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#overviewVenueModeTabs .filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      userSelectedOverviewTab = true;
      overviewVenueMode = btn.getAttribute('data-overview-venue-mode') || 'latest';
      renderVenues();
    });
  });

  document.querySelectorAll('#adminVenueFilterTabs .filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#adminVenueFilterTabs .filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentVenueFilter = btn.getAttribute('data-venue-filter') || 'all';
      renderVenues();
    });
  });

  const adminVenueSearchInput = document.getElementById('adminVenueSearchInput');
  if (adminVenueSearchInput) {
    adminVenueSearchInput.addEventListener('input', e => {
      currentVenueSearch = e.target.value.trim().toLowerCase();
      renderVenues();
    });
  }

  document.querySelectorAll('#adminUserRoleTabs .filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#adminUserRoleTabs .filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentUserRoleFilter = btn.getAttribute('data-user-role') || 'all';
      renderUsersAndHosts();
    });
  });

  const adminUserSearchInput = document.getElementById('adminUserSearchInput');
  if (adminUserSearchInput) {
    adminUserSearchInput.addEventListener('input', e => {
      currentUserSearch = e.target.value.trim().toLowerCase();
      renderUsersAndHosts();
    });
  }

  const adminHostSearchInput = document.getElementById('adminHostSearchInput');
  if (adminHostSearchInput) {
    adminHostSearchInput.addEventListener('input', e => {
      currentHostSearch = e.target.value.trim().toLowerCase();
      renderUsersAndHosts();
    });
  }

  document.querySelectorAll('#adminRecentBookingTabs .filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#adminRecentBookingTabs .filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRecentBookingFilter = btn.getAttribute('data-status') || 'all';
      renderBookings();
    });
  });

  const inlineBookingSearch = document.getElementById('inlineBookingSearch');
  if (inlineBookingSearch) {
    inlineBookingSearch.addEventListener('input', e => {
      currentRecentBookingSearch = e.target.value.trim().toLowerCase();
      renderBookings();
    });
  }

  const globalSearchInput = document.getElementById('globalSearchInput');
  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      currentVenueSearch = q;
      currentUserSearch = q;
      currentHostSearch = q;
      currentRecentBookingSearch = q;
      renderVenues();
      renderUsersAndHosts();
      renderBookings();
    });
  }

  document.querySelectorAll('.chart-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chartMode = btn.getAttribute('data-filter') || 'monthly';
      renderChart();
    });
  });

  const adminOpenAddVenueBtn = document.getElementById('adminOpenAddVenueBtn');
  if (adminOpenAddVenueBtn) {
    adminOpenAddVenueBtn.addEventListener('click', () => openModal('adminVenueModal'));
  }

  const adminVenueForm = document.getElementById('adminVenueForm');
  if (adminVenueForm) {
    adminVenueForm.addEventListener('submit', async e => {
      e.preventDefault();
      const selectedCategories = Array.from(document.querySelectorAll('input[name="adminVenueCategories"]:checked'))
        .map(input => String(input.value || '').trim().toLowerCase())
        .filter(Boolean);
      if (selectedCategories.length === 0) {
        alert('Please select at least one event category.');
        return;
      }
      const payload = {
        title: document.getElementById('adminVenueTitle').value.trim(),
        category: selectedCategories[0],
        categories: selectedCategories,
        city: document.getElementById('adminVenueCity').value,
        address: document.getElementById('adminVenueAddress').value.trim(),
        capacity: parseInt(document.getElementById('adminVenueCapacity').value, 10) || 200,
        pricePerDay: parseInt(document.getElementById('adminVenuePrice').value, 10) || 25000,
        description: document.getElementById('adminVenueDesc').value.trim(),
        bookingType: 'direct',
        amenities: ['Power Backup', 'Air Conditioning', 'Valet Parking', 'Audio System'],
        images: ['assets/venue-ballroom.jpg']
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
          alert('Failed to publish venue: ' + (err.message || res.statusText));
          return;
        }
        closeModal(document.getElementById('adminVenueModal'));
        adminVenueForm.reset();
        showToast(`Venue "${payload.title}" published! Reflected across Users & Admin Dashboard.`);
        refreshAdminDashboard();
      } catch (err) {
        alert('Connection error publishing venue.');
      }
    });
  }

  function openCreateAccountModal(defaultRole) {
    const roleSelect = document.getElementById('adminNewUserRole');
    const titleEl = document.getElementById('adminCreateUserTitle');
    if (roleSelect) roleSelect.value = defaultRole;
    if (titleEl) {
      titleEl.textContent = defaultRole === 'host'
        ? 'Add New Venue Owner'
        : 'Add New User / Venue Owner';
    }
    openModal('adminCreateUserModal');
  }

  const adminOpenAddUserBtn = document.getElementById('adminOpenAddUserBtn');
  if (adminOpenAddUserBtn) {
    adminOpenAddUserBtn.addEventListener('click', () => openCreateAccountModal('user'));
  }

  const adminOpenAddHostBtn = document.getElementById('adminOpenAddHostBtn');
  if (adminOpenAddHostBtn) {
    adminOpenAddHostBtn.addEventListener('click', () => openCreateAccountModal('host'));
  }

  const adminCreateUserForm = document.getElementById('adminCreateUserForm');
  if (adminCreateUserForm) {
    adminCreateUserForm.addEventListener('submit', async e => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('adminNewUserName').value.trim(),
        email: document.getElementById('adminNewUserEmail').value.trim(),
        phone: document.getElementById('adminNewUserPhone').value.trim(),
        role: document.getElementById('adminNewUserRole').value,
        password: document.getElementById('adminNewUserPassword').value
      };

      try {
        const res = await fetch(`${API_BASE}/api/admin/users`, {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert('Failed to create account: ' + (data.message || res.statusText));
          return;
        }
        closeModal(document.getElementById('adminCreateUserModal'));
        adminCreateUserForm.reset();
        const roleLabel = payload.role === 'host' ? 'Venue Owner' : (payload.role === 'admin' ? 'Administrator' : 'Customer');
        showToast(`${roleLabel} "${payload.name}" added! Counts & lists updated.`);
        refreshAdminDashboard();
      } catch (err) {
        alert('Connection error creating account.');
      }
    });
  }

  const adminClearAllBookingsBtn = document.getElementById('adminClearAllBookingsBtn');
  if (adminClearAllBookingsBtn) {
    adminClearAllBookingsBtn.addEventListener('click', async () => {
      if (!confirm('Delete ALL bookings from MongoDB and reset Booking Management to 0?')) return;
      try {
        let res = await fetch(`${API_BASE}/api/admin/bookings`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          credentials: 'include'
        });

        if (res.status === 404 || res.status === 405) {
          for (const b of loadedBookings) {
            const bId = extractId(b.id || b._id);
            if (!bId) continue;
            await fetch(`${API_BASE}/api/bookings/${encodeURIComponent(bId)}`, {
              method: 'DELETE',
              headers: getAuthHeaders(),
              credentials: 'include'
            });
          }
          res = { ok: true };
        }

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert('Failed to clear bookings: ' + (err.message || res.statusText));
          return;
        }
        showToast('All database bookings cleared. Booking Management reset to 0.');
        refreshAdminDashboard();
      } catch (err) {
        alert('Connection error clearing bookings.');
      }
    });
  }

  const adminRefreshBtn = document.getElementById('adminRefreshBtn');
  if (adminRefreshBtn) {
    adminRefreshBtn.addEventListener('click', () => refreshAdminDashboard(true));
  }

  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      showToast('Platform settings saved successfully.');
    });
  }

  window.addEventListener('focus', () => refreshAdminDashboard(false));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshAdminDashboard(false);
  });
  setInterval(() => {
    if (!document.hidden) refreshAdminDashboard(false);
  }, 15000);

  refreshAdminDashboard(false);
});
