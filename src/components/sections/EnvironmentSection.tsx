'use client';

import gsap from 'gsap';
import { useRef } from 'react';
import { ENVIRONMENTS, EnvironmentScene, PICTURES, pictureSrc, pictureSrcSet } from '@/config/assets';
import { useScrub } from '@/hooks/useScrub';
import { pad } from '@/lib/math';
import styles from './EnvironmentSection.module.css';

const SCENES = ENVIRONMENTS.filter((e) => e.enabled && e.picture);
const N = SCENES.length;

/** A full-bleed picture that always covers the viewport, keeping its focus point in frame. */
function Cover({ scene, priority }: { scene: EnvironmentScene; priority?: boolean }) {
  const pic = PICTURES[scene.picture!];
  const [cx, cy, cw, ch] = scene.crop;
  const aspect = (cw * pic.w) / (ch * pic.h);
  const [fx, fy] = scene.focus.split(' ').map((v) => parseFloat(v));
  return (
    <div className={styles.cover} data-cover>
      <div
        className={styles.coverInner}
        style={{ ['--ar' as string]: aspect, ['--fx' as string]: `${fx}%`, ['--fy' as string]: `${fy}%` }}
      >
        {/* GSAP owns this layer's transform; the wrapper above owns the layout */}
        <div className={styles.zoom} data-inner>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pictureSrc(pic, pic.widths[1])}
          srcSet={pictureSrcSet(pic)}
          sizes="100vw"
          alt={pic.alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          style={{ width: `${100 / cw}%`, height: `${100 / ch}%`, left: `${(-cx / cw) * 100}%`, top: `${(-cy / ch) * 100}%` }}
        />
        </div>
      </div>
    </div>
  );
}

/**
 * 07 — THE ENVIRONMENT. The motorcycle leaves the showroom. Each location is a full-screen
 * scene pinned in place; the next one rises over it like the shutter did at the very start,
 * while the picture slowly pushes back. Add more scenes in config/assets.ts → ENVIRONMENTS.
 */
export function EnvironmentSection() {
  const ref = useRef<HTMLElement>(null);

  useScrub(ref, (tl, q) => {
    const covers = q('[data-scene]') as HTMLElement[];
    const seg = 1 / N;
    gsap.set(q('[data-title] .c'), { yPercent: 115 });
    gsap.set(q('[data-meta]'), { opacity: 0, y: 14 });

    covers.forEach((el, i) => {
      const t0 = i * seg;
      const inner = el.querySelector('[data-inner]');
      // the next scene is uncovered bottom→top like a shutter rising
      if (i > 0) {
        tl.fromTo(el, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: seg * 0.36, ease: 'power2.inOut' }, t0 - seg * 0.3);
      }
      // slow push-out across the scene's whole life
      if (inner) {
        tl.fromTo(inner, { scale: 1.08, xPercent: i % 2 ? 1.2 : -1.2 }, { scale: 1.0, xPercent: i % 2 ? -0.8 : 0.8, duration: seg * 1.3 }, Math.max(0, t0 - seg * 0.3));
      }
      // titles
      const chars = q(`[data-title="${i}"] .c`);
      tl.to(chars, { yPercent: 0, duration: seg * 0.22, stagger: seg * 0.006, ease: 'power3.out' }, t0 + seg * 0.02);
      tl.to(q(`[data-meta="${i}"]`), { opacity: 1, y: 0, duration: seg * 0.16 }, t0 + seg * 0.12);
      if (i < N - 1) {
        tl.to(chars, { yPercent: -115, duration: seg * 0.14, stagger: seg * 0.003, ease: 'power3.in' }, t0 + seg * 0.74);
        tl.to(q(`[data-meta="${i}"]`), { opacity: 0, duration: seg * 0.1 }, t0 + seg * 0.76);
      }
    });

    // counter + ticks follow the active scene
    const counter = q('[data-count]')[0] as HTMLElement | undefined;
    const ticks = q('[data-tick]') as HTMLElement[];
    tl.eventCallback('onUpdate', () => {
      const idx = Math.min(N - 1, Math.floor(tl.progress() * N + 0.15));
      if (counter) counter.textContent = pad(idx + 1);
      ticks.forEach((t, i) => t.toggleAttribute('data-active', i === idx));
    });
  });

  return (
    <section id="environment" ref={ref} className={`opaque ${styles.section}`} style={{ height: `${N * 140}vh` }}>
      <div className="stage-section__pin">
        {SCENES.map((s, i) => (
          <div key={s.id} className={styles.scene} data-scene data-copy={s.copy} style={{ zIndex: i + 1 }}>
            <Cover scene={s} priority={i === 0} />
            <div className={styles.scrim} />
            <div className={styles.copy}>
              <span className="mono mono--dim" data-meta={i}>{s.kicker}</span>
              <h2 className={`display ${styles.title}`} data-title={i} aria-label={s.title}>
                {s.title.split(' ').map((w, wi) => (
                  <span key={wi} className={styles.w} aria-hidden>
                    {Array.from(w).map((ch, ci) => (
                      <span key={ci} className={`${styles.c} c`}>{ch}</span>
                    ))}
                    {' '}
                  </span>
                ))}
              </h2>
              <p className={`lede ${styles.caption}`} data-meta={i}>{s.caption}</p>
            </div>
          </div>
        ))}

        <span className={`mono mono--dim ${styles.kicker}`}>07 — The environment</span>
        <div className={styles.index}>
          <span className="mono">
            <span data-count>01</span>
            <i> / {pad(N)}</i>
          </span>
          <span className={styles.ticks}>
            {SCENES.map((s) => (
              <span key={s.id} data-tick className={styles.tick} />
            ))}
          </span>
        </div>
      </div>
    </section>
  );
}
