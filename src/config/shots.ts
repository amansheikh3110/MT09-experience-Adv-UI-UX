/**
 * CAMERA / LIGHT CHOREOGRAPHY
 * ─────────────────────────────────────────────────────────────────────────────
 * One track per 3D section. `at` is that section's scroll progress (0–1, measured
 * across its pinned distance). Anything a key leaves out is carried over from the
 * previous key, so a track only lists what changes.
 *
 * World units ≈ metres. The bike is 2.15 long, ~1.25 tall, stands on y = 0 and
 * points its nose at +Z (toward the default camera). `rot` turns the bike (a turntable),
 * the room and lights stay put — that's what makes reflections travel across the paint.
 *
 * Two ways to aim a key:
 *   • cam + look        — absolute world positions
 *   • focus             — aim at a spot ON the bike (bike-space: u 0 = nose → 1 = tail,
 *                         v 0 = floor → 1 = top, w −1..1 across) from az/el/dist
 */

import type { Vec3 } from '@/lib/stage';

export type Focus = {
  /** [u, v, w] in bike space */
  at: Vec3;
  dist: number;
  /** degrees; 0 = camera on +Z looking toward −Z, positive swings toward +X */
  az: number;
  /** degrees above horizon */
  el: number;
};

export type Key = {
  at: number;
  cam?: Vec3;
  look?: Vec3;
  focus?: Focus;
  fov?: number;
  rot?: number;
  shiftX?: number;
  shiftY?: number;
  exposure?: number;
  key?: number;
  fill?: number;
  rim?: number;
  headlight?: number;
  ambient?: number;
  shutter?: number;
  spin?: number;
  mist?: number;
  /** 1 = pull the camera back on narrow screens until the whole bike fits; 0 = never (details) */
  fit?: number;
};

const HERO: Key = {
  at: 0,
  cam: [0, 0.9, 4.75],
  look: [0, 0.82, 0],
  fov: 30,
  rot: 0,
  shiftX: 0,
  shiftY: 0.05,
  exposure: 1,
  key: 1,
  fill: 1,
  rim: 1,
  headlight: 1,
  ambient: 1,
  shutter: 1,
  spin: 1,
  mist: 1,
  fit: 1,
};

/** Where each engineering chapter looks (bike space, see Focus). Order = chapter order. */
export const ENGINEERING_SHOTS: Focus[] = [
  { at: [0.46, 0.33, 0], dist: 2.3, az: 0, el: 6 }, // engine
  { at: [0.36, 0.46, 0], dist: 1.9, az: -58, el: 10 }, // cooling
  { at: [0.2, 0.5, 0], dist: 2.5, az: -12, el: 4 }, // suspension
  { at: [0.16, 0.28, 0], dist: 1.7, az: -15, el: 4 }, // brakes
  { at: [0.8, 0.28, 0], dist: 2.0, az: 14, el: 8 }, // drive
  { at: [0.31, 0.92, 0], dist: 1.8, az: -34, el: 22 }, // cockpit
];

