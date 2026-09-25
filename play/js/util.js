import * as THREE from 'three';

export const COLORS = {
  cream: 0xe6d38f,
  peri: 0xb3acff,
  ink: 0xf3f2ee,
  night: 0x121417,
  navy: 0x262a3b,
  rock: 0x1b1e28,
  joint: 0x2b2f42,
  visor: 0x0b0c10,
  eye: 0xdcd8ff,
  flame: 0xffc98a,
};

export const clamp01 = x => Math.min(Math.max(x, 0), 1);
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (x, a, b) => clamp01((x - a) / (b - a));
export const smooth = t => t * t * (3 - 2 * t);
export const easeOutBack = t => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const easeInCubic = t => t * t * t;

export function physical(color, opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.36,
    metalness: 0.05,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
    ...opts,
  });
}

export function glow(color, intensity = 2) {
  return new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: intensity, roughness: 1 });
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A canvas-backed texture whose text can be redrawn cheaply (only when it changes).
export function textPanel({ w = 512, h = 256, bg = '#1a1d27', fg = '#ecdfa8', radius = 36, font = '"JetBrains Mono", monospace' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  let last = null;
  function draw(lines, sizes = []) {
    const key = lines.join('|');
    if (key === last) return;
    last = key;
    g.clearRect(0, 0, w, h);
    g.fillStyle = bg;
    g.beginPath();
    g.roundRect(0, 0, w, h, radius);
    g.fill();
    g.fillStyle = fg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const base = sizes[0] || h * 0.28;
    lines.forEach((line, i) => {
      const s = sizes[i] || base * 0.62;
      g.font = `${i === 0 ? 700 : 500} ${s}px ${font}`;
      g.fillText(line, w / 2, h / 2 + (i - (lines.length - 1) / 2) * base * 1.05);
    });
    texture.needsUpdate = true;
  }
  return { texture, draw };
}

export function labelMesh(lines, width, height, opts = {}) {
  const panel = textPanel({ w: Math.round(512 * (width / height)), h: 512, ...opts });
  panel.draw(lines, opts.sizes);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: panel.texture, transparent: true, toneMapped: false })
  );
  mesh.userData.panel = panel;
  return mesh;
}

// Invisible, raycastable box for click-to-inspect; kept out of shadows and depth.
const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
export function hitBox(w, h, d) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMat);
  m.userData.hit = true;
  return m;
}

export function castAll(object) {
  object.traverse(o => {
    if (o.isMesh && !o.userData.hit) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
}
