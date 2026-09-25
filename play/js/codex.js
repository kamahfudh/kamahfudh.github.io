import { CASES } from './case-data.js';
import { PROFILE, CAPABILITIES, SERVICES, EXPERIENCE, EXPLORATORY } from './content.js';
import { asset as sharedAsset } from './paths.js';

const root = document.querySelector('[data-codex]');
const body = root.querySelector('[data-codex-body]');
const lightbox = document.querySelector('[data-lightbox]');
const lightboxImg = lightbox.querySelector('img');
let lastFocus = null;

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const asset = src => sharedAsset(`case/${encodeURIComponent(src)}`);

// Mirrors mahfudh.art's headline style: the product name before the first comma is the accent word.
export function title(text) {
  const i = text.indexOf(',');
  return i > 0 ? `<em>${esc(text.slice(0, i))}</em>${esc(text.slice(i))}` : esc(text);
}

export function shots(images) {
  if (!images.length) return '';
  const cls = images.length === 1 ? 'shots shots-one' : 'shots';
  return `<div class="${cls}">${images.map(im => `<button type="button" class="shot" data-zoom="${asset(im.src)}" aria-label="Enlarge: ${esc(im.alt)}"><img src="${asset(im.src)}" alt="${esc(im.alt)}" loading="lazy" decoding="async"></button>`).join('')}</div>`;
}

