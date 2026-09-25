import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { COLORS, physical, glow, lerp, seg, smooth, easeOutBack, easeInCubic, clamp01, textPanel, labelMesh, castAll, rng, hitBox } from './util.js';
import { WEB, MOBILE, EXPERIENCE, EXPLORATORY } from './content.js';
import { asset } from './paths.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

const jointMat = physical(COLORS.joint, { roughness: 0.5, clearcoat: 0.3 });
const shellMat = physical(COLORS.cream);
const bodyMat = physical(COLORS.peri);
const deckMat = new THREE.MeshStandardMaterial({ color: COLORS.navy, roughness: 0.85 });
const innerDeckMat = new THREE.MeshStandardMaterial({ color: 0x2f3448, roughness: 0.9 });
const rockMat = new THREE.MeshStandardMaterial({ color: COLORS.rock, roughness: 1, flatShading: true });

function island(scene, origin, radius = 3.4) {
  const g = new THREE.Group();
  g.position.copy(origin);
  scene.add(g);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.97, 0.4, 72), deckMat);
  deck.position.y = -0.2;
  deck.receiveShadow = true;
  g.add(deck);
  const inner = new THREE.Mesh(new THREE.CircleGeometry(radius - 0.35, 72), innerDeckMat);
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.002;
  inner.receiveShadow = true;
  g.add(inner);
  const rock = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.96, 3.4, 9), rockMat);
  rock.rotation.x = Math.PI;
  rock.position.y = -2.1;
  g.add(rock);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.01, 0.03, 8, 160), glow(COLORS.peri, 1.3));
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  const r = rng(Math.round(origin.x * 13 + 7));
  const pebbles = [];
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + r() * 0.25, 0), rockMat);
    const a = r() * Math.PI * 2;
    p.position.set(Math.cos(a) * (radius + 0.8 + r() * 1.2), -0.9 - r() * 1.8, Math.sin(a) * (radius + 0.8 + r() * 1.2));
    p.userData.base = p.position.y;
    p.userData.phase = r() * 10;
    g.add(p);
    pebbles.push(p);
  }
  g.userData.tick = time => pebbles.forEach(p => { p.position.y = p.userData.base + Math.sin(time * 0.8 + p.userData.phase) * 0.12; p.rotation.y = time * 0.2 + p.userData.phase; });
  return g;
}

function place(robot, isl, local) {
  robot.root.position.copy(isl.position).add(local);
}

// Moves the robot between two island-local points; walks on the ground, hovers when either end is in the air.
function travel(robot, isl, from, to, u, time, dt) {
  const e = smooth(u);
  const p = new THREE.Vector3().lerpVectors(from, to, e);
  place(robot, isl, p);
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const flat = Math.hypot(dx, dz);
  if (u > 0 && u < 1 && flat > 0.02) robot.face(Math.atan2(dx, dz), dt);
  const airborne = from.y > 0.02 || to.y > 0.02;
  if (u > 0 && u < 1) {
    if (airborne) robot.hover(1, time);
    else robot.walk(flat * e * 9, 1);
  } else if (airborne && p.y > 0.02) {
    robot.hover(1, time);
  }
}

// ---------- Level 1: Boot ----------
export function levelBoot(scene, origin) {
  const isl = island(scene, origin);
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.82, 0.07, 48), jointMat);
  pad.position.y = 0.035;
  isl.add(pad);
  const padRing = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.03, 8, 64), glow(COLORS.cream, 0.4));
  padRing.rotation.x = Math.PI / 2;
  padRing.position.y = 0.075;
  isl.add(padRing);
  const box = new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.75, 0.45, 3, 0.06), jointMat);
  box.position.set(1.8, 0.375, -1.2);
  isl.add(box);
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.5), glow(COLORS.peri, 1.6));
  stripe.position.set(1.8, 0.4, -0.97);
  isl.add(stripe);
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(1.6, 0.06, -1.0), V(1.2, 0.03, -0.7), V(0.8, 0.03, -0.35), V(0.5, 0.06, -0.1)]), 32, 0.025, 8),
    jointMat
  );
  isl.add(cable);
  const holo = labelMesh(['SYSTEM BOOT', '0%'], 1.9, 0.95, { bg: 'rgba(179,172,255,0.14)', fg: '#dcd8ff', sizes: [120, 150] });
  holo.position.set(-1.75, 1.95, -1.3);
  holo.rotation.y = 0.35;
  isl.add(holo);
  castAll(isl);

  const start = V(0, 0.07, 0.05);
  return {
    island: isl,
    xp: 100,
    title: 'Boot Sequence',
    achievement: ['Online', 'Designer booted'],
    quests: [0.35, 0.55, 0.8, 1],
    start,
    end: start,
    cam: { pos: V(0.4, 1.8, 5.4), look: V(0, 0.85, 0) },
    update(robot, a, c, time, dt) {
      const charge = seg(a, 0, 0.35);
      padRing.material.emissiveIntensity = 0.4 + charge * 2.2;
      holo.userData.panel.draw([a >= 1 ? 'ONLINE' : 'SYSTEM BOOT', `${Math.round(a * 100)}%`], [120, 150]);
      if (!robot) return;
      place(robot, isl, start);
      robot.face(0, dt);
      const stand = smooth(seg(a, 0.55, 0.8));
      robot.slump(1 - stand);
      robot.setCharge(charge);
      let eyes = 0.04;
      if (a >= 0.55) eyes = 1;
      else if (a > 0.35) eyes = hash(Math.floor(time * 14)) < seg(a, 0.35, 0.55) ? 1 : 0.05;
      robot.setEyes(eyes, c > 0 ? 'happy' : 'normal');
      if (a >= 0.55 && c === 0) robot.blink(time);
      if (stand > 0.98) robot.breathe(time);
      robot.head.rotation.y = Math.sin(seg(a, 0.6, 0.8) * Math.PI * 2) * 0.55;
      const w = Math.max(seg(a, 0.8, 0.9), c > 0 ? 1 : 0);
      if (w > 0) robot.wave(time, smooth(w));
    },
  };
}

