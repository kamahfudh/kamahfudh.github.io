import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { COLORS, physical, glow, lerp, castAll } from './util.js';

// Faces +z. Arms/legs are pivot groups so levels can pose them directly.
// Side convention: +1 = the +x limb, -1 = the -x limb. shoulder.rotation.z = side * a raises that arm outward,
// shoulder.rotation.x = -a swings it forward; hip.rotation.x = -a swings the leg forward; knee.rotation.x = +a bends it.
export function createRobot() {
  const bodyMat = physical(COLORS.peri);
  const shellMat = physical(COLORS.cream);
  const jointMat = physical(COLORS.joint, { roughness: 0.5, clearcoat: 0.3 });
  const visorMat = physical(COLORS.visor, { roughness: 0.1, clearcoat: 1 });
  const eyeMat = glow(COLORS.eye, 3);
  const bulbMat = glow(COLORS.cream, 2.5);
  const ringOffMat = physical(COLORS.joint, { roughness: 0.4 });
  const ringOnMat = glow(COLORS.cream, 2.4);
  const flameMat = glow(COLORS.flame, 3);

  const root = new THREE.Group();
  const hips = new THREE.Group();
  root.add(hips);
  const pelvis = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.14, 0.3, 3, 0.06), jointMat);
  pelvis.position.y = 0.02;
  hips.add(pelvis);

  const torso = new THREE.Group();
  torso.position.y = 0.06;
  hips.add(torso);
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.56, 0.44, 4, 0.13), bodyMat);
  body.position.y = 0.3;
  torso.add(body);
  const belt = new THREE.Mesh(new RoundedBoxGeometry(0.64, 0.07, 0.46, 3, 0.03), shellMat);
  belt.position.y = 0.06;
  torso.add(belt);

  const ringSegments = [];
  const ringGeo = new RoundedBoxGeometry(0.05, 0.022, 0.03, 2, 0.008);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const seg = new THREE.Mesh(ringGeo, ringOffMat);
    seg.position.set(Math.sin(a) * 0.1, 0.34 + Math.cos(a) * 0.1, 0.225);
    seg.rotation.z = -a;
    torso.add(seg);
    ringSegments.push(seg);
  }
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.05, 24), glow(COLORS.peri, 1.2));
  core.position.set(0, 0.34, 0.222);
  torso.add(core);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.1, 16), jointMat);
  neck.position.y = 0.62;
  torso.add(neck);

  const head = new THREE.Group();
  head.position.y = 0.64;
  torso.add(head);
  const skull = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.46, 0.48, 4, 0.16), shellMat);
  skull.position.y = 0.25;
  head.add(skull);
  const visor = new THREE.Mesh(new RoundedBoxGeometry(0.48, 0.25, 0.04, 3, 0.08), visorMat);
  visor.position.set(0, 0.24, 0.23);
  head.add(visor);
  const eyeGeo = new THREE.CapsuleGeometry(0.034, 0.05, 4, 10);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(0.1, 0.24, 0.255);
  eyeR.position.set(-0.1, 0.24, 0.255);
  head.add(eyeL, eyeR);
  for (const side of [1, -1]) {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 20), bodyMat);
    ear.rotation.z = Math.PI / 2;
    ear.position.set(side * 0.32, 0.25, 0);
    head.add(ear);
  }
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8), jointMat);
  stalk.position.y = 0.56;
  head.add(stalk);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), bulbMat);
  bulb.position.y = 0.67;
  head.add(bulb);

  function makeArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.37, 0.48, 0);
    torso.add(shoulder);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 14), shellMat);
    shoulder.add(ball);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.13, 4, 10), jointMat);
    upper.position.y = -0.13;
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.25;
    shoulder.add(elbow);
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.12, 4, 10), bodyMat);
    fore.position.y = -0.1;
    elbow.add(fore);
    const hand = new THREE.Group();
    hand.position.y = -0.22;
    elbow.add(hand);
    const mitt = new THREE.Mesh(new THREE.SphereGeometry(0.072, 18, 12), shellMat);
    mitt.scale.set(1, 0.9, 1);
    hand.add(mitt);
    return { shoulder, elbow, hand, side };
  }
  function makeLeg(side) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.15, 0, 0);
    hips.add(hip);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.064, 0.12, 4, 10), jointMat);
    thigh.position.y = -0.1;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.22;
    hip.add(knee);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.066, 0.1, 4, 10), bodyMat);
    shin.position.y = -0.09;
    knee.add(shin);
    const foot = new THREE.Group();
    foot.position.y = -0.21;
    knee.add(foot);
    const boot = new THREE.Mesh(new RoundedBoxGeometry(0.17, 0.09, 0.26, 3, 0.04), shellMat);
    boot.position.set(0, -0.075, 0.03);
    foot.add(boot);
    return { hip, knee, foot, side };
  }
  const armL = makeArm(1);
  const armR = makeArm(-1);
  const legL = makeLeg(1);
  const legR = makeLeg(-1);

  const jet = new THREE.Group();
  jet.position.set(0, 0.36, -0.25);
  torso.add(jet);
  const flames = [];
  for (const side of [1, -1]) {
    const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.16, 4, 12), jointMat);
    tank.position.set(side * 0.11, 0, -0.04);
    jet.add(tank);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.34, 14), flameMat);
    flame.rotation.x = Math.PI;
    flame.position.set(side * 0.11, -0.3, -0.04);
    jet.add(flame);
    flames.push(flame);
  }

  const sparks = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), glow(i % 2 ? COLORS.cream : COLORS.flame, 4));
    sparks.add(s);
  }
  sparks.visible = false;
  armR.hand.add(sparks);

  castAll(root);
  for (const f of flames) f.castShadow = false;

  const limbs = [armL, armR, legL, legR];
  const tmp = new THREE.Vector3();

  const api = {
    root, hips, torso, head, armL, armR, legL, legR, jet, flames, sparks, bulb, core,
    reset() {
      root.scale.set(1, 1, 1);
      hips.position.set(0, 0.55, 0);
      hips.rotation.set(0, 0, 0);
      torso.position.y = 0.06;
      torso.rotation.set(0, 0, 0);
      head.rotation.set(0, 0, 0);
      for (const l of limbs) {
        (l.shoulder || l.hip).rotation.set(0, 0, 0);
        (l.elbow || l.knee).rotation.set(0, 0, 0);
      }
      eyeL.scale.set(1, 1, 1);
      eyeR.scale.set(1, 1, 1);
      for (const f of flames) f.scale.set(1, 0, 1);
      sparks.visible = false;
    },
    breathe(time, amount = 1) {
      torso.position.y = 0.06 + Math.sin(time * 2.2) * 0.008 * amount;
      head.rotation.z += Math.sin(time * 0.9) * 0.03 * amount;
      armL.shoulder.rotation.z += 0.08 + Math.sin(time * 2.2) * 0.02 * amount;
      armR.shoulder.rotation.z -= 0.08 + Math.sin(time * 2.2) * 0.02 * amount;
      bulb.material.emissiveIntensity = 1.6 + Math.sin(time * 3) * 0.9;
    },
    walk(phase, amount = 1) {
      const s = Math.sin(phase);
      legL.hip.rotation.x = s * 0.6 * amount;
      legR.hip.rotation.x = -s * 0.6 * amount;
      legL.knee.rotation.x = Math.max(0, -Math.cos(phase)) * 0.8 * amount;
      legR.knee.rotation.x = Math.max(0, Math.cos(phase)) * 0.8 * amount;
      armL.shoulder.rotation.x = -s * 0.55 * amount;
      armR.shoulder.rotation.x = s * 0.55 * amount;
      armL.elbow.rotation.x = -0.35 * amount;
      armR.elbow.rotation.x = -0.35 * amount;
      hips.position.y = 0.55 - Math.abs(Math.cos(phase)) * 0.035 * amount;
      torso.rotation.x = 0.08 * amount;
    },
    fly(amount, time) {
      for (const f of flames) f.scale.set(1, amount * (0.85 + Math.sin(time * 45 + f.position.x * 10) * 0.15), 1);
      torso.rotation.x = 0.28 * amount;
      armL.shoulder.rotation.x = 0.5 * amount;
      armR.shoulder.rotation.x = 0.5 * amount;
      armL.shoulder.rotation.z = 0.25 * amount;
      armR.shoulder.rotation.z = -0.25 * amount;
      legL.hip.rotation.x = 0.25 * amount;
      legR.hip.rotation.x = 0.35 * amount;
      legL.knee.rotation.x = 0.45 * amount;
      legR.knee.rotation.x = 0.6 * amount;
    },
    hover(amount, time) {
      for (const f of flames) f.scale.set(1, amount * (0.55 + Math.sin(time * 40 + f.position.x * 10) * 0.12), 1);
      legL.knee.rotation.x = 0.35 * amount;
      legR.knee.rotation.x = 0.45 * amount;
      legL.hip.rotation.x = -0.1 * amount;
    },
    slump(amount) {
      hips.position.y = lerp(0.55, 0.16, amount);
      legL.hip.rotation.x = -1.45 * amount;
      legR.hip.rotation.x = -1.35 * amount;
      legL.knee.rotation.x = 0.15 * amount;
      legR.knee.rotation.x = 0.25 * amount;
      torso.rotation.x = 0.6 * amount;
      head.rotation.x = 0.55 * amount;
      armL.shoulder.rotation.z = 0.15 * amount;
      armR.shoulder.rotation.z = -0.15 * amount;
      armL.shoulder.rotation.x = -0.4 * amount;
      armR.shoulder.rotation.x = -0.4 * amount;
    },
    wave(time, amount = 1, arm = armR) {
      arm.shoulder.rotation.z = arm.side * lerp(0, 2.55, amount);
      arm.shoulder.rotation.x = -0.15 * amount;
      arm.elbow.rotation.z = arm.side * Math.sin(time * 9) * 0.45 * amount;
      head.rotation.z += arm.side * 0.12 * amount;
    },
    cheer(time, amount = 1) {
      const bounce = Math.abs(Math.sin(time * 6));
      armL.shoulder.rotation.z = lerp(armL.shoulder.rotation.z, 2.7 + Math.sin(time * 6) * 0.15, amount);
      armR.shoulder.rotation.z = lerp(armR.shoulder.rotation.z, -2.7 - Math.sin(time * 6) * 0.15, amount);
      hips.position.y += bounce * 0.07 * amount;
      head.rotation.x -= 0.15 * amount;
    },
    hammer(phase, amount = 1) {
      armR.shoulder.rotation.x = -(1.5 + Math.sin(phase) * 0.45) * amount;
      armR.elbow.rotation.x = -(0.5 + Math.max(0, Math.sin(phase)) * 0.6) * amount;
      armL.shoulder.rotation.x = -0.9 * amount;
      armL.elbow.rotation.x = -0.9 * amount;
      torso.rotation.x = 0.08 * Math.sin(phase) * amount;
      sparks.visible = amount > 0.5 && Math.sin(phase) < -0.2;
      if (sparks.visible) {
        sparks.children.forEach((s, i) => {
          s.position.set(Math.sin(phase * 3 + i * 1.7) * 0.12, -0.05 + Math.cos(phase * 5 + i) * 0.1, 0.1 + (i % 3) * 0.04);
        });
      }
    },
    type(time, amount = 1) {
      armL.shoulder.rotation.x = -1.05 * amount;
      armR.shoulder.rotation.x = -1.05 * amount;
      armL.shoulder.rotation.z = -0.25 * amount;
      armR.shoulder.rotation.z = 0.25 * amount;
      armL.elbow.rotation.x = -(0.7 + Math.max(0, Math.sin(time * 18)) * 0.25) * amount;
      armR.elbow.rotation.x = -(0.7 + Math.max(0, Math.sin(time * 18 + 1.8)) * 0.25) * amount;
      head.rotation.x += 0.18 * amount;
    },
    crouch(amount) {
      root.scale.set(1 + 0.12 * amount, 1 - 0.16 * amount, 1 + 0.12 * amount);
      armL.shoulder.rotation.x = 0.7 * amount;
      armR.shoulder.rotation.x = 0.7 * amount;
      legL.knee.rotation.x = 0.5 * amount;
      legR.knee.rotation.x = 0.5 * amount;
      legL.hip.rotation.x = -0.4 * amount;
      legR.hip.rotation.x = -0.4 * amount;
    },
    airborne(amount) {
      root.scale.set(1 - 0.06 * amount, 1 + 0.08 * amount, 1 - 0.06 * amount);
      armL.shoulder.rotation.z = 2.3 * amount;
      armR.shoulder.rotation.z = -2.3 * amount;
      legL.hip.rotation.x = -0.9 * amount;
      legR.hip.rotation.x = -0.5 * amount;
      legL.knee.rotation.x = 1.3 * amount;
      legR.knee.rotation.x = 0.9 * amount;
    },
    reach(amount) {
      torso.rotation.x = 0.75 * amount;
      head.rotation.x = 0.2 * amount;
      armL.shoulder.rotation.x = -0.9 * amount;
      armR.shoulder.rotation.x = -0.9 * amount;
      armL.shoulder.rotation.z = -0.2 * amount;
      armR.shoulder.rotation.z = 0.2 * amount;
      legL.knee.rotation.x = 0.5 * amount;
      legR.knee.rotation.x = 0.5 * amount;
      legL.hip.rotation.x = -0.35 * amount;
      legR.hip.rotation.x = -0.35 * amount;
      hips.position.y -= 0.1 * amount;
    },
    liftOverhead(amount) {
      armL.shoulder.rotation.x = -lerp(1.0, 2.9, amount);
      armR.shoulder.rotation.x = -lerp(1.0, 2.9, amount);
      armL.shoulder.rotation.z = -0.2;
      armR.shoulder.rotation.z = 0.2;
      armL.elbow.rotation.x = -0.3;
      armR.elbow.rotation.x = -0.3;
      head.rotation.x -= 0.35 * amount;
    },
    setEyes(on, mood = 'normal') {
      eyeMat.emissiveIntensity = 3 * on;
      const sy = mood === 'happy' ? 0.35 : 1;
      eyeL.scale.y = sy;
      eyeR.scale.y = sy;
    },
    blink(time) {
      const t = time % 3.7;
      if (t < 0.12) {
        eyeL.scale.y *= 0.12;
        eyeR.scale.y *= 0.12;
      }
    },
    setCharge(p) {
      const lit = Math.round(p * ringSegments.length);
      ringSegments.forEach((s, i) => { s.material = i < lit ? ringOnMat : ringOffMat; });
      core.material.emissiveIntensity = 0.6 + p * 2.4;
    },
    face(angle, dt, rate = 10) {
      let d = angle - root.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      root.rotation.y += d * (dt === null ? 1 : 1 - Math.exp(-dt * rate));
    },
    handWorld(out = tmp) {
      root.updateMatrixWorld(true);
      const a = armL.hand.getWorldPosition(new THREE.Vector3());
      const b = armR.hand.getWorldPosition(new THREE.Vector3());
      return out.copy(a).add(b).multiplyScalar(0.5);
    },
    chestWorld(out = new THREE.Vector3()) {
      root.updateMatrixWorld(true);
      return core.getWorldPosition(out);
    },
  };
  api.reset();
  return api;
}
