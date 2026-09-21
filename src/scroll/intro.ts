import gsap from 'gsap';
import { prefersReducedMotion } from '@/lib/quality';
import { hudStore, stage } from '@/lib/stage';
import { lockScroll, unlockScroll } from './lenis';

/**
 * THE OPENING SEQUENCE
 * ─────────────────────────────────────────────────────────────────────────────
 *  BLACK → electrical flicker → power restored → narrow focused light → headlight
 *  → shutter starts to lift → silhouette → shutter fully open → full machine
 *  → slow rotation → scroll unlocked.
 *
 * It only writes numbers into `stage`; the scene (lights, shutter, emissives, camera)
 * and the DOM glitch layer react to them. Times are seconds from timeline start.
 */

let timeline: gsap.core.Timeline | null = null;

const hud = (status: string) => hudStore.set({ status });

export function playIntro(onDone?: () => void) {
  if (timeline) return timeline;
  const S = stage;
  const reduced = prefersReducedMotion();

  // starting state: everything off
  Object.assign(S, {
    power: 1, key: 0, keyAngle: 0.035, keyAim: 0, headlight: 0, tail: 0, fill: 0, rim: 0,
    ambient: 0, shutter: 0, introDolly: 1, introSpin: 0, glitch: 0,
  });
  lockScroll();

  const tl = gsap.timeline({
    paused: true,
    onComplete: () => {
      S.introDone = true;
      S.phase = 'live';
      hud('LIVE');
      unlockScroll();
      onDone?.();
    },
  });

  const at = (t: number, vars: gsap.TweenVars) => tl.set(S, vars, t);
  const glitch = (t: number, amount: number, dur = 0.07) => {
    if (reduced) return;
    at(t, { glitch: amount });
    at(t + dur, { glitch: 0 });
  };
  /** an instantaneous light blip (electrical fault) */
  const blip = (t: number, vars: gsap.TweenVars, dur: number, g = 0) => {
    at(t, vars);
    const off: Record<string, number> = {};
    Object.keys(vars).forEach((k) => (off[k] = k === 'keyAngle' ? 0.035 : 0));
    at(t + dur, off);
    if (g) glitch(t, g, dur + 0.02);
  };

  // ── STANDBY ───────────────────────────────────────────────────────
  tl.call(() => { S.phase = 'standby'; hud('STANDBY'); }, [], 0);

  // ── 1 · POWER FAILURE / FLICKER (1.5 → 3.3) ───────────────────────
  tl.call(() => { S.phase = 'power'; hud('POWER'); }, [], 1.5);
  blip(1.5, { key: 0.16, keyAim: 0 }, 0.05, 0.6);
  blip(1.86, { key: 0.32 }, 0.04, 1);
  blip(1.98, { key: 0.55 }, 0.03, 0.4);
  blip(2.42, { key: 0.9, keyAim: 0.5, keyAngle: 0.1, ambient: 0.12 }, 0.09, 0.85);
  glitch(3.05, 0.35, 0.05);
  at(3.06, { power: 0.5 });
  at(3.1, { power: 1 });

  // ── 2 · LIGHT (3.5 → 8) ───────────────────────────────────────────
  tl.call(() => { S.phase = 'light'; hud('LIGHT'); }, [], 3.5);
  tl.to(S, { key: 0.8, keyAngle: 0.055, duration: 1.5, ease: 'power3.out' }, 3.5);
  // bulb settling
  at(4.75, { key: 0.62 });
  at(4.82, { key: 0.9 });
  tl.to(S, { key: 1, duration: 0.6, ease: 'sine.inOut' }, 4.85);

  // headlights stutter on, like cold LEDs finding their supply
  at(5.6, { headlight: 0.9 });
  at(5.66, { headlight: 0 });
  at(5.82, { headlight: 0.6 });
  at(5.87, { headlight: 0 });
  glitch(5.6, 0.3, 0.05);
  tl.to(S, { headlight: 1, duration: 0.7, ease: 'power2.out' }, 6.05);

  tl.to(S, { tail: 1, duration: 1.4, ease: 'power1.inOut' }, 6.6);
  // the cone opens and travels from the front wheel to the whole machine
  tl.to(S, { keyAngle: 0.13, keyAim: 1, duration: 6, ease: 'sine.inOut' }, 6.4);

  // ── 3 · SHUTTER (7 → 15.5) ────────────────────────────────────────
  tl.call(() => { S.phase = 'shutter'; hud('SHUTTER'); }, [], 7.2);
  tl.to(S, { shutter: 0.012, duration: 0.28, ease: 'power4.out' }, 7.2); // the jolt
  tl.to(S, { shutter: 1, duration: 8.4, ease: 'power2.inOut' }, 8.0);
  tl.to(S, { ambient: 1, fill: 1, duration: 8.5, ease: 'power1.in' }, 8.4);
  tl.to(S, { rim: 1, duration: 5, ease: 'power1.inOut' }, 11);
  tl.to(S, { keyAngle: 0.25, duration: 5, ease: 'sine.inOut' }, 11.2);
  tl.to(S, { introDolly: 0, duration: 11.5, ease: 'sine.inOut' }, 6.5);

  // ── 4/5 · REVEAL + ROTATION ───────────────────────────────────────
  tl.call(() => { S.phase = 'reveal'; hud('READY'); }, [], 15.6);
  tl.to(S, { introSpin: 1, duration: 4, ease: 'sine.inOut' }, 14.6);
  tl.to(S, { keyAngle: 0.3 }, 15.6);
  tl.set({}, {}, 16.6); // tail so the timeline ends after the last move

  if (reduced) tl.timeScale(2.6);

  timeline = tl;
  S.started = true;

  // dev / accessibility escape hatch:  /?intro=off  jumps straight to the revealed state
  if (new URLSearchParams(window.location.search).get('intro') === 'off') {
    tl.progress(1);
    S.introDone = true;
    S.phase = 'live';
    hud('LIVE');
    unlockScroll();
    onDone?.();
    return tl;
  }

  tl.play(0);
  return tl;
}

/** Fast-forwards the sequence instead of cutting it. */
export function skipIntro() {
  if (!timeline || stage.introDone) return;
  timeline.timeScale(9);
}

export const introPlaying = () => !!timeline && !stage.introDone;