// ---------- Level 2: Build the web ----------
export function levelWeb(scene, origin, load) {
  const isl = island(scene, origin);
  const wall = new THREE.Mesh(new RoundedBoxGeometry(5.5, 3.0, 0.2, 3, 0.08), jointMat);
  wall.position.set(0, 1.7, -1.62);
  isl.add(wall);
  // Build order matches WEB: bottom row first, then the top row.
  const FR = [V(-0.86, 1.0, -1.45), V(0.86, 1.0, -1.45), V(-1.72, 2.36, -1.45), V(0, 2.36, -1.45), V(1.72, 2.36, -1.45)];
  const W = 1.5;
  const H = 0.94;
  const video = document.createElement('video');
  Object.assign(video, { src: asset(WEB[0].video), muted: true, loop: true, playsInline: true, preload: 'auto' });
  const videoTex = new THREE.VideoTexture(video);
  videoTex.colorSpace = THREE.SRGBColorSpace;
  const picks = [];
  const frames = FR.map((pos, k) => {
    const g = new THREE.Group();
    g.position.copy(pos);
    isl.add(g);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.72, 1.22), glow(COLORS.peri, 0.12));
    halo.position.z = -0.05;
    g.add(halo);
    const back = new THREE.Mesh(new RoundedBoxGeometry(1.62, 1.12, 0.06, 3, 0.04), new THREE.MeshStandardMaterial({ color: 0x14161d, roughness: 0.6 }));
    g.add(back);
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(1.52, 0.08), new THREE.MeshBasicMaterial({ color: 0x353a50 }));
    bar.position.set(0, 0.51, 0.035);
    g.add(bar);
    [0xff8a7a, 0xecdfa8, 0xb3acff].forEach((col, i) => {
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.018, 12), new THREE.MeshBasicMaterial({ color: col }));
      dot.position.set(-0.7 + i * 0.055, 0.51, 0.04);
      g.add(dot);
    });
    const tex = load(WEB[k].tex);
    const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    const tiles = [];
    for (let j = 0; j < 12; j++) {
      const cx = j % 4;
      const cy = Math.floor(j / 4);
      const geo = new THREE.PlaneGeometry(W / 4, H / 3);
      const u0 = cx / 4, u1 = (cx + 1) / 4, v0 = cy / 3, v1 = (cy + 1) / 3;
      geo.setAttribute('uv', new THREE.Float32BufferAttribute([u0, v1, u1, v1, u0, v0, u1, v0], 2));
      const t = new THREE.Mesh(geo, mat);
      t.position.set(-W / 2 + (cx + 0.5) * (W / 4), -0.04 - H / 2 + (cy + 0.5) * (H / 3), 0.04);
      t.scale.setScalar(0.0001);
      g.add(t);
      tiles.push(t);
    }
    const hit = hitBox(1.62, 1.12, 0.14);
    g.add(hit);
    picks.push({ object: hit, label: WEB[k].name, action: { type: 'case', key: WEB[k].key } });
    return { halo, tiles, mat, tex };
  });
  castAll(isl);
  const start = V(0, 0, 0.9);
  const work = k => V(FR[k].x, Math.max(0, FR[k].y - 1.06), -0.66);
  const n = frames.length;
  let videoOn = false;

  return {
    island: isl,
    xp: 450,
    title: 'Build the Web',
    achievement: ['Full stack of screens', `${n} websites shipped`],
    quests: WEB.map((_, k) => (k + 1) / n),
    picks,
    start,
    end: start,
    cam: { pos: V(0.2, 2.35, 8.3), look: V(0, 1.5, -0.6), follow: 0.3 },
    update(robot, a, c, time, dt) {
      frames.forEach((f, k) => {
        const build = seg(seg(a, k / n, (k + 1) / n), 0.3, 1);
        f.tiles.forEach((t, j) => {
          const s = easeOutBack(clamp01(build * 13 - j));
          t.visible = s > 0.001;
          t.scale.setScalar(Math.max(s, 0.0001));
        });
        if (k === 0 && (build >= 1) !== videoOn) {
          // The finished RiverLens screen comes alive with the real product-tour recording.
          videoOn = build >= 1;
          f.mat.map = videoOn ? videoTex : f.tex;
          f.mat.needsUpdate = true;
          if (videoOn) video.play().catch(() => {});
          else video.pause();
        }
        const active = a > k / n && build < 1;
        f.halo.material.emissive.setHex(build >= 1 ? COLORS.cream : COLORS.peri);
        f.halo.material.emissiveIntensity = build >= 1 ? 1.0 : active ? 0.5 + Math.sin(time * 5) * 0.25 : 0.12;
      });
      if (!robot) return;
      robot.setEyes(1, c > 0 ? 'happy' : 'normal');
      robot.setCharge(a);
      if (c > 0) {
        travel(robot, isl, work(n - 1), start, seg(c, 0, 0.6), time, dt);
        if (c >= 0.6) {
          robot.face(0, dt);
          robot.cheer(time, smooth(seg(c, 0.6, 0.8)));
        }
        return;
      }
      const k = Math.min(n - 1, Math.floor(a * n));
      const sub = seg(a, k / n, (k + 1) / n);
      if (a <= 0) {
        place(robot, isl, start);
        robot.face(0, dt);
        robot.breathe(time);
        robot.blink(time);
      } else if (sub < 0.3) {
        travel(robot, isl, k === 0 ? start : work(k - 1), work(k), seg(sub, 0, 0.3), time, dt);
      } else {
        place(robot, isl, work(k));
        robot.face(Math.PI, dt);
        robot.hammer(seg(sub, 0.3, 1) * 16 * Math.PI, 1);
        if (work(k).y > 0) robot.hover(1, time);
      }
    },
  };
}

