import { CV_URL } from './paths.js';

// The CV is a straight download from mahfudh.art (the public copy has the phone numbers removed).
document.addEventListener('click', e => {
  if (!e.target.closest('[data-cv-open]')) return;
  const a = Object.assign(document.createElement('a'), { href: CV_URL, download: 'Mahfudh-Khoiri-Amran-CV.pdf' });
  // Cross-origin (local dev) links ignore download and open the PDF instead, so give them their own tab.
  if (new URL(CV_URL, location.href).origin !== location.origin) a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  a.remove();
});
