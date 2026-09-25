import * as THREE from 'three';

// Free-roam: the player drives the robot around the islands. Scroll story is paused meanwhile.
const ISLAND_R = 3.3;
const GRAVITY = 14;
const JUMP_V = 5.4;
const WALK = 2.7;
const RUN = 4.6;
const JET_THRUST = 20;
const JET_MAX_UP = 2.4;
const FUEL_DRAIN = 0.28;
const FUEL_REGEN = 0.8;
const REACH = 1.9;

export function createRoam({ robot, levels, origins, picks, runPick, toast, isOverlayOpen, onStop }) {
  const root = document.documentElement;
  const ui = document.querySelector('[data-roam-ui]');
  const prompt = ui.querySelector('[data-roam-prompt]');
  const fuelBar = ui.querySelector('[data-roam-fuel]');
  const islandsEl = ui.querySelector('[data-roam-islands]');
  const orbsEl = ui.querySelector('[data-roam-orbs]');
  const joyBase = ui.querySelector('[data-joy]');
  const joyKnob = ui.querySelector('[data-joy-knob]');

  const surfaces = levels.flatMap((lv, i) => (lv.surfaces || []).map(s => ({
    x: origins[i].x + s.pos.x, z: origins[i].z + s.pos.z, top: origins[i].y + s.pos.y, half: s.half,
  })));
  const collectibles = levels.flatMap(lv => lv.collectibles || []);
  const collectMeshes = new Set(collectibles.map(c => c.mesh));
  const inspectables = picks.filter(p => !collectMeshes.has(p.object));

  const s = {
    active: false, pos: new THREE.Vector3(), vel: new THREE.Vector3(), onGround: true, air: 0,
    fuel: 1, phase: 0, lastIsland: 0, visited: new Set(), orbs: new Set(), nearest: null,
  };
  const keys = new Set();
  const joy = new THREE.Vector2();
  let jumpQueued = false;
  let touchJet = false;
  let interactQueued = false;
  const tmp = new THREE.Vector3();
  const chest = new THREE.Vector3();

  function groundAt(x, z, fromY) {
    let best = -Infinity;
    origins.forEach(o => { if (Math.hypot(x - o.x, z - o.z) < ISLAND_R && o.y <= fromY + 0.4) best = Math.max(best, o.y); });
    for (const p of surfaces) {
      if (Math.abs(x - p.x) < p.half && Math.abs(z - p.z) < p.half && p.top <= fromY + 0.4) best = Math.max(best, p.top);
    }
    return best;
  }

  function islandAt(x, z) {
    return origins.findIndex(o => Math.hypot(x - o.x, z - o.z) < ISLAND_R);
  }

  function spawn(i) {
    const lv = levels[i];
    s.pos.copy(origins[i]).add(lv.start).setY(origins[i].y);
    s.pos.z += 0.4;
    s.vel.set(0, 0, 0);
    s.onGround = true;
    s.fuel = 1;
    s.lastIsland = i;
  }

  function start(levelIndex) {
    s.active = true;
    root.classList.add('roam');
    ui.hidden = false;
    keys.clear();
    spawn(levelIndex);
    updateGoals();
  }

  function stop() {
    if (!s.active) return;
    s.active = false;
    root.classList.remove('roam');
    ui.hidden = true;
    prompt.hidden = true;
    onStop();
  }

  function updateGoals() {
    islandsEl.textContent = `${s.visited.size}/${levels.length}`;
    orbsEl.textContent = `${s.orbs.size}/${collectibles.length}`;
  }

  function input() {
    const x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) + joy.x;
    const z = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) + joy.y;
    const v = new THREE.Vector2(x, z);
    if (v.length() > 1) v.normalize();
    return v;
  }

  function update(dt, time) {
    const move = input();
    const run = keys.has('ShiftLeft') || keys.has('ShiftRight') || joy.length() > 0.92;
    const jetHeld = keys.has('Space') || touchJet;

    if (jumpQueued && s.onGround) {
      s.vel.y = JUMP_V;
      s.onGround = false;
      s.air = 0;
    }
    jumpQueued = false;

    const jetting = !s.onGround && jetHeld && s.air > 0.18 && s.fuel > 0;
    const speed = (run ? RUN : WALK) * (jetting ? 1.35 : 1);
    const accel = s.onGround ? 14 : 5;
    const k = 1 - Math.exp(-dt * accel);
    s.vel.x += (move.x * speed - s.vel.x) * k;
    s.vel.z += (move.y * speed - s.vel.z) * k;

    if (jetting) {
      s.vel.y = Math.min(s.vel.y + JET_THRUST * dt, JET_MAX_UP);
      s.fuel = Math.max(0, s.fuel - FUEL_DRAIN * dt);
    }
    s.vel.y -= GRAVITY * dt;
    if (s.onGround) s.fuel = Math.min(1, s.fuel + FUEL_REGEN * dt);

    const prevY = s.pos.y;
    s.pos.addScaledVector(s.vel, dt);
    const g = groundAt(s.pos.x, s.pos.z, prevY);
    if (s.vel.y <= 0 && s.pos.y <= g) {
      s.pos.y = g;
      s.vel.y = 0;
      s.onGround = true;
      s.air = 0;
    } else {
      s.onGround = s.onGround && s.pos.y - g < 0.05 && s.vel.y <= 0;
      if (!s.onGround) s.air += dt;
    }

    const isl = islandAt(s.pos.x, s.pos.z);
    if (isl >= 0 && s.onGround) {
      s.lastIsland = isl;
      if (!s.visited.has(isl)) {
        s.visited.add(isl);
        toast('Island discovered', levels[isl].title);
        updateGoals();
        if (s.visited.size === levels.length) toast('Cartographer', 'Every island discovered');
      }
    }
    if (s.pos.y < Math.min(...origins.map(o => o.y)) - 14) {
      spawn(s.lastIsland);
      toast('Respawned', 'Hold Space mid-jump to fly with the jetpack');
    }

    // Pose
    robot.root.position.copy(s.pos);
    const flat = Math.hypot(s.vel.x, s.vel.z);
    if (flat > 0.25) robot.face(Math.atan2(s.vel.x, s.vel.z), dt, 12);
    robot.setEyes(1, s.orbs.size === collectibles.length ? 'happy' : 'normal');
    robot.setCharge(s.fuel);
    if (s.onGround && flat > 0.2) {
      s.phase += flat * dt * 3.6;
      robot.walk(s.phase, run ? 1.35 : 1);
      if (run) robot.torso.rotation.x = 0.22;
    } else if (!s.onGround) {
      if (jetting) robot.fly(1, time);
      else robot.airborne(Math.min(1, s.air * 3));
    } else {
      robot.breathe(time);
      robot.blink(time);
    }

    // Skill orbs: touch to collect
    robot.chestWorld(chest);
    collectibles.forEach((c, i) => {
      if (s.orbs.has(i)) {
        c.mesh.visible = false;
        c.sprite.visible = false;
        return;
      }
      if (c.mesh.getWorldPosition(tmp).distanceTo(chest) < 0.7) {
        s.orbs.add(i);
        c.mesh.visible = false;
        c.sprite.visible = false;
        toast('Skill collected', c.label);
        updateGoals();
        if (s.orbs.size === collectibles.length) toast('Collector', 'All skills looted');
      }
    });

    // Nearest inspectable thing
    let best = null;
    let bestD = REACH;
    for (const p of inspectables) {
      if (!visible(p.object)) continue;
      p.object.getWorldPosition(tmp);
      if (Math.abs(tmp.y - chest.y) > 2.4) continue;
      const d = Math.hypot(tmp.x - s.pos.x, tmp.z - s.pos.z);
      if (d < bestD) { bestD = d; best = p; }
    }
    if (best !== s.nearest) {
      s.nearest = best;
      prompt.hidden = !best;
      if (best) prompt.innerHTML = `${coarse.matches ? '' : '<kbd>E</kbd> '}Inspect · ${escapeHtml(best.label)}`;
    }
    if (interactQueued && best) runPick(best);
    interactQueued = false;

    fuelBar.style.width = `${s.fuel * 100}%`;

    const narrow = window.innerWidth / window.innerHeight < 0.9;
    const back = narrow ? 9.5 : 7.2;
    return {
      pos: tmp.set(s.pos.x, s.pos.y + (narrow ? 4.4 : 3.4), s.pos.z + back).clone(),
      look: new THREE.Vector3(s.pos.x, s.pos.y + 1.0, s.pos.z - 1.2),
    };
  }

  const coarse = window.matchMedia('(pointer: coarse)');
  const visible = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
  const escapeHtml = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const typing = e => e.target.closest?.('input, textarea, select, [contenteditable]');

  window.addEventListener('keydown', e => {
    if (!s.active || typing(e)) return;
    if (e.code === 'Escape') {
      if (!isOverlayOpen()) { e.preventDefault(); stop(); }
      return;
    }
    if (isOverlayOpen()) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (e.code === 'Space' && !e.repeat) jumpQueued = true;
    if (e.code === 'KeyE' && !e.repeat) interactQueued = true;
    keys.add(e.code);
  }, true);
  window.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  // Touch controls: left joystick, jump/fly and inspect buttons.
  let joyId = null;
  const joyMove = e => {
    const r = joyBase.getBoundingClientRect();
    const max = r.width / 2;
    let dx = e.clientX - (r.left + max);
    let dy = e.clientY - (r.top + max);
    const len = Math.hypot(dx, dy);
    if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
    joy.set(dx / max, dy / max);
    joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  joyBase.addEventListener('pointerdown', e => {
    joyId = e.pointerId;
    try { joyBase.setPointerCapture(e.pointerId); } catch { /* pointer already gone; drag still tracks via pointermove */ }
    joyMove(e);
  });
  joyBase.addEventListener('pointermove', e => { if (e.pointerId === joyId) joyMove(e); });
  const joyEnd = e => { if (e.pointerId !== joyId) return; joyId = null; joy.set(0, 0); joyKnob.style.transform = ''; };
  joyBase.addEventListener('pointerup', joyEnd);
  joyBase.addEventListener('pointercancel', joyEnd);
  const jumpBtn = ui.querySelector('[data-roam-jump]');
  jumpBtn.addEventListener('pointerdown', e => { e.preventDefault(); jumpQueued = true; touchJet = true; });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => jumpBtn.addEventListener(t, () => { touchJet = false; }));
  ui.querySelector('[data-roam-act]').addEventListener('click', () => { interactQueued = true; });
  ui.querySelector('[data-roam-exit]').addEventListener('click', stop);

  return { start, stop, update, get active() { return s.active; } };
}
