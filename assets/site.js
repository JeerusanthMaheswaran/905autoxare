/* 905 Group of Companies – shared behaviour
 * - WhatsApp booking / inquiry forms  (form.book[data-wa])
 * - WhatsApp quick-message links      (a[data-wa-text])
 * - Time-slot picker from opening hours
 * - "Open now" badge + today's row in the hours table
 * - Google reviews list from assets/reviews.js
 */
(function () {
  const TZ = 'America/Toronto';
  const DEFAULT_WA = document.body.dataset.wa || '16479837575';

  const waLink = (num, text) => `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Year + mobile nav
  $$('[data-year]').forEach(el => (el.textContent = new Date().getFullYear()));
  const nav = $('nav.main');
  $('.menu-btn')?.addEventListener('click', () => nav.classList.toggle('open'));
  $$('nav.main a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

  // Quick WhatsApp links
  $$('a[data-wa-text]').forEach(a => {
    const num = a.closest('[data-wa]')?.dataset.wa || DEFAULT_WA;
    a.href = waLink(num, a.dataset.waText);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  // ---- Opening hours helpers ----
  // hours: {"0":["10:00","18:30"], ... } where 0 = Sunday. Missing day = closed.
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = m => {
    const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0');
    return `${((h + 11) % 12) + 1}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
  };
  const nowInTZ = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date()).map(x => [x.type, x.value]));
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
    return { dow, min: +p.hour * 60 + +p.minute, iso: `${p.year}-${p.month}-${p.day}` };
  };

  // Open-now badge
  $$('.open-now[data-hours]').forEach(el => {
    const hours = JSON.parse(el.dataset.hours);
    const n = nowInTZ();
    const today = hours[n.dow];
    const open = today && n.min >= toMin(today[0]) && n.min < toMin(today[1]);
    el.classList.add(open ? 'on' : 'off');
    el.querySelector('span').textContent = open
      ? `Open now · closes ${fmt(toMin(today[1]))}`
      : 'Closed now · book on WhatsApp anytime';
    $$(`tr[data-dow~="${n.dow}"]`).forEach(tr => tr.classList.add('today'));
  });

  // ---- Booking forms ----
  $$('form.book').forEach(form => {
    const num = form.dataset.wa || DEFAULT_WA;
    const hours = form.dataset.hours ? JSON.parse(form.dataset.hours) : null;
    const today = nowInTZ();
    $$('input[type=date]', form).forEach(d => (d.min = today.iso));

    // time slots follow the chosen date
    const dateEl = $('[data-slot-date]', form);
    const slotEl = $('select[data-slots]', form);
    if (hours && dateEl && slotEl) {
      const fill = () => {
        slotEl.innerHTML = '';
        if (!dateEl.value) {
          slotEl.disabled = true;
          slotEl.add(new Option('Pick a date first', ''));
          return;
        }
        const [y, m, d] = dateEl.value.split('-').map(Number);
        const dow = new Date(y, m - 1, d).getDay();
        const h = hours[dow];
        const slots = [];
        if (h) {
          for (let t = toMin(h[0]); t <= toMin(h[1]) - 60; t += 30) {
            if (dateEl.value === today.iso && t < today.min + 60) continue;
            slots.push(t);
          }
        }
        slotEl.disabled = !slots.length;
        if (!slots.length) { slotEl.add(new Option('No times left that day', '')); return; }
        slotEl.add(new Option('Select a time', ''));
        slots.forEach(t => slotEl.add(new Option(fmt(t), fmt(t))));
      };
      dateEl.addEventListener('change', fill);
      fill();
    }

    // When a card's "Book" link pre-selects a service
    $$('[data-preselect]').forEach(a => a.addEventListener('click', () => {
      const v = a.dataset.preselect;
      const box = $$(`input[type=checkbox][value="${CSS.escape(v)}"]`, form)[0];
      if (box) box.checked = true;
      const opt = $$('select option', form).find(o => o.value === v);
      if (opt) opt.selected = true;
    }));

    form.addEventListener('submit', e => {
      e.preventDefault();
      const err = $('.err', form);
      err?.classList.remove('show');
      if (!form.reportValidity()) return;

      const required = $$('fieldset[data-required]', form).find(fs => !$$('input:checked', fs).length);
      if (required) {
        if (err) { err.textContent = `Please choose at least one: ${required.dataset.label}`; err.classList.add('show'); }
        required.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }

      const lines = [`*${form.dataset.title || 'New request'}*`, ''];
      $$('[data-label]', form).forEach(el => {
        let v;
        if (el.tagName === 'FIELDSET') v = $$('input:checked', el).map(i => i.value).join(', ');
        else if (el.type === 'checkbox') v = el.checked ? 'Yes' : 'No';
        else if (el.type === 'date' && el.value) {
          const [y, m, d] = el.value.split('-').map(Number);
          v = new Date(y, m - 1, d).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        } else v = el.value.trim();
        if (v) lines.push(`*${el.dataset.label}:* ${v}`);
      });
      lines.push('', 'Sent from our website');
      window.open(waLink(num, lines.join('\n')), '_blank', 'noopener');
    });
  });

  // ---- Google reviews ----
  $$('[data-reviews]').forEach(box => {
    const list = (window.REVIEWS && window.REVIEWS[box.dataset.reviews]) || [];
    if (!list.length) { box.remove(); return; }
    const colors = ['#1a73e8', '#e8453c', '#f9a825', '#34a853', '#8e24aa', '#00897b'];
    box.innerHTML = list.map((r, i) => `
      <article class="review reveal">
        <header>
          <div class="av" style="background:${colors[i % colors.length]}">${(r.name || '?').trim()[0].toUpperCase()}</div>
          <div><b>${esc(r.name)}</b><small>${esc(r.when || '')}</small></div>
        </header>
        <div class="stars" aria-label="${r.rating} out of 5 stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        <p>${esc(r.text)}</p>
        <div class="src">Posted on Google</div>
      </article>`).join('');
  });
  function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // ---- Reveal on scroll ----
  const io = 'IntersectionObserver' in window && new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -60px 0px' });
  $$('.reveal').forEach(el => (io ? io.observe(el) : el.classList.add('in')));
})();
