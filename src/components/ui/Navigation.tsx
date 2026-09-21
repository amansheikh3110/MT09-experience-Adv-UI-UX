'use client';

import gsap from 'gsap';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { CHAPTERS, PRODUCT } from '@/config/content';
import { MODEL_CREDIT } from '@/config/assets';
import { hudStore, stage } from '@/lib/stage';
import { lockScroll, scrollToTarget, unlockScroll } from '@/scroll/lenis';
import styles from './Navigation.module.css';

/**
 * Navigation that almost disappears into the environment:
 *   • a hairline top bar (wordmark · five chapters · menu) that only appears after the reveal
 *   • a right-edge rail of tiny ticks — long + amber where you are, labels on hover
 *   • a full-screen chapter index that opens like a shutter
 */
export function Navigation() {
  const hud = useSyncExternalStore(hudStore.subscribe, hudStore.get, hudStore.get);
  const live = hud.status === 'READY' || hud.status === 'LIVE';
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const items = useRef<Record<string, HTMLElement[]>>({});

  const reg = (id: string) => (el: HTMLElement | null) => {
    if (!el) return;
    const list = (items.current[id] ||= []);
    if (!list.includes(el)) list.push(el);
  };

  // which chapter is under the middle of the screen? — updates classes directly, no re-render
  useEffect(() => {
    let raf = 0;
    let current = '';
    const tick = () => {
      const mid = window.innerHeight * 0.5;
      let found = '';
      for (const c of CHAPTERS) {
        const el = document.getElementById(c.id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) {
          found = c.id;
          break;
        }
      }
      if (found && found !== current) {
        current = found;
        Object.entries(items.current).forEach(([id, els]) => els.forEach((e) => e.toggleAttribute('data-active', id === found)));
        hudStore.set({ chapter: found });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const go = useCallback((id: string) => {
    setOpen(false);
    // the menu locks scrolling while open — release it first or Lenis ignores the jump
    if (stage.introDone) unlockScroll();
    scrollToTarget(`#${id}`);
  }, []);

  // shutter-style open / close
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    if (open) {
      lockScroll();
      gsap.set(el, { display: 'grid' });
      gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'power3.inOut' });
      gsap.fromTo(el.querySelectorAll('[data-row]'), { yPercent: 105 }, { yPercent: 0, duration: 0.9, stagger: 0.045, delay: 0.25, ease: 'power3.out' });
      gsap.fromTo(el.querySelectorAll('[data-fade]'), { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.6 });
    } else if (getComputedStyle(el).display !== 'none') {
      gsap.to(el, {
        clipPath: 'inset(0 0 100% 0)',
        duration: 0.7,
        ease: 'power3.inOut',
        onComplete: () => {
          gsap.set(el, { display: 'none' });
          if (stage.introDone) unlockScroll();
        },
      });
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const top = CHAPTERS.filter((c) => c.nav);

  return (
    <>
      <header className={`${styles.bar} ${live ? styles.live : ''}`}>
        <a href="#machine" onClick={(e) => { e.preventDefault(); go('machine'); }} className={styles.brand} aria-label="Back to the top">
          <span className={styles.mark} />
          <span className="mono">{PRODUCT.name}</span>
        </a>

        <nav className={styles.links} aria-label="Chapters">
          {top.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              ref={reg(c.id)}
              className={`mono ${styles.link}`}
              onClick={(e) => { e.preventDefault(); go(c.id); }}
            >
              <i>{c.index}</i>
              {c.nav}
            </a>
          ))}
        </nav>

        <button className={styles.menuBtn} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'}>
          <span className="mono">{open ? 'Close' : 'Menu'}</span>
          <span className={`${styles.burger} ${open ? styles.burgerOpen : ''}`}>
            <span />
            <span />
          </span>
        </button>
      </header>

      {/* chapter rail */}
      <nav className={`${styles.rail} ${live ? styles.live : ''}`} aria-label="Chapter progress">
        {CHAPTERS.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            ref={reg(c.id)}
            className={styles.tick}
            onClick={(e) => { e.preventDefault(); go(c.id); }}
            aria-label={c.label}
          >
            <span className={`mono ${styles.tickLabel}`}>
              <i>{c.index}</i> {c.label}
            </span>
            <span className={styles.tickLine} />
          </a>
        ))}
      </nav>

      {/* full-screen index */}
      <div ref={menuRef} className={styles.menu} style={{ display: 'none' }} role="dialog" aria-modal="true" aria-label="Chapters">
        <ol className={styles.list}>
          {CHAPTERS.map((c) => (
            <li key={c.id} className={styles.row}>
              <a href={`#${c.id}`} onClick={(e) => { e.preventDefault(); go(c.id); }} className={styles.rowLink}>
                <span className={styles.rowMask}>
                  <span data-row className={styles.rowInner}>
                    <i className="mono">{c.index}</i>
                    <span className="display">{c.label}</span>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ol>
        <div className={styles.menuFoot} data-fade>
          <span className="mono mono--dim">{PRODUCT.name} — {PRODUCT.edition}</span>
          <span className="mono mono--faint">
            3D model {MODEL_CREDIT.text} · <a href={MODEL_CREDIT.licenseHref} target="_blank" rel="noreferrer noopener">{MODEL_CREDIT.license}</a>
          </span>
        </div>
      </div>
    </>
  );
}
