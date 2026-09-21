'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { CHAPTERS } from '@/config/content';
import { hudStore, stage } from '@/lib/stage';
import { pad } from '@/lib/math';
import { introPlaying, skipIntro } from '@/scroll/intro';
import styles from './Overlays.module.css';

const BARS = 6;

/**
 * Everything that sits ON the picture: film grain, vignette, the electrical glitch and the
 * tiny status HUD. Grain + vignette give every section (3D and photographic) the same
 * "shot on one camera" treatment.
 */
export function Overlays() {
  const bars = useRef<HTMLSpanElement[]>([]);
  const glitchRoot = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const hud = useSyncExternalStore(hudStore.subscribe, hudStore.get, hudStore.get);

  useEffect(() => {
    const canvas = document.getElementById('stage-canvas');
    let raf = 0;
    let lastGlitch = 0;
    const t0 = performance.now();

    const tick = () => {
      const g = stage.glitch;

      // ── electrical instability: a couple of frames of lateral tear + brightness spike ──
      if (canvas) {
        if (g > 0.02) {
          const dx = (Math.random() - 0.5) * 22 * g;
          const skew = (Math.random() - 0.5) * 0.9 * g;
          canvas.style.transform = `translate3d(${dx}px,0,0) skewX(${skew}deg)`;
          canvas.style.filter = `brightness(${1 + g * 0.6 * Math.random()}) contrast(${1 + g * 0.25})`;
          lastGlitch = g;
        } else if (lastGlitch) {
          canvas.style.transform = '';
          canvas.style.filter = '';
          lastGlitch = 0;
        }
      }
      bars.current.forEach((b) => {
        if (!b) return;
        if (g > 0.02) {
          const on = Math.random() < 0.55 + g * 0.3;
          b.style.opacity = on ? String(0.05 + Math.random() * 0.1 * g) : '0';
          b.style.top = `${Math.random() * 100}%`;
          b.style.height = `${1 + Math.random() * 12 * g}px`;
          b.style.transform = `translateX(${(Math.random() - 0.5) * 30}px)`;
        } else {
          b.style.opacity = '0';
        }
      });

      // ── HUD scroll readout ──
      if (pct.current) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        pct.current.textContent = pad(p * 100, 3);
      }

      // ── skip affordance, only while the opening is playing ──
      if (skip.current) {
        const show = introPlaying() && performance.now() - t0 > 2600;
        skip.current.style.opacity = show ? '1' : '0';
        skip.current.style.pointerEvents = show ? 'auto' : 'none';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const live = hud.status === 'READY' || hud.status === 'LIVE';
  const hideHud = hud.chapter === 'final'; // the closing credit owns the bottom edge
  const chapter = live ? CHAPTERS.find((c) => c.id === hud.chapter) : undefined;

  return (
    <>
      <div className={styles.vignette} aria-hidden />
      <div className={styles.grain} aria-hidden />
      <div className={styles.glitch} ref={glitchRoot} aria-hidden>
        {Array.from({ length: BARS }).map((_, i) => (
          <span key={i} ref={(el) => { if (el) bars.current[i] = el; }} className={styles.bar} />
        ))}
      </div>

      {/* status HUD — bottom-left / bottom-right, near invisible */}
      <div className={`${styles.hud} ${styles.hudL} mono mono--faint`} style={{ opacity: hideHud ? 0 : 1, transition: 'opacity 0.6s ease' }}>
        <span className={`${styles.led} ${hud.status === 'STANDBY' ? styles.ledStandby : styles.ledOn}`} />
        <span>SYS / {hud.status}</span>
        {chapter && <span className={styles.hudChapter}> — {chapter.index} {chapter.label}</span>}
      </div>
      <div className={`${styles.hud} ${styles.hudR} mono mono--faint`} style={{ opacity: live && !hideHud ? 1 : 0, transition: 'opacity 1.6s ease' }}>
        <span ref={pct}>000</span>
        <span> / 100</span>
      </div>

      <button ref={skip} className={`${styles.skip} mono`} onClick={skipIntro} type="button" style={{ opacity: 0, pointerEvents: 'none' }}>
        Skip
      </button>
    </>
  );
}