// ---------- Level 3: Launch the apps ----------
export function levelMobile(scene, origin, load) {
  const isl = island(scene, origin);
  const XS = [-1.3, 0, 1.3];
  const picks = [];
  const phones = MOBILE.map((app, k) => {
    const x = XS[k];
    const padG = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.12, 40), jointMat);
    padG.position.set(x, 0.06, -1.25);
    isl.add(padG);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.022, 8, 48), glow(COLORS.peri, 0.5));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 0.125, -1.25);
    isl.add(ring);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 1.4, 32, 1, true), new THREE.MeshBasicMaterial({ color: COLORS.peri, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.set(x, 0.82, -1.25);
    isl.add(beam);
    const mat = new THREE.MeshBasicMaterial({ map: load(app.tex), transparent: true, alphaTest: 0.02, toneMapped: false, side: THREE.DoubleSide });
    const phone = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.96), mat);
    isl.add(phone);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 12), glow(COLORS.flame, 3));
    flame.rotation.x = Math.PI;
    flame.position.set(0, -0.62, 0);
    phone.add(flame);
    const hit = hitBox(0.5, 1.0, 0.12);
    phone.add(hit);
    picks.push({ object: hit, label: app.name, action: { type: 'case', key: app.key } });
    // Feature screens that orbit the launched app.
    const orbit = new THREE.Group();
    isl.add(orbit);
    const cards = app.orbit.map(name => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: load(`tex/${name}.jpg`), toneMapped: false }));
      orbit.add(s);
      picks.push({ object: s, label: app.name, action: { type: 'case', key: app.key } });
      return s;
    });
    return { x, phone, mat, ring, beam, flame, orbit, cards, rest: V(x, 0.03, 1.02), slot: V(x, 1.72, -1.25), release: null };
  });
  castAll(isl);
  const start = V(-2.35, 0, 0.35);
  const pick = k => V(XS[k], 0, 0.38);
  const endPos = V(2.25, 0, 0.6);
  const hands = new THREE.Vector3();
  const n = phones.length;

  return {
    island: isl,
    xp: 300,
    title: 'Launch the Apps',
    achievement: ['Liftoff', `${n} apps in orbit`],
    quests: MOBILE.map((_, k) => (k + 1) / n),
    picks,
    start,
    end: endPos,
    cam: { pos: V(0.1, 2.3, 7.6), look: V(0, 1.15, -0.3), follow: 0.25 },
    update(robot, a, c, time, dt) {
      const k = Math.min(n - 1, Math.floor(a * n));
      phones.forEach((p, i) => {
        const u = seg(a, i / n, (i + 1) / n);
        const lit = seg(u, 0.8, 1);
        p.mat.color.setScalar(lerp(0.14, 1, lit));
        p.ring.material.emissiveIntensity = 0.5 + lit * 2;
        p.beam.material.opacity = lit * (0.12 + Math.sin(time * 3 + i) * 0.04);
        p.flame.visible = false;
        const held = robot && i === k && u > 0.365 && u < 0.62 && c === 0;
        if (u >= 0.62) {
          const f = seg(u, 0.62, 0.8);
          p.phone.position.lerpVectors(p.release || p.rest, p.slot, smooth(f));
          p.phone.position.y += Math.sin(f * Math.PI) * 0.7 + (f >= 1 ? Math.sin(time * 1.6 + i) * 0.05 : 0);
          p.phone.rotation.set(0, f >= 1 ? Math.sin(time * 0.9 + i) * 0.25 : 0, 0);
          p.flame.visible = f > 0 && f < 1;
          if (p.flame.visible) p.flame.scale.y = 0.8 + Math.sin(time * 40) * 0.2;
        } else if (!held) {
          p.phone.position.copy(p.rest);
          p.phone.rotation.set(-Math.PI / 2, 0, 0);
          p.release = null;
        }
        p.orbit.visible = lit > 0;
        if (lit > 0) {
          p.orbit.position.copy(p.slot);
          p.orbit.position.y += Math.sin(time * 1.6 + i) * 0.05;
          const spin = time * 0.35 + i * 1.3;
          p.cards.forEach((card, j) => {
            const ang = spin + (j / p.cards.length) * Math.PI * 2;
            const s = easeOutBack(clamp01(lit * 1.8 - j * 0.15));
            card.position.set(Math.cos(ang) * 0.52, 0.05 + Math.sin(ang * 2 + i) * 0.08, Math.sin(ang) * 0.52);
            card.scale.set(Math.max(0.19 * s, 1e-4), Math.max(0.41 * s, 1e-4), 1);
          });
        }
      });
      if (!robot) return;
      robot.setEyes(1, c > 0 ? 'happy' : 'normal');
      robot.setCharge(a);
      if (c > 0) {
        travel(robot, isl, pick(n - 1), endPos, seg(c, 0, 0.5), time, dt);
        if (c >= 0.5) {
          robot.face(0, dt);
          robot.cheer(time, smooth(seg(c, 0.5, 0.7)));
        }
        return;
      }
      if (a <= 0) {
        place(robot, isl, start);
        robot.face(0.6, dt);
        robot.breathe(time);
        robot.blink(time);
        return;
      }
      const u = seg(a, k / n, (k + 1) / n);
      const p = phones[k];
      if (u < 0.28) {
        travel(robot, isl, k === 0 ? start : pick(k - 1), pick(k), seg(u, 0, 0.28), time, dt);
        return;
      }
      place(robot, isl, pick(k));
      robot.face(0, dt);
      if (u < 0.45) {
        const r = seg(u, 0.28, 0.45);
        robot.reach(Math.sin(r * Math.PI));
        if (r > 0.5) {
          robot.handWorld(hands).sub(isl.position);
          p.phone.position.copy(hands).add(V(0, 0.02, 0.14));
          p.phone.rotation.set(-Math.PI / 2 * (1 - smooth(seg(r, 0.5, 1)) * 0.4), 0, 0);
        }
      } else if (u < 0.62) {
        const l = seg(u, 0.45, 0.62);
        robot.liftOverhead(smooth(l));
        robot.handWorld(hands).sub(isl.position);
        p.phone.position.copy(hands).add(V(0, 0.3, 0.05));
        p.phone.rotation.set(-Math.PI / 2 * 0.6 * (1 - smooth(l)), 0, 0);
        p.release = p.phone.position.clone();
      } else {
        const d = seg(u, 0.62, 0.9);
        robot.liftOverhead(1 - smooth(d));
        robot.head.rotation.x = u > 0.8 ? -0.35 + Math.sin(seg(u, 0.8, 1) * Math.PI * 4) * 0.12 : -0.4;
      }
    },
  };
}

