// Garden Pet Sitting — small bits of behavior.
// Everything here is optional: the site still works without JavaScript.

// ---- Mobile menu (slide-in drawer) ----
const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.getElementById('site-nav');
const navScrim = document.querySelector('[data-nav-scrim]');
function setMenu(open) {
  nav.classList.toggle('is-open', open);
  navScrim?.classList.toggle('is-open', open);
  navToggle.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  navToggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  document.body.style.overflow = open ? 'hidden' : ''; // stop the page scrolling behind the drawer
}
if (navToggle && nav) {
  navToggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  navScrim?.addEventListener('click', () => setMenu(false));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false); });
}

// ---- Hero carousel ----
document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const slides = Array.from(carousel.querySelectorAll('.carousel__slide'));
  const dotsWrap = carousel.querySelector('[data-carousel-dots]');
  let index = 0;
  let timer;

  // Build one dot per slide
  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel__dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', 'Go to photo ' + (i + 1));
    dot.addEventListener('click', () => show(i, true));
    dotsWrap.appendChild(dot);
    return dot;
  });

  function show(i, userTriggered) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle('is-active', n === index));
    dots.forEach((d, n) => d.classList.toggle('is-active', n === index));
    if (userTriggered) restart();
  }
  function restart() {
    clearInterval(timer);
    timer = setInterval(() => show(index + 1), 6000); // auto-advance every 6s
  }

  carousel.querySelector('[data-carousel-prev]')?.addEventListener('click', () => show(index - 1, true));
  carousel.querySelector('[data-carousel-next]')?.addEventListener('click', () => show(index + 1, true));
  restart();
});

// ---- Modals (inquiry form + confirmation) ----
const modals = {};
document.querySelectorAll('[data-modal]').forEach((m) => { modals[m.dataset.modal] = m; });
function openModal(name) {
  const m = modals[name]; if (!m) return;
  m.classList.add('is-open');
  const first = m.querySelector('input:not([type=hidden]):not(.visually-hidden input), select, textarea, button');
  if (first) first.focus();
}
function closeModals() { Object.values(modals).forEach((m) => m.classList.remove('is-open')); }
document.querySelectorAll('[data-open-modal]').forEach((el) => {
  el.addEventListener('click', (e) => { e.preventDefault(); openModal(el.dataset.openModal); });
});
document.querySelectorAll('[data-modal-close]').forEach((el) => el.addEventListener('click', closeModals));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModals(); });
if (location.hash === '#inquiry') openModal('inquiry'); // lets other pages link straight to the form

// ---- Contact forms -> Google Sheet -> confirmation ----
// Paste the Google Apps Script "Web app" URL here (see docs/contact-form-setup.md).
// While it's empty, the forms just show the confirmation so you can preview the site.
const FORM_ENDPOINT = '';

document.querySelectorAll('[data-contact-form]').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.website && form.website.value) return; // honeypot filled in = a bot; quietly ignore

    const button = form.querySelector('[type="submit"]');
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = 'Sending…';

    try {
      const data = new FormData(form);
      data.append('page', location.pathname);
      if (FORM_ENDPOINT) {
        await fetch(FORM_ENDPOINT, { method: 'POST', mode: 'no-cors', body: data });
      }
      form.reset();
      closeModals();
      openModal('confirm');
    } catch (err) {
      alert('Sorry, something went wrong sending your message. Please try again in a moment.');
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  });
});

// ---- Custom dropdown (Select) ----
// A styled replacement for <select>: a button opens a menu of options;
// the chosen value is stored in a hidden input so the form submits it normally.
document.querySelectorAll('[data-select]').forEach((sel) => {
  const trigger = sel.querySelector('.select__trigger');
  const valueEl = sel.querySelector('.select__value');
  const hidden = sel.querySelector('input[type=hidden]');
  const menu = sel.querySelector('.select__menu');
  const options = Array.from(menu.querySelectorAll('.select__option'));
  let active = -1;

  function open() { menu.hidden = false; sel.classList.add('is-open'); trigger.setAttribute('aria-expanded', 'true'); }
  function close() { menu.hidden = true; sel.classList.remove('is-open'); trigger.setAttribute('aria-expanded', 'false'); setActive(-1); }
  function setActive(i) {
    active = i;
    options.forEach((o, n) => o.classList.toggle('is-active', n === i));
  }
  function choose(i) {
    const opt = options[i];
    options.forEach((o) => o.setAttribute('aria-selected', o === opt ? 'true' : 'false'));
    hidden.value = opt.dataset.value;
    valueEl.textContent = opt.textContent;
    sel.classList.add('has-value');
    close();
    trigger.focus();
  }

  trigger.addEventListener('click', () => (menu.hidden ? open() : close()));
  options.forEach((o, i) => {
    o.addEventListener('click', () => choose(i));
    o.addEventListener('mousemove', () => setActive(i));
  });
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (menu.hidden) open();
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      setActive((active + dir + options.length) % options.length);
    } else if ((e.key === 'Enter' || e.key === ' ') && !menu.hidden && active >= 0) {
      e.preventDefault(); choose(active);
    } else if (e.key === 'Escape') { close(); }
  });
  document.addEventListener('click', (e) => { if (!sel.contains(e.target)) close(); });
  // Reset the dropdown when its form resets
  sel.closest('form')?.addEventListener('reset', () => {
    hidden.value = ''; valueEl.textContent = valueEl.dataset.placeholder;
    sel.classList.remove('has-value'); options.forEach((o) => o.setAttribute('aria-selected', 'false'));
  });
});
