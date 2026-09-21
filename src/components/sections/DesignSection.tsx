'use client';

import { useRef } from 'react';
import { CROPS } from '@/config/assets';
import { useEditorial } from '@/hooks/useScrub';
import { Plate } from '@/components/ui/Plate';
import { SplitText } from '@/components/ui/SplitText';
import styles from './DesignSection.module.css';

/**
 * 02 — DESIGN. An editorial sequence, not a gallery: the supplied renders are cropped,
 * overlapped and pushed at different speeds like pages of a campaign book.
 * Every label sits on a real part of the machine (source-space coordinates).
 */
export function DesignSection() {
  const ref = useRef<HTMLElement>(null);
  useEditorial(ref);

  return (
    <section id="design" ref={ref} className={`opaque ${styles.section}`}>
      {/* ─ 1 · statement + three-quarter ─────────────────────────────── */}
      <div className={`${styles.scene} ${styles.s1}`}>
        <div className={styles.s1Head}>
          <span className="mono mono--faint">02 — Design</span>
          <SplitText as="h2" text="Form is not decoration." className={`display ${styles.statement}`} />
        </div>
        <div className={styles.s1Plate} data-speed="0.05">
          <Plate
            id="threeQuarter"
            crop={CROPS.tqFull}
            sizes="(max-width: 900px) 100vw, 86vw"
            drift={0.03}
            priority
            index="02.1"
            caption="Three-quarter · left"
            hotspots={[
              { x: 0.464, y: 0.266, title: 'Tank', detail: 'Sculpted shoulders · 14 L', dir: 'ne', d: 70, t: 60 },
              { x: 0.6, y: 0.168, title: 'Cockpit', detail: 'Flyscreen · TFT display', dir: 'ne', d: 56, t: 50 },
              { x: 0.179, y: 0.616, title: 'Exhaust', detail: 'Carbon canister', dir: 'sw', d: 64, t: 46 },
              { x: 0.743, y: 0.735, title: 'Front brake', detail: 'Dual floating discs', dir: 'se', d: 58, t: 44 },
              { x: 0.243, y: 0.328, title: 'Tail', detail: 'Cut-away seat unit', dir: 'nw', d: 60, t: 50 },
            ]}
          />
        </div>
        <p className={`lede ${styles.s1Note}`}>
          Nothing on this machine is there to be looked at. Everything is there to be used — and it just happens to look like this.
        </p>
      </div>

      {/* ─ 2 · profile strip with a wheelbase dimension ──────────────── */}
      <div className={`${styles.scene} ${styles.s2}`}>
        <div className={styles.s2Plate}>
          <Plate
            id="side"
            crop={CROPS.sideStrip}
            sizes="100vw"
            drift={0.035}
            index="02.2"
            caption="Profile · left"
            measures={[{ a: [0.19, 0.715], b: [0.786, 0.706], label: 'Wheelbase 1,475 mm', offset: 0 }]}
            hotspots={[
              { x: 0.245, y: 0.52, title: 'Fork', detail: 'Inverted · fully adjustable', dir: 'nw', d: 60, t: 50 },
              { x: 0.44, y: 0.257, title: 'Tank', detail: 'Knee-recessed', dir: 'ne', d: 50, t: 44 },
              { x: 0.457, y: 0.646, title: 'Engine', detail: 'Stressed member', dir: 'sw', d: 50, t: 40 },
              { x: 0.714, y: 0.359, title: 'Tail', detail: 'Single-piece', dir: 'ne', d: 60, t: 44 },
            ]}
          />
        </div>
        <div className={styles.s2Text}>
          <SplitText as="h3" text="Every surface has a purpose." className={`display ${styles.mid}`} />
        </div>
      </div>

      {/* ─ 3 · front: two crops, two speeds ──────────────────────────── */}
      <div className={`${styles.scene} ${styles.s3}`}>
        <div className={styles.s3A} data-speed="0.06">
          <Plate
            id="front"
            crop={CROPS.frontCockpit}
            sizes="(max-width: 900px) 100vw, 60vw"
            drift={0.04}
            index="02.3"
            caption="Frontal signature"
            hotspots={[
              { x: 0.357, y: 0.15, title: 'Hand guard', detail: 'Composite', dir: 'nw', d: 46, t: 40 },
              { x: 0.493, y: 0.125, title: 'Flyscreen', detail: 'Wind-tunnel tuned', dir: 'ne', d: 50, t: 42 },
              { x: 0.489, y: 0.248, title: 'Headlight', detail: 'Dual LED · signature DRL', dir: 'se', d: 56, t: 44 },
            ]}
          />
        </div>
        <div className={styles.s3B} data-speed="-0.1">
          <Plate
            id="front"
            crop={CROPS.frontLower}
            sizes="(max-width: 900px) 70vw, 30vw"
            drift={0.05}
            index="02.4"
            hotspots={[
              { x: 0.5, y: 0.5, title: 'Radiator', detail: 'Side-vented', dir: 'ne', d: 40, t: 34 },
              { x: 0.489, y: 0.8, title: 'Front tyre', detail: '120/70 ZR17', dir: 'se', d: 44, t: 34 },
            ]}
          />
        </div>
        <div className={styles.s3Text}>
          <span className="mono mono--faint">Signature</span>
          <p className={styles.para}>
            The face was drawn last and it was drawn once. Two lamps, one line, no explanation required.
          </p>
        </div>
      </div>

      {/* ─ 4 · cockpit panorama ──────────────────────────────────────── */}
      <div className={`${styles.scene} ${styles.s4}`}>
        <div className={styles.s4Plate}>
          <Plate
            id="threeQuarter"
            crop={CROPS.tqCockpit}
            sizes="100vw"
            drift={0.04}
            index="02.5"
            caption="Cockpit"
            hotspots={[
              { x: 0.496, y: 0.04, title: 'Mirror', detail: 'Bar-end profile', dir: 'se', d: 50, t: 44 },
              { x: 0.579, y: 0.102, title: 'Reservoir', detail: 'Machined cap', dir: 'ne', d: 44, t: 40 },
              { x: 0.6, y: 0.17, title: 'Screen', detail: 'Six-axis IMU readout', dir: 'se', d: 50, t: 42 },
            ]}
          />
        </div>
      </div>

      {/* ─ 5 · wheel + rear ──────────────────────────────────────────── */}
      <div className={`${styles.scene} ${styles.s5}`}>
        <div className={styles.s5A} data-speed="-0.06">
          <Plate
            id="side"
            crop={CROPS.sideFrontWheel}
            sizes="(max-width: 900px) 80vw, 34vw"
            drift={0.04}
            index="02.6"
            caption="Front wheel"
            hotspots={[
              { x: 0.19, y: 0.715, title: 'Disc', detail: 'Ø 298 mm · floating', dir: 'ne', d: 46, t: 38 },
              { x: 0.245, y: 0.53, title: 'Fork leg', detail: 'Anodised', dir: 'ne', d: 40, t: 30 },
            ]}
          />
        </div>
        <div className={styles.s5B} data-speed="0.08">
          <Plate
            id="threeQuarter"
            crop={CROPS.tqRear}
            sizes="(max-width: 900px) 100vw, 44vw"
            drift={0.05}
            index="02.7"
            caption="Rear · left"
            hotspots={[
              { x: 0.179, y: 0.616, title: 'Exhaust', detail: 'Carbon · titanium', dir: 'ne', d: 50, t: 40 },
              { x: 0.179, y: 0.724, title: 'Rear wheel', detail: '180/55 ZR17', dir: 'se', d: 44, t: 36 },
            ]}
          />
        </div>
        <div className={styles.s5Text}>
          <SplitText as="h3" text="Every gram argued for." className={`display ${styles.mid}`} />
        </div>
      </div>
    </section>
  );
}
