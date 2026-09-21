'use client';

import gsap from 'gsap';
import { useRef, useSyncExternalStore } from 'react';
import { PRODUCT } from '@/config/content';
import { hudStore } from '@/lib/stage';
import { useScrub, useStageSection } from '@/hooks/useScrub';
import { SplitText } from '@/components/ui/SplitText';
import styles from './MachineSection.module.css';

/**
 * 01 — THE MACHINE.
 * The bike stays the star; the camera (config/shots.ts → machine) and the words
 * are both driven by the same scroll progress.
 */
export function MachineSection() {
  const ref = useRef<HTMLElement>(null);
  const register = useStageSection('machine');
  const status = useSyncExternalStore(hudStore.subscribe, () => hudStore.get().status, () => 'STANDBY');
  const live = status === 'READY' || status === 'LIVE';

  useScrub(ref, (tl, q) => {
    // masked characters start hidden (explicit set — staggered fromTo only primes the first target)
    gsap.set(q('[data-a] .c, [data-b] .c'), { yPercent: 115 });

    // scroll cue is only for the very first moments
    tl.fromTo(q('[data-cue]'), { opacity: 1 }, { opacity: 0, duration: 0.05 }, 0.01);
    tl.fromTo(q('[data-tag]'), { opacity: 1 }, { opacity: 0, duration: 0.06 }, 0.04);

    // NOT TRANSPORT.
    tl.to(q('[data-a] .c'), { yPercent: 0, duration: 0.1, stagger: 0.006, ease: 'power3.out' }, 0.11);
    tl.fromTo(q('[data-a-kick]'), { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.11);
    tl.to(q('[data-a-kick]'), { opacity: 0, duration: 0.04 }, 0.4);
    tl.fromTo(q('[data-a-sub]'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.06 }, 0.2);
    tl.to(q('[data-a] .c'), { yPercent: -115, duration: 0.08, stagger: 0.004, ease: 'power3.in' }, 0.4);
    tl.to(q('[data-a-sub]'), { opacity: 0, duration: 0.04 }, 0.4);

    // AN INSTRUMENT.
    tl.to(q('[data-b] .c'), { yPercent: 0, duration: 0.1, stagger: 0.006, ease: 'power3.out' }, 0.47);
    tl.fromTo(q('[data-b-sub]'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.06 }, 0.56);
    tl.to(q('[data-b] .c'), { yPercent: -115, duration: 0.08, stagger: 0.004, ease: 'power3.in' }, 0.79);
    tl.to(q('[data-b-sub]'), { opacity: 0, duration: 0.04 }, 0.79);

    // closing line
    tl.fromTo(q('[data-c]'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.06 }, 0.86);
    tl.fromTo(q('[data-c-rule]'), { scaleX: 0 }, { scaleX: 1, duration: 0.08 }, 0.87);
  });

  return (
    <section id="machine" ref={(el) => { ref.current = el; register(el); }} className={`stage-section ${styles.section}`}>
      <div className="stage-section__pin">
        {/* hero: nothing but a quiet tag + scroll cue */}
        <div className={`${styles.gate} ${live ? styles.gateOn : ''}`}>
        <div className={styles.tag} data-tag>
          <span className="mono">{PRODUCT.name}</span>
          <span className="mono mono--faint">{PRODUCT.year} — {PRODUCT.edition}</span>
        </div>
        <div className={styles.cue} data-cue>
          <span className="mono mono--dim">Scroll</span>
          <span className={styles.cueLine} />
        </div>
        </div>

        <div className={`${styles.block} ${styles.blockA}`}>
          <span className="mono mono--faint" data-a-kick>01 — The machine</span>
          <div data-a>
            <SplitText as="h2" text="Not transport." className={`display ${styles.big}`} />
          </div>
          <p className={`lede ${styles.sub}`} data-a-sub>
            It was never meant to get you somewhere. It was meant to make the getting there the point.
          </p>
        </div>

        <div className={`${styles.block} ${styles.blockB}`}>
          <div data-b>
            <SplitText as="h2" text="An instrument." className={`display ${styles.big}`} />
          </div>
          <p className={`lede ${styles.sub}`} data-b-sub>
            Tuned like something you play. Every proportion, every surface, every gram answers to a single question: how does it feel at the limit?
          </p>
        </div>

        <div className={styles.closing} data-c>
          <span className={styles.rule} data-c-rule />
          <div className={styles.closingRow}>
            <span className="display" style={{ fontSize: 'clamp(1.1rem,1.6vw,1.5rem)', letterSpacing: '-0.02em' }}>Built for motion.</span>
            <span className="mono mono--dim">890 cc · 119 hp · 193 kg</span>
          </div>
        </div>
      </div>
    </section>
  );
}
