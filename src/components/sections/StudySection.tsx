'use client';

import { useRef } from 'react';
import { Annotations } from '@/components/ui/Annotations';
import { SplitText } from '@/components/ui/SplitText';
import { useScrub, useStageSection } from '@/hooks/useScrub';
import styles from './StudySection.module.css';

/**
 * 03 — PRODUCT STUDY. Back inside the room, the real-time model becomes a design laboratory:
 * the camera circles the machine on scroll while thin, precise annotations lock onto it.
 */
export function StudySection() {
  const ref = useRef<HTMLElement>(null);
  const register = useStageSection('study');

  useScrub(ref, (tl, q) => {
    tl.fromTo(q('[data-head]'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.04 }, 0.01);
    tl.to(q('[data-head]'), { opacity: 0, duration: 0.05 }, 0.9);
  });

  return (
    <section id="study" ref={(el) => { ref.current = el; register(el); }} className={`stage-section ${styles.section}`}>
      <div className="stage-section__pin">
        <div className={styles.head} data-head>
          <span className="mono mono--faint">03 — Product study</span>
          <SplitText as="h2" text="Six systems. One machine." className={`display ${styles.title}`} />
        </div>
        <Annotations section="study" />
      </div>
    </section>
  );
}