// ---------- Level 4: Side quests (exploratory work) ----------
export function levelSide(scene, origin, load) {
  const isl = island(scene, origin);
  const center = V(0, 0, 0.7);
  const n = EXPLORATORY.length;
  const picks = [];
  const chests = EXPLORATORY.map((p, k) => {
    const th = lerp(-1.2, 1.2, k / (n - 1));
    const pos = V(Math.sin(th) * 2.35, 0, 0.35 - Math.cos(th) * 2.0);
    const g = new THREE.Group();
    g.position.copy(pos);
    g.rotation.y = Math.atan2(center.x - pos.x, center.z - pos.z);
    isl.add(g);
    const base = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.32, 0.36, 3, 0.04), bodyMat);
    base.position.y = 0.16;
    g.add(base);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.035, 0.38), glow(COLORS.cream, 0.4));
    trim.position.y = 0.31;
    g.add(trim);
    const hinge = new THREE.Group();
    hinge.position.set(0, 0.33, -0.19);
    g.add(hinge);
    const lid = new THREE.Mesh(new RoundedBoxGeometry(0.52, 0.12, 0.38, 3, 0.05), shellMat);
    lid.position.set(0, 0.06, 0.19);
    hinge.add(lid);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 1.5, 24, 1, true), new THREE.MeshBasicMaterial({ color: COLORS.cream, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 1.05;
    g.add(beam);
    const cw = p.wide ? 0.84 : 0.4;
    const ch = p.wide ? 0.58 : 0.87;
    const card = new THREE.Sprite(new THREE.SpriteMaterial({ map: load(`tex/${p.tex}.jpg`), toneMapped: false }));
    isl.add(card);
    const panel = textPanel({ w: 720, h: 190, bg: 'rgba(18,20,23,0.82)', fg: '#f3f2ee', radius: 60 });
    panel.draw([p.name, p.type], [66, 46]);
    const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: panel.texture, toneMapped: false, transparent: true, depthWrite: false }));
    tag.scale.set(0.78, 0.2, 1);
    isl.add(tag);
    const hit = hitBox(0.6, 0.5, 0.5);
    hit.position.y = 0.25;
    g.add(hit);
    const action = { type: 'case', key: 'exploratory', block: p.block };
    picks.push({ object: hit, label: p.name, action }, { object: card, label: p.name, action });
    const stand = pos.clone().add(center.clone().sub(pos).setY(0).normalize().multiplyScalar(0.62));
    return { pos, hinge, trim, beam, card, tag, cw, ch, stand };
  });
  castAll(isl);
  const start = V(0, 0, 1.3);

  return {
    island: isl,
    xp: 300,
    title: 'Side Quests',
    achievement: ['Explorer', `${n} side quests cleared`],
    quests: EXPLORATORY.map((_, k) => (k + 0.85) / n),
    picks,
    start,
    end: start,
    cam: { pos: V(-0.7, 3.0, 8.4), look: V(-0.7, 1.05, -0.6), follow: 0.15 },
    update(robot, a, c, time, dt) {
      chests.forEach((ch, k) => {
        const u = seg(a, k / n, (k + 1) / n);
        const open = smooth(seg(u, 0.35, 0.55));
        ch.hinge.rotation.x = -open * 1.9;
        ch.trim.material.emissiveIntensity = 0.4 + open * 1.4;
        const rise = smooth(seg(u, 0.5, 0.85));
        const s = Math.max(easeOutBack(rise), 1e-4);
        ch.card.visible = rise > 0;
        ch.card.position.copy(ch.pos);
        ch.card.position.y = 0.45 + rise * 0.95 + (rise >= 1 ? Math.sin(time * 1.5 + k) * 0.04 : 0);
        ch.card.scale.set(ch.cw * s, ch.ch * s, 1);
        ch.tag.visible = rise > 0.6;
        ch.tag.position.set(ch.pos.x, ch.card.position.y - (ch.ch * s) / 2 - 0.15, ch.pos.z + 0.02);
        ch.tag.material.opacity = seg(rise, 0.6, 1);
        ch.beam.material.opacity = open * 0.16 * (1 - rise * 0.6);
      });
      if (!robot) return;
      robot.setEyes(1, c > 0 ? 'happy' : 'normal');
      robot.setCharge(a);
      if (c > 0) {
        travel(robot, isl, chests[n - 1].stand, start, seg(c, 0, 0.5), time, dt);
        if (c >= 0.5) {
          robot.face(0, dt);
          robot.cheer(time, smooth(seg(c, 0.5, 0.7)));
        }
        return;
      }
      if (a <= 0) {
        place(robot, isl, start);
        robot.face(0, dt);
        robot.breathe(time);
        robot.blink(time);
        return;
      }
      const k = Math.min(n - 1, Math.floor(a * n));
      const u = seg(a, k / n, (k + 1) / n);
      const ch = chests[k];
      if (u < 0.35) {
        travel(robot, isl, k === 0 ? start : chests[k - 1].stand, ch.stand, seg(u, 0, 0.35), time, dt);
        return;
      }
      place(robot, isl, ch.stand);
      robot.face(Math.atan2(ch.pos.x - ch.stand.x, ch.pos.z - ch.stand.z), dt);
      if (u < 0.55) {
        robot.reach(Math.sin(seg(u, 0.35, 0.55) * Math.PI));
      } else {
        robot.breathe(time, 0.5);
        robot.head.rotation.x = -0.45 * smooth(seg(u, 0.55, 0.75));
        if (u > 0.8) robot.cheer(time, smooth(seg(u, 0.8, 0.92)) * 0.6);
      }
    },
  };
}