export const TRACKS: Record<string, Key[]> = {
  // 01 ─ THE MACHINE: hero → 3/4 → profile → high rear 3/4
  machine: [
    { ...HERO, at: 0 },
    { at: 0.1, spin: 0 },
    { at: 0.34, cam: [2.5, 1.0, 4.6], look: [0, 0.58, 0], rot: 0.78, fov: 30, shiftX: 0.22, shiftY: -0.2 },
    { at: 0.66, cam: [-0.15, 0.72, 4.2], look: [0, 0.6, 0], rot: -1.5, fov: 30, shiftX: 0, shiftY: -0.2, key: 1.1 },
    { at: 1, cam: [1.2, 1.4, 4.9], look: [0, 0.55, 0], rot: -2.5, shiftX: 0.1, shiftY: -0.12, exposure: 0.9 },
  ],

  // 03 ─ THE STUDY: slow technical orbit, labels live here
  study: [
    { at: 0, cam: [2.6, 1.1, 4.6], look: [0, 0.6, 0], rot: -1.5708, fov: 28, shiftX: 0, shiftY: -0.06, key: 0.9, fill: 1.5, rim: 1.2, spin: 0, exposure: 0.95 },
    { at: 0.12, cam: [0.1, 0.8, 5.0], rot: -1.5708 },
    { at: 0.42, cam: [0.1, 0.8, 5.0], rot: -1.5708 },
    { at: 0.58, cam: [2.4, 1.15, 4.0], rot: -0.62 },
    { at: 0.78, cam: [2.0, 1.2, 4.3], rot: -0.42 },
    { at: 0.9, cam: [1.7, 1.2, 4.5], rot: -2.5 },
    { at: 1, cam: [1.5, 1.15, 4.7], rot: -2.55 },
  ],

  // 04 ─ PERFORMANCE: the machine slides behind enormous numbers
  performance: [
    { at: 0, cam: [3.3, 0.62, 5.4], look: [3.3, 0.62, 0], rot: -1.5708, fov: 30, shiftX: 0, shiftY: 0, exposure: 0.62, key: 0.9, fill: 1, rim: 1, spin: 0 },
    { at: 0.5, cam: [0, 0.6, 5.4], look: [0, 0.62, 0], exposure: 0.66 },
    { at: 1, cam: [-3.3, 0.62, 5.4], look: [-3.3, 0.62, 0], exposure: 0.62 },
  ],

  // 05 ─ ENGINEERING: six macro dives (see ENGINEERING_SHOTS below), bike held side-on
  engineering: [
    { at: 0, cam: [-3.3, 0.62, 5.4], look: [-3.3, 0.62, 0], rot: -1.5708, fov: 30, exposure: 0.62, key: 0.95, fill: 1.2, rim: 1.1, fit: 0, shiftX: 0, shiftY: 0, spin: 0 },
    ...ENGINEERING_SHOTS.flatMap((f, i) => {
      const s = 0.04 + i * 0.16;
      return [
        { at: s + 0.045, focus: f, fov: 26, exposure: 0.95, shiftX: 0.26 },
        { at: s + 0.135, focus: f },
      ] as Key[];
    }),
    { at: 1, focus: ENGINEERING_SHOTS[ENGINEERING_SHOTS.length - 1] },
  ],

  // 08 ─ CONFIGURATION: the bike holds centre, finish categories nudge the camera
  configurator: [
    { at: 0, cam: [1.9, 1.02, 4.9], look: [0, 0.6, 0], rot: 0.55, fov: 30, exposure: 1, key: 1, fill: 1.2, rim: 1, ambient: 1, shutter: 1, spin: 0, shiftX: 0.06, shiftY: 0.02, mist: 1, fit: 1 },
    { at: 1, cam: [1.9, 1.02, 4.9], rot: 0.55 },
  ],

  // 09 ─ FINAL RETURN: dark showroom, only the machine remains
  final: [
    { at: 0, cam: [1.9, 1.02, 4.9], look: [0, 0.6, 0], rot: 0.55, fov: 30, exposure: 1, key: 1, fill: 1.2, rim: 1, ambient: 1, shutter: 1, spin: 0, shiftX: 0.06, shiftY: 0.02, mist: 1, fit: 1 },
    { at: 0.3, cam: [0.9, 0.95, 4.8], look: [0, 0.78, 0], rot: 0.15, ambient: 0.5, fill: 0.5, rim: 0.7, shutter: 0.6, spin: 1, shiftX: 0, shiftY: 0.04, mist: 0.8 },
    { at: 0.68, cam: [0, 0.9, 5.5], look: [0, 0.74, 0], rot: 0, shiftY: 0.2, ambient: 0.05, fill: 0.08, rim: 0.35, shutter: 0, key: 0.95, mist: 0.35 },
    { at: 1, cam: [0, 0.88, 5.3], shiftY: 0.2, ambient: 0, fill: 0, rim: 0.2, shutter: 0, key: 0.85, mist: 0.2, exposure: 1 },
  ],
};

/**
 * Configurator: where the camera goes for each category while it is selected.
 * Blended over the base track (fades in/out at the section edges so scrolling stays smooth).
 */
export type ConfigShot = { rot: number; focus?: Focus; cam?: Vec3; look?: Vec3; shiftX?: number };
export const CONFIG_SHOTS: Record<'body' | 'wheels' | 'seat' | 'details', ConfigShot> = {
  body: { rot: 0.55, cam: [1.9, 1.02, 4.9], look: [0, 0.6, 0], shiftX: 0.1 },
  wheels: { rot: -0.85, focus: { at: [0.16, 0.3, 0], dist: 3.3, az: -22, el: 5 }, shiftX: 0.26 },
  seat: { rot: -2.35, focus: { at: [0.7, 0.62, 0], dist: 3.5, az: 12, el: 26 }, shiftX: 0.26 },
  details: { rot: -1.5, focus: { at: [0.72, 0.32, 0], dist: 3.2, az: 10, el: 8 }, shiftX: 0.26 },
};

/** DOM section ids that own a 3D track (everything else is an opaque editorial section). */
export const STAGE_SECTIONS = Object.keys(TRACKS);
