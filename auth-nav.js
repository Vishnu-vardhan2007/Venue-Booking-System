(function () {
  const STORAGE_KEY = 'venueverse_user';
  const API_BASE = window.VENUEVERSE_API_BASE ||
    ((window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:5000' : 'http://localhost:5000');

  function getBasePath() {
    const script = document.querySelector('script[src*="auth-nav.js"]');
    if (script) {
      const src = script.getAttribute('src') || '';
      const idx = src.indexOf('auth-nav.js');
      if (idx > 0) return src.slice(0, idx);
    }
    const path = window.location.pathname.replace(/\\/g, '/');
    if (/\/(venues|venue-details|checkout|owner-dashboard|admin-dashboard|signin)\//.test(path)) {
      return '../';
    }
    return '';
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function computeInitials(name) {
    if (!name || typeof name !== 'string') return 'VV';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'VV';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function getNormalizedRole(user) {
    const raw = String((user && (user.backendRole || user.role)) || 'user').trim().toLowerCase();
    if (raw === 'admin' || raw === 'administrator') return 'admin';
    if (['host', 'venue_owner', 'venue owner', 'venue_host', 'venue host', 'owner'].includes(raw)) return 'host';
    return 'user';
  }

  function getRoleMeta(user) {
    const role = getNormalizedRole(user);
    if (role === 'admin') {
      return { role: 'admin', displayRole: 'Administrator' };
    }
    if (role === 'host') {
      return { role: 'host', displayRole: 'Venue Owner' };
    }
    return { role: 'user', displayRole: 'User' };
  }

  function getUser() {
    let raw = null;
    try {
      raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      const role = getNormalizedRole(parsed);
      const meta = getRoleMeta(parsed);
      return {
        ...parsed,
        _id: parsed._id || parsed.id || '',
        role,
        backendRole: role,
        displayRole: meta.displayRole,
        initials: parsed.initials || computeInitials(parsed.name || parsed.email)
      };
    } catch (e) {
      return null;
    }
  }

  function setUser(userData) {
    if (!userData || typeof userData !== 'object') {
      clearUser();
      return null;
    }
    const role = getNormalizedRole(userData);
    const meta = getRoleMeta({ ...userData, role, backendRole: role });
    const payload = {
      ...userData,
      _id: userData._id || userData.id || '',
      role,
      backendRole: role,
      displayRole: meta.displayRole,
      initials: computeInitials(userData.name || userData.email)
    };
    const serialized = JSON.stringify(payload);
    try {
      sessionStorage.setItem(STORAGE_KEY, serialized);
    } catch (e) {   }
    try {
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (e) {   }

    renderNavbar();
    refreshBookingsBadge();
    return payload;
  }

  function clearUser() {
    ['venueverse_user', 'venueverse_pending_checkout'].forEach(key => {
      try { sessionStorage.removeItem(key); } catch (e) {   }
      try { localStorage.removeItem(key); } catch (e) {   }
    });
  }

  async function logout() {
    const user = getUser();
    clearUser();
    renderNavbar();
    refreshBookingsBadge();

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
        headers: user && user._id ? { 'X-User-Id': user._id } : {}
      });
      clearTimeout(timer);
    } catch (e) {
    }

    window.location.replace(`${getBasePath()}index.html`);
  }

  async function syncWithBackend() {
    const localUser = getUser();
    if (!localUser) {
      renderNavbar();
      refreshBookingsBadge();
      return null;
    }

    try {
      const headers = localUser._id ? { 'X-User-Id': localUser._id } : {};
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers
      });

      if (res.ok) {
        const data = await res.json();
        const backendUser = data && (data.user || data);
        if (backendUser && (backendUser.id || backendUser._id)) {
          const nextId = backendUser.id || backendUser._id;
          const nextName = backendUser.name || localUser.name;
          const nextEmail = backendUser.email || localUser.email;
          const nextRole = String(backendUser.role || localUser.role).trim().toLowerCase();

          if (
            nextId === localUser._id &&
            nextName === localUser.name &&
            nextEmail === localUser.email &&
            nextRole === localUser.role
          ) {
            return localUser;
          }

          return setUser({
            ...localUser,
            _id: nextId,
            name: nextName,
            email: nextEmail,
            role: nextRole,
            backendRole: nextRole
          });
        }
      } else if (res.status === 401) {
        clearUser();
        renderNavbar();
        refreshBookingsBadge();
        return null;
      }
    } catch (e) {
    }

    renderNavbar();
    refreshBookingsBadge();
    return localUser;
  }

  function ensureHelperStyles() {
    if (document.getElementById('vv-auth-nav-styles')) return;
    const style = document.createElement('style');
    style.id = 'vv-auth-nav-styles';
    style.textContent = `
            .profile-dropdown-menu { display: none; }
            .profile-dropdown-menu.open { display: block; }
            .vv-modal-overlay {
                position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55);
                backdrop-filter: blur(4px); z-index: 10000;
                display: none; align-items: center; justify-content: center; padding: 20px;
            }
            .vv-modal-overlay.open { display: flex; }
            .vv-modal-card {
                background: #ffffff; border-radius: 18px; width: 100%; max-width: 680px;
                max-height: 85vh; display: flex; flex-direction: column; overflow: hidden;
                box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
            }
            .vv-modal-header {
                display: flex; align-items: center; justify-content: space-between;
                padding: 18px 22px; border-bottom: 1px solid #e2e8f0;
            }
            .vv-modal-header h3 { margin: 0; font-size: 1.12rem; color: #0f172a; }
            .vv-modal-close {
                border: none; background: #f1f5f9; color: #334155; width: 32px; height: 32px;
                border-radius: 50%; cursor: pointer; font-size: 1.1rem; line-height: 1;
            }
            .vv-modal-body { padding: 18px 22px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
            .vv-booking-row {
                border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px;
                display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px;
            }
            .vv-status-pill {
                display: inline-block; padding: 3px 10px; border-radius: 999px;
                font-size: 0.74rem; font-weight: 700; text-transform: capitalize;
                background: #dcfce7; color: #166534;
            }
            .vv-status-pill.cancelled { background: #fee2e2; color: #991b1b; }
            .vv-status-pill.completed { background: #e0e7ff; color: #3730a3; }
        `;
    document.head.appendChild(style);
  }

  function buildRoleDropdownLinks(role, basePath) {
    if (role === 'admin') {
      return `
                <a href="${basePath}admin-dashboard/admin.html" class="dropdown-item host-highlight-item">
                    <span class="dropdown-item-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    </span>
                    <span class="dropdown-item-text">
                        <strong>Admin Portal</strong>
                        <span>Manage users, hosts &amp; venues</span>
                    </span>
                </a>
                <a href="${basePath}owner-dashboard/owner.html" class="dropdown-item">
                    <span class="dropdown-item-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    </span>
                    <span class="dropdown-item-text">
                        <strong>Host Dashboard</strong>
                        <span>Switch to owner view</span>
                    </span>
                </a>
            `;
    }
    if (role === 'host') {
      return `
                <a href="${basePath}owner-dashboard/owner.html" class="dropdown-item host-highlight-item">
                    <span class="dropdown-item-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    </span>
                    <span class="dropdown-item-text">
                        <strong>Host Dashboard</strong>
                        <span>Manage your venues &amp; bookings</span>
                    </span>
                </a>
                <a href="${basePath}owner-dashboard/add-venue.html" class="dropdown-item">
                    <span class="dropdown-item-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    </span>
                    <span class="dropdown-item-text">
                        <strong>Add New Venue</strong>
                        <span>Publish a new listing</span>
                    </span>
                </a>
            `;
    }
    return '';
  }

  function renderNavbar() {
    ensureHelperStyles();
    const user = getUser();
    const hostBanner = document.getElementById('hostBanner');
    if (hostBanner) {
      const role = user ? getNormalizedRole({ backendRole: user.backendRole || user.role }) : '';
      hostBanner.style.display = (user && role === 'user') ? 'none' : '';
    }

    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    const basePath = getBasePath();
    const existingWrap = document.getElementById('userProfileMenuWrap');
    const signinLink = navActions.querySelector('a[href*="signin.html"], a[href*="signin"]');

    if (!user) {
      if (existingWrap) {
        const restoredLink = document.createElement('a');
        restoredLink.href = `${basePath}signin/signin.html`;
        restoredLink.className = 'btn btn-primary';
        restoredLink.textContent = 'Sign In';
        existingWrap.replaceWith(restoredLink);
      } else if (signinLink) {
        signinLink.style.display = '';
      }
      return;
    }

    const meta = getRoleMeta(user);
    const initials = escapeHtml(user.initials || computeInitials(user.name || user.email));
    const displayName = escapeHtml(user.name || 'VenueVerse User');
    const displayEmail = escapeHtml(user.email || '');

    const wrap = document.createElement('div');
    wrap.id = 'userProfileMenuWrap';
    wrap.className = 'user-profile-menu-wrap';
    wrap.innerHTML = `
            <button type="button" id="profilePillBtn" class="btn-profile-pill" aria-expanded="false" aria-label="Account menu">
                <svg class="pill-menu-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round">
                    <line x1="4" y1="7" x2="20" y2="7"></line>
                    <line x1="4" y1="12" x2="20" y2="12"></line>
                    <line x1="4" y1="17" x2="20" y2="17"></line>
                </svg>
                <span id="navAvatarCircle" class="pill-avatar-circle" title="${displayName}">${initials}</span>
            </button>
            <div id="profileDropdownMenu" class="profile-dropdown-menu" role="menu">
                <div class="dropdown-user-header">
                    <div class="dropdown-user-avatar">${initials}</div>
                    <div class="dropdown-user-meta">
                        <div class="dropdown-user-name">${displayName}</div>
                        <div class="dropdown-user-email">${displayEmail}</div>
                        <div class="dropdown-badges-row">
                            <span class="user-role-badge">${escapeHtml(meta.displayRole)}</span>
                        </div>
                    </div>
                </div>
                <div class="dropdown-divider"></div>
                ${buildRoleDropdownLinks(meta.role, basePath)}
                <button type="button" id="dropdownMyBookingsBtn" class="dropdown-item">
                    <span class="dropdown-item-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </span>
                    <span class="dropdown-item-text">
                        <strong>My Bookings</strong>
                        <span>View instant confirmations</span>
                    </span>
                </button>
                <a href="${basePath}venues/venues.html" class="dropdown-item">
                    <span class="dropdown-item-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </span>
                    <span class="dropdown-item-text">
                        <strong>Explore Venues</strong>
                        <span>Browse verified spaces</span>
                    </span>
                </a>
                <div class="dropdown-divider"></div>
                <button type="button" id="dropdownLogoutBtn" class="dropdown-item logout-item">
                    <span class="dropdown-item-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </span>
                    <span class="dropdown-item-text">
                        <strong>Log Out</strong>
                        <span>Sign out of this device</span>
                    </span>
                </button>
            </div>
        `;

    if (existingWrap) {
      existingWrap.replaceWith(wrap);
    } else if (signinLink) {
      signinLink.replaceWith(wrap);
    } else {
      navActions.appendChild(wrap);
    }

    const pillBtn = wrap.querySelector('#profilePillBtn');
    const dropdown = wrap.querySelector('#profileDropdownMenu');
    const bookingsBtn = wrap.querySelector('#dropdownMyBookingsBtn');
    const logoutBtn = wrap.querySelector('#dropdownLogoutBtn');

    pillBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      pillBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    if (bookingsBtn) {
      bookingsBtn.addEventListener('click', () => {
        dropdown.classList.remove('open');
        pillBtn.setAttribute('aria-expanded', 'false');
        openMyBookingsModal();
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        dropdown.classList.remove('open');
        logout();
      });
    }
  }

  async function refreshBookingsBadge() {
    const badge = document.getElementById('myBookingsCountBadge');
    if (!badge) return;

    const user = getUser();
    if (!user) {
      badge.style.display = 'none';
      badge.textContent = '0';
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/bookings/my`, {
        credentials: 'include',
        headers: user._id ? { 'X-User-Id': user._id } : {}
      });
      if (!res.ok) {
        badge.style.display = 'none';
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data.bookings) ? data.bookings : [];
      const activeCount = list.filter(b => b.status !== 'cancelled').length;
      if (activeCount > 0) {
        badge.textContent = String(activeCount);
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    } catch (e) {
      badge.style.display = 'none';
    }
  }

  function ensureBookingsModal() {
    let modal = document.getElementById('vvMyBookingsModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'vvMyBookingsModal';
    modal.className = 'vv-modal-overlay';
    modal.innerHTML = `
            <div class="vv-modal-card" role="dialog" aria-modal="true" aria-labelledby="vvBookingsTitle">
                <div class="vv-modal-header">
                    <h3 id="vvBookingsTitle">My Confirmed Bookings</h3>
                    <button type="button" id="vvBookingsCloseBtn" class="vv-modal-close" aria-label="Close">&times;</button>
                </div>
                <div id="vvBookingsBody" class="vv-modal-body">
                    <p style="color:#64748b;margin:0;">Loading your bookings...</p>
                </div>
            </div>
        `;
    document.body.appendChild(modal);

    modal.querySelector('#vvBookingsCloseBtn').addEventListener('click', () => {
      modal.classList.remove('open');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
    return modal;
  }

  async function cancelBookingById(bookingId) {
    const user = getUser();
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${encodeURIComponent(bookingId)}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(user._id ? { 'X-User-Id': user._id } : {})
        }
      });
      if (res.ok) {
        await openMyBookingsModal();
        refreshBookingsBadge();
      }
    } catch (e) {
      alert('Unable to cancel booking right now.');
    }
  }

  async function openMyBookingsModal() {
    const user = getUser();
    if (!user) {
      window.location.href = `${getBasePath()}signin/signin.html`;
      return;
    }

    ensureHelperStyles();
    const modal = ensureBookingsModal();
    const body = modal.querySelector('#vvBookingsBody');
    body.innerHTML = '<p style="color:#64748b;margin:0;">Loading your bookings...</p>';
    modal.classList.add('open');

    try {
      const res = await fetch(`${API_BASE}/api/bookings/my`, {
        credentials: 'include',
        headers: user._id ? { 'X-User-Id': user._id } : {}
      });
      if (!res.ok) {
        throw new Error('Failed to load bookings');
      }
      const data = await res.json();
      const bookings = Array.isArray(data.bookings) ? data.bookings : [];

      if (bookings.length === 0) {
        body.innerHTML = `
                    <div style="text-align:center;padding:28px 12px;color:#64748b;">
                        <p style="margin:0 0 12px 0;">You have no bookings yet.</p>
                        <a href="${getBasePath()}venues/venues.html" style="color:#2563eb;font-weight:600;text-decoration:none;">Explore Venues &rarr;</a>
                    </div>
                `;
        return;
      }

      body.innerHTML = bookings.map(b => {
        const venue = (b.venue && typeof b.venue === 'object') ? b.venue : {};
        const title = escapeHtml(b.venueTitle || venue.title || 'Booked Venue');
        const loc = escapeHtml(b.venueLocation || venue.location || '');
        const dateStr = b.bookingDate
          ? new Date(b.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'Scheduled Date';
        const statusRaw = String(b.status || 'confirmed').toLowerCase();
        const cancelledBy = String(b.cancelledBy || '').trim().toLowerCase();
        const statusLabel = statusRaw === 'cancelled'
          ? (cancelledBy === 'admin' ? 'Cancelled by Admin' : (cancelledBy === 'user' ? 'Cancelled by User' : 'Cancelled'))
          : (statusRaw === 'rejected' ? 'Rejected by Admin' : statusRaw);
        const statusClass = statusRaw === 'cancelled' || statusRaw === 'rejected' ? 'cancelled' : (statusRaw === 'completed' ? 'completed' : '');
        const total = Number(b.totalPrice || b.amount || 0).toLocaleString('en-IN');
        const guests = b.guests || 1;
        const bId = b._id || b.id;
        const eventTypeBadge = b.eventType
          ? ` &bull; ${escapeHtml(String(b.eventType).replace(/^./, c => c.toUpperCase()))}`
          : '';

        return `
                    <div class="vv-booking-row">
                        <div>
                            <div style="font-weight:700;color:#0f172a;margin-bottom:4px;">${title}${eventTypeBadge}</div>
                            <div style="font-size:0.84rem;color:#64748b;">${loc ? `${loc} &bull; ` : ''}${dateStr} &bull; ${guests} guests</div>
                            <div style="font-size:0.86rem;font-weight:600;color:#1e293b;margin-top:4px;">&#8377;${total}</div>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span class="vv-status-pill ${statusClass}">${escapeHtml(statusLabel)}</span>
                            ${statusRaw === 'confirmed' && bId ? `<button type="button" class="vv-cancel-btn" data-booking-id="${escapeHtml(bId)}" style="padding:6px 12px;border-radius:8px;border:1px solid #fecaca;background:#fff;color:#dc2626;font-size:0.8rem;font-weight:600;cursor:pointer;">Cancel</button>` : ''}
                        </div>
                    </div>
                `;
      }).join('');

      body.querySelectorAll('.vv-cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-booking-id');
          if (id) cancelBookingById(id);
        });
      });
    } catch (e) {
      body.innerHTML = '<p style="color:#dc2626;margin:0;">Unable to load bookings from server. Make sure the backend is running on port 5000.</p>';
    }
  }

  function bindGlobalEvents() {
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('profileDropdownMenu');
      const pillBtn = document.getElementById('profilePillBtn');
      const wrap = document.getElementById('userProfileMenuWrap');
      if (dropdown && dropdown.classList.contains('open') && wrap && !wrap.contains(e.target)) {
        dropdown.classList.remove('open');
        if (pillBtn) pillBtn.setAttribute('aria-expanded', 'false');
      }
    });

    const myBookingsNavBtn = document.getElementById('myBookingsNavBtn');
    if (myBookingsNavBtn) {
      myBookingsNavBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openMyBookingsModal();
      });
    }

    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        renderNavbar();
        refreshBookingsBadge();
      }
    });

    window.addEventListener('pageshow', () => {
      renderNavbar();
      refreshBookingsBadge();
      syncWithBackend();
    });
  }

  window.VenueVerseAuth = {
    API_BASE,
    STORAGE_KEY,
    getUser,
    setUser,
    clearUser,
    logout,
    syncWithBackend,
    renderNavbar,
    openMyBookingsModal,
    refreshBookingsBadge
  };

  document.addEventListener('DOMContentLoaded', () => {
    bindGlobalEvents();
    renderNavbar();
    refreshBookingsBadge();
    syncWithBackend();
  });
})();