// ---------- Level 5: Career climb ----------
export function levelClimb(scene, origin) {
  const isl = island(scene, origin);
  const roles = EXPERIENCE.map(r => r.short);
  const S = roles.map((_, k) => V(-1.9 + k * 0.95, 0.5 + k * 0.62, -0.5));
  const picks = [];
  const steps = S.map((pos, k) => {
    const step = new THREE.Mesh(new RoundedBoxGeometry(0.92, 0.26, 0.92, 3, 0.07), deckMat);
    step.position.copy(pos);
    isl.add(step);
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.04), glow(COLORS.peri, 0.2));
    strip.position.set(pos.x, pos.y - 0.1, pos.z + 0.465);
    isl.add(strip);
    const label = labelMesh(roles[k], 0.9, 0.4, { bg: 'rgba(18,20,23,0.72)', fg: '#f3f2ee', radius: 60, sizes: [88, 68] });
    label.position.set(pos.x, pos.y - 0.4, pos.z + 0.5);
    label.material.opacity = 0.35;
    isl.add(label);
    const under = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 6), rockMat);
    under.rotation.x = Math.PI;
    under.position.set(pos.x, pos.y - 0.38, pos.z);
    isl.add(under);
    const hit = hitBox(0.95, 0.9, 1.0);
    hit.position.set(pos.x, pos.y - 0.2, pos.z);
    isl.add(hit);
    picks.push({ object: hit, label: `${EXPERIENCE[k].org} · ${EXPERIENCE[k].when}`, action: { type: 'role', index: k } });
    return { strip, label, top: V(pos.x, pos.y + 0.13, pos.z) };
  });
  const flagG = new THREE.Group();
  const top = steps[4].top;
  flagG.position.set(top.x + 0.32, top.y, top.z - 0.28);
  isl.add(flagG);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.1, 8), shellMat);
  pole.position.y = 0.55;
  flagG.add(pole);
  const cloth = labelMesh(['RiverLens', 'now'], 0.6, 0.36, { bg: '#b3acff', fg: '#14161a', radius: 10, sizes: [120, 80] });
  cloth.position.set(0.31, 0.9, 0);
  flagG.add(cloth);
  castAll(isl);
  const start = V(-2.75, 0, -0.5);

  return {
    island: isl,
    xp: 450,
    title: 'Career Climb',
    achievement: ['Summit', 'Reached RiverLens'],
    quests: [0.8 / 5, 1.8 / 5, 2.8 / 5, 3.8 / 5, 4.8 / 5],
    picks,
    surfaces: steps.map(st => ({ pos: st.top, half: 0.47 })),
    roamC: 1,
    start,
    end: top,
    cam: { pos: V(0.1, 2.9, 9.2), look: V(0, 1.8, -0.5), follow: 0.35, followY: 0.35 },
    update(robot, a, c, time, dt) {
      steps.forEach((s, k) => {
        const landed = a >= (k + 0.8) / 5;
        s.strip.material.emissive.setHex(landed ? COLORS.cream : COLORS.peri);
        s.strip.material.emissiveIntensity = landed ? 1.1 : 0.25;
        s.label.material.opacity = landed ? 1 : 0.35;
      });
      const rise = smooth(c);
      flagG.scale.set(1, Math.max(rise, 0.0001), 1);
      flagG.visible = rise > 0;
      cloth.rotation.y = Math.sin(time * 3) * 0.15;
      if (!robot) return;
      robot.setEyes(1, c > 0 ? 'happy' : 'normal');
      robot.setCharge(a);
      if (c > 0) {
        place(robot, isl, top);
        robot.face(0, dt);
        robot.cheer(time, smooth(seg(c, 0, 0.3)));
        return;
      }
      if (a <= 0) {
        place(robot, isl, start);
        robot.face(0.9, dt);
        robot.breathe(time);
        robot.blink(time);
        return;
      }
      const k = Math.min(4, Math.floor(a * 5));
      const u = seg(a, k / 5, (k + 1) / 5);
      const from = k === 0 ? start : steps[k - 1].top;
      const to = steps[k].top;
      robot.face(1.0, dt);
      if (u < 0.22) {
        place(robot, isl, from);
        robot.crouch(Math.sin(seg(u, 0, 0.22) * Math.PI * 0.5));
      } else if (u < 0.78) {
        const v = seg(u, 0.22, 0.78);
        const p = new THREE.Vector3().lerpVectors(from, to, v);
        p.y += Math.sin(v * Math.PI) * 0.9;
        place(robot, isl, p);
        robot.airborne(Math.sin(v * Math.PI));
      } else {
        place(robot, isl, to);
        robot.crouch(Math.sin(seg(u, 0.78, 1) * Math.PI) * 0.8);
      }
    },
  };
}

