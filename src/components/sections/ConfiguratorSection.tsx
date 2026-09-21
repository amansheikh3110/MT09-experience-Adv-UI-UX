'use client';

import { useRef } from 'react';
import { CATEGORIES } from '@/config/finishes';
import { setCategory, selectOption, useConfig } from '@/lib/configStore';
import { useScrub, useStageSection } from '@/hooks/useScrub';
import { scrollToTarget } from '@/scroll/lenis';
import { SplitText } from '@/components/ui/SplitText';
import styles from './ConfiguratorSection.module.css';

/**
 * 08 — CONFIGURATION STUDIO. Not a shop: four quiet groups and a row of swatches.
 * Every choice recolours the real materials of the 3D model (easing, never snapping)
 * and the camera drifts to the part you are choosing.
 */
export function ConfiguratorSection() {
  const ref = useRef<HTMLElement>(null);
  const register = useStageSection('configurator');
  const cfg = useConfig();

  useScrub(ref, (tl, q) => {
    tl.fromTo(q('[data-fade]'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.09, stagger: 0.015 }, 0.02);
    tl.to(q('[data-fade]'), { opacity: 0, y: -10, duration: 0.07 }, 0.93);
  });

  const cat = CATEGORIES.find((c) => c.id === cfg.category) ?? CATEGORIES[0];
  const active = cat.options.find((o) => o.id === cfg.selection[cat.id]) ?? cat.options[0];

  const code = CATEGORIES.map((c) => {
    const o = c.options.find((x) => x.id === cfg.selection[c.id]) ?? c.options[0];
    return o.name.slice(0, 3).toUpperCase();
  }).join('·');

  return (
    <section id="configurator" ref={(el) => { ref.current = el; register(el); }} className={`stage-section ${styles.section}`}>
      <div className="stage-section__pin">
        <div className={styles.head} data-fade>
          <span className="mono mono--faint">08 — Configure</span>
          <SplitText as="h2" text="Make it yours." className={`display ${styles.title}`} />
        </div>

        {/* groups */}
        <div className={styles.groups} role="tablist" aria-label="Configuration groups" data-fade>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={c.id === cfg.category}
              className={`${styles.group} ${c.id === cfg.category ? styles.groupOn : ''}`}
              onClick={() => setCategory(c.id)}
            >
              <i className="mono">{c.index}</i>
              <span className="mono">{c.label}</span>
            </button>
          ))}
        </div>

        {/* options */}
        <div className={styles.options} data-fade>
          <div className={styles.swatches} role="radiogroup" aria-label={cat.label}>
            {cat.options.map((o) => {
              const on = o.id === active.id;
              return (
                <button
                  key={o.id}
                  role="radio"
                  aria-checked={on}
                  aria-label={o.name}
                  className={`${styles.swatch} ${on ? styles.swatchOn : ''}`}
                  onClick={() => selectOption(cat.id, o.id)}
                >
                  <span className={styles.chip} style={{ background: o.color }} />
                </button>
              );
            })}
          </div>
          <div className={styles.readout} aria-live="polite">
            <span className={`display ${styles.name}`}>{active.name}</span>
            <span className="mono mono--faint">{active.note}</span>
          </div>
        </div>

        {/* summary */}
        <div className={styles.summary} data-fade>
          <ul>
            {CATEGORIES.map((c) => {
              const o = c.options.find((x) => x.id === cfg.selection[c.id]) ?? c.options[0];
              return (
                <li key={c.id} className="mono">
                  <span className="mono--faint">{c.label}</span>
                  <span>{o.name}</span>
                </li>
              );
            })}
          </ul>
          <span className="mono mono--faint">Build {code}</span>
          <button className={`mono ${styles.reserve}`} onClick={() => scrollToTarget('#final')}>
            Reserve this build <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
