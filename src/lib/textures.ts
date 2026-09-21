import * as THREE from 'three';

/** Tiny seeded PRNG so the concrete looks the same on every load. */
const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

/** Smooth value noise on a wrapping grid, 0..1. */
const makeNoise = (size: number, seed: number) => {
  const r = rng(seed);
  const grid = new Float32Array(size * size);
  for (let i = 0; i < grid.length; i++) grid[i] = r();
  const at = (x: number, y: number) => grid[((y + size) % size) * size + ((x + size) % size)];
  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
};

export type ConcreteOpts = {
  size?: number;
  /** vertical seams every n px (0 = none) */
  seamsX?: number;
  seamsY?: number;
  seed?: number;
  /** average brightness 0..1 of the albedo */
  tone?: number;
  contrast?: number;
};

/**
 * Procedural poured-concrete: returns albedo + roughness/bump maps.
 * Seams give the architectural panel look; noise gives tonal drift and pores.
 */
export function makeConcrete({
  size = 512,
  seamsX = 0,
  seamsY = 0,
  seed = 7,
  tone = 0.16,
  contrast = 0.09,
}: ConcreteOpts = {}) {
  const n1 = makeNoise(32, seed);
  const n2 = makeNoise(64, seed + 3);
  const n3 = makeNoise(128, seed + 9);
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    return c;
  };
  const albedo = mk();
  const rough = mk();
  const a = albedo.getContext('2d')!;
  const r = rough.getContext('2d')!;
  const ia = a.createImageData(size, size);
  const ir = r.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const low = n1(u * 8, v * 8) * 0.55 + n2(u * 16, v * 16) * 0.3 + n3(u * 64, v * 64) * 0.15;
      // vertical streaking, like shuttering marks
      const streak = n2(u * 40, v * 3);
      let l = tone + (low - 0.5) * contrast * 2 + (streak - 0.5) * contrast * 0.6;
      let ro = 0.72 + (n3(u * 96, v * 96) - 0.5) * 0.35;

      const seam = (pos: number, every: number, w: number) => {
        if (!every) return 0;
        const d = Math.abs(((pos % every) + every) % every);
        const e = Math.min(d, every - d);
        return e < w ? 1 - e / w : 0;
      };
      const s = Math.max(seam(x, seamsX, 1.6), seam(y, seamsY, 1.6));
      l *= 1 - s * 0.7;
      ro = Math.min(1, ro + s * 0.2);

      const i = (y * size + x) * 4;
      const v8 = Math.max(0, Math.min(255, l * 255));
      ia.data[i] = v8 * 1.02;
      ia.data[i + 1] = v8;
      ia.data[i + 2] = v8 * 0.97;
      ia.data[i + 3] = 255;
      const rv = Math.max(0, Math.min(255, ro * 255));
      ir.data[i] = ir.data[i + 1] = ir.data[i + 2] = rv;
      ir.data[i + 3] = 255;
    }
  }
  a.putImageData(ia, 0, 0);
  r.putImageData(ir, 0, 0);

  const tex = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: tex(albedo, true), roughnessMap: tex(rough, false), bumpMap: tex(rough, false) };
}

/** Soft round glow used by light flares. */
export function makeGlow(size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.10)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