// ---------- Level 6: Collect the skills ----------
export function levelCollect(scene, origin) {
  const isl = island(scene, origin);
  const R = 1.5;
  const skills = ['UTM · BSc CS', 'GPA 3.7', "Dean's List", 'Bahasa Indonesia', 'English', 'Bahasa Melayu', 'Figma'];
  const orbs = skills.map((text, k) => {
    const theta = ((k + 0.6) / skills.length) * Math.PI * 2;
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), glow(k % 2 ? COLORS.peri : COLORS.cream, 2.2));
    isl.add(orb);
    const panel = textPanel({ w: 640, h: 170, bg: 'rgba(18,20,23,0.78)', fg: '#f3f2ee', radius: 60 });
    panel.draw([text], [78]);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: panel.texture, transparent: true, toneMapped: false, depthWrite: false }));
    sprite.scale.set(0.9, 0.24, 1);
    isl.add(sprite);
    return { orb, sprite, theta, base: V(R * Math.sin(theta), 0.95, R * Math.cos(theta)) };
  });
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.5, 24), jointMat);
  pedestal.position.y = 0.25;
  isl.add(pedestal);
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), physical(COLORS.peri, { emissive: COLORS.peri, emissiveIntensity: 0.2, roughness: 0.15 }));
  crystal.position.y = 1.0;
  isl.add(crystal);
  castAll(isl);
  const picks = [
    { object: crystal, label: 'Character sheet', action: { type: 'sheet' } },
    ...orbs.map(o => ({ object: o.orb, label: 'Character sheet', action: { type: 'sheet' } })),
  ];
  const start = V(0, 0, R);
  const chest = new THREE.Vector3();

  return {
    island: isl,
    xp: 250,
    title: 'Loot the Skills',
    achievement: ['Collector', '7 skills looted'],
    quests: orbs.map(o => Math.min(1, (o.theta + 0.2) / (Math.PI * 2))),
    picks,
    collectibles: orbs.map((o, k) => ({ mesh: o.orb, sprite: o.sprite, label: skills[k] })),
    roamA: 0,
    start,
    end: start,
    cam: { pos: V(0, 2.7, 7.0), look: V(0, 0.9, 0) },
    update(robot, a, c, time, dt) {
      const thetaR = a * Math.PI * 2;
      const rp = V(R * Math.sin(thetaR), 0, R * Math.cos(thetaR));
      if (robot) robot.chestWorld(chest).sub(isl.position);
      else chest.set(rp.x, 0.95, rp.z);
      let collected = 0;
      orbs.forEach((o, k) => {
        const cp = seg(thetaR, o.theta - 0.15, o.theta + 0.2);
        if (cp >= 1) collected++;
        const bob = V(o.base.x, o.base.y + Math.sin(time * 2 + k) * 0.07, o.base.z);
        o.orb.position.lerpVectors(bob, chest, easeInCubic(cp));
        o.orb.scale.setScalar(Math.max(1 - cp * 0.85, 0.0001));
        o.orb.visible = cp < 1;
        o.orb.rotation.set(time * 0.8 + k, time * 1.1, 0);
        o.sprite.position.set(bob.x, bob.y + 0.3, bob.z);
        o.sprite.material.opacity = 1 - seg(cp, 0, 0.5);
        o.sprite.visible = cp < 0.5;
      });
      crystal.rotation.y = time * 0.7;
      crystal.position.y = 1.0 + Math.sin(time * 1.4) * 0.06;
      crystal.material.emissiveIntensity = 0.15 + (collected / orbs.length) * 0.9;
      if (!robot) return;
      robot.setEyes(1, c > 0 ? 'happy' : 'normal');
      robot.setCharge(collected / orbs.length);
      place(robot, isl, rp);
      if (c > 0 || a >= 1) {
        robot.face(0, dt);
        robot.cheer(time, smooth(seg(c, 0, 0.3)));
      } else if (a <= 0) {
        robot.face(0, dt);
        robot.breathe(time);
        robot.blink(time);
      } else {
        robot.face(Math.atan2(Math.cos(thetaR), -Math.sin(thetaR)), dt, 14);
        robot.walk(thetaR * R * 7, 1.35);
        robot.torso.rotation.x = 0.22;
      }
    },
  };
}

