(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const EMAIL = 'mahfudhkhoiri2906@gmail.com';
  const CV_API_URL = 'https://script.google.com/macros/s/AKfycbwd5uic5U1bJv--e2Q9VFFGYrEwz3PjRmE-379NRP-nCKr1G5_rvkRLR4jMdjJyRvvo/exec';
  const pad = n => String(n).padStart(2, '0');

  // ---------- Rooms: the page repaints to the colour of whatever sits at the middle of the screen ----------
  const theme = $('meta[name="theme-color"]');
  const rooms = $$('[data-bg]');
  const paint = el => {
    root.style.setProperty('--bg', el.dataset.bg);
    root.style.setProperty('--accent', el.dataset.accent);
    theme?.setAttribute('content', el.dataset.bg);
  };
  if ('IntersectionObserver' in window) {
    const rio = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) paint(en.target); }),
      { rootMargin: '-40% 0px -60% 0px' });
    rooms.forEach(r => rio.observe(r));
  }

  // ---------- Header: solid once scrolled, tucks away while reading down ----------
  const top = $('[data-top]');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    top.classList.toggle('is-solid', y > 40);
    top.classList.toggle('is-hidden', y > 400 && y > lastY && !document.body.classList.contains('menu-open'));
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Menu ----------
  const menuBtn = $('[data-menu]');
  const menu = $('[data-menu-panel]');
  const setMenu = open => {
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); }
    else { menu.classList.remove('is-open'); setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 600); }
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') setMenu(false); });

  // ---------- Reveals: lines slide up out of their masks, media unclips ----------
  $$('.lines').forEach(l => $$('.w > span', l).forEach((s, i) => s.style.setProperty('--i', i)));
  const reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    }), { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  // ---------- Scroll parallax: each project's layers drift at different speeds ----------
  const layered = $$('.project, [data-parallax]');
  let ticking = false;
  const parallax = () => {
    ticking = false;
    const vh = innerHeight;
    layered.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
      if (el.hasAttribute('data-parallax')) el.style.transform = `translateY(${(p * parseFloat(el.dataset.parallax) * vh).toFixed(1)}px)`;
      else el.style.setProperty('--p', p.toFixed(3));
    });
  };
  if (!reduce) {
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });
    parallax();
  }

  // ---------- Work index: follows the product in view ----------
  const index = $('.work-index');
  const work = $('.work');
  if (index && work && 'IntersectionObserver' in window) {
    const links = $$('[data-index-link]', index);
    new IntersectionObserver(([en]) => index.classList.toggle('is-shown', en.isIntersecting), { rootMargin: '-40% 0px -40% 0px' }).observe(work);
    const pio = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const i = +en.target.dataset.index;
      links.forEach((a, k) => a.classList.toggle('is-on', k === i));
    }), { rootMargin: '-50% 0px -50% 0px' });
    $$('.project').forEach(p => pio.observe(p));
  }

  // ---------- Hero: device stack leans toward the pointer; the accent word rotates ----------
  const stage = $('[data-stage]');
  if (stage && fine && !reduce) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener('pointermove', e => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; }, { passive: true });
    const loop = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      stage.style.setProperty('--mx', cx.toFixed(4));
      stage.style.setProperty('--my', cy.toFixed(4));
      requestAnimationFrame(loop);
    };
    loop();
  }
  const rot = $('[data-rotate]');
  if (rot && !reduce) {
    const tones = ['#6d93ff', '#35e0a5', '#ffb54d', '#ff7cb8', '#82caff', '#ff8a73'];
    const spans = rot.dataset.rotate.split(',').map((word, i) => {
      const s = i === 0 ? rot.firstElementChild : document.createElement('span');
      s.textContent = word;
      s.style.color = tones[i % tones.length];
      if (i) rot.append(s);
      return s;
    });
    let w = 0;
    const size = () => { rot.style.width = `${spans[w].offsetWidth}px`; };
    document.fonts?.ready.then(size);
    addEventListener('resize', size);
    size();
    setInterval(() => {
      if (document.hidden || scrollY > innerHeight) return;
      const out = spans[w];
      w = (w + 1) % spans.length;
      out.classList.remove('is-on');
      out.classList.add('is-out');
      spans[w].classList.remove('is-out');
      spans[w].classList.add('is-on');
      size();
      setTimeout(() => out.classList.remove('is-out'), 800);
    }, 2600);
  }

  // ---------- Cursor with labels, and magnetic buttons ----------
  const cursor = $('[data-cursor]');
  if (cursor && fine && !reduce) {
    const label = $('[data-cursor-label]', cursor);
    let x = -100, y = -100, px = -100, py = -100;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; cursor.classList.add('is-on'); }, { passive: true });
    // Hide the disc when the pointer leaves the window, so it never parks in a corner.
    document.documentElement.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
    addEventListener('blur', () => cursor.classList.remove('is-on'));
    const follow = () => {
      px += (x - px) * 0.22;
      py += (y - py) * 0.22;
      cursor.style.transform = `translate(${px}px, ${py}px)`;
      requestAnimationFrame(follow);
    };
    follow();
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor-text]');
      cursor.classList.toggle('is-label', !!t);
      label.textContent = t ? t.dataset.cursorText : '';
    });
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  // ---------- Experience rows preview their project under the pointer ----------
  const preview = $('[data-exp-preview]');
  if (preview && fine) {
    const pimg = document.createElement('img');
    pimg.alt = '';
    preview.append(pimg);
    $$('[data-preview]').forEach(row => {
      row.addEventListener('pointerenter', () => {
        pimg.src = row.dataset.preview;
        preview.classList.add('is-on');
        paint({ dataset: { bg: row.dataset.room, accent: row.dataset.roomAccent } });
      });
      row.addEventListener('pointerleave', () => {
        preview.classList.remove('is-on');
        paint(row.closest('[data-bg]'));
      });
      row.addEventListener('pointermove', e => { preview.style.left = `${e.clientX + 170}px`; preview.style.top = `${e.clientY}px`; });
    });
  }

  // ---------- Copy email ----------
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const small = $('small', b);
    try { await navigator.clipboard.writeText(b.dataset.copy); small.textContent = 'Copied'; }
    catch (e) { location.href = `mailto:${b.dataset.copy}`; return; }
    setTimeout(() => { small.textContent = 'Copy'; }, 1800);
  }));

  // ---------- Videos play only while on screen ----------
  const vids = $$('video[data-inview-play], video[data-autoplay]');
  if (vids.length && 'IntersectionObserver' in window) {
    const vio = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting && !reduce) en.target.play().catch(() => {});
      else en.target.pause();
    }), { threshold: 0.2 });
    vids.forEach(v => { if (reduce) v.removeAttribute('autoplay'); vio.observe(v); });
  }

  // ---------- Medan clock ----------
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const clocks = $$('[data-clock]');
  const tick = () => {
    const [h, m, s] = fmt.format(new Date()).split(':');
    clocks.forEach(c => { c.textContent = c.hasAttribute('data-seconds') ? `${h}:${m}:${s}` : `${h}:${m}`; });
  };
  tick();
  setInterval(tick, 1000);

  // ---------- Screen viewer ----------
  const lb = $('[data-lb]');
  const stageEl = $('[data-lb-stage]', lb);
  const lbImg = document.createElement('img');
  stageEl.append(lbImg);
  const lbCount = $('[data-lb-count]', lb);
  const lbCap = $('[data-lb-cap]', lb);
  const prev = $('[data-lb-prev]', lb);
  const next = $('[data-lb-next]', lb);
  let set = [];
  let at = 0;
  let opener = null;
  const render = dir => {
    const s = set[at];
    lbImg.src = s.dataset.full;
    lbImg.alt = s.dataset.alt;
    lbCap.textContent = s.dataset.alt;
    lbCount.textContent = `${pad(at + 1)} / ${pad(set.length)}`;
    prev.hidden = next.hidden = set.length < 2;
    if (!reduce) { lbImg.style.setProperty('--from', `${dir * 30}px`); lbImg.classList.remove('is-in'); void lbImg.offsetWidth; lbImg.classList.add('is-in'); }
  };
  $$('[data-shot]').forEach(btn => btn.addEventListener('click', () => {
    set = $$(`[data-shot="${CSS.escape(btn.dataset.shot)}"]`);
    at = set.indexOf(btn);
    opener = btn;
    render(0);
    lb.showModal();
  }));
  prev.addEventListener('click', () => { at = (at - 1 + set.length) % set.length; render(-1); });
  next.addEventListener('click', () => { at = (at + 1) % set.length; render(1); });
  $('[data-lb-close]', lb).addEventListener('click', () => lb.close());
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') prev.click(); if (e.key === 'ArrowRight') next.click(); });
  lb.addEventListener('click', e => { if (e.target === lb || e.target === stageEl) lb.close(); });
  lb.addEventListener('close', () => { lbImg.removeAttribute('src'); opener?.focus(); });
  let sx = null;
  lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) (dx > 0 ? prev : next).click();
    sx = null;
  });

  // ---------- CV: request access, then unlock with a passcode ----------
  const cv = $('[data-cv]');
  const steps = $$('[data-cv-step]', cv);
  let cvOpener = null;
  const showStep = name => {
    steps.forEach(s => { s.hidden = s.dataset.cvStep !== name; });
    $(`[data-cv-step="${name}"] input, [data-cv-step="${name}"] button`, cv)?.focus();
  };
  $$('[data-cv-open]').forEach(b => b.addEventListener('click', () => {
    cvOpener = b;
    if (menuBtn.getAttribute('aria-expanded') === 'true') setMenu(false);
    cv.showModal();
    showStep('request');
  }));
  $('[data-cv-close]', cv).addEventListener('click', () => cv.close());
  cv.addEventListener('click', e => { if (e.target === cv) cv.close(); });
  cv.addEventListener('close', () => cvOpener?.focus());
  $$('[data-cv-goto]', cv).forEach(b => b.addEventListener('click', () => showStep(b.dataset.cvGoto)));

  const post = payload => fetch(CV_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  }).then(r => r.json());
  const busy = (form, on, idle, working) => {
    const b = $('button[type="submit"]', form);
    b.disabled = on;
    b.textContent = on ? working : idle;
  };
  const invalid = (form, names, errEl) => {
    const bad = names.map(n => form.elements[n]).filter(f => !f.value.trim() || (f.type === 'email' && !f.checkValidity()));
    names.forEach(n => form.elements[n].removeAttribute('aria-invalid'));
    bad.forEach(f => f.setAttribute('aria-invalid', 'true'));
    if (bad.length) {
      errEl.textContent = bad[0].type === 'email' && bad[0].value.trim() ? 'That email address looks incomplete. Check it and try again.' : 'Please fill in every field before continuing.';
      errEl.hidden = false;
      bad[0].focus();
    }
    return bad.length > 0;
  };

  const reqForm = $('[data-cv-request-form]', cv);
  const reqErr = $('[data-cv-request-error]', cv);
  reqForm.addEventListener('submit', e => {
    e.preventDefault();
    reqErr.hidden = true;
    if (invalid(reqForm, ['name', 'email'], reqErr)) return;
    busy(reqForm, true, 'Request access', 'Sending…');
    post({ action: 'request', name: reqForm.name.value.trim(), email: reqForm.email.value.trim() })
      .then(res => {
        if (res.ok) showStep('sent');
        else { reqErr.textContent = res.error || 'Something went wrong. Please try again.'; reqErr.hidden = false; }
      })
      .catch(() => { reqErr.textContent = 'Network error. Check your connection and try again.'; reqErr.hidden = false; })
      .finally(() => busy(reqForm, false, 'Request access', 'Sending…'));
  });

  const verForm = $('[data-cv-verify-form]', cv);
  const verErr = $('[data-cv-verify-error]', cv);
  verForm.addEventListener('submit', e => {
    e.preventDefault();
    verErr.hidden = true;
    if (invalid(verForm, ['email', 'passcode'], verErr)) return;
    busy(verForm, true, 'Unlock & download', 'Checking…');
    post({ action: 'verify', email: verForm.email.value.trim(), passcode: verForm.passcode.value.trim() })
      .then(res => {
        if (!res.ok) { verErr.textContent = res.error || 'Invalid email or passcode.'; verErr.hidden = false; return; }
        const bytes = Uint8Array.from(atob(res.base64), c => c.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bytes], { type: res.mime || 'application/pdf' }));
        const a = Object.assign(document.createElement('a'), { href: url, download: res.filename || 'CV.pdf' });
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        cv.close();
      })
      .catch(() => { verErr.textContent = 'Network error. Check your connection and try again.'; verErr.hidden = false; })
      .finally(() => busy(verForm, false, 'Unlock & download', 'Checking…'));
  });

  // ---------- Contact: opens a prefilled email ----------
  const contact = $('#contact-form');
  if (contact) {
    const err = $('[data-contact-error]', contact);
    contact.addEventListener('submit', e => {
      e.preventDefault();
      err.hidden = true;
      if (invalid(contact, ['name', 'email', 'message'], err)) return;
      const f = contact.elements;
      const name = f.name.value.trim();
      const lines = [`Name: ${name}`, `Email: ${f.email.value.trim()}`];
      if (f.company.value.trim()) lines.push(`Company: ${f.company.value.trim()}`);
      lines.push('', f.message.value.trim());
      location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Project enquiry from ${name || 'website visitor'}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
    });
  }
})();
