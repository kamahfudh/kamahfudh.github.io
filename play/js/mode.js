import { renderDossier } from './dossier.js';

// "play" = interactive 3D game, "read" = plain listing of everything. Choice is remembered per browser.
const KEY = 'pq-mode';
const root = document.documentElement;
const dossier = document.querySelector('[data-dossier]');
const buttons = [...document.querySelectorAll('[data-mode-set]')];
let playScroll = 0;

export const getMode = () => (root.dataset.mode === 'read' ? 'read' : 'play');

function apply(mode, { initial = false } = {}) {
  if (mode === 'read') renderDossier(dossier);
  if (!initial && getMode() === 'play' && mode === 'read') playScroll = window.scrollY;
  root.dataset.mode = mode;
  buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modeSet === mode)));
  document.querySelector('.logo').setAttribute('href', mode === 'read' ? '#read-top' : '#lvl-1');
  if (initial) return;
  try { localStorage.setItem(KEY, mode); } catch { /* storage blocked: mode just won't persist */ }
  window.scrollTo(0, mode === 'play' ? playScroll : 0);
  window.dispatchEvent(new CustomEvent('pq:mode', { detail: mode }));
}

buttons.forEach(b => b.addEventListener('click', () => {
  if (b.dataset.modeSet !== getMode()) apply(b.dataset.modeSet);
}));

apply(getMode(), { initial: true });
