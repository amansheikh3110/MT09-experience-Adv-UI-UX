'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, useRef } from 'react';
import { CROPS, Crop } from '@/config/assets';
import { Hotspot, Plate } from '@/components/ui/Plate';
import styles from './MaterialsSection.module.css';

gsap.registerPlugin(ScrollTrigger);

type Material = {
  id: string;
  idx: string;
  name: string;
  spec: string;
  line: string;
  plate: { id: 'threeQuarter' | 'side' | 'front'; crop: Crop; hotspots: Hotspot[] };
  /** panel width in vw (desktop) */
  w: number;
  /** vertical offset in vh — gives the row a rhythm instead of a shelf */
  y: number;
};

const MATERIALS: Material[] = [
  {
    id: 'paint', idx: '06.1', name: 'Paint', spec: 'Pearl · three-stage', w: 46, y: -4,
    line: 'Forty microns of lacquer over a metallic base. Depth you could lose a finger in.',
    plate: { id: 'threeQuarter', crop: CROPS.tqTank, hotspots: [{ x: 0.464, y: 0.266, title: 'Clearcoat', detail: '40 µm', dir: 'ne', d: 40, t: 40 }] },
  },
  {
    id: 'metal', idx: '06.2', name: 'Metal', spec: 'Forged · 7075-T6', w: 34, y: 8,
    line: 'Machined from solid, then anodised. Every hole in the disc is chamfered by hand-set tooling.',
    plate: { id: 'side', crop: CROPS.sideDisc, hotspots: [{ x: 0.19, y: 0.715, title: 'Floating disc', detail: 'Ø 298 mm', dir: 'ne', d: 40, t: 34 }] },
  },
  {
    id: 'carbon', idx: '06.3', name: 'Carbon', spec: 'Twill weave · 2×2', w: 40, y: -8,
    line: 'Structural where it must be, sculptural where it need not. Cured, sanded, cleared — never painted over.',
    plate: { id: 'threeQuarter', crop: CROPS.tqExhaust, hotspots: [{ x: 0.19, y: 0.63, title: 'Carbon canister', detail: 'Titanium header', dir: 'ne', d: 40, t: 34 }] },
  },
  {
    id: 'rubber', idx: '06.4', name: 'Rubber', spec: 'Dual compound', w: 17, y: 4,
    line: 'A firm centre for the straight, a soft shoulder for the corner. The only part that touches the world.',
    plate: { id: 'front', crop: CROPS.frontTyre, hotspots: [{ x: 0.49, y: 0.7, title: 'Contact patch', dir: 'ne', d: 34, t: 28 }] },
  },
  {
    id: 'machined', idx: '06.5', name: 'Machined', spec: 'Chain · sprocket', w: 42, y: -2,
    line: 'Sealed links. Every tooth cut to a tolerance you only ever feel as silence.',
    plate: { id: 'side', crop: CROPS.sideChain, hotspots: [{ x: 0.785, y: 0.71, title: 'Rear sprocket', detail: 'Ø 178 mm', dir: 'nw', d: 40, t: 34 }] },
  },
  {
    id: 'glass', idx: '06.6', name: 'Glass', spec: 'Optical polycarbonate', w: 36, y: 8,
    line: 'A lens is a decision about where light goes. These two go exactly one place.',
    plate: { id: 'front', crop: CROPS.frontHeadlight, hotspots: [{ x: 0.489, y: 0.25, title: 'Dual LED optic', dir: 'ne', d: 40, t: 34 }] },
  },
];

/**
 * 06 — MATERIALS. Six macro crops of the supplied renders on a pinned horizontal run.
 * The pictures lean toward the cursor (a few pixels, heavily damped) so the surfaces feel
 * physical. On phones the run turns vertical.
 */
export function MaterialsSection() {
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = ref.current;
    const rail = track.current;
    if (!section || !rail) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 901px)', () => {
        const dist = () => Math.max(0, rail.scrollWidth - window.innerWidth);
        gsap.to(rail, {
          x: () => -dist(),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${dist()}`,
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // cursor "lean" — quickTo keeps it buttery, amplitude keeps it honest
        const imgs = gsap.utils.toArray<HTMLElement>('figure img', rail);
        const qx = imgs.map((i) => gsap.quickTo(i, 'x', { duration: 1.1, ease: 'power3.out' }));
        const qy = imgs.map((i) => gsap.quickTo(i, 'y', { duration: 1.1, ease: 'power3.out' }));
        const onMove = (e: PointerEvent) => {
          if (e.pointerType === 'touch') return;
          const nx = (e.clientX / window.innerWidth - 0.5) * 2;
          const ny = (e.clientY / window.innerHeight - 0.5) * 2;
          qx.forEach((f) => f(-nx * 14));
          qy.forEach((f) => f(-ny * 9));
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        return () => window.removeEventListener('pointermove', onMove);
      });

      // the heading lines rise as the section is reached (all viewports)
      gsap.from('[data-mat-head] > *', {
        yPercent: 30,
        opacity: 0,
        stagger: 0.08,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 70%', toggleActions: 'play none none reverse' },
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section id="materials" ref={ref} className={`opaque ${styles.section}`}>
      <div className={styles.viewport}>
        <div ref={track} className={styles.track}>
          <div className={styles.intro} data-mat-head>
            <span className="mono mono--faint">06 — Materials</span>
            <h2 className={`display ${styles.big}`}>Touch.</h2>
            <p className="lede">Six surfaces, seen closer than the eye ever gets. Keep scrolling — and move your hand.</p>
          </div>

          {MATERIALS.map((m) => (
            <article key={m.id} className={styles.panel} style={{ ['--w' as string]: `${m.w}vw`, ['--y' as string]: `${m.y}vh` }}>
              <header className={styles.meta}>
                <span className="mono mono--dim">{m.idx}</span>
                <span className="mono mono--faint">{m.spec}</span>
              </header>
              <Plate
                id={m.plate.id}
                crop={m.plate.crop}
                hotspots={m.plate.hotspots}
                sizes="(max-width: 900px) 100vw, 46vw"
                reveal={false}
                className={styles.plate}
              />
              <footer className={styles.foot}>
                <h3 className={`display ${styles.name}`}>{m.name}</h3>
                <p className={`lede ${styles.line}`}>{m.line}</p>
              </footer>
            </article>
          ))}

          <div className={styles.outro}>
            <span className="mono mono--faint">Next — the environment</span>
          </div>
        </div>
      </div>
    </section>
  );
}
