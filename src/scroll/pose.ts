import { CONFIG_SHOTS, Focus, Key, TRACKS } from '@/config/shots';
import { configStore } from '@/lib/configStore';
import { clamp, lerp, smooth } from '@/lib/math';
import { NUM_POSE_KEYS, Pose, Vec3, makePose, stage } from '@/lib/stage';

/**
 * Turns "where is the scrollbar?" into a camera/bike pose.
 * Sections register their DOM element; every frame we find which 3D section
 * is under the middle of the screen and sample its track by its own progress.
 */

const registry = new Map<string, HTMLElement>();

export const registerStageSection = (id: string, el: HTMLElement | null) => {
  if (el) registry.set(id, el);
  else registry.delete(id);
};

const VEC_KEYS = ['cam', 'look'] as const;

type Resolved = Pose & { at: number };

/** bike-space → world, for a bike turned by `yaw` */
export const bikeToWorld = (u: number, v: number, w: number, yaw: number): Vec3 => {
  const { L, W, H } = stage.bike;
  const lx = (w * W) / 2;
  const lz = L / 2 - u * L;
  const ly = v * H;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [lx * c + lz * s, ly, -lx * s + lz * c];
};

const resolveFocus = (f: Focus, yaw: number): { cam: Vec3; look: Vec3 } => {
  const look = bikeToWorld(f.at[0], f.at[1], f.at[2], yaw);
  const az = (f.az * Math.PI) / 180;
  const el = (f.el * Math.PI) / 180;
  const cam: Vec3 = [
    look[0] + Math.sin(az) * Math.cos(el) * f.dist,
    look[1] + Math.sin(el) * f.dist,
    look[2] + Math.cos(az) * Math.cos(el) * f.dist,
  ];
  return { cam, look };
};

/** Fill in carried-over values so every key is complete. */
const resolveTrack = (keys: Key[]): Resolved[] => {
  const base = makePose();
  let prev: Record<string, unknown> = { ...base, fit: 1 };
  return keys.map((k) => {
    const merged: Record<string, unknown> = { ...prev };
    (Object.keys(k) as (keyof Key)[]).forEach((prop) => {
      if (prop !== 'focus' && k[prop] !== undefined) merged[prop] = k[prop];
    });
    if (k.focus) {
      const r = resolveFocus(k.focus, (merged.rot as number) ?? 0);
      merged.cam = r.cam;
      merged.look = r.look;
    }
    prev = merged;
    return { ...(merged as unknown as Resolved), at: k.at };
  });
};

let resolved: Record<string, Resolved[]> | null = null;
let resolvedForBike = '';

const getResolved = () => {
  // focus keys depend on the model's measured size → re-resolve once it is known
  const sig = stage.bike.ready ? `${stage.bike.L}|${stage.bike.W}|${stage.bike.H}` : 'x';
  if (!resolved || sig !== resolvedForBike) {
    resolved = {};
    Object.keys(TRACKS).forEach((id) => (resolved![id] = resolveTrack(TRACKS[id])));
    resolvedForBike = sig;
  }
  return resolved;
};

const sampleTrack = (keys: Resolved[], p: number, out: Pose) => {
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1].at) i++;
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const span = Math.max(1e-5, b.at - a.at);
  const t = smooth(clamp((p - a.at) / span));
  VEC_KEYS.forEach((k) => {
    out[k] = [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t), lerp(a[k][2], b[k][2], t)];
  });
  NUM_POSE_KEYS.forEach((k) => {
    (out as unknown as Record<string, number>)[k] = lerp(a[k] as number, b[k] as number, t);
  });
};

/** The selected configurator category steers the camera (eased in/out at the section edges). */
const applyConfigShot = (p: number) => {
  const shot = CONFIG_SHOTS[configStore.get().category];
  const w = smooth(clamp(p / 0.14)) * (1 - smooth(clamp((p - 0.86) / 0.14)));
  const t = stage.target;
  let cam: Vec3 = t.cam;
  let look: Vec3 = t.look;
  if (shot.focus) {
    const r = resolveFocus(shot.focus, shot.rot);
    cam = r.cam;
    look = r.look;
  } else {
    cam = shot.cam ?? cam;
    look = shot.look ?? look;
  }
  for (let i = 0; i < 3; i++) {
    t.cam[i] = lerp(t.cam[i], cam[i], w);
    t.look[i] = lerp(t.look[i], look[i], w);
  }
  t.rot = lerp(t.rot, shot.rot, w);
  t.shiftX = lerp(t.shiftX, shot.shiftX ?? t.shiftX, w);
};

/** Section under a horizontal line at `line` (fraction of viewport height). */
export const sampleScrollPose = (vh: number) => {
  const tracks = getResolved();
  let active: string | null = null;
  let progress = 0;
  let anyVisible = false;

  for (const [id, el] of registry) {
    const r = el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < vh) anyVisible = true;
    if (!active && r.top <= vh * 0.5 && r.bottom > vh * 0.5) {
      active = id;
      progress = clamp(-r.top / Math.max(1, r.height - vh));
    }
  }

  stage.canvasVisible = anyVisible;
  stage.section = active;
  stage.sectionProgress = progress;
  if (active && tracks[active]) sampleTrack(tracks[active], progress, stage.target);
  if (active === 'configurator') applyConfigShot(progress);
  return { active, progress };
};

/** Cheap visibility test used by the canvas gate (works even while rendering is paused). */
export const updateCanvasVisibility = (vh: number) => {
  let visible = false;
  for (const el of registry.values()) {
    const r = el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < vh) {
      visible = true;
      break;
    }
  }
  stage.canvasVisible = visible;
  return visible;
};
