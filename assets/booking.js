/* 905 Group – booking calendar + live quote
 * Renders into <div class="booker" data-booker="autocare|heavy"></div>
 * Settings live in assets/booking-config.js
 */
(function () {
  const TZ = 'America/Toronto';
  const HST = 0.13;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const money = n => n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' });
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmtT = m => `${((Math.floor(m / 60) + 11) % 12) + 1}:${pad(m % 60)} ${m < 720 ? 'AM' : 'PM'}`;
  const nice = s => parse(s).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const dayDiff = (a, b) => Math.round((parse(b) - parse(a)) / 864e5) + 1;

  function nowTZ() {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).map(x => [x.type, x.value]));
    return { iso: `${p.year}-${p.month}-${p.day}`, min: +p.hour * 60 + +p.minute };
  }

  document.querySelectorAll('.booker[data-booker]').forEach(root => {
    const key = root.dataset.booker;
    const C = window.BOOKING && window.BOOKING[key];
    if (!C) return;
    const range = C.mode === 'range';
    const today = nowTZ();
    const maxDate = iso(new Date(parse(today.iso).getTime() + C.daysAhead * 864e5));
    const S = {
      step: 0, sel: new Set(), date: null, end: null, time: null, window: 'Morning (7–11am)',
      view: parse(today.iso), ref: null, sent: false
    };
    S.view.setDate(1);

    root.innerHTML = `
      <div class="bk">
        <ol class="bk-steps">
          <li data-s="0"><b>1</b><span>Services</span></li>
          <li data-s="1"><b>2</b><span>${range ? 'Dates' : 'Date &amp; Time'}</span></li>
          <li data-s="2"><b>3</b><span>Details</span></li>
          <li data-s="3"><b>4</b><span>Confirm</span></li>
        </ol>
        <div class="bk-body">
          <div class="bk-main">
            <div class="bk-pane" data-p="0">
              <h3>What can we help with?</h3>
              <p class="bk-sub">Pick one or more. Your quote updates as you go.</p>
              <div class="bk-svcs">${C.services.map(s => `
                <button type="button" class="bk-svc" data-id="${s.id}" aria-pressed="false">
                  <span class="bk-ico">${s.icon}</span>
                  <span class="bk-svc-t"><b>${esc(s.name)}</b><small>${esc(s.desc)}</small></span>
                  <span class="bk-price">${priceLabel(s)}</span>
                  <span class="bk-tick">✓</span>
                </button>`).join('')}
              </div>
            </div>

            <div class="bk-pane" data-p="1" hidden>
              <h3>${range ? 'When do you need it?' : 'Pick a day &amp; time'}</h3>
              <p class="bk-sub">${range ? 'Tap your start date, then your end date.' : 'Grey days are closed or fully booked.'}</p>
              <div class="bk-cal">
                <div class="bk-cal-h">
                  <button type="button" class="bk-mnav" data-m="-1" aria-label="Previous month">‹</button>
                  <strong class="bk-month"></strong>
                  <button type="button" class="bk-mnav" data-m="1" aria-label="Next month">›</button>
                </div>
                <div class="bk-wd">${WD.map(d => `<span>${d[0]}${d[1]}</span>`).join('')}</div>
                <div class="bk-days"></div>
              </div>
              ${range ? `
                <div class="bk-range-info"></div>
                <label class="f bk-gap">Delivery window
                  <select class="bk-window">
                    <option>Morning (7–11am)</option><option>Midday (11am–3pm)</option><option>Afternoon (3–7pm)</option><option>Flexible</option>
                  </select>
                </label>` : `
                <div class="bk-slots-wrap"><p class="bk-sub bk-slot-hint">Choose a day to see available times.</p><div class="bk-slots"></div></div>`}
            </div>

            <div class="bk-pane" data-p="2" hidden>
              <h3>Your details</h3>
              <p class="bk-sub">We'll use these to confirm your booking.</p>
              <div class="bk-form">
                <div class="row">
                  <label class="f">Full name *<input data-k="Name" autocomplete="name" required></label>
                  <label class="f">Phone *<input data-k="Phone" type="tel" autocomplete="tel" placeholder="(647) 000-0000" required></label>
                </div>
                <label class="f">Email <span class="opt">(for your quote copy)</span><input data-k="Email" type="email" autocomplete="email" placeholder="you@example.com"></label>
                <h4 class="bk-h4">${esc(C.detailsTitle)}</h4>
                ${range ? `
                  <label class="f">Site address or city *<input data-k="Job site" placeholder="e.g. 123 Main St, Caledon" required></label>
                  <div class="row">
                    <label class="f">Company <span class="opt">(optional)</span><input data-k="Company" autocomplete="organization"></label>
                    <label class="f">Site access
                      <select data-k="Site access"><option>Easy / open lot</option><option>Tight / limited access</option><option>Not sure</option></select>
                    </label>
                  </div>` : `
                  <div class="row row3">
                    <label class="f">Year<input data-k="Year" inputmode="numeric" maxlength="4" placeholder="2019"></label>
                    <label class="f">Make *<input data-k="Make" placeholder="Honda" required></label>
                    <label class="f">Model<input data-k="Model" placeholder="Civic"></label>
                  </div>`}
                <label class="f">Notes<textarea data-k="Notes" placeholder="${range ? 'Describe the job, ground conditions, attachments…' : 'Noises, warning lights, anything we should know…'}"></textarea></label>
              </div>
            </div>

            <div class="bk-pane" data-p="3" hidden>
              <h3>Review &amp; confirm</h3>
              <p class="bk-sub">Check everything looks right, then send your booking.</p>
              <div class="bk-review"></div>
              <div class="bk-send">
                <button type="button" class="btn btn-a btn-lg btn-block bk-submit">Confirm Booking</button>
                <a class="btn btn-wa btn-lg btn-block bk-wa" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg>Send via WhatsApp instead</a>
                <p class="err bk-err" role="alert"></p>
              </div>
            </div>

            <div class="bk-pane bk-done" data-p="4" hidden>
              <div class="bk-check">✓</div>
              <h3 class="bk-done-t">Booking request sent!</h3>
              <p class="bk-sub bk-done-p"></p>
              <div class="bk-refbox">Reference <b class="bk-ref"></b></div>
              <div class="bk-done-btns">
                <button type="button" class="btn btn-a bk-pdf">⬇ Download PDF Quote</button>
                <button type="button" class="btn btn-o bk-ics">📅 Add to Calendar</button>
                <a class="btn btn-wa bk-wa2" target="_blank" rel="noopener"><svg><use href="#i-wa"/></svg>WhatsApp Us</a>
              </div>
              <button type="button" class="bk-again">Start a new booking</button>
            </div>

            <div class="bk-nav">
              <button type="button" class="btn btn-o bk-back">← Back</button>
              <button type="button" class="btn btn-a bk-next">Continue →</button>
            </div>
          </div>

          <aside class="bk-quote">
            <div class="bk-q-head">
              <img src="${esc(C.logo)}" alt="" width="44" height="44">
              <div><b>Your Quote</b><small>${esc(C.short)}</small></div>
            </div>
            <div class="bk-q-lines"></div>
            <div class="bk-q-when"></div>
            <div class="bk-q-total"></div>
            <button type="button" class="bk-q-pdf" disabled>⬇ Download quote (PDF)</button>
          </aside>
        </div>
      </div>`;

    const $ = s => root.querySelector(s);
    const $$ = s => [...root.querySelectorAll(s)];

    function priceLabel(s) {
      if (s.price == null) return 'Quote';
      return `${s.from ? 'from ' : ''}${money(s.price)}${s.unit ? '/' + s.unit : ''}`;
    }
    const days = () => range ? (S.date && S.end ? dayDiff(S.date, S.end) : S.date ? 1 : 1) : 1;

    function lines() {
      return C.services.filter(s => S.sel.has(s.id)).map(s => {
        const qty = s.unit === 'day' ? days() : 1;
        return { s, qty, amt: s.price == null ? null : s.price * qty };
      });
    }
    function totals() {
      const L = lines();
      const priced = L.filter(l => l.amt != null);
      const sub = priced.reduce((a, l) => a + l.amt, 0);
      const all = L.length > 0 && priced.length === L.length && !L.some(l => l.s.from);
      return { L, sub, all, hst: sub * HST, total: sub * (1 + HST), anyPrice: priced.length > 0 };
    }
    function whenText() {
      if (range) {
        if (!S.date) return '';
        const e = S.end || S.date;
        return `${nice(S.date)}${e !== S.date ? ' → ' + nice(e) : ''} · ${days()} day${days() > 1 ? 's' : ''}`;
      }
      return S.date ? `${nice(S.date)}${S.time != null ? ' · ' + fmtT(S.time) : ''}` : '';
    }
    const details = () => Object.fromEntries($$('[data-k]').map(el => [el.dataset.k, el.value.trim()]).filter(([, v]) => v));

    // ---------- quote panel ----------
    function renderQuote() {
      const t = totals();
      $('.bk-q-lines').innerHTML = t.L.length ? t.L.map(l => `
        <div class="bk-q-line"><span>${l.s.icon} ${esc(l.s.name)}${l.qty > 1 ? ` <em>× ${l.qty} days</em>` : ''}</span>
        <b>${l.amt == null ? '<i>Quote</i>' : (l.s.from ? 'from ' : '') + money(l.amt)}</b></div>`).join('')
        : '<p class="bk-q-empty">Select a service to start your quote.</p>';
      const w = whenText();
      $('.bk-q-when').innerHTML = w ? `<span>📅</span>${esc(w)}` : '';
      let tot = '';
      if (t.L.length) {
        if (t.all) tot = `<div><span>Subtotal</span><b>${money(t.sub)}</b></div><div><span>HST 13%</span><b>${money(t.hst)}</b></div><div class="grand"><span>Total</span><b>${money(t.total)}</b></div>`;
        else if (t.anyPrice) tot = `<div class="grand"><span>Estimated from</span><b>${money(t.sub)}</b></div><p class="bk-q-note">+ HST. Items marked "Quote" are priced by our team, and we'll confirm the final price with you.</p>`;
        else tot = `<p class="bk-q-note">✅ Free quote. Our team will confirm pricing and availability, usually the same day.</p>`;
      }
      $('.bk-q-total').innerHTML = tot;
      $('.bk-q-pdf').disabled = !t.L.length;
    }

    // ---------- calendar ----------
    function dayState(d) {
      const s = iso(d);
      if (s < today.iso || s > maxDate) return 'off';
      if (C.closedDates.includes(s) || !C.hours[d.getDay()]) return 'off';
      if (!range && s === today.iso && !slotsFor(s).length) return 'off';
      return 'on';
    }
    function slotsFor(s) {
      const h = C.hours[parse(s).getDay()];
      if (!h) return [];
      const out = [];
      for (let t = toMin(h[0]); t <= toMin(h[1]) - 60; t += C.slotMinutes || 30) {
        if (s === today.iso && t < today.min + 60) continue;
        out.push(t);
      }
      return out;
    }
    function renderCal() {
      const v = S.view;
      $('.bk-month').textContent = `${MONTHS[v.getMonth()]} ${v.getFullYear()}`;
      const first = new Date(v.getFullYear(), v.getMonth(), 1);
      const n = new Date(v.getFullYear(), v.getMonth() + 1, 0).getDate();
      let h = '<span></span>'.repeat(first.getDay());
      for (let i = 1; i <= n; i++) {
        const d = new Date(v.getFullYear(), v.getMonth(), i), s = iso(d), st = dayState(d);
        const cls = ['bk-day'];
        if (st === 'off') cls.push('off');
        if (s === today.iso) cls.push('today');
        if (s === S.date) cls.push('sel', 'start');
        if (range && S.end && s === S.end) cls.push('sel', 'end');
        if (range && S.date && S.end && s > S.date && s < S.end) cls.push('in');
        h += `<button type="button" class="${cls.join(' ')}" data-d="${s}" ${st === 'off' ? 'disabled' : ''}>${i}</button>`;
      }
      $('.bk-days').innerHTML = h;
      const firstOfThis = parse(today.iso); firstOfThis.setDate(1);
      $('.bk-mnav[data-m="-1"]').disabled = v <= firstOfThis;
      $('.bk-mnav[data-m="1"]').disabled = iso(new Date(v.getFullYear(), v.getMonth() + 1, 1)) > maxDate;

      if (range) {
        $('.bk-range-info').innerHTML = S.date
          ? `<b>${esc(whenText())}</b>${S.end ? '' : '<span> · tap an end date (or continue for 1 day)</span>'}`
          : '<span>No dates selected yet</span>';
      } else {
        const box = $('.bk-slots');
        if (!S.date) { box.innerHTML = ''; $('.bk-slot-hint').hidden = false; return; }
        $('.bk-slot-hint').hidden = true;
        const sl = slotsFor(S.date);
        const groups = [['Morning', t => t < 720], ['Afternoon', t => t >= 720 && t < 1020], ['Evening', t => t >= 1020]];
        box.innerHTML = `<p class="bk-slot-day">${esc(nice(S.date))}</p>` + groups.map(([g, f]) => {
          const ts = sl.filter(f);
          return ts.length ? `<div class="bk-slot-g"><small>${g}</small><div>${ts.map(t => `<button type="button" class="bk-slot${t === S.time ? ' sel' : ''}" data-t="${t}">${fmtT(t)}</button>`).join('')}</div></div>` : '';
        }).join('');
      }
    }

    // ---------- steps ----------
    function canGo(step) {
      if (step >= 1 && !S.sel.size) return 'Please pick at least one service.';
      if (step >= 2) {
        if (!S.date) return range ? 'Please pick a start date.' : 'Please pick a day.';
        if (!range && S.time == null) return 'Please pick a time.';
      }
      if (step >= 3) {
        const bad = $$('.bk-form [required]').find(el => !el.value.trim());
        if (bad) { bad.focus(); return `Please fill in: ${bad.dataset.k}.`; }
        const em = $('[data-k="Email"]');
        if (em.value && !em.checkValidity()) { em.focus(); return 'Please check your email address.'; }
      }
      return '';
    }
    function go(step) {
      const msg = step > S.step ? canGo(step) : '';
      if (msg) { toast(msg); return; }
      S.step = step;
      $$('.bk-pane').forEach(p => (p.hidden = +p.dataset.p !== step));
      $$('.bk-steps li').forEach(li => {
        li.classList.toggle('cur', +li.dataset.s === step);
        li.classList.toggle('done', +li.dataset.s < step);
      });
      $('.bk-back').style.visibility = step === 0 || step === 4 ? 'hidden' : 'visible';
      $('.bk-next').hidden = step >= 3;
      $('.bk-nav').hidden = step === 4;
      if (step === 1) renderCal();
      if (step === 3) renderReview();
      const top = root.getBoundingClientRect().top + window.scrollY - 90;
      if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
    }
    function toast(m) {
      let t = $('.bk-toast');
      if (!t) { t = document.createElement('div'); t.className = 'bk-toast'; root.querySelector('.bk-main').appendChild(t); }
      t.textContent = m; t.classList.add('show');
      clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
    }

    function newRef() {
      const d = today.iso.slice(2).replace(/-/g, '');
      return `905-${C.prefix}-${d}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    function summaryText() {
      const t = totals(), D = details();
      const L = [`*New Booking – ${C.business}*`, `Ref: ${S.ref}`, '', '*Services:*'];
      t.L.forEach(l => L.push(`• ${l.s.name}${l.qty > 1 ? ` × ${l.qty} days` : ''}${l.amt != null ? ` – ${money(l.amt)}` : ''}`));
      L.push('', `*When:* ${whenText()}`);
      if (range) L.push(`*Delivery window:* ${S.window}`);
      Object.entries(D).forEach(([k, v]) => L.push(`*${k}:* ${v}`));
      if (t.all) L.push('', `*Quoted total:* ${money(t.total)} (incl. HST)`);
      else if (t.anyPrice) L.push('', `*Estimate from:* ${money(t.sub)} + HST`);
      L.push('', 'Sent from our website booking calendar');
      return L.join('\n');
    }
    const waURL = () => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(summaryText())}`;

    function renderReview() {
      if (!S.ref) S.ref = newRef();
      const D = details();
      $('.bk-review').innerHTML = `
        <div class="bk-rv"><small>Services</small><div>${lines().map(l => `<span class="bk-pill">${l.s.icon} ${esc(l.s.name)}</span>`).join('')}</div><button type="button" data-goto="0">Edit</button></div>
        <div class="bk-rv"><small>${range ? 'Dates' : 'Appointment'}</small><div><b>${esc(whenText())}</b>${range ? `<br><span class="muted">Delivery: ${esc(S.window)}</span>` : ''}</div><button type="button" data-goto="1">Edit</button></div>
        <div class="bk-rv"><small>Details</small><div>${Object.entries(D).map(([k, v]) => `<span class="muted">${esc(k)}:</span> ${esc(v)}`).join('<br>')}</div><button type="button" data-goto="2">Edit</button></div>`;
      $('.bk-submit').innerHTML = C.web3formsKey ? 'Confirm Booking' : '<svg><use href="#i-wa"/></svg>Confirm Booking on WhatsApp';
      $('.bk-submit').classList.toggle('btn-wa', !C.web3formsKey);
      $('.bk-submit').classList.toggle('btn-a', !!C.web3formsKey);
      $('.bk-wa').hidden = !C.web3formsKey;
      $('.bk-wa').href = waURL();
    }

    async function submit() {
      const btn = $('.bk-submit'), err = $('.bk-err');
      err.classList.remove('show');
      if (!C.web3formsKey) {
        window.open(waURL(), '_blank', 'noopener');
        done(false);
        return;
      }
      btn.disabled = true; btn.textContent = 'Sending…';
      try {
        const t = totals(), D = details();
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: C.web3formsKey,
            subject: `New booking ${S.ref} – ${D.Name || ''}`,
            from_name: `${C.short} Website`,
            replyto: D.Email || undefined,
            Reference: S.ref,
            Services: t.L.map(l => l.s.name + (l.qty > 1 ? ` × ${l.qty} days` : '')).join(', '),
            When: whenText(),
            ...(range ? { 'Delivery window': S.window } : {}),
            ...D,
            Quote: t.all ? `${money(t.total)} incl. HST` : t.anyPrice ? `from ${money(t.sub)} + HST` : 'To be quoted'
          })
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || j.success === false) throw new Error(j.message || 'Send failed');
        done(true);
      } catch (e) {
        err.textContent = 'We couldn\'t send that just now. Please tap "Send via WhatsApp instead" or call us.';
        err.classList.add('show');
      } finally {
        btn.disabled = false; renderReview();
      }
    }

    function done(viaEmail) {
      S.sent = true;
      $('.bk-ref').textContent = S.ref;
      $('.bk-done-t').textContent = viaEmail ? 'Booking request sent!' : 'Almost done!';
      $('.bk-done-p').innerHTML = viaEmail
        ? `Thanks${details().Name ? ', ' + esc(details().Name.split(' ')[0]) : ''}! We've received your request for <b>${esc(whenText())}</b> and will confirm shortly.`
        : `WhatsApp has opened with your booking. <b>Tap send</b> and we'll confirm <b>${esc(whenText())}</b> shortly.`;
      $('.bk-wa2').href = waURL();
      go(4);
    }

    // ---------- PDF quote ----------
    function printQuote() {
      if (!S.ref) S.ref = newRef();
      const t = totals(), D = details();
      let doc = document.getElementById('quote-doc');
      if (!doc) { doc = document.createElement('div'); doc.id = 'quote-doc'; document.body.appendChild(doc); }
      const issued = parse(today.iso).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });
      const valid = new Date(parse(today.iso).getTime() + 30 * 864e5).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' });
      doc.innerHTML = `
        <div class="qd-head">
          <div class="qd-brand"><img src="${esc(C.logo)}" alt=""><div><h1>${esc(C.business)}</h1><p>${esc(C.address)}<br>Tel ${esc(C.phone)} · WhatsApp ${C.whatsapp.replace(/^1(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3')}</p></div></div>
          <div class="qd-meta"><h2>QUOTE</h2><table>
            <tr><td>Reference</td><td>${esc(S.ref)}</td></tr>
            <tr><td>Issued</td><td>${issued}</td></tr>
            <tr><td>Valid until</td><td>${valid}</td></tr></table></div>
        </div>
        <div class="qd-bar"></div>
        <div class="qd-cols">
          <div><h3>Prepared for</h3><p>${esc(D.Name || '—')}<br>${esc(D.Phone || '')}${D.Email ? '<br>' + esc(D.Email) : ''}${D.Company ? '<br>' + esc(D.Company) : ''}</p></div>
          <div><h3>${range ? 'Rental period' : 'Appointment'}</h3><p>${esc(whenText() || 'To be scheduled')}${range ? '<br>Delivery: ' + esc(S.window) : ''}</p></div>
          <div><h3>${esc(C.detailsTitle)}</h3><p>${range ? esc(D['Job site'] || '—') + (D['Site access'] ? '<br>' + esc(D['Site access']) : '') : esc([D.Year, D.Make, D.Model].filter(Boolean).join(' ') || '—')}</p></div>
        </div>
        <table class="qd-items">
          <thead><tr><th>Service</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
          <tbody>${t.L.map(l => `<tr><td><b>${esc(l.s.name)}</b><br><small>${esc(l.s.desc)}</small></td><td>${l.qty}${l.s.unit ? ' ' + l.s.unit + (l.qty > 1 ? 's' : '') : ''}</td><td>${l.s.price == null ? 'Quote' : (l.s.from ? 'from ' : '') + money(l.s.price)}</td><td>${l.amt == null ? 'To be quoted' : money(l.amt)}</td></tr>`).join('')}</tbody>
        </table>
        <div class="qd-tot">${t.all
          ? `<div><span>Subtotal</span><b>${money(t.sub)}</b></div><div><span>HST (13%)</span><b>${money(t.hst)}</b></div><div class="g"><span>Total (CAD)</span><b>${money(t.total)}</b></div>`
          : t.anyPrice ? `<div class="g"><span>Estimated from</span><b>${money(t.sub)} + HST</b></div>` : `<div class="g"><span>Total</span><b>To be confirmed</b></div>`}</div>
        ${D.Notes ? `<div class="qd-notes"><h3>Notes</h3><p>${esc(D.Notes)}</p></div>` : ''}
        <div class="qd-foot"><p><b>Thank you for choosing ${esc(C.short)}.</b> This quote is an estimate based on the information provided. Final pricing is confirmed after inspection or job review. Prices in Canadian dollars. Towing 24/7: 437-770-5440.</p><p class="qd-group">A 905 Group of Companies business</p></div>`;
      const img = doc.querySelector('img');
      const go = () => window.print();
      img.complete ? go() : (img.onload = img.onerror = go);
    }

    // ---------- calendar file ----------
    function ics() {
      const D = details();
      const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      let start, end;
      if (range) {
        const e = new Date(parse(S.end || S.date).getTime() + 864e5);
        start = `DTSTART;VALUE=DATE:${S.date.replace(/-/g, '')}`;
        end = `DTEND;VALUE=DATE:${iso(e).replace(/-/g, '')}`;
      } else {
        const d = S.date.replace(/-/g, ''), t = m => `${pad(Math.floor(m / 60))}${pad(m % 60)}00`;
        start = `DTSTART;TZID=${TZ}:${d}T${t(S.time)}`;
        end = `DTEND;TZID=${TZ}:${d}T${t(S.time + 60)}`;
      }
      const desc = `Ref ${S.ref}\\nServices: ${lines().map(l => l.s.name).join(', ')}\\nCall ${C.phone} · WhatsApp ${C.whatsapp}`;
      const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//905 Group//Booking//EN', 'BEGIN:VEVENT',
        `UID:${S.ref}@905group`, `DTSTAMP:${stamp}`, start, end,
        `SUMMARY:${C.short} – ${range ? 'Equipment rental' : 'Appointment'}`,
        `LOCATION:${range ? (D['Job site'] || C.address).replace(/,/g, '\\,') : C.address.replace(/,/g, '\\,')}`,
        `DESCRIPTION:${desc}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
      a.download = `${S.ref}.ics`;
      document.body.appendChild(a); a.click(); a.remove();
    }

    // ---------- events ----------
    root.addEventListener('click', e => {
      const svc = e.target.closest('.bk-svc');
      if (svc) {
        const id = svc.dataset.id;
        S.sel.has(id) ? S.sel.delete(id) : S.sel.add(id);
        svc.setAttribute('aria-pressed', S.sel.has(id));
        renderQuote();
        return;
      }
      const m = e.target.closest('.bk-mnav');
      if (m) { S.view = new Date(S.view.getFullYear(), S.view.getMonth() + +m.dataset.m, 1); renderCal(); return; }
      const day = e.target.closest('.bk-day');
      if (day && !day.disabled) {
        const d = day.dataset.d;
        if (range) {
          if (!S.date || S.end || d < S.date) { S.date = d; S.end = null; }
          else if (d === S.date) { S.end = null; }
          else S.end = d;
        } else { S.date = d; S.time = null; }
        renderCal(); renderQuote();
        return;
      }
      const slot = e.target.closest('.bk-slot');
      if (slot) { S.time = +slot.dataset.t; renderCal(); renderQuote(); return; }
      const g = e.target.closest('[data-goto]');
      if (g) { go(+g.dataset.goto); return; }
      const st = e.target.closest('.bk-steps li');
      if (st && +st.dataset.s < S.step && S.step < 4) { go(+st.dataset.s); return; }
    });
    $('.bk-next').addEventListener('click', () => go(S.step + 1));
    $('.bk-back').addEventListener('click', () => go(S.step - 1));
    $('.bk-submit').addEventListener('click', submit);
    $('.bk-pdf').addEventListener('click', printQuote);
    $('.bk-q-pdf').addEventListener('click', printQuote);
    $('.bk-ics').addEventListener('click', ics);
    $('.bk-window')?.addEventListener('change', e => { S.window = e.target.value; });
    $$('[data-k]').forEach(el => el.addEventListener('input', () => { if (S.step === 3) renderReview(); }));
    $('.bk-again').addEventListener('click', () => {
      S.sel.clear(); S.date = S.end = S.time = null; S.ref = null; S.sent = false;
      $$('.bk-svc').forEach(b => b.setAttribute('aria-pressed', 'false'));
      $$('[data-k]').forEach(el => { if (el.tagName !== 'SELECT') el.value = ''; });
      renderQuote(); go(0);
    });

    // "Book" links elsewhere on the page pre-select a service
    document.querySelectorAll(`[data-book]`).forEach(a => a.addEventListener('click', () => {
      const id = a.dataset.book;
      if (!C.services.some(s => s.id === id)) return;
      S.sel.add(id);
      root.querySelector(`.bk-svc[data-id="${id}"]`)?.setAttribute('aria-pressed', 'true');
      renderQuote();
      if (S.step === 4) return;
      go(0);
    }));

    renderQuote();
    go(0);
  });
})();
