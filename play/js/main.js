import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { COLORS, clamp01, lerp, seg, smooth } from './util.js';
import { createRobot } from './robot.js';
import { levelBoot, levelWeb, levelMobile, levelSide, levelClimb, levelCollect, levelContact } from './levels.js';
import { openCase, openRole, openSheet, openMessage, isOpen, hide as hideCodex } from './codex.js';
import { createRoam } from './roam.js';
import './cv.js';
import { getMode } from './mode.js';
import { asset } from './paths.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = s => document.querySelector(s);
const loaderEl = $('[data-loader]');
const loaderBar = $('[data-loader-bar]');
const hudLvl = $('[data-hud-lvl]');
const hudName = $('[data-hud-name]');
const xpBar = $('[data-xp-bar]');
const xpText = $('[data-xp]');
const toasts = $('[data-toasts]');
const totalXpEl = $('[data-total-xp]');
const sections = [...document.querySelectorAll('[data-level]')];
const questLists = sections.map(s => [...s.querySelectorAll('[data-quests] > li')]);
const objBars = sections.map(s => s.querySelector('[data-obj-bar]'));

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('#scene'), antialias: true, powerPreference: 'high-performance' });
} catch {
  loaderEl.classList.add('is-done');
  document.body.classList.add('no-webgl');
  throw new Error('WebGL unavailable');
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.night);
scene.fog = new THREE.FogExp2(COLORS.night, 0.02);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 400);

scene.add(new THREE.HemisphereLight(COLORS.peri, COLORS.night, 0.55));
const key = new THREE.DirectionalLight(0xfff1dc, 2.0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0005;
key.shadow.normalBias = 0.02;
Object.assign(key.shadow.camera, { left: -5.5, right: 5.5, top: 6, bottom: -4, near: 0.5, far: 30 });
const rim = new THREE.DirectionalLight(COLORS.peri, 1.6);
scene.add(key, key.target, rim, rim.target);

// Starfield
{
  const count = 2600;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const tints = [new THREE.Color(COLORS.cream), new THREE.Color(COLORS.peri), new THREE.Color(0xffffff)];
  for (let i = 0; i < count; i++) {
    const r = 45 + Math.random() * 90;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos.set([33 + r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.6, r * Math.sin(ph) * Math.sin(th)], i * 3);
    tints[i % 3].toArray(col, i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
  stars.name = 'stars';
  scene.add(stars);
}

const manager = new THREE.LoadingManager();
manager.onProgress = (_u, loaded, total) => { loaderBar.style.width = `${(loaded / total) * 100}%`; };
manager.onLoad = () => loaderEl.classList.add('is-done');
const texLoader = new THREE.TextureLoader(manager);
const maxAniso = renderer.capabilities.getMaxAnisotropy();
const load = path => {
  const t = texLoader.load(asset(path));
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  return t;
};

await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]);

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const origins = [V(0, 0, 0), V(11, 1.2, -3), V(22, -0.2, -1), V(33, 1.0, -3.5), V(44, 0.8, -4), V(55, 1.6, -2), V(66, 0.6, 0)];
const levels = [
  levelBoot(scene, origins[0]),
  levelWeb(scene, origins[1], load),
  levelMobile(scene, origins[2], load),
  levelSide(scene, origins[3], load),
  levelClimb(scene, origins[4]),
  levelCollect(scene, origins[5]),
  levelContact(scene, origins[6]),
];
const TOTAL_XP = levels.reduce((s, l) => s + l.xp, 0);
const robot = createRobot();
scene.add(robot.root);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.45, 1.45);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---- Viewport ----
const view = { narrow: false, k: 1 };
let roam = null;
let tops = [];
let heights = [];
function applyViewport() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloom.resolution.set(w, h);
  view.narrow = w / h < 0.9;
  camera.aspect = w / h;
  camera.fov = view.narrow ? 50 : 34;
  view.k = view.narrow ? THREE.MathUtils.clamp(1.05 / camera.aspect, 1, 2.3) : 1;
  // Desktop: push the scene right of the text card. Phones: lift it above the bottom card.
  if (view.narrow) camera.setViewOffset(w, h, 0, h * 0.17, w, h);
  else camera.setViewOffset(w, h, -w * 0.17, 0, w, h);
  if (roam?.active) camera.clearViewOffset();
  camera.updateProjectionMatrix();
  tops = sections.map(s => s.offsetTop);
  heights = sections.map(s => s.offsetHeight);
}
applyViewport();
window.addEventListener('resize', applyViewport);

