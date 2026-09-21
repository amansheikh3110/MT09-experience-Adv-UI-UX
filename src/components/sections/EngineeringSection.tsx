'use client';

import gsap from 'gsap';
import { useRef } from 'react';
import { CROPS, Crop } from '@/config/assets';
import { useScrub, useStageSection } from '@/hooks/useScrub';
import { Hotspot, Plate } from '@/components/ui/Plate';
import styles from './EngineeringSection.module.css';

type Chapter = {
  id: string;
  idx: string;
  title: string;
  lead: string;
  body: string;
  specs: [string, string][];
  plate: { id: 'side' | 'front' | 'threeQuarter'; crop: Crop; hotspots: Hotspot[] };
};

const CHAPTERS: Chapter[] = [
  {
    id: 'engine', idx: '05.1', title: 'Engine', lead: 'Three cylinders. Uneven on purpose.',
    body: 'A crossplane crank fires at irregular intervals — the note of a twin, the pull of a four. It is bolted in as a stressed member, so it works as structure, not cargo.',
    specs: [['Displacement', '890 cc'], ['Layout', 'Crossplane triple'], ['Peak power', '119 hp'], ['Torque', '93 Nm']],
    plate: { id: 'side', crop: CROPS.sideEngine, hotspots: [{ x: 0.457, y: 0.646, title: 'Clutch cover', dir: 'ne', d: 40, t: 30 }, { x: 0.385, y: 0.72, title: 'Header', dir: 'sw', d: 36, t: 26 }] },
  },
  {
    id: 'cooling', idx: '05.2', title: 'Cooling', lead: 'Heat is the enemy of repeatability.',
    body: 'A side-vented radiator with a two-stage fan keeps the water temperature flat through a whole day of hard use — and lets the engine map stay aggressive.',
    specs: [['Circuit', 'Liquid, two-stage'], ['Airflow', '+14 %'], ['Fan', 'Thermostatic'], ['Oil', 'Cooled']],
    plate: { id: 'front', crop: CROPS.frontRadiator, hotspots: [{ x: 0.5, y: 0.5, title: 'Core', dir: 'ne', d: 36, t: 26 }, { x: 0.585, y: 0.44, title: 'Shroud', dir: 'se', d: 32, t: 24 }] },
  },
  {
    id: 'suspension', idx: '05.3', title: 'Suspension', lead: 'The road is only as honest as this.',
    body: 'A fully adjustable inverted fork up front, an electronic shock behind. Both are damped for feel first and numbers second.',
    specs: [['Fork', '43 mm inverted'], ['Travel', '130 mm'], ['Rear', 'Electronic'], ['Rake', '25°']],
    plate: { id: 'threeQuarter', crop: CROPS.tqFrontWheel, hotspots: [{ x: 0.69, y: 0.6, title: 'Fork leg', dir: 'nw', d: 34, t: 24 }, { x: 0.75, y: 0.515, title: 'Fender', dir: 'ne', d: 30, t: 22 }] },
  },
  {
    id: 'brakes', idx: '05.4', title: 'Brakes', lead: 'Stopping is half the performance.',
    body: 'Twin floating discs with radial-mount four-piston calipers and cornering ABS. Lever feel is progressive right to the last millimetre.',
    specs: [['Discs', '2 × Ø 298 mm'], ['Calipers', 'Radial · 4-piston'], ['ABS', 'Cornering'], ['Lines', 'Braided']],
    plate: { id: 'side', crop: CROPS.sideDisc, hotspots: [{ x: 0.19, y: 0.715, title: 'Disc', dir: 'nw', d: 34, t: 22 }, { x: 0.238, y: 0.708, title: 'Caliper', dir: 'ne', d: 34, t: 22 }] },
  },
  {
    id: 'drive', idx: '05.5', title: 'Drive', lead: 'The last metre of power.',
    body: 'A sealed-link chain, a lightweight cast swingarm and a wheelbase that puts the weight where the rear tyre can use it.',
    specs: [['Final drive', 'Chain'], ['Swingarm', 'Cast aluminium'], ['Wheelbase', '1,475 mm'], ['Slipper clutch', 'Yes']],
    plate: { id: 'side', crop: CROPS.sideChain, hotspots: [{ x: 0.7, y: 0.62, title: 'Chain', dir: 'ne', d: 34, t: 24 }, { x: 0.785, y: 0.71, title: 'Sprocket', dir: 'se', d: 32, t: 24 }] },
  },
  {
    id: 'cockpit', idx: '05.6', title: 'Cockpit', lead: 'Everything you need. Nothing you do not.',
    body: 'A flat, glare-free display, a bar that puts your weight over the front, and switchgear you can find in the dark with a glove on.',
    specs: [['Display', 'TFT · 5 in'], ['Modes', '4 riding modes'], ['IMU', '6-axis'], ['Quickshifter', 'Up / down']],
    plate: { id: 'threeQuarter', crop: CROPS.tqCockpit, hotspots: [{ x: 0.579, y: 0.102, title: 'Reservoir', dir: 'se', d: 30, t: 22 }, { x: 0.6, y: 0.17, title: 'Screen', dir: 'ne', d: 30, t: 22 }] },
  },
];

