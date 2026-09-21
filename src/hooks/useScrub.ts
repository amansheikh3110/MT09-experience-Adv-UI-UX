'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RefObject, useCallback, useLayoutEffect } from 'react';
import { registerStageSection } from '@/scroll/pose';

gsap.registerPlugin(ScrollTrigger);

type Q = gsap.utils.SelectorFunc;

/**
 * Builds a timeline whose progress IS the section's scroll progress (scrub).
 * Positions inside the timeline are progress fractions 0–1, so
 *   tl.to(el, {...}, 0.3)   means "starts at 30 % of this section's scroll".
 * Scroll back and everything rewinds — nothing plays once and gets stuck.
 */
export function useScrub(
  scope: RefObject<HTMLElement | null>,
  build: (tl: gsap.core.Timeline, q: Q, mm: gsap.MatchMedia) => void,
  {
    start = 'top top',
    end = 'bottom bottom',
    scrub = 0.6,
    deps = [] as unknown[],
  }: { start?: string; end?: string; scrub?: number | boolean; deps?: unknown[] } = {},
) {
  useLayoutEffect(() => {
    const el = scope.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start, end, scrub, invalidateOnRefresh: true },
      });
      build(tl, gsap.utils.selector(el), mm);
      tl.set({}, {}, 1); // pin the timeline length to exactly 1
    }, el);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Ref callback that registers an element as a 3D "stage" chapter (see config/shots.ts). */
export function useStageSection(id: string) {
  return useCallback((el: HTMLElement | null) => registerStageSection(id, el), [id]);
}

/**
 * Scroll-tied editorial motion for everything inside `scope`:
 *   [data-drift="0.04"]  picture drifts inside its crop window (parallax depth)
 *   [data-reveal]        plate is uncovered bottom→top like a shutter rising, settling from a slight zoom
 *   [data-speed="0.2"]   any element floats at its own speed (fraction of viewport height)
 * Every tween is scrubbed, so scrolling back reverses it.
 */
export function useEditorial(scope: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = scope.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 901px)', () => {
        gsap.utils.toArray<HTMLElement>('[data-drift]').forEach((d) => {
          const s = parseFloat(d.dataset.drift || '0');
          if (!s) return;
          gsap.fromTo(
            d,
            { yPercent: -s * 100 },
            {
              yPercent: s * 100,
              ease: 'none',
              scrollTrigger: { trigger: d.closest('figure') || d, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          );
        });
        gsap.utils.toArray<HTMLElement>('[data-speed]').forEach((el) => {
          const s = parseFloat(el.dataset.speed || '0');
          gsap.fromTo(
            el,
            { y: () => s * window.innerHeight * 0.5 },
            {
              y: () => -s * window.innerHeight * 0.5,
              ease: 'none',
              scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
            },
          );
        });
      });
      // reveals run on every viewport
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((fig) => {
        const frame = fig.querySelector('[data-frame]');
        const inner = fig.querySelector('[data-drift]');
        if (frame) {
          gsap.fromTo(
            frame,
            { clipPath: 'inset(100% 0 0 0)' },
            { clipPath: 'inset(0% 0 0 0)', ease: 'none', scrollTrigger: { trigger: fig, start: 'top 94%', end: 'top 52%', scrub: 0.6 } },
          );
        }
        if (inner) {
          gsap.fromTo(
            inner,
            { scale: 1.16 },
            { scale: 1, ease: 'none', scrollTrigger: { trigger: fig, start: 'top 94%', end: 'bottom 40%', scrub: 0.6 } },
          );
        }
      });
      // masked headline characters rise as the headline enters
      gsap.utils.toArray<HTMLElement>('[data-split]').forEach((el) => {
        const chars = el.querySelectorAll('.c');
        gsap.set(chars, { yPercent: 115 });
        gsap.to(chars, {
          yPercent: 0,
          ease: 'power3.out',
          stagger: 0.03,
          duration: 1,
          scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 52%', scrub: 0.5 },
        });
      });
      void mm;
    }, root);
    return () => ctx.revert();
  }, [scope]);
}
