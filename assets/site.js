/* Qraftistry site scripts: analytics, inquiry form, before/after.
   Everything you may need to change is in CONFIG below. */
(function () {
  'use strict';
  var CONFIG = {
    GA_MEASUREMENT_ID: 'G-XXXXXXXXXX',            // Google Analytics 4 ID, e.g. G-AB12CD34EF
    WEB3FORMS_ACCESS_KEY: 'YOUR_WEB3FORMS_ACCESS_KEY', // free key from web3forms.com (delivers form to email)
    WHATSAPP_NUMBER: '919769471251',
    EMAIL: 'qraftistry24@gmail.com',
    /* Before/after items. Leave empty to keep that section hidden. Example:
       { title:'Dau Gopal listing', service:'Graphic Design', before:'assets/ba-1-before.jpg', after:'assets/ba-1-after.jpg',
         ratio:'4/3', change:'What we changed', result:'What improved' } */
    BEFORE_AFTER: []
  };

  var gaOn = /^G-[A-Z0-9]{6,}$/.test(CONFIG.GA_MEASUREMENT_ID) && CONFIG.GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX';
  var wbOn = CONFIG.WEB3FORMS_ACCESS_KEY && CONFIG.WEB3FORMS_ACCESS_KEY !== 'YOUR_WEB3FORMS_ACCESS_KEY';
  var page = location.pathname.replace(/\/index\.html$/, '/') || '/';

  /* ---------- analytics ---------- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  if (gaOn) {
    var s = document.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.GA_MEASUREMENT_ID;
    document.head.appendChild(s);
    gtag('js', new Date()); gtag('config', CONFIG.GA_MEASUREMENT_ID);
  }
  function track(name, params) {
    params = params || {}; params.page_path = page;
    if (gaOn) gtag('event', name, params);
    document.dispatchEvent(new CustomEvent('qtrack', { detail: { name: name, params: params } }));
  }
  function whereIs(el) {
    if (el.dataset && el.dataset.loc) return el.dataset.loc;
    var sec = el.closest('section[id],header.nav,footer,.wafab');
    if (!sec) return 'page';
    return sec.id || (sec.matches('header.nav') ? 'header' : sec.matches('footer') ? 'footer' : 'page');
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a,button'); if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/wa\.me|api\.whatsapp\.com/.test(href)) return track('whatsapp_click', { location: whereIs(a) });
    if (href.indexOf('mailto:') === 0) return track('email_click', { location: whereIs(a) });
    if (a.dataset && a.dataset.track) track(a.dataset.track, { location: whereIs(a), label: (a.textContent || '').trim().slice(0, 40) });
  });
  document.querySelectorAll('.faq details').forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) track('faq_open', { question: d.querySelector('summary').textContent.trim().slice(0, 60) }); });
  });

  /* ---------- swipe for clients slider (swipe-added) ---------- */
  var sl = document.querySelector('.slider');
  if (sl) {
    var sx = 0, sy = 0;
    sl.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    sl.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) { var b = document.getElementById(dx < 0 ? 'next' : 'prev'); if (b) b.click(); }
    }, { passive: true });
  }

  /* ---------- inquiry form ---------- */
  var form = document.getElementById('inq');
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function waLink(msg) { return 'https://wa.me/' + CONFIG.WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg); }
  function mailLink(msg) { return 'mailto:' + CONFIG.EMAIL + '?subject=' + encodeURIComponent('New inquiry from Qraftistry website') + '&body=' + encodeURIComponent(msg); }
  if (form) {
    var started = false;
    form.addEventListener('focusin', function () { if (!started) { started = true; track('form_start'); } });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements, ok = true;
      function check(id, valid) { var box = form.querySelector('#' + id).closest('.fld'); box.classList.toggle('bad', !valid); if (!valid) ok = false; }
      var name = f.name.value.trim(), email = f.email.value.trim(), msg = f.message.value.trim();
      check('f-name', name.length > 1);
      check('f-email', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email));
      check('f-msg', msg.length > 5);
      if (!ok) { form.querySelector('.bad input,.bad textarea').focus(); return; }
      if (f.company_website.value) { done(name, '', true); return; }      // honeypot: bots
      var data = { name: name, email: email, phone: f.phone.value.trim(), brand: f.brand.value.trim(), service: f.service.value, message: msg, pref: form.querySelector('input[name=pref]:checked').value };
      var text = 'Hi Qraftistry, I\'m ' + data.name + (data.brand ? ' from ' + data.brand : '') + '.\nService: ' + data.service + '\nDetails: ' + data.message + '\nEmail: ' + data.email + (data.phone ? '\nPhone: ' + data.phone : '') + '\nPlease reply on: ' + data.pref;
      track('form_submit', { service: data.service, reply_on: data.pref });
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Sending...';
      if (wbOn) {
        fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ access_key: CONFIG.WEB3FORMS_ACCESS_KEY, subject: 'New inquiry from Qraftistry website', from_name: 'Qraftistry website', name: data.name, email: data.email, phone: data.phone, brand: data.brand, service: data.service, message: data.message, reply_on: data.pref }) })
          .then(function (r) { return r.json(); })
          .then(function (j) { if (j.success) { track('generate_lead', { method: 'email_service', service: data.service }); done(data.name, text, false, true); } else { fallback(data, text); } })
          .catch(function () { fallback(data, text); });
      } else { fallback(data, text); }
    });
  }
  function fallback(data, text) {            // no email service: hand the inquiry to WhatsApp, offer email too
    track('generate_lead', { method: 'whatsapp_prefill', service: data.service });
    window.open(waLink(text), '_blank');
    done(data.name, text, false, false);
  }
  function done(name, text, bot, delivered) {
    var box = document.createElement('div'); box.className = 'ok';
    if (bot) { box.innerHTML = '<h3>Thank you</h3><p>Your message has been received.</p>'; }
    else {
      box.innerHTML = '<h3>Thank you, ' + esc(name.split(' ')[0]) + '!</h3><p>' +
        (delivered ? 'Your inquiry has reached us. Want a faster reply? Message us on WhatsApp too.' : 'WhatsApp should have opened with your message ready. Just press send. If it did not open, use a button below.') +
        '</p><div class="row2"><a class="btn" target="_blank" rel="noopener" href="' + waLink(text) + '">Send on WhatsApp</a><a class="btn" style="background:var(--ink);box-shadow:0 5px 0 #0c1124" href="' + mailLink(text) + '">Send by email</a></div>';
    }
    form.innerHTML = ''; form.appendChild(box);
  }

  /* ---------- before / after ---------- */
  var sec = document.getElementById('beforeafter');
  if (sec) {
    var items = CONFIG.BEFORE_AFTER || [];
    if (!items.length) { sec.remove(); }
    else {
      var grid = document.getElementById('ba-grid');
      items.forEach(function (it, i) {
        var card = document.createElement('div'); card.className = 'ba-card';
        card.innerHTML = '<div class="ba" style="--ar:' + esc(it.ratio || '4/3') + '"><img src="' + esc(it.after) + '" alt="After: ' + esc(it.title) + '" loading="lazy"><img class="bf" src="' + esc(it.before) + '" alt="Before: ' + esc(it.title) + '" loading="lazy"><span class="line"></span><span class="knob">&#8596;</span><span class="tg b">Before</span><span class="tg a">After</span><input type="range" min="0" max="100" value="50" aria-label="Compare before and after: ' + esc(it.title) + '"></div>' +
          '<h3>' + esc(it.title) + '</h3>' + (it.service ? '<p><b>' + esc(it.service) + '</b></p>' : '') + (it.change ? '<p>' + esc(it.change) + '</p>' : '') + (it.result ? '<p class="res"><b>Result:</b> ' + esc(it.result) + '</p>' : '');
        var box = card.querySelector('.ba'), r = card.querySelector('input'), used = false;
        r.addEventListener('input', function () { box.style.setProperty('--pos', r.value + '%'); if (!used) { used = true; track('before_after_interact', { item: it.title }); } });
        grid.appendChild(card);
      });
      sec.hidden = false;
    }
  }
})();
