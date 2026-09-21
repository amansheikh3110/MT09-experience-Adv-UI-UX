export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, v: number) => clamp((v - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
export const remap = (v: number, a: number, b: number, c: number, d: number) =>
  lerp(c, d, invLerp(a, b, v));

/** Frame-rate independent exponential smoothing (same idea as THREE.MathUtils.damp). */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

/** Shortest-way angle damping. */
export const dampAngle = (current: number, target: number, lambda: number, dt: number) => {
  const d = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + d * (1 - Math.exp(-lambda * dt));
};

/** Cheap deterministic pseudo-noise, ~[-1, 1]. */
export const noise1 = (t: number) =>
  (Math.sin(t * 1.7) + Math.sin(t * 2.9 + 1.3) * 0.6 + Math.sin(t * 5.3 + 4.1) * 0.35) / 1.95;

export const pad = (n: number, len = 2) => String(Math.round(n)).padStart(len, '0');
