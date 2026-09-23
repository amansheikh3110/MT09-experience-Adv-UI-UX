'use client';

import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import { MODEL_CREDIT } from '@/config/assets';
import { PRODUCT } from '@/config/content';
import { useScrub, useStageSection } from '@/hooks/useScrub';
import { scrollToTarget } from '@/scroll/lenis';
import { SplitText } from '@/components/ui/SplitText';
import styles from './CTASection.module.css';

/**
 * 09 — FINAL RETURN. Back to the dark room. The lights step down one by one, the shutter
 * lowers, and only the machine — headlights on, turning very slowly — is left.
 * Then a single question and two quiet actions.
 */
export function CTASection() {
  const ref = useRef<HTMLElement>(null);
  const register = useStageSection('final');

  useScrub(ref, (tl, q) => {
    gsap.set(q('[data-q] .c'), { yPercent: 115 });
    tl.to(q('[data-q] .c'), { yPercent: 0, duration: 0.14, stagger: 0.012, ease: 'power3.out' }, 0.58);
    tl.fromTo(q('[data-k]'), { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.56);
    tl.fromTo(q('[data-act]'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.08, stagger: 0.03 }, 0.74);
    tl.fromTo(q('[data-foot]'), { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.86);
    // the note that sets the mood while the room darkens
    tl.fromTo(q('[data-mood]'), { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.12);
    tl.to(q('[data-mood]'), { opacity: 0, duration: 0.08 }, 0.42);
  });

  // restrained "magnetic" pull on the two actions — a few pixels, only when the cursor is close
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(pointer: coarse)').matches) return;
    const btns = Array.from(el.querySelectorAll<HTMLElement>('[data-act]'));
    const set = btns.map((b) => ({ x: gsap.quickTo(b, 'x', { duration: 0.6, ease: 'power3.out' }), y: gsap.quickTo(b, 'y', { duration: 0.6, ease: 'power3.out' }) }));
    const move = (e: PointerEvent) => {
      btns.forEach((b, i) => {
        const r = b.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy);
        const k = d < 140 ? (1 - d / 140) * 0.28 : 0;
        set[i].x(dx * k);
        set[i].y(dy * k);
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  return (
    <section id="final" ref={(el) => { ref.current = el; register(el); }} className={`stage-section ${styles.section}`}>
      <div className="stage-section__pin">
        <span className={`mono mono--faint ${styles.mood}`} data-mood>09 — Return · the room powers down</span>

        <div className={styles.center}>
          <span className="mono mono--faint" data-k>{PRODUCT.name} — {PRODUCT.edition}</span>
          <div data-q>
            <SplitText as="h2" text="Ready to move?" className={`display ${styles.q}`} />
          </div>
          <div className={styles.actions}>
            <button className={`mono ${styles.action}`} data-act onClick={() => scrollToTarget('#design')}>
              <span>Explore</span>
              <i aria-hidden>→</i>
            </button>
            <button className={`mono ${styles.action}`} data-act onClick={() => scrollToTarget('#configurator')}>
              <span>Configure</span>
              <i aria-hidden>→</i>
            </button>
          </div>
        </div>

        <footer className={styles.foot} data-foot>
          <span className="mono mono--faint">Concept launch film · not an offer for sale.</span>
          <span className="mono mono--faint">
            Developed by <a href="https://portfolio-website-mu-bay-12.vercel.app/" target="_blank" rel="noreferrer noopener">Aman Sheikh</a>
          </span>
          <span className="mono mono--faint">
            3D model {MODEL_CREDIT.text} ·{' '}
            <a href={MODEL_CREDIT.href} target="_blank" rel="noreferrer noopener">Sketchfab</a> ·{' '}
            <a href={MODEL_CREDIT.licenseHref} target="_blank" rel="noreferrer noopener">{MODEL_CREDIT.license}</a>
          </span>
        </footer>
      </div>
    </section>
  );
}