export function block(b) {
  return `<section class="cx-block">
    ${b.label ? `<p class="cx-label">${esc(b.label)}</p>` : ''}
    ${b.heading ? `<h3>${esc(b.heading)}</h3>` : ''}
    ${b.paras.map(p => `<p>${esc(p)}</p>`).join('')}
    ${b.bullets.length ? `<ul class="cx-list">${b.bullets.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${shots(b.images)}
  </section>`;
}

function show(html, label) {
  lastFocus = document.activeElement;
  body.innerHTML = html;
  root.setAttribute('aria-label', label);
  root.setAttribute('aria-hidden', 'false');
  document.documentElement.classList.add('codex-open');
  body.scrollTop = 0;
  root.querySelector('[data-codex-close]').focus({ preventScroll: true });
  root.querySelectorAll('video').forEach(v => v.play().catch(() => {}));
}

export function hide() {
  if (root.getAttribute('aria-hidden') === 'true') return;
  root.querySelectorAll('video').forEach(v => v.pause());
  root.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('codex-open');
  lastFocus?.focus?.({ preventScroll: true });
}

export function openCase(key, { block: blockIndex } = {}) {
  const c = CASES[key];
  if (!c) return;
  if (key === 'exploratory' && blockIndex != null) {
    const b = c.blocks[blockIndex];
    const meta = EXPLORATORY[blockIndex];
    show(`
      <p class="cx-eyebrow">Side quest · ${esc(b.label)}</p>
      <h2>${esc(b.heading)}</h2>
      <p class="cx-summary">${esc(b.paras[0] || '')}</p>
      ${shots(b.images)}
      <div class="cx-actions">
        <button type="button" class="btn btn-ghost" data-case="exploratory">All ${c.blocks.length} side quests</button>
        <a class="btn btn-ghost" href="https://mahfudh.art/${c.page}" target="_blank" rel="noopener">Open on mahfudh.art ↗</a>
      </div>`, meta ? meta.name : b.heading);
    return;
  }
  const cover = c.video
    ? `<div class="cx-cover"><video src="${asset(c.video)}" poster="${c.cover ? asset(c.cover.src) : ''}" muted loop playsinline preload="metadata"></video></div>`
    : c.cover ? `<div class="cx-cover">${shots([c.cover])}</div>` : '';
  show(`
    <p class="cx-eyebrow">Case file · ${esc(c.label.replace(/^Case study - /, ''))}</p>
    <h2>${title(c.title)}</h2>
    ${c.summary ? `<p class="cx-summary">${esc(c.summary)}</p>` : ''}
    ${c.meta.length ? `<dl class="cx-meta">${c.meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
    ${cover}
    ${c.blocks.map(block).join('')}
    <div class="cx-actions"><a class="btn btn-accent" href="https://mahfudh.art/${c.page}" target="_blank" rel="noopener">Open on mahfudh.art ↗</a></div>`, c.title);
}

export function openRole(i) {
  const r = EXPERIENCE[i];
  if (!r) return;
  show(`
    <p class="cx-eyebrow">Career log · ${esc(r.when)}</p>
    <h2>${esc(r.title)}</h2>
    <p class="cx-summary">${esc(r.org)} · ${esc(r.where)}</p>
    <ul class="cx-list">${r.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
    <div class="cx-actions">
      ${r.caseKey ? `<button type="button" class="btn btn-accent" data-case="${r.caseKey}">Open the related case file</button>` : ''}
      <button type="button" class="btn btn-ghost" data-sheet>Character sheet</button>
    </div>`, r.title);
}

export function openSheet() {
  const p = PROFILE;
  show(`
    <p class="cx-eyebrow">Character sheet</p>
    <h2>${esc(p.name)}</h2>
    <p class="cx-summary">${esc(p.intro)}</p>
    <dl class="cx-meta">${p.stats.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    <section class="cx-block">
      <p class="cx-label">Abilities</p>
      <h3>What I bring to a project.</h3>
      <div class="cx-cards">${CAPABILITIES.map((c, i) => `<div class="cx-card"><span class="cx-num">0${i + 1}</span><strong>${esc(c.title)}</strong><p>${esc(c.text)}</p><div class="cx-tags">${c.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div></div>`).join('')}</div>
    </section>
    <section class="cx-block">
      <p class="cx-label">Services</p>
      <h3>Services I can help with.</h3>
      <ol class="cx-services">${SERVICES.map(([t, d], i) => `<li><span class="cx-num">0${i + 1}</span><div><strong>${esc(t)}</strong><p>${esc(d)}</p></div></li>`).join('')}</ol>
    </section>
    <section class="cx-block cx-grid3">
      <div><p class="cx-label">Education</p><ul class="cx-plain">${p.education.map((e, i) => `<li>${i === 0 ? `<strong>${esc(e)}</strong>` : esc(e)}</li>`).join('')}</ul></div>
      <div><p class="cx-label">Skills</p><ul class="cx-plain">${p.skills.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
      <div><p class="cx-label">Languages</p><ul class="cx-plain">${p.languages.map(([l, lv]) => `<li><strong>${esc(l)}</strong> - ${esc(lv)}</li>`).join('')}</ul></div>
    </section>
    <section class="cx-block">
      <p class="cx-label">Career log</p>
      <ol class="cx-roles">${EXPERIENCE.slice().reverse().map((r, idx) => `<li><button type="button" data-role="${EXPERIENCE.length - 1 - idx}"><span>${esc(r.when)}</span><strong>${esc(r.title)}</strong><em>${esc(r.org)}</em></button></li>`).join('')}</ol>
    </section>
    <div class="cx-actions">
      <button type="button" class="btn btn-accent" data-message>Send a message</button>
      <button type="button" class="btn btn-ghost" data-cv-open>Download CV</button>
    </div>`, 'Character sheet');
}

export function openMessage() {
  show(`
    <p class="cx-eyebrow">Transmission</p>
    <h2>Have a project in mind? Let's talk it through.</h2>
    <p class="cx-summary">Freelance UI/UX work, a full-time role, or just a question. ${esc(PROFILE.response)}.</p>
    <form class="cx-form" data-message-form>
      <label>Name<input name="name" required autocomplete="name"></label>
      <label>Email<input name="email" type="email" required autocomplete="email"></label>
      <label>Company (optional)<input name="company" autocomplete="organization"></label>
      <label>Message<textarea name="message" rows="5" required></textarea></label>
      <button type="submit" class="btn btn-accent">Send message</button>
      <p class="cx-note">Submitting opens your email client with these details prefilled to ${esc(PROFILE.email)}.</p>
    </form>`, 'Send a message');
}

root.addEventListener('submit', e => {
  const form = e.target.closest('[data-message-form]');
  if (!form) return;
  e.preventDefault();
  const f = new FormData(form);
  const name = String(f.get('name') || '').trim();
  const lines = [`Name: ${name}`, `Email: ${String(f.get('email') || '').trim()}`];
  const company = String(f.get('company') || '').trim();
  if (company) lines.push(`Company: ${company}`);
  lines.push('', String(f.get('message') || '').trim());
  window.location.href = `mailto:${PROFILE.email}?subject=${encodeURIComponent(`Project enquiry from ${name || 'website visitor'}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
});

document.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('[data-codex-close]')) return hide();
  if (t === root) return hide();
  const zoom = t.closest('[data-zoom]');
  if (zoom) {
    lightboxImg.src = zoom.dataset.zoom;
    lightboxImg.alt = zoom.querySelector('img')?.alt || '';
    lightbox.setAttribute('aria-hidden', 'false');
    return;
  }
  if (t.closest('[data-lightbox]')) {
    lightbox.setAttribute('aria-hidden', 'true');
    return;
  }
  const c = t.closest('[data-case]');
  if (c) return openCase(c.dataset.case, { block: c.dataset.block != null ? Number(c.dataset.block) : undefined });
  const r = t.closest('[data-role]');
  if (r) return openRole(Number(r.dataset.role));
  if (t.closest('[data-sheet]')) return openSheet();
  if (t.closest('[data-message]')) return openMessage();
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (lightbox.getAttribute('aria-hidden') === 'false') lightbox.setAttribute('aria-hidden', 'true');
  else hide();
});

export const isOpen = () => root.getAttribute('aria-hidden') === 'false';
