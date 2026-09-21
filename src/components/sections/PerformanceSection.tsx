'use client';

import gsap from 'gsap';
import { useRef } from 'react';
import { CURVE, STATS } from '@/config/content';
import { pad } from '@/lib/math';
import { useScrub, useStageSection } from '@/hooks/useScrub';
import styles from './PerformanceSection.module.css';

const N = STATS.length;
const SPAN = 1 / N;

const fmt = (v: number, decimals: number, width: number) => {
  const s = v.toFixed(decimals);
  const [i, d] = s.split('.');
  return (d ? `${i.padStart(width, '0')}.${d}` : i.padStart(width, '0'));
};

/** Power/torque curves as one thin SVG — drawn by scroll, labelled directly (no legend). */
function Curves() {
  const w = 320;
  const h = 120;
  const xs = (i: number) => (i / (CURVE.rpm.length - 1)) * w;
  const ys = (v: number) => h - (v / 130) * h;
  const path = (a: number[]) => a.map((v, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join(' ');
  const last = CURVE.rpm.length - 1;
  return (
    <svg className={styles.curves} viewBox={`-2 -14 ${w + 90} ${h + 36}`} aria-hidden>
      {[0, 1, 2, 3].map((g) => (
        <line key={g} x1="0" x2={w} y1={(g * h) / 3} y2={(g * h) / 3} className={styles.grid} />
      ))}
      <path d={path(CURVE.torque)} className={styles.curveDim} pathLength={1} data-curve />
      <path d={path(CURVE.power)} className={styles.curve} pathLength={1} data-curve />
      <text x={w + 8} y={ys(CURVE.power[last]) + 3} className={styles.svgText}>119 HP</text>
      <text x={w + 8} y={ys(CURVE.torque[last]) + 3} className={styles.svgTextDim}>93 NM</text>
      {[2, 6, 10].map((r) => (
        <text key={r} x={xs(CURVE.rpm.indexOf(r))} y={h + 14} className={styles.svgTextDim} textAnchor="middle">{r}k</text>
      ))}
    </svg>
  );
}

/**
 * 04 — PERFORMANCE. No dashboard: four numbers, enormous, on the dark, with the machine
 * sliding past behind them. The counters are scrubbed by scroll — stop mid-way and the
 * number stops mid-way.
 */
export function PerformanceSection() {
  const ref = useRef<HTMLElement>(null);
  const register = useStageSection('performance');

  useScrub(ref, (tl, q) => {
    gsap.set(q('[data-rise]'), { yPercent: 40, opacity: 0 });
    STATS.forEach((s, i) => {
      const start = i * SPAN;
      const block = `[data-stat="${s.id}"]`;
      const num = q(`${block} [data-num]`)[0] as HTMLElement | undefined;
      const counter = { v: 0 };

      // enter
      tl.fromTo(q(block), { opacity: 0 }, { opacity: 1, duration: SPAN * 0.16 }, start + SPAN * 0.02);
      tl.to(q(`${block} [data-rise]`), { yPercent: 0, opacity: 1, duration: SPAN * 0.24, stagger: SPAN * 0.04, ease: 'power3.out' }, start + SPAN * 0.02);
      // the number itself counts up over the first half of its slot
      tl.to(counter, {
        v: s.value,
        duration: SPAN * 0.5,
        ease: 'power2.out',
        onUpdate: () => {
          if (num) num.textContent = fmt(counter.v, s.decimals, s.pad);
        },
      }, start + SPAN * 0.04);
      // exit (not on the last one — the section itself ends)
      if (i < N - 1) {
        tl.to(q(block), { opacity: 0, duration: SPAN * 0.14 }, start + SPAN * 0.86);
        tl.to(q(`${block} [data-rise]`), { yPercent: -30, duration: SPAN * 0.14, ease: 'power2.in' }, start + SPAN * 0.86);
      }
      if (s.id === 'power') {
        tl.fromTo(q('[data-curve]'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: SPAN * 0.5, stagger: SPAN * 0.06 }, start + SPAN * 0.1);
      }
      // progress ticks
      tl.to(q(`[data-tick="${i}"]`), { scaleX: 1, duration: SPAN * 0.98 }, start);
    });
  });

  return (
    <section id="performance" ref={(el) => { ref.current = el; register(el); }} className={`stage-section ${styles.section}`}>
      <div className="stage-section__pin">
        <span className={`mono mono--faint ${styles.kicker}`}>04 — Performance</span>

        {STATS.map((s) => (
          <div key={s.id} className={`${styles.stat} ${s.outline ? styles.outline : ''}`} data-stat={s.id}>
            <div className={styles.numWrap}>
              <span className={`${styles.num} display`} data-num data-rise>
                {fmt(0, s.decimals, s.pad)}
              </span>
              <span className={`${styles.unit} display`} data-rise>{s.unit}</span>
            </div>
            <div className={styles.meta}>
              <span className={`mono ${styles.label}`} data-rise>{s.label}</span>
              <p className={`lede ${styles.note}`} data-rise>{s.note}</p>
            </div>
            {s.id === 'power' && (
              <div className={styles.chart} data-rise>
                <Curves />
                <span className="mono mono--faint">Power · torque, 2 – 12k rpm</span>
              </div>
            )}
          </div>
        ))}

        <div className={styles.ticks} aria-hidden>
          {STATS.map((s, i) => (
            <span key={s.id} className={styles.tickTrack}>
              <span className={styles.tickFill} data-tick={i} />
            </span>
          ))}
          <span className="mono mono--faint">{pad(N)} figures</span>
        </div>
      </div>
    </section>
  );
}
