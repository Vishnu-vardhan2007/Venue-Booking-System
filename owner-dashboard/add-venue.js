document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  function verifyHostAccess() {
    let user = null;
    try {
      const raw = sessionStorage.getItem('venueverse_user') || localStorage.getItem('venueverse_user');
      if (raw) user = JSON.parse(raw);
    } catch (e) {}

    if (!user) {
      alert('Please sign in with a Venue Owner account to list venues.');
      window.location.replace('../signin/signin.html');
      return null;
    }

    const rawRole = String(user.backendRole || user.role || '').trim().toLowerCase();
    const allowed = ['host', 'venue_owner', 'venue owner', 'venue_host', 'venue host', 'owner', 'admin', 'administrator'].includes(rawRole)
      || rawRole.includes('host') || rawRole.includes('organizer');
    if (!allowed) {
      alert('Access Restricted: Only Venue Owner accounts can list venues.');
      window.location.replace('../index.html');
      return null;
    }
    return user;
  }

  let currentUser = verifyHostAccess();
  if (!currentUser) return;

  window.addEventListener('pageshow', verifyHostAccess);
  window.addEventListener('storage', (e) => {
    if (e.key === 'venueverse_user') verifyHostAccess();
  });

  const stepCounterText = document.getElementById('stepCounterText');
  const wizardStep1 = document.getElementById('wizardStep1');
  const wizardStep2 = document.getElementById('wizardStep2');
  const wizardStep3 = document.getElementById('wizardStep3');
  const wizardStep4 = document.getElementById('wizardStep4');
  const publishSuccessCard = document.getElementById('publishSuccessCard');

  const btnNext1 = document.getElementById('btnNext1');
  const btnBack2 = document.getElementById('btnBack2');
  const btnNext2 = document.getElementById('btnNext2');
  const btnBack3 = document.getElementById('btnBack3');
  const btnNext3 = document.getElementById('btnNext3');
  const btnBack4 = document.getElementById('btnBack4');
  const btnPublishVenue = document.getElementById('btnPublishVenue');

  function showStep(stepNum) {
    wizardStep1.style.display = stepNum === 1 ? 'block' : 'none';
    wizardStep2.style.display = stepNum === 2 ? 'block' : 'none';
    wizardStep3.style.display = stepNum === 3 ? 'block' : 'none';
    wizardStep4.style.display = stepNum === 4 ? 'block' : 'none';
    if (stepCounterText) {
      stepCounterText.textContent = `Step ${stepNum} of 4`;
    }
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }

  function getSelectedCategories() {
    return Array.from(document.querySelectorAll('input[name="venueCategory"]:checked'))
      .map(input => String(input.value || '').trim().toLowerCase())
      .filter(Boolean);
  }

  function formatCategoryLabels(categories) {
    const labelMap = { corporate: 'CORPORATE EVENT' };
    return categories.map(cat => (labelMap[cat] || cat).toUpperCase()).join(' • ');
  }

  if (btnNext1) {
    btnNext1.addEventListener('click', function () {
      const title = document.getElementById('venueTitleInput').value.trim();
      if (!title) {
        alert('Please give your venue a name before proceeding.');
        document.getElementById('venueTitleInput').focus();
        return;
      }
      if (getSelectedCategories().length === 0) {
        alert('Please select at least one event category for your venue.');
        return;
      }
      showStep(2);
    });
  }

  if (btnBack2) btnBack2.addEventListener('click', () => showStep(1));
  if (btnNext2) {
    btnNext2.addEventListener('click', function () {
      const address = document.getElementById('addressInput').value.trim();
      if (!address) {
        alert('Please enter your venue address or nearest landmark.');
        document.getElementById('addressInput').focus();
        return;
      }
      showStep(3);
    });
  }

  if (btnBack3) btnBack3.addEventListener('click', () => showStep(2));
  if (btnNext3) {
    btnNext3.addEventListener('click', function () {
      const capacity = parseInt(document.getElementById('capacityInput').value, 10);
      if (!capacity || capacity < 10) {
        alert('Please enter a valid guest capacity (at least 10 guests).');
        return;
      }
      showStep(4);
    });
  }

  if (btnBack4) btnBack4.addEventListener('click', () => showStep(3));

  const prevTitle = document.getElementById('prevTitle');
  const prevCategory = document.getElementById('prevCategory');
  const prevLocation = document.getElementById('prevLocation');
  const prevCapacity = document.getElementById('prevCapacity');
  const prevPrice = document.getElementById('prevPrice');
  const prevHostBadge = document.getElementById('prevHostBadge');
  const prevImg = document.getElementById('prevImg');

  const venueTitleInput = document.getElementById('venueTitleInput');
  const spaceTypeSelect = document.getElementById('spaceTypeSelect');
  const citySelect = document.getElementById('citySelect');
  const capacityInput = document.getElementById('capacityInput');
  const priceInput = document.getElementById('priceInput');
  const hostNameInput = document.getElementById('hostNameInput');

  try {
    const rawUser = sessionStorage.getItem('venueverse_user') || localStorage.getItem('venueverse_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (hostNameInput && u.name && !hostNameInput.value) {
        hostNameInput.value = u.name;
      }
    }
  } catch (e) {}

  function updateLivePreview() {
    const title = venueTitleInput ? venueTitleInput.value.trim() : 'Your Venue';
    const city = citySelect ? citySelect.value : 'Ahmedabad';
    const space = spaceTypeSelect ? spaceTypeSelect.value : 'Indoor Banquet';
    const cap = capacityInput ? capacityInput.value : '300';
    const price = priceInput ? parseInt(priceInput.value, 10) || 25000 : 25000;
    const host = hostNameInput ? hostNameInput.value.trim() : 'Host';

    const selectedCats = getSelectedCategories();
    if (prevTitle) prevTitle.textContent = title || 'Your Venue Name';
    if (prevCategory) {
      prevCategory.textContent = selectedCats.length > 0
        ? `${formatCategoryLabels(selectedCats)} VENUE`
        : 'SELECT EVENT CATEGORY';
    }
    if (prevLocation) prevLocation.textContent = `${city}, Gujarat`;
    if (prevCapacity) prevCapacity.textContent = `Up to ${cap} guests • ${space}`;
    if (prevPrice) prevPrice.textContent = `₹${price.toLocaleString('en-IN')}`;
    if (prevHostBadge) prevHostBadge.textContent = `Host: ${host}`;
  }

  if (venueTitleInput) venueTitleInput.addEventListener('input', updateLivePreview);
  if (citySelect) citySelect.addEventListener('change', updateLivePreview);
  if (spaceTypeSelect) spaceTypeSelect.addEventListener('change', updateLivePreview);
  if (capacityInput) capacityInput.addEventListener('input', updateLivePreview);
  if (priceInput) priceInput.addEventListener('input', updateLivePreview);
  if (hostNameInput) hostNameInput.addEventListener('input', updateLivePreview);

  const catChoiceTiles = document.querySelectorAll('.cat-choice-tile');
  catChoiceTiles.forEach(tile => {
    const input = tile.querySelector('input[type="checkbox"], input[type="radio"]');
    if (input) {
      tile.classList.toggle('is-selected', input.checked);
    }
    tile.addEventListener('click', function (e) {
      if (!input) return;
      if (e.target !== input) {
        input.checked = !input.checked;
      }
      tile.classList.toggle('is-selected', input.checked);
      updateLivePreview();
    });
  });

  const amenityChips = document.querySelectorAll('.amenity-checkbox-chip');
  amenityChips.forEach(chip => {
    const cb = chip.querySelector('input[type="checkbox"]');
    chip.addEventListener('click', function (e) {
      if (e.target !== cb) {
        cb.checked = !cb.checked;
      }
      chip.classList.toggle('is-checked', cb.checked);
    });
  });

  let uploadedPhotos = [];

  const photoDropZone = document.getElementById('photoDropZone');
  const venuePhotoFileInput = document.getElementById('venuePhotoFileInput');
  const btnBrowsePhotos = document.getElementById('btnBrowsePhotos');
  const uploadedPhotosGrid = document.getElementById('uploadedPhotosGrid');
  const photoCounterBadge = document.getElementById('photoCounterBadge');
  const photoErrorMsg = document.getElementById('photoErrorMsg');

  function compressAndAddImage(file) {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

        const newPhotoItem = {
          id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          dataUrl: compressedDataUrl,
          name: file.name,
          isCover: uploadedPhotos.length === 0
        };

        uploadedPhotos.push(newPhotoItem);
        renderUploadedPhotosTray();
        if (photoErrorMsg) photoErrorMsg.style.display = 'none';
        if (photoDropZone) photoDropZone.classList.remove('has-error');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function handleFiles(files) {
    if (!files || !files.length) return;
    Array.from(files).forEach(file => compressAndAddImage(file));
  }

  function renderUploadedPhotosTray() {
    if (!uploadedPhotosGrid) return;

    if (uploadedPhotos.length === 0) {
      uploadedPhotosGrid.style.display = 'none';
      uploadedPhotosGrid.innerHTML = '';
      if (photoCounterBadge) photoCounterBadge.textContent = '0 photos added';
      if (photoDropZone) photoDropZone.style.display = 'block';
      if (prevImg) prevImg.src = '../assets/venue-ballroom.jpg';
      return;
    }

    uploadedPhotosGrid.style.display = 'grid';
    if (photoDropZone) photoDropZone.style.display = 'none';

    if (photoCounterBadge) {
      photoCounterBadge.textContent = `${uploadedPhotos.length} photo${uploadedPhotos.length === 1 ? '' : 's'} added`;
    }

    let html = '';
    uploadedPhotos.forEach(item => {
      html += `
        <div class="photo-thumb-card ${item.isCover ? 'is-cover' : ''}" data-id="${item.id}">
          <img src="${item.dataUrl}" alt="${item.name}" class="thumb-img">
          ${item.isCover 
            ? '<span class="cover-badge">★ Cover Photo</span>' 
            : `<button type="button" class="btn-make-cover" data-id="${item.id}">Set as Cover</button>`
          }
          <button type="button" class="btn-remove-photo" data-id="${item.id}" title="Remove photo">&times;</button>
        </div>
      `;
    });

    html += `
      <div class="dropzone-add-more-card" id="btnAddMorePhotos">
        <span class="add-more-icon">+</span>
        <span class="add-more-text">Add More</span>
      </div>
    `;

    uploadedPhotosGrid.innerHTML = html;

    const removeButtons = uploadedPhotosGrid.querySelectorAll('.btn-remove-photo');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const photoId = btn.getAttribute('data-id');
        removePhoto(photoId);
      });
    });

    const coverButtons = uploadedPhotosGrid.querySelectorAll('.btn-make-cover');
    coverButtons.forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const photoId = btn.getAttribute('data-id');
        setCoverPhoto(photoId);
      });
    });

    const btnAddMore = document.getElementById('btnAddMorePhotos');
    if (btnAddMore && venuePhotoFileInput) {
      btnAddMore.addEventListener('click', () => venuePhotoFileInput.click());
    }

    const cover = uploadedPhotos.find(p => p.isCover) || uploadedPhotos[0];
    if (cover && prevImg) {
      prevImg.src = cover.dataUrl;
    }
  }

  function removePhoto(id) {
    const idx = uploadedPhotos.findIndex(p => p.id === id);
    if (idx === -1) return;
    const wasCover = uploadedPhotos[idx].isCover;
    uploadedPhotos.splice(idx, 1);
    if (wasCover && uploadedPhotos.length > 0) {
      uploadedPhotos[0].isCover = true;
    }
    renderUploadedPhotosTray();
  }

  function setCoverPhoto(id) {
    uploadedPhotos.forEach(p => {
      p.isCover = (p.id === id);
    });
    renderUploadedPhotosTray();
  }

  if (btnBrowsePhotos && venuePhotoFileInput) {
    btnBrowsePhotos.addEventListener('click', function (e) {
      e.stopPropagation();
      venuePhotoFileInput.click();
    });
  }

  if (photoDropZone && venuePhotoFileInput) {
    photoDropZone.addEventListener('click', function () {
      venuePhotoFileInput.click();
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      photoDropZone.addEventListener(eventName, function (e) {
        e.preventDefault();
        e.stopPropagation();
        photoDropZone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'dragend'].forEach(eventName => {
      photoDropZone.addEventListener(eventName, function (e) {
        e.preventDefault();
        e.stopPropagation();
        photoDropZone.classList.remove('is-dragover');
      });
    });

    photoDropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();
      photoDropZone.classList.remove('is-dragover');
      if (e.dataTransfer && e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    });
  }

  if (venuePhotoFileInput) {
    venuePhotoFileInput.addEventListener('change', function (e) {
      handleFiles(e.target.files);
      venuePhotoFileInput.value = '';
    });
  }

  const btnLoadSamplePhotos = document.getElementById('btnLoadSamplePhotos');
  if (btnLoadSamplePhotos) {
    btnLoadSamplePhotos.addEventListener('click', async function () {
      const samplePaths = [
        { path: '../assets/venue-glasshouse.jpg', name: 'glasshouse-lawn.jpg' },
        { path: '../assets/venue-ballroom.jpg', name: 'grand-ballroom.jpg' },
        { path: '../assets/venue-dining.jpg', name: 'dining-pavilion.jpg' }
      ];

      for (const item of samplePaths) {
        try {
          const res = await fetch(item.path);
          const blob = await res.blob();
          const file = new File([blob], item.name, { type: 'image/jpeg' });
          compressAndAddImage(file);
        } catch (err) {
          console.warn('Could not load demo sample photo:', err);
        }
      }
    });
  }

  updateLivePreview();

  const cityCoordinatesMap = {
    'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'Gandhinagar': { lat: 23.2156, lng: 72.6369 },
    'Surat': { lat: 21.1702, lng: 72.8311 },
    'Rajkot': { lat: 22.3039, lng: 70.8022 },
    'Vadodara': { lat: 22.3072, lng: 73.1812 }
  };

  if (btnPublishVenue) {
    btnPublishVenue.addEventListener('click', async function () {
      if (uploadedPhotos.length === 0) {
        if (photoErrorMsg) photoErrorMsg.style.display = 'block';
        if (photoDropZone) {
          photoDropZone.classList.add('has-error');
          photoDropZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      const title = venueTitleInput.value.trim() || 'My Venue';
      const city = citySelect.value;
      const addressInputEl = document.getElementById('addressInput');
      const addressVal = addressInputEl ? addressInputEl.value.trim() : '';
      const spaceType = spaceTypeSelect.value;
      const desc = document.getElementById('venueDescInput').value.trim();
      const capacity = parseInt(capacityInput.value, 10) || 300;
      const price = parseInt(priceInput.value, 10) || 25000;
      const host = hostNameInput.value.trim() || 'Verified Host';

      const selectedCategories = getSelectedCategories();
      if (selectedCategories.length === 0) {
        alert('Please go back to Step 1 and select at least one event category.');
        showStep(1);
        return;
      }
      const category = selectedCategories[0];

      const coverItem = uploadedPhotos.find(p => p.isCover) || uploadedPhotos[0];
      const coverPhoto = coverItem ? coverItem.dataUrl : 'assets/venue-ballroom.jpg';
      const galleryPhotos = [
        coverPhoto,
        ...uploadedPhotos.filter(p => p !== coverItem).map(p => p.dataUrl)
      ];

      const checkedAmenities = Array.from(document.querySelectorAll('.amenity-checkbox-chip.is-checked input'))
        .map(input => input.value);

      const coords = cityCoordinatesMap[city] || { lat: 23.02, lng: 72.57 };

      try {
      const apiBase = (window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:5000' : 'http://localhost:5000';
      let currentUser = null;
      try {
        const raw = sessionStorage.getItem('venueverse_user') || localStorage.getItem('venueverse_user');
        if (raw) currentUser = JSON.parse(raw);
      } catch (e) {}

      if (!currentUser) {
        alert('Access Denied: You must be logged in to publish a venue. Please sign in first.');
        window.location.href = '../signin/signin.html?returnUrl=' + encodeURIComponent(window.location.href);
        return;
      }

      const backendPayload = {
        title: title,
        description: desc || `${title} located in ${city} (${spaceType})`,
        category: category,
        categories: selectedCategories,
        city: city,
        address: addressVal || `${title}, ${city}`,
        capacity: capacity,
        pricePerDay: price,
        bookingType: 'direct',
        lat: coords.lat,
        lng: coords.lng,
        amenities: checkedAmenities,
        images: galleryPhotos
      };

      const reqHeaders = { 'Content-Type': 'application/json' };
      if (currentUser && (currentUser._id || currentUser.id)) {
        reqHeaders['X-User-Id'] = currentUser._id || currentUser.id;
      }

      let realVenueId = '';
      try {
        const resp = await fetch(`${apiBase}/api/venues`, {
          method: 'POST',
          headers: reqHeaders,
          credentials: 'include',
          body: JSON.stringify(backendPayload)
        });

        if (resp.status === 401) {
          alert('Access Denied (401): You must be logged in to publish a venue. Please sign in first.');
          window.location.href = '../signin/signin.html?returnUrl=' + encodeURIComponent(window.location.href);
          return;
        }

        if (resp.status === 403) {
          alert('Access Denied (403): Only authenticated Venue Hosts are allowed to add venues. Please sign in or register with a Venue Host account.');
          return;
        }

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          alert(`Failed to add venue (${resp.status}): ${errData.message || 'Please check all required fields.'}`);
          return;
        }

        const data = await resp.json();
        const createdVenue = (data && data.venue) ? data.venue : data;
        realVenueId = createdVenue._id || createdVenue.id || '';
        console.log('Venue saved to MongoDB via Spring Boot backend:', createdVenue);
      } catch (netErr) {
        console.error('Cannot connect to Java backend on port 5000:', netErr);
        alert('Connection Error: Cannot reach the Java backend at ' + apiBase + '.\nPlease ensure the backend server is running on port 5000.');
        return;
      }

        wizardStep1.style.display = 'none';
        wizardStep2.style.display = 'none';
        wizardStep3.style.display = 'none';
        wizardStep4.style.display = 'none';

        const pubVenueTitle = document.getElementById('pubVenueTitle');
        const pubCategoryCity = document.getElementById('pubCategoryCity');
        const pubPrice = document.getElementById('pubPrice');
        const pubHost = document.getElementById('pubHost');
        const btnViewLiveVenue = document.getElementById('btnViewLiveVenue');

        if (pubVenueTitle) pubVenueTitle.textContent = title;
        if (pubCategoryCity) pubCategoryCity.textContent = `${formatCategoryLabels(selectedCategories)} in ${city}`;
        if (pubPrice) pubPrice.textContent = `₹${price.toLocaleString('en-IN')} / day`;
        if (pubHost) pubHost.textContent = `${host} — Pending Admin Approval`;
        if (btnViewLiveVenue) {
          btnViewLiveVenue.href = 'owner.html';
        }

        if (publishSuccessCard) {
          publishSuccessCard.style.display = 'flex';
          publishSuccessCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

      } catch (err) {
        alert('Could not publish venue: ' + err.message);
      }
    });
  }

});
