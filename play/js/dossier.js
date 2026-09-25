import { CASES } from './case-data.js';
import { PROFILE, CAPABILITIES, SERVICES, EXPERIENCE, WEB, MOBILE } from './content.js';
import { esc, title, block, shots } from './codex.js';
import { asset, CLASSIC_URL } from './paths.js';

const caseAsset = src => asset(`case/${encodeURIComponent(src)}`);
const meta = pairs => (pairs.length ? `<dl class="cx-meta">${pairs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : '');

function project(p) {
  const c = CASES[p.key];
  const cover = c.cover ? caseAsset(c.cover.src) : asset(p.tex);
  const screens = c.blocks.reduce((n, b) => n + b.images.length, 0);
  return `<article class="ds-project" id="work-${p.key}">
    <button type="button" class="ds-cover${c.cover ? '' : ' is-phone'}" data-zoom="${cover}" aria-label="Enlarge cover of ${esc(p.name)}"><img src="${cover}" alt="${esc(c.cover?.alt || p.name)}" loading="lazy" decoding="async"></button>
    <div class="ds-project-body">
      <p class="ds-eyebrow">${esc(c.label.replace(/^Case study - /, ''))}</p>
      <h3>${title(c.title)}</h3>
      <p>${esc(c.summary)}</p>
      <div class="cx-tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
      ${meta(c.meta)}
    </div>
    <details class="ds-details">
        <summary>Full case study <span>${c.blocks.length} sections · ${screens} screens</span></summary>
        ${c.blocks.map(block).join('')}
        <div class="cx-actions"><a class="btn btn-ghost" href="https://mahfudh.art/${c.page}" target="_blank" rel="noopener">Open on mahfudh.art ↗</a></div>
    </details>
  </article>`;
}

function build() {
  const p = PROFILE;
  const ex = CASES.exploratory;
  return `
  <header class="ds-hero" id="read-top">
    <p class="ds-eyebrow">UI/UX & Product Designer</p>
    <h1>${esc(p.name)}</h1>
    <p class="ds-lead">${esc(p.intro)}</p>
    ${meta(p.stats)}
    <div class="cx-actions">
      <a class="btn btn-accent" href="mailto:${p.email}">Email me</a>
      <button type="button" class="btn btn-ghost" data-message>Send a message</button>
      <button type="button" class="btn btn-ghost" data-cv-open>Download CV</button>
      <a class="btn btn-ghost" href="${p.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
      <a class="btn btn-ghost" href="${CLASSIC_URL}">Classic site</a>
    </div>
    <nav class="ds-toc" aria-label="Contents">
      <a href="#read-web">Website design</a><a href="#read-mobile">Mobile design</a><a href="#read-exploratory">Exploratory</a>
      <a href="#read-experience">Experience</a><a href="#read-skills">Skills & services</a><a href="#read-contact">Contact</a>
    </nav>
  </header>

  <section class="ds-section" id="read-web">
    <div class="ds-head"><p class="ds-eyebrow">Selected work · ${WEB.length} projects</p><h2>Website design</h2></div>
    ${WEB.map(project).join('')}
  </section>

  <section class="ds-section" id="read-mobile">
    <div class="ds-head"><p class="ds-eyebrow">Selected work · ${MOBILE.length} projects</p><h2>Mobile design</h2></div>
    ${MOBILE.map(project).join('')}
  </section>

  <section class="ds-section" id="read-exploratory">
    <div class="ds-head"><p class="ds-eyebrow">Exploratory · ${ex.blocks.length} projects</p><h2>${esc(ex.title)}</h2><p class="ds-lead">${esc(ex.summary)}</p></div>
    ${ex.blocks.map(b => `<article class="ds-mini">
      <p class="ds-eyebrow">${esc(b.label)}</p>
      <h3>${esc(b.heading)}</h3>
      ${b.paras.map(x => `<p>${esc(x)}</p>`).join('')}
      ${shots(b.images)}
    </article>`).join('')}
  </section>

  <section class="ds-section" id="read-experience">
    <div class="ds-head"><p class="ds-eyebrow">Experience</p><h2>Where I've worked.</h2></div>
    <ol class="ds-timeline">
      ${EXPERIENCE.slice().reverse().map(r => `<li>
        <div class="ds-when"><strong>${esc(r.when)}</strong><span>${esc(r.where)}</span></div>
        <div>
          <h3>${esc(r.title)}</h3>
          <p class="ds-org">${esc(r.org)}</p>
          <ul class="cx-list">${r.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
          ${r.caseKey ? `<a class="ds-link" href="#work-${r.caseKey}">Related case study ↓</a>` : ''}
        </div>
      </li>`).join('')}
    </ol>
  </section>

  <section class="ds-section" id="read-skills">
    <div class="ds-head"><p class="ds-eyebrow">Skills & services</p><h2>What I bring to a project.</h2></div>
    <div class="cx-cards">${CAPABILITIES.map((c, i) => `<div class="cx-card"><span class="cx-num">0${i + 1}</span><strong>${esc(c.title)}</strong><p>${esc(c.text)}</p><div class="cx-tags">${c.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div></div>`).join('')}</div>
    <h3 class="ds-sub">Services I can help with.</h3>
    <ol class="cx-services">${SERVICES.map(([t, d], i) => `<li><span class="cx-num">0${i + 1}</span><div><strong>${esc(t)}</strong><p>${esc(d)}</p></div></li>`).join('')}</ol>
    <div class="cx-grid3 ds-grid3">
      <div><p class="cx-label">Education</p><ul class="cx-plain">${p.education.map((e, i) => `<li>${i === 0 ? `<strong>${esc(e)}</strong>` : esc(e)}</li>`).join('')}</ul></div>
      <div><p class="cx-label">Skills</p><ul class="cx-plain">${p.skills.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
      <div><p class="cx-label">Languages</p><ul class="cx-plain">${p.languages.map(([l, lv]) => `<li><strong>${esc(l)}</strong> - ${esc(lv)}</li>`).join('')}</ul></div>
    </div>
  </section>

  <section class="ds-section ds-contact" id="read-contact">
    <div class="ds-head"><p class="ds-eyebrow">Contact</p><h2>Have a project in mind? Let's talk it through.</h2>
      <p class="ds-lead">Open to freelance UI/UX work and full-time product design roles. ${esc(p.notice)}</p></div>
    ${meta([['Email', p.email], ['Location', p.location], ['Response time', p.response]])}
    <div class="cx-actions">
      <a class="btn btn-accent" href="mailto:${p.email}">Email me</a>
      <button type="button" class="btn btn-ghost" data-message>Send a message</button>
      <button type="button" class="btn btn-ghost" data-cv-open>Download CV</button>
      <a class="btn btn-ghost" href="${p.linkedin}" target="_blank" rel="noopener">LinkedIn</a>
    </div>
  </section>`;
}

let rendered = false;
export function renderDossier(el) {
  if (rendered) return;
  el.innerHTML = build();
  rendered = true;
}
