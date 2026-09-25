// Locally, screens/ and case/ files live under assets/. On mahfudh.art the game is served from /play/ and
// reuses the main site's images/ folder instead, so deploy.sh rewrites SHARED to '../images/'.
const SHARED = '../images/';

export const asset = path => (SHARED && !path.startsWith('tex/') ? SHARED + path.split('/').pop() : `assets/${path}`);

export const CLASSIC_URL = SHARED ? '../index.html' : 'https://mahfudh.art/';

// Tell the main site this visitor has seen the game, so its homepage stops redirecting here.
try { localStorage.setItem('mk-seen-game', '1'); } catch (e) { /* storage blocked: the homepage just redirects again */ }
document.querySelectorAll('[data-classic]').forEach(a => { a.href = CLASSIC_URL; });
