// Garden Pet Sitting — reviews
// Loads posted reviews from the Google script, shows them on the homepage
// carousel and the Reviews page, and handles the "Leave a review" form.
// Runs after main.js, so openModal / closeModals are available.

// The "Garden Pet Sitting reviews" Apps Script web app URL (see docs/reviews-setup.md).
const REVIEWS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxWm1WY2VDs-r3aHeq9RVR0BnJf7Kh3UQCKG1jL_ExyjaLo-RaW6ADUUishRbmZH3emrg/exec';
// The homepage section and the Reviews link in the nav stay hidden until this many reviews are posted.
const MIN_REVIEWS_TO_SHOW = 3;
const MAX_PHOTOS = 3;

// ---- Loading reviews (cached for 10 minutes so page-to-page clicks feel instant) ----
async function fetchReviews() {
  const key = 'gps-reviews';
  try {
    const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.reviews;
  } catch (e) { /* ignore a bad cache */ }
  const res = await fetch(REVIEWS_ENDPOINT);
  const data = await res.json();
  const reviews = Array.isArray(data.reviews) ? data.reviews : [];
  try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), reviews })); } catch (e) { /* storage full or blocked */ }
  return reviews;
}

// ---- Small HTML helpers ----
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function starsHtml(rating) {
  let out = '<span class="stars" aria-label="' + rating + ' out of 5 stars">';
  for (let i = 1; i <= 5; i++) out += '<svg class="icon' + (i <= rating ? '' : ' is-off') + '" aria-hidden="true"><use href="#i-star"/></svg>';
  return out + '</span>';
}
// Google Drive image links: the script stores drive.google.com/thumbnail?id=... links and we add a size.
// (Older rows may hold lh3.googleusercontent.com/d/<id> links; those are converted the same way.)
function photoUrl(url, width) {
  const id = (url.match(/[?&]id=([^&]+)/) || url.match(/\/d\/([^/?=]+)/) || [])[1];
  return id ? 'https://drive.google.com/thumbnail?id=' + id + '&sz=w' + width : url;
}
function metaLine(r) { return [r.pet, r.service].filter(Boolean).join(' · '); }
function monthYear(iso) {
  const d = new Date(iso); if (isNaN(d)) return '';
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function reviewCardHtml(r, index, extraClass) {
  const photos = r.photos || [];
  const long = r.review.length > 180 || photos.length > 1;
  return (
    '<button class="review-card ' + (extraClass || '') + '" type="button" data-review-index="' + index + '" aria-label="Read the full review from ' + escapeHtml(r.name) + '">' +
      (photos.length ? '<div class="review-card__media"><img src="' + photoUrl(photos[0], 800) + '" alt="" loading="lazy">' +
        (photos.length > 1 ? '<span class="review-card__count">+' + (photos.length - 1) + ' photo' + (photos.length > 2 ? 's' : '') + '</span>' : '') + '</div>' : '') +
      '<div class="review-card__body">' +
        starsHtml(r.rating) +
        '<p class="review-card__quote">“' + escapeHtml(r.review) + '”</p>' +
        (long ? '<span class="review-card__more">Read the full review</span>' : '') +
        '<div><div class="review-card__name">' + escapeHtml(r.name) + '</div>' +
        (metaLine(r) ? '<div class="review-card__meta">' + escapeHtml(metaLine(r)) + '</div>' : '') + '</div>' +
      '</div>' +
    '</button>'
  );
}

// ---- Review detail modal (opened by tapping a card) ----
let loadedReviews = [];
function openReviewDetail(index) {
  const r = loadedReviews[index]; const modal = document.querySelector('[data-modal="review"]'); if (!r || !modal) return;
  modal.querySelector('[data-review-name]').textContent = r.name;
  const meta = [metaLine(r), monthYear(r.date)].filter(Boolean).join(' · ');
  modal.querySelector('[data-review-meta]').textContent = meta;
  modal.querySelector('[data-review-stars]').innerHTML = starsHtml(r.rating);
  modal.querySelector('[data-review-text]').textContent = '“' + r.review + '”';

  const gallery = modal.querySelector('[data-review-gallery]');
  const photos = r.photos || [];
  gallery.hidden = photos.length === 0;
  if (photos.length) {
    const main = gallery.querySelector('[data-gallery-main]');
    const thumbs = gallery.querySelector('.gallery__thumbs');
    const counter = gallery.querySelector('[data-gallery-counter]');
    const controls = gallery.querySelector('.gallery__controls');
    let i = 0;
    function show(n) {
      i = (n + photos.length) % photos.length;
      main.src = photoUrl(photos[i], 1200);
      counter.textContent = (i + 1) + ' / ' + photos.length;
      Array.from(thumbs.children).forEach((t, k) => t.classList.toggle('is-active', k === i));
    }
    thumbs.innerHTML = photos.map((p, k) => '<button class="gallery__thumb" type="button" aria-label="Photo ' + (k + 1) + '"><img src="' + photoUrl(p, 240) + '" alt=""></button>').join('');
    Array.from(thumbs.children).forEach((t, k) => t.addEventListener('click', () => show(k)));
    thumbs.hidden = photos.length < 2; controls.hidden = photos.length < 2;
    gallery.querySelector('[data-gallery-prev]').onclick = () => show(i - 1);
    gallery.querySelector('[data-gallery-next]').onclick = () => show(i + 1);
    show(0);
  }
  openModal('review');
}
document.addEventListener('click', (e) => {
  const card = e.target.closest('[data-review-index]');
  if (card) openReviewDetail(Number(card.dataset.reviewIndex));
});

// ---- Putting reviews on the page ----
function renderHomepage(reviews) {
  const section = document.querySelector('[data-reviews-section]'); if (!section) return;
  if (reviews.length < MIN_REVIEWS_TO_SHOW) return;              // stays hidden until there are enough
  const row = section.querySelector('[data-card-row]');
  const shown = reviews.slice(0, 6);
  row.innerHTML = shown.map((r, i) => reviewCardHtml(r, i, 'review-card--carousel')).join('');
  // Dots follow the scroll position
  const dots = section.querySelector('[data-dots]');
  dots.innerHTML = shown.map(() => '<span></span>').join('');
  function updateDots() {
    const card = row.firstElementChild; if (!card) return;
    const step = card.offsetWidth + parseFloat(getComputedStyle(row).gap || 24);
    const active = Math.round(row.scrollLeft / step);
    Array.from(dots.children).forEach((d, i) => d.classList.toggle('is-active', i === active));
  }
  row.addEventListener('scroll', updateDots, { passive: true }); updateDots();
  section.querySelectorAll('[data-scroll]').forEach((btn) => btn.addEventListener('click', () => row.scrollBy({ left: Number(btn.dataset.scroll) * 364, behavior: 'smooth' })));
  section.hidden = false;
}

function renderReviewsPage(reviews) {
  const grid = document.querySelector('[data-reviews-grid]'); if (!grid) return;
  const status = document.querySelector('[data-reviews-status]');
  if (!reviews.length) {
    grid.hidden = true;
    status.innerHTML = '<p class="body-large">No reviews yet. If Georgia has looked after your pets, you could be the first.</p>';
    status.hidden = false; return;
  }
  status.hidden = true;
  grid.innerHTML = reviews.map((r, i) => reviewCardHtml(r, i)).join('');
  grid.hidden = false;
}

function revealNavLink(reviews) {
  if (reviews.length < MIN_REVIEWS_TO_SHOW) return;
  document.querySelectorAll('[data-nav-reviews]').forEach((a) => { a.hidden = false; });
}

fetchReviews().then((reviews) => {
  loadedReviews = reviews;
  renderHomepage(reviews); renderReviewsPage(reviews); revealNavLink(reviews);
}).catch(() => {
  const status = document.querySelector('[data-reviews-status]');
  if (status) { status.innerHTML = '<p>Reviews could not be loaded right now. Please try again in a moment.</p>'; status.hidden = false; }
});

// ---- Leave a review form ----
const reviewForm = document.querySelector('[data-review-form]');
if (reviewForm) {
  // Star picker
  const picker = reviewForm.querySelector('[data-rating-picker]');
  const ratingInput = reviewForm.querySelector('input[name="rating"]');
  const ratingLabel = reviewForm.querySelector('[data-rating-label]');
  function setRating(n) {
    ratingInput.value = n;
    picker.querySelectorAll('button').forEach((b, i) => b.classList.toggle('is-on', i < n));
    ratingLabel.textContent = n ? n + ' of 5' : '';
  }
  picker.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => setRating(i + 1)));

  // Photos: pick up to 3, shrink them in the browser so uploads stay small
  const fileInput = reviewForm.querySelector('input[type="file"]');
  const tiles = reviewForm.querySelector('[data-photo-tiles]');
  const addBtn = reviewForm.querySelector('[data-photo-add]');
  let photos = []; // { dataUrl }
  function renderTiles() {
    tiles.querySelectorAll('.photo-tile').forEach((t) => t.remove());
    photos.forEach((p, i) => {
      const t = document.createElement('div'); t.className = 'photo-tile';
      t.innerHTML = '<img src="' + p.dataUrl + '" alt="Photo ' + (i + 1) + '"><button class="photo-tile__remove" type="button" aria-label="Remove photo"><svg class="icon"><use href="#i-close"/></svg></button>';
      t.querySelector('button').addEventListener('click', () => { photos.splice(i, 1); renderTiles(); });
      tiles.insertBefore(t, addBtn);
    });
    addBtn.hidden = photos.length >= MAX_PHOTOS;
  }
  function shrink(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const max = 1200, scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  }
  addBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    for (const file of Array.from(fileInput.files).slice(0, MAX_PHOTOS - photos.length)) {
      const dataUrl = await shrink(file);
      if (dataUrl) photos.push({ dataUrl });
    }
    fileInput.value = ''; renderTiles();
  });

  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!ratingInput.value) { picker.querySelector('button').focus(); ratingLabel.textContent = 'Please pick a star rating'; return; }
    const submit = reviewForm.querySelector('button[type="submit"]');
    submit.disabled = true; submit.textContent = 'Sending…';
    const data = new FormData(reviewForm);
    const payload = {
      name: data.get('name'), email: data.get('email'), pet: data.get('pet'), service: data.get('service'),
      rating: Number(data.get('rating')), review: data.get('review'), website: data.get('website'),
      photos: photos.map((p) => ({ type: 'image/jpeg', data: p.dataUrl.split(',')[1] }))
    };
    try {
      // text/plain keeps the browser from doing a "preflight" check the Google script can't answer
      await fetch(REVIEWS_ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) });
    } catch (err) { /* the confirmation still shows; the script is very reliable */ }
    reviewForm.reset(); photos = []; renderTiles(); setRating(0);
    submit.disabled = false; submit.textContent = 'Submit review';
    closeModals(); openModal('review-sent');
  });
}
