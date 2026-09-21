'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { STUDY_LABELS, StudyLabel } from '@/config/content';
import { clamp, smooth } from '@/lib/math';
import { sceneRefs, stage } from '@/lib/stage';
import styles from './Annotations.module.css';

const TAIL = 52;

/**
 * Technical callouts pinned to the REAL 3D model.
 * Each label owns an anchor in bike space; every frame the anchor is carried through the
 * bike's current rotation + the camera and written to the label's transform — pure DOM writes,
 * no React re-renders. A label lives inside a progress window of the section and draws itself
 * on (line first, text after) whenever the window opens — and retracts when it closes.
 */
export function Annotations({ section, labels = STUDY_LABELS }: { section: string; labels?: StudyLabel[] }) {
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const legend = useRef<(HTMLLIElement | null)[]>([]);
  const v = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const cam = sceneRefs.camera;
      const bike = sceneRefs.bike;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const phone = w < 720;
      const active = stage.section === section;
      const p = stage.sectionProgress;

      labels.forEach((l, i) => {
        const el = nodes.current[i];
        if (!el) return;
        const inWindow = active && p >= l.window[0] && p <= l.window[1];
        const show = inWindow && (!phone || l.mobile) && !!cam && !!bike;
        el.toggleAttribute('data-on', show);
        legend.current[i]?.toggleAttribute('data-on', inWindow);
        if (!cam || !bike || !active) return;

        // bike space → world → screen
        const { L, W, H } = stage.bike;
        v.set((l.anchor[2] * W) / 2, l.anchor[1] * H, L / 2 - l.anchor[0] * L);
        bike.localToWorld(v);
        v.project(cam);
        const x = (v.x * 0.5 + 0.5) * w;
        const y = (-v.y * 0.5 + 0.5) * h;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [labels, section, v]);

  return (
    <div className={styles.layer} aria-hidden>
      {labels.map((l, i) => {
        const sx = l.dx >= 0 ? 1 : -1;
        const kx = l.dx - sx * TAIL;
        const len = Math.hypot(kx, l.dy) + TAIL;
        return (
          <div key={l.id} ref={(el) => { nodes.current[i] = el; }} className={styles.label} style={{ ['--dx' as string]: `${l.dx}px`, ['--dy' as string]: `${l.dy}px` }}>
            <span className={styles.dot} />
            <svg className={styles.svg} width="1" height="1" style={{ overflow: 'visible' }}>
              <polyline
                points={`0,0 ${kx},${l.dy} ${l.dx},${l.dy}`}
                fill="none"
                className={styles.line}
                style={{ strokeDasharray: len, strokeDashoffset: len, ['--len' as string]: len }}
              />
            </svg>
            <span className={`${styles.text} ${sx > 0 ? styles.right : styles.left}`} style={{ transform: `translate(${l.dx}px, ${l.dy}px)` }}>
              <span className={styles.textInner}>
                <span className="mono">
                  <b>{l.index}</b>
                  {l.title}
                </span>
                <span className="mono mono--faint">{l.detail}</span>
              </span>
            </span>
          </div>
        );
      })}

      {/* legend — which systems are currently being looked at */}
      <ul className={styles.legend}>
        {labels.map((l, i) => (
          <li key={l.id} ref={(el) => { legend.current[i] = el; }} className="mono">
            <i>{l.index}</i>
            {l.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

export { clamp, smooth };