// ---------- Level 7: Send the signal ----------
export function levelContact(scene, origin) {
  const isl = island(scene, origin);
  const consoleBase = new THREE.Mesh(new RoundedBoxGeometry(0.95, 0.82, 0.5, 3, 0.06), jointMat);
  consoleBase.position.set(1.0, 0.41, -0.95);
  isl.add(consoleBase);
  const screenPanel = textPanel({ w: 1024, h: 512, bg: '#0f1118', fg: '#ecdfa8', radius: 30 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.43), new THREE.MeshBasicMaterial({ map: screenPanel.texture, toneMapped: false }));
  screen.position.set(1.0, 1.0, -0.86);
  screen.rotation.x = -0.45;
  isl.add(screen);

  const tower = new THREE.Group();
  tower.position.set(-1.35, 0, -1.3);
  isl.add(tower);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.2, 24), jointMat);
  base.position.y = 0.1;
  tower.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.3, 12), jointMat);
  pole.position.y = 0.85;
  tower.add(pole);
  const dishPivot = new THREE.Group();
  dishPivot.position.y = 1.5;
  tower.add(dishPivot);
  const bowlPts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    bowlPts.push(new THREE.Vector2(0.02 + t * 0.72, t * t * 0.28));
  }
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlPts, 40), physical(COLORS.cream, { side: THREE.DoubleSide }));
  dishPivot.add(bowl);
  const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 8), jointMat);
  horn.position.y = 0.21;
  dishPivot.add(horn);
  const hornTip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), glow(COLORS.peri, 1));
  hornTip.position.y = 0.44;
  dishPivot.add(hornTip);

  const envelope = new THREE.Group();
  const envBody = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.25, 0.03), physical(COLORS.cream));
  envelope.add(envBody);
  const flapShape = new THREE.Shape([new THREE.Vector2(-0.19, 0.125), new THREE.Vector2(0.19, 0.125), new THREE.Vector2(0, -0.04)]);
  const flap = new THREE.Mesh(new THREE.ShapeGeometry(flapShape), new THREE.MeshBasicMaterial({ color: COLORS.peri, toneMapped: false }));
  flap.position.z = 0.017;
  envelope.add(flap);
  const trail = [];
  for (let i = 0; i < 10; i++) {
    const t = new THREE.Mesh(new THREE.SphereGeometry(0.05 - i * 0.004, 8, 6), glow(i % 2 ? COLORS.peri : COLORS.cream, 3));
    isl.add(t);
    trail.push(t);
  }
  isl.add(envelope);

  const count = 160;
  const confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.05, 0.09), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), count);
  const r = rng(99);
  const pieces = [];
  const palette = [new THREE.Color(COLORS.cream), new THREE.Color(COLORS.peri), new THREE.Color(0xffffff), new THREE.Color(0xff9a8a)];
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2;
    const sp = 1.2 + r() * 2.4;
    pieces.push({ v: V(Math.cos(a) * sp * 0.6, 3 + r() * 3.2, Math.sin(a) * sp * 0.6), spin: V(r() * 8, r() * 8, r() * 8) });
    confetti.setColorAt(i, palette[i % palette.length]);
  }
  confetti.frustumCulled = false;
  isl.add(confetti);
  const dummy = new THREE.Object3D();

  castAll(isl);
  confetti.castShadow = false;
  const consoleHit = hitBox(1.0, 1.2, 0.7);
  consoleHit.position.set(1.0, 0.6, -0.9);
  const dishHit = hitBox(1.6, 2.4, 1.4);
  dishHit.position.set(-1.35, 1.2, -1.3);
  isl.add(consoleHit, dishHit);
  const picks = [
    { object: consoleHit, label: 'Send a message', action: { type: 'message' } },
    { object: dishHit, label: 'Send a message', action: { type: 'message' } },
  ];
  const start = V(0, 0, 0.9);
  const desk = V(1.0, 0, -0.3);
  const message = "hi mahfudh, let's build something";
  const launchFrom = V(-1.35, 1.95, -1.3);
  const launchTo = V(-5, 13, -16);

  return {
    island: isl,
    xp: 150,
    title: 'Send the Signal',
    achievement: ['Signal sent', 'Mission complete'],
    quests: [0.55, 0.75, 1],
    picks,
    start,
    end: desk,
    cam: { pos: V(0.2, 2.1, 6.8), look: V(0, 1.25, -0.4) },
    update(robot, a, c, time, dt) {
      const typed = Math.floor(seg(a, 0.22, 0.55) * message.length);
      const caret = Math.floor(time * 2) % 2 ? '_' : ' ';
      screenPanel.draw([a >= 0.75 ? 'TRANSMITTING' : `> ${message.slice(0, typed)}${caret}`, a >= 0.75 ? '▲ ▲ ▲' : ''], [a >= 0.75 ? 88 : 46, 60]);
      const aim = smooth(seg(a, 0.55, 0.75));
      dishPivot.rotation.x = lerp(1.25, 0.35, aim);
      dishPivot.rotation.z = lerp(0, -0.3, aim);
      hornTip.material.emissiveIntensity = 1 + aim * 3 + (aim >= 1 ? Math.sin(time * 10) : 0);
      const fly = seg(a, 0.75, 1);
      envelope.visible = fly > 0 && fly < 1;
      const pathAt = t => {
        const p = new THREE.Vector3().lerpVectors(launchFrom, launchTo, easeInCubic(t));
        p.x += Math.sin(t * Math.PI) * 1.5;
        return p;
      };
      envelope.position.copy(pathAt(fly));
      envelope.scale.setScalar(Math.max(1 - fly * 0.7, 0.0001));
      envelope.rotation.set(-0.4, time * 2, Math.sin(time * 5) * 0.3);
      trail.forEach((t, i) => {
        const tt = fly - (i + 1) * 0.025;
        t.visible = fly > 0 && fly < 1 && tt > 0;
        if (t.visible) t.position.copy(pathAt(tt));
      });
      confetti.visible = c > 0;
      if (c > 0) {
        const s = c * 1.7;
        pieces.forEach((p, i) => {
          dummy.position.set(p.v.x * s, 2.0 + p.v.y * s - 2.6 * s * s, p.v.z * s);
          dummy.rotation.set(p.spin.x * s, p.spin.y * s, p.spin.z * s);
          dummy.updateMatrix();
          confetti.setMatrixAt(i, dummy.matrix);
        });
        confetti.instanceMatrix.needsUpdate = true;
      }
      if (!robot) return;
      robot.setEyes(1, c > 0 ? 'happy' : 'normal');
      robot.setCharge(a);
      if (c > 0) {
        place(robot, isl, desk);
        robot.face(0, dt);
        robot.wave(time, smooth(seg(c, 0, 0.25)));
        robot.wave(time, smooth(seg(c, 0, 0.25)), robot.armL);
        return;
      }
      if (a <= 0) {
        place(robot, isl, start);
        robot.face(0, dt);
        robot.breathe(time);
        robot.blink(time);
      } else if (a < 0.22) {
        travel(robot, isl, start, desk, seg(a, 0, 0.22), time, dt);
      } else if (a < 0.55) {
        place(robot, isl, desk);
        robot.face(Math.PI, dt);
        robot.type(time, 1);
      } else {
        place(robot, isl, desk);
        const toDish = Math.atan2(-1.35 - desk.x, -1.3 - desk.z);
        robot.face(toDish, dt);
        robot.armR.shoulder.rotation.x = -lerp(0.2, 2.2, aim);
        robot.head.rotation.x = -0.35 * seg(a, 0.75, 1);
        robot.breathe(time, 0.5);
      }
    },
  };
}