const pointer = new THREE.Vector2();
const pointerTarget = new THREE.Vector2();
window.addEventListener('pointermove', e => pointerTarget.set((e.clientX / window.innerWidth - 0.5) * 2, (e.clientY / window.innerHeight - 0.5) * 2));

// ---- Progress model ----
// t: progress through a level's own section. tr: the jetpack flight into a level, which happens while its card scrolls in.
function progress(y) {
  const vh = window.innerHeight;
  const t = sections.map((_, i) => clamp01((y - tops[i]) / Math.max(heights[i] - vh, 1)));
  const tr = sections.map((_, i) => (i === 0 ? 1 : clamp01((y - (tops[i] - vh)) / vh)));
  let L = 0;
  for (let i = 1; i < sections.length; i++) if (tr[i] > 0) L = i;
  return { t, tr, L };
}
const phaseA = t => seg(t, 0.03, 0.8);
const phaseC = t => seg(t, 0.8, 0.95);

function bezier(p0, p1, p2, p3, u, out) {
  const m = 1 - u;
  return out.set(0, 0, 0)
    .addScaledVector(p0, m * m * m)
    .addScaledVector(p1, 3 * m * m * u)
    .addScaledVector(p2, 3 * m * u * u)
    .addScaledVector(p3, u * u * u);
}

function camFor(j, follow) {
  const lv = levels[j];
  const look = origins[j].clone().add(lv.cam.look);
  const pos = origins[j].clone().add(lv.cam.pos);
  if (follow) {
    const rl = robot.root.position.clone().sub(origins[j]);
    const f = lv.cam.follow || 0.15;
    const fy = lv.cam.followY || 0;
    look.x += rl.x * f; pos.x += rl.x * f;
    look.y += rl.y * fy; pos.y += rl.y * fy;
  }
  if (view.k !== 1) pos.sub(look).multiplyScalar(view.k).add(look);
  return { pos, look };
}