const N = CHAPTERS.length;
const slot = (i: number) => 0.04 + i * 0.16;

/**
 * 05 — ENGINEERING. Progressive discovery: the camera flies into a different area of the real
 * model per chapter while the copy and a reference plate cross-fade. Chapters are pure scroll
 * position — scrub back and you fly back out.
 */
export function EngineeringSection() {
  const ref = useRef<HTMLElement>(null);
  const register = useStageSection('engineering');

  useScrub(ref, (tl, q) => {
    gsap.set(q('[data-ch]'), { opacity: 0 });
    gsap.set(q('[data-up]'), { yPercent: 60, opacity: 0 });
    const plates = q('[data-ch] figure') as HTMLElement[];
    const items = q('[data-item]') as HTMLElement[];
    const names = q('[data-name]') as HTMLElement[];

    CHAPTERS.forEach((c, i) => {
      const s = slot(i);
      const ch = `[data-ch="${c.id}"]`;
      tl.to(q(ch), { opacity: 1, duration: 0.02 }, s + 0.05);
      tl.to(q(`${ch} [data-up]`), { yPercent: 0, opacity: 1, duration: 0.045, stagger: 0.005, ease: 'power3.out' }, s + 0.045);
      if (i < N - 1) {
        tl.to(q(`${ch} [data-up]`), { yPercent: -40, opacity: 0, duration: 0.03, stagger: 0.003, ease: 'power2.in' }, s + 0.125);
        tl.to(q(ch), { opacity: 0, duration: 0.01 }, s + 0.153);
      }
    });

    // plates + progress list follow the active chapter (both directions)
    tl.eventCallback('onUpdate', () => {
      const p = tl.progress();
      let idx = Math.floor((p - 0.04) / 0.16);
      idx = Math.max(-1, Math.min(N - 1, idx));
      plates.forEach((el, i) => el.setAttribute('data-on', i === idx && p > slot(i) + 0.06 ? '1' : '0'));
      items.forEach((el, i) => el.toggleAttribute('data-active', i === idx));
      names.forEach((el, i) => el.toggleAttribute('data-active', i === idx));
    });
    tl.to(q('[data-fill]'), { scaleX: 1, duration: 0.96 }, 0.02);
  });

  return (
    <section id="engineering" ref={(el) => { ref.current = el; register(el); }} className={`stage-section ${styles.section}`}>
      <div className="stage-section__pin">
        <span className={`mono mono--faint ${styles.kicker}`}>05 — Engineering</span>

        {CHAPTERS.map((c) => (
          <article key={c.id} className={styles.chapter} data-ch={c.id}>
            <div className={styles.text}>
              <span className="mono mono--dim" data-up>{c.idx} — {c.title}</span>
              <h3 className={`display ${styles.title}`} data-up>{c.title}</h3>
              <p className={styles.lead} data-up>{c.lead}</p>
              <p className={`lede ${styles.body}`} data-up>{c.body}</p>
              <dl className={styles.specs} data-up>
                {c.specs.map(([k, v]) => (
                  <div key={k}>
                    <dt className="mono mono--faint">{k}</dt>
                    <dd className="mono">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className={styles.plate} data-up>
              <Plate
                id={c.plate.id}
                crop={c.plate.crop}
                hotspots={c.plate.hotspots}
                sizes="24vw"
                reveal={false}
                manual
                plain={false}
                caption="Reference render"
                index={c.idx}
              />
            </div>
          </article>
        ))}

        <div className={styles.progress}>
          <div className={styles.names}>
            {CHAPTERS.map((c) => (
              <span key={c.id} className="mono" data-name>
                <i>{c.idx.slice(-1)}</i>
                {c.title}
              </span>
            ))}
          </div>
          <span className={styles.bar}>
            <span className={styles.fill} data-fill />
          </span>
        </div>
      </div>
    </section>
  );
}
