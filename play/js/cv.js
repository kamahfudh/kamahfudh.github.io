import { hide as hideCodex } from './codex.js';

// Same backend as mahfudh.art: request -> owner approves (email/Telegram) -> passcode -> download.
const CV_API_URL = 'https://script.google.com/macros/s/AKfycbwd5uic5U1bJv--e2Q9VFFGYrEwz3PjRmE-379NRP-nCKr1G5_rvkRLR4jMdjJyRvvo/exec';

const modal = document.querySelector('[data-cv-modal]');
const steps = modal.querySelectorAll('[data-cv-step]');
const showStep = name => steps.forEach(s => { s.hidden = s.dataset.cvStep !== name; });

function open() {
  hideCodex();
  showStep('request');
  modal.setAttribute('aria-hidden', 'false');
  document.documentElement.classList.add('codex-open');
  modal.querySelector('input')?.focus({ preventScroll: true });
}
function close() {
  modal.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('codex-open');
}

document.addEventListener('click', e => {
  if (e.target.closest('[data-cv-open]')) open();
  else if (e.target.closest('[data-cv-close]')) close();
  else if (e.target.closest('[data-cv-goto-verify]')) showStep('verify');
  else if (e.target.closest('[data-cv-goto-request]')) showStep('request');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') close();
});

const post = payload => fetch(CV_API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify(payload),
}).then(r => r.json());

function busy(form, on, idle, working) {
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = on;
  btn.textContent = on ? working : idle;
}

const requestForm = modal.querySelector('[data-cv-request-form]');
const requestError = modal.querySelector('[data-cv-request-error]');
requestForm.addEventListener('submit', e => {
  e.preventDefault();
  requestError.hidden = true;
  busy(requestForm, true, 'Request access', 'Sending…');
  post({ action: 'request', name: requestForm.name.value.trim(), email: requestForm.email.value.trim() })
    .then(res => {
      if (res.ok) showStep('sent');
      else { requestError.textContent = res.error || 'Something went wrong. Please try again.'; requestError.hidden = false; }
    })
    .catch(() => { requestError.textContent = 'Network error. Please try again.'; requestError.hidden = false; })
    .finally(() => busy(requestForm, false, 'Request access', 'Sending…'));
});

const verifyForm = modal.querySelector('[data-cv-verify-form]');
const verifyError = modal.querySelector('[data-cv-verify-error]');
verifyForm.addEventListener('submit', e => {
  e.preventDefault();
  verifyError.hidden = true;
  busy(verifyForm, true, 'Unlock & download', 'Checking…');
  post({ action: 'verify', email: verifyForm.email.value.trim(), passcode: verifyForm.passcode.value.trim() })
    .then(res => {
      if (!res.ok) { verifyError.textContent = res.error || 'Invalid email or passcode.'; verifyError.hidden = false; return; }
      const bytes = Uint8Array.from(atob(res.base64), ch => ch.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: res.mime || 'application/pdf' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: res.filename || 'CV.pdf' });
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      close();
    })
    .catch(() => { verifyError.textContent = 'Network error. Please try again.'; verifyError.hidden = false; })
    .finally(() => busy(verifyForm, false, 'Unlock & download', 'Checking…'));
});