function toast(title, sub, xp) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="toast-badge">★</span><div class="toast-text"><strong></strong><span class="toast-sub"></span></div><em></em>`;
  el.querySelector('strong').textContent = xp ? `Achievement · ${title}` : title;
  el.querySelector('.toast-sub').textContent = sub;
  el.querySelector('em').textContent = xp ? `+${xp} XP` : '';
  toasts.appendChild(el);
  // Fast scrolling can unlock several levels at once; keep the stack short.
  while (toasts.children.length > 3) toasts.firstElementChild.remove();
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 600); }, 3200);
}

// ---- Click-to-inspect ----
const picks = levels.flatMap(lv => lv.picks || []);
const pickByObject = new Map(picks.map(p => [p.object, p]));
const robotPick = { label: 'Character sheet', action: { type: 'sheet' } };
const pickTargets = [...picks.map(p => p.object), robot.root];
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const tip = $('[data-tip]');
const uiSelector = '.card, .hud, .codex, .cv-modal, .lightbox, .toast, a, button, input, textarea, label';

const shown = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
function pickAt(x, y) {
  ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  for (const hit of raycaster.intersectObjects(pickTargets, true)) {
    if (!shown(hit.object)) continue;
    let o = hit.object;
    while (o && !pickByObject.has(o) && o !== robot.root) o = o.parent;
    if (o === robot.root) return robotPick;
    if (o) return pickByObject.get(o);
  }
  return null;
}
function runPick(pick) {
  const a = pick.action;
  if (a.type === 'case') openCase(a.key, { block: a.block });
  else if (a.type === 'role') openRole(a.index);
  else if (a.type === 'sheet') openSheet();
  else if (a.type === 'message') openMessage();
}
let hoverQueued = false;
let lastPointer = null;
window.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || getMode() === 'read') return;
  lastPointer = e;
  if (hoverQueued) return;
  hoverQueued = true;
  requestAnimationFrame(() => {
    hoverQueued = false;
    const ev = lastPointer;
    const overUi = ev.target.closest?.(uiSelector) || isOpen();
    const pick = overUi ? null : pickAt(ev.clientX, ev.clientY);
    document.body.classList.toggle('is-inspecting', !!pick);
    tip.hidden = !pick;
    if (pick) {
      tip.textContent = `Inspect · ${pick.label}`;
      tip.style.transform = `translate(${ev.clientX + 16}px, ${ev.clientY + 16}px)`;
    }
  });
});
window.addEventListener('click', e => {
  if (getMode() === 'read' || isOpen() || e.target.closest(uiSelector)) return;
  const pick = pickAt(e.clientX, e.clientY);
  if (pick) {
    tip.hidden = true;
    runPick(pick);
  }
});

// ---- Loop ----
const clock = new THREE.Clock();
let sy = window.scrollY;
let shownXp = 0;
let lastL = -1;
const unlocked = new Set();
const lastA = levels.map(() => -1);
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
let camReady = false;
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const stars = scene.getObjectByName('stars');

const overlayOpen = () => isOpen()
  || document.querySelector('[data-lightbox]').getAttribute('aria-hidden') === 'false'
  || document.querySelector('[data-cv-modal]').getAttribute('aria-hidden') === 'false';
roam = createRoam({
  robot, levels, origins, picks, runPick, toast,
  isOverlayOpen: overlayOpen,
  onStop() {
    applyViewport();
    sy = window.scrollY;
    camReady = false;
  },
});
function startRoam() {
  if (getMode() === 'read') document.querySelector('[data-mode-set="play"]').click();
  hideCodex();
  roam.start(progress(sy).L);
  applyViewport();
  camReady = false;
}
document.addEventListener('click', e => { if (e.target.closest('[data-roam-start]')) startRoam(); });

function tickRoam(dt, time) {
  robot.reset();
  levels.forEach(lv => {
    lv.island.userData.tick(time);
    lv.update(null, lv.roamA ?? 1, lv.roamC ?? 0, time, dt);
  });
  const target = roam.update(dt, time);
  if (!camReady) {
    camPos.copy(target.pos);
    camLook.copy(target.look);
    camReady = true;
  } else {
    const k = 1 - Math.exp(-dt * 6);
    camPos.lerp(target.pos, k);
    camLook.lerp(target.look, k);
  }
  camera.position.copy(camPos);
  camera.lookAt(camLook);
  key.position.copy(camLook).add(tmp.set(4, 7, 5));
  key.target.position.copy(camLook);
  rim.position.copy(camLook).add(tmp.set(-3, 4, -6));
  rim.target.position.copy(camLook);
  stars.rotation.y += dt * 0.004;
  composer.render(dt);
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  if (roam.active) return tickRoam(dt, time);
  sy = reduced ? window.scrollY : sy + (window.scrollY - sy) * (1 - Math.exp(-dt * 6));
  const { t, tr, L } = progress(sy);

  robot.reset();
  levels.forEach((lv, j) => {
    lv.island.userData.tick(time);
    const active = j === L && tr[L] >= 1;
    lv.update(active ? robot : null, phaseA(t[j]), phaseC(t[j]), time, dt);
  });

  const flying = tr[L] < 1;
  if (flying) {
    const u = smooth(tr[L]);
    const p0 = origins[L - 1].clone().add(levels[L - 1].end);
    const p3 = origins[L].clone().add(levels[L].start);
    const lift = V(0, 3.4, 0);
    bezier(p0, p0.clone().add(lift), p3.clone().add(lift), p3, u, robot.root.position);
    bezier(p0, p0.clone().add(lift), p3.clone().add(lift), p3, Math.min(u + 0.02, 1), tmp);
    tmp.sub(robot.root.position);
    if (tmp.lengthSq() > 1e-6) robot.face(Math.atan2(tmp.x, tmp.z), dt, 12);
    robot.fly(Math.min(1, tr[L] * 5, (1 - tr[L]) * 5), time);
    robot.setEyes(1);
    robot.setCharge(1);
  }

  // Camera
  let target;
  if (flying) {
    const A = camFor(L - 1, false);
    const B = camFor(L, false);
    const e = smooth(tr[L]);
    target = { pos: A.pos.lerp(B.pos, e), look: A.look.lerp(B.look, e) };
    tmp2.copy(robot.root.position).add(V(0, 0.8, 0));
    target.look.lerp(tmp2, Math.sin(e * Math.PI) * 0.55);
    target.pos.y += Math.sin(e * Math.PI) * 1.4;
  } else {
    target = camFor(L, true);
  }
  if (!camReady || reduced) {
    camPos.copy(target.pos);
    camLook.copy(target.look);
    camReady = true;
  } else {
    const k = 1 - Math.exp(-dt * 5);
    camPos.lerp(target.pos, k);
    camLook.lerp(target.look, k);
  }
  pointer.lerp(pointerTarget, 1 - Math.exp(-dt * 3));
  camera.position.copy(camPos).add(tmp.set(pointer.x * 0.3, -pointer.y * 0.15, 0));
  camera.lookAt(camLook);

  key.position.copy(camLook).add(tmp.set(4, 7, 5));
  key.target.position.copy(camLook);
  rim.position.copy(camLook).add(tmp.set(-3, 4, -6));
  rim.target.position.copy(camLook);
  stars.rotation.y += dt * 0.004;

  // HUD
  const hudL = L > 0 && tr[L] < 0.5 ? L - 1 : L;
  if (hudL !== lastL) {
    lastL = hudL;
    hudLvl.textContent = `LVL ${hudL + 1}/${levels.length}`;
    hudName.textContent = levels[hudL].title;
  }
  const xp = levels.reduce((s, lv, j) => s + lv.xp * clamp01(t[j] / 0.95), 0);
  shownXp += (xp - shownXp) * (1 - Math.exp(-dt * 8));
  const xpRound = Math.round(shownXp);
  xpText.textContent = `${xpRound.toLocaleString()} XP`;
  xpBar.style.width = `${(shownXp / TOTAL_XP) * 100}%`;
  if (totalXpEl) totalXpEl.textContent = xpRound.toLocaleString();

  levels.forEach((lv, j) => {
    const a = phaseA(t[j]);
    if (Math.abs(a - lastA[j]) > 0.0005) {
      lastA[j] = a;
      objBars[j].style.width = `${a * 100}%`;
      questLists[j].forEach((li, k) => {
        const thr = lv.quests[k];
        const done = a >= thr - 1e-4;
        const prev = k === 0 ? 0 : lv.quests[k - 1];
        li.classList.toggle('is-done', done);
        li.classList.toggle('is-active', !done && a > 0 && a >= prev - 1e-4);
      });
    }
    if (phaseC(t[j]) >= 1 && !unlocked.has(j)) {
      unlocked.add(j);
      toast(lv.achievement[0], lv.achievement[1], lv.xp);
    }
  });

  composer.render(dt);
}

// Read mode hides the canvas, so stop rendering entirely; resume from the saved scroll position.
function setRunning(on) {
  if (on) {
    applyViewport();
    sy = window.scrollY;
    camReady = false;
    clock.getDelta();
    renderer.setAnimationLoop(tick);
  } else {
    roam.stop();
    renderer.setAnimationLoop(null);
    tip.hidden = true;
    document.body.classList.remove('is-inspecting');
  }
}
window.addEventListener('pq:mode', e => setRunning(e.detail === 'play'));
setRunning(getMode() === 'play');

window.__game = { scene, camera, robot, roam, state: () => ({ ...progress(sy), sy }), snap: () => { sy = window.scrollY; camReady = false; },
  // Debug: advance free-roam without rAF (hidden test panes throttle it to zero).
  stepRoam: (frames = 60, dt = 1 / 60) => { for (let i = 0; i < frames; i++) tickRoam(dt, clock.elapsedTime + i * dt); },
};
