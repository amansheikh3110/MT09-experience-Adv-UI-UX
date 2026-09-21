'use client';

import { useProgress } from '@react-three/drei';
import gsap from 'gsap';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { bootStore } from '@/lib/stage';
import { pad } from '@/lib/math';
import { playIntro } from '@/scroll/intro';
import styles from './Initializer.module.css';

const MIN_MS = 2200;

/**
 * INITIALIZING MACHINE — a hairline and a counter. No spinner, no "Loading…".
 * Waits for the model + compiled shaders (bootStore) and a minimum beat, then dissolves
 * into the black room and hands control to the opening sequence.
 */
export function Initializer() {
  const { progress } = useProgress();
  const ready = useSyncExternalStore(bootStore.subscribe, () => bootStore.get().ready, () => false);
  const [shown, setShown] = useState(0);
  const [label, setLabel] = useState('Initializing machine');
  const [gone, setGone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const t0 = useRef(0);
  const finishing = useRef(false);

  // smooth, monotonic displayed value
  useEffect(() => {
    t0.current = performance.now();
    let raf = 0;
    let v = 0;
    const tick = () => {
      const elapsed = performance.now() - t0.current;
      // the bar never sits dead still: a slow creep covers the moment before assets report in
      const creep = Math.min(14, elapsed / 260);
      const cap = ready && elapsed > MIN_MS ? 100 : Math.min(Math.max(progress, creep), 96);
      // never outrun time: the counter fills over MIN_MS at the earliest
      const timeCap = Math.min(100, (elapsed / MIN_MS) * 100);
      const target = Math.min(cap, ready ? timeCap : Math.min(timeCap, 96));
      v += (target - v) * 0.08;
      if (target - v < 0.05) v = target;
      setShown(v);
      if (v >= 99.9 && ready && !finishing.current) {
        finishing.current = true;
        setLabel('System ready');
        gsap
          .timeline({ delay: 0.55, onComplete: () => setGone(true) })
          .to(root.current, { opacity: 0, duration: 1.1, ease: 'power2.inOut' })
          .add(() => {
            playIntro();
          }, '-=0.3');
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress, ready]);

  if (gone) return null;

  return (
    <div ref={root} className={styles.root} role="status" aria-live="polite">
      <div className={styles.center}>
        <span className={`mono ${styles.label}`}>{label}</span>
        <span className={styles.track}>
          <span className={styles.bar} style={{ transform: `scaleX(${shown / 100})` }} />
        </span>
        <span className={`mono mono--faint ${styles.count}`}>{pad(shown, 3)}</span>
      </div>
      <span className={`mono mono--faint ${styles.corner} ${styles.tl}`}>MT—09 SP</span>
      <span className={`mono mono--faint ${styles.corner} ${styles.br}`}>Launch film · v1</span>
    </div>
  );
}
