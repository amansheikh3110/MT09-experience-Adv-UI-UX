/**
 * The STAGE is the single mutable source of truth shared by
 *   • the GSAP opening timeline (writes lighting state),
 *   • the scroll choreography (writes the camera/bike pose targets),
 *   • the R3F scene (reads everything every frame, no React re-renders),
 *   • the DOM overlays (labels, HUD).
 *
 * It is deliberately NOT React state: animation values change 60×/s.
 * Anything React needs to *render* (e.g. selected finish) lives in `configStore`.
 */

export type Vec3 = [number, number, number];

/** One resolved camera/bike pose. Also used for the damped "current" pose. */
export type Pose = {
  cam: Vec3;
  look: Vec3;
  fov: number;
  /** bike yaw (radians) */
  rot: number;
  /** horizontal frame shift, fraction of half-width (+ pushes the bike to the right) */
  shiftX: number;
  /** vertical frame shift, fraction of half-height (+ pushes the bike up) */
  shiftY: number;
  /** global exposure multiplier, 0 = black */
  exposure: number;
  key: number;
  fill: number;
  rim: number;
  headlight: number;
  ambient: number;
  /** 0..1 how open the shutter should be once the intro is over */
  shutter: number;
  /** idle-spin weight 0..1 */
  spin: number;
  /** floor mist density multiplier */
  mist: number;
  /** 1 = pull back on narrow screens until the whole silhouette fits; 0 = detail shot */
  fit: number;
};

export const makePose = (): Pose => ({
  cam: [0, 0.95, 6.4],
  look: [0, 0.55, 0],
  fov: 30,
  rot: 0,
  shiftX: 0,
  shiftY: 0,
  exposure: 1,
  key: 1,
  fill: 1,
  rim: 1,
  headlight: 1,
  ambient: 1,
  shutter: 1,
  spin: 0,
  mist: 1,
  fit: 1,
});

/** Every scalar in a Pose (the vectors `cam` / `look` are handled separately). */
export const NUM_POSE_KEYS = [
  'fov', 'rot', 'shiftX', 'shiftY', 'exposure', 'key', 'fill', 'rim',
  'headlight', 'ambient', 'shutter', 'spin', 'mist', 'fit',
] as const satisfies readonly (keyof Pose)[];

export type Phase = 'boot' | 'standby' | 'power' | 'light' | 'shutter' | 'reveal' | 'live';

export const stage = {
  // ── lifecycle ─────────────────────────────────────────────────────
  /** model parsed + first frame compiled */
  ready: false,
  /** preloader finished and faded out */
  started: false,
  introDone: false,
  phase: 'boot' as Phase,

  // ── lighting state, driven by the opening timeline (all 0..1 unless noted) ──
  /** master electrical supply; the flicker lives here */
  power: 0,
  key: 0,
  /** spot cone half-angle in radians */
  keyAngle: 0.04,
  /** 0 = aiming at the headlight/front wheel, 1 = aiming at the machine's centre */
  keyAim: 0,
  headlight: 0,
  tail: 0,
  fill: 0,
  rim: 0,
  ambient: 0,
  /** intro-controlled shutter opening (pose.shutter takes over after the intro) */
  shutter: 0,
  /** 0 → 1 : how much the intro keeps the camera pulled in / low */
  introDolly: 1,
  /** bike idle-spin speed multiplier during/after intro */
  introSpin: 0,
  /** 0..1 electrical instability, drives the DOM glitch layer */
  glitch: 0,
  /** rumble amplitude while the shutter moves */
  rumble: 0,

  // ── scroll state ──────────────────────────────────────────────────
  scroll: 0,
  scrollProgress: 0,
  /** id of the active 3D section (null while an opaque editorial section covers the canvas) */
  section: null as string | null,
  sectionProgress: 0,
  canvasVisible: true,

  // ── pose: `target` is written by scroll, `cur` is the damped result ──
  target: makePose(),
  cur: makePose(),

  // ── model info (filled by <Motorcycle/> once loaded) ──────────────
  bike: {
    ready: false,
    /** bounding dimensions after normalisation (metres-ish) */
    L: 2.15,
    W: 0.82,
    H: 1.15,
    /** bike group yaw currently displayed (for label anchors etc.) */
    yaw: 0,
  },

  // ── pointer, normalised −1..1, smoothed ───────────────────────────
  pointer: { x: 0, y: 0, tx: 0, ty: 0 },
};

/** Live scene handles so DOM overlays (labels) can project 3D points. Filled by the 3D layer. */
export const sceneRefs: {
  camera: import('three').PerspectiveCamera | null;
  bike: import('three').Group | null;
} = { camera: null, bike: null };

export type Stage = typeof stage;

// ── tiny pub/sub for React-facing state ─────────────────────────────

type Listener = () => void;

export function createStore<T extends object>(initial: T) {
  let state = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    set: (patch: Partial<T>) => {
      state = { ...state, ...patch };
      listeners.forEach((l) => l());
    },
    subscribe: (l: Listener) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

/** Current phase text for the HUD; set by the intro, read by <Hud/>. */
export const hudStore = createStore({ status: 'STANDBY', chapter: '' });

/** Boot state: is the model parsed + shaders compiled? (read by <Initializer/>) */
export const bootStore = createStore({ ready: false });
