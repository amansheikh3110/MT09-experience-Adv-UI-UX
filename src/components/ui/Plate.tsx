'use client';

import { CSSProperties, useEffect, useRef } from 'react';
import { CROPS, Crop, PICTURES, PictureId, pictureSrc, pictureSrcSet } from '@/config/assets';
import styles from './Plate.module.css';

/**
 * A "plate" is one supplied render, cropped in CSS, with precise technical annotations.
 *
 *   crop      [x, y, w, h] in fractions of the SOURCE picture (see config/assets.ts → CROPS)
 *   hotspots  positioned in SOURCE coordinates, so they stay glued to the right part of the
 *             motorcycle no matter how the crop, size or layout changes.
 *
 * Labels reveal (line draws, text settles) when the plate is on screen and retract when
 * it leaves — driven by visibility, so scrolling back up replays them.
 */

export type Hotspot = {
  /** position in source-picture fractions */
  x: number;
  y: number;
  title: string;
  detail?: string;
  /** which way the label leaves the point */
  dir?: 'ne' | 'nw' | 'se' | 'sw';
  /** diagonal length / horizontal tail, px */
  d?: number;
  t?: number;
};

export type Measure = {
  a: [number, number];
  b: [number, number];
  label: string;
  /** perpendicular offset of the dimension line, in % of the plate height (− = above) */
  offset?: number;
};

type Props = {
  id: PictureId;
  crop?: Crop | readonly number[];
  hotspots?: Hotspot[];
  measures?: Measure[];
  sizes?: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  /** vertical drift of the picture inside its frame while scrolling (data-drift, see useParallax) */
  drift?: number;
  /** zoom-out reveal on enter */
  reveal?: boolean;
  caption?: string;
  index?: string;
  /** hide the annotation layer (e.g. on tiny plates) */
  plain?: boolean;
  /** the parent drives `data-on` itself (pinned / cross-faded plates) */
  manual?: boolean;
};

export function Plate({
  id,
  crop = CROPS.tqFull,
  hotspots = [],
  measures = [],
  sizes = '100vw',
  priority = false,
  className = '',
  style,
  drift = 0,
  reveal = true,
  caption,
  index,
  plain = false,
  manual = false,
}: Props) {
  const pic = PICTURES[id];
  const [cx, cy, cw, ch] = crop as readonly number[];
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || plain || manual) return;
    const io = new IntersectionObserver(
      ([e]) => el.setAttribute('data-on', e.isIntersecting && e.intersectionRatio > 0.28 ? '1' : '0'),
      { threshold: [0, 0.28, 0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [plain, manual]);

  const aspect = (cw * pic.w) / (ch * pic.h);
  const at = (x: number, y: number) => ({ left: `${((x - cx) / cw) * 100}%`, top: `${((y - cy) / ch) * 100}%` });

  return (
    <figure
      ref={ref}
      className={`${styles.plate} ${className}`}
      style={{ aspectRatio: String(aspect), ...style }}
      data-on="0"
      data-reveal={reveal ? '' : undefined}
    >
      <div className={styles.frame} data-frame>
        <div className={styles.drift} data-drift={drift || undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.img}
            src={pictureSrc(pic, pic.widths[1])}
            srcSet={pictureSrcSet(pic)}
            sizes={sizes}
            alt={pic.alt}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            style={{
              width: `${100 / cw}%`,
              height: `${100 / ch}%`,
              left: `${(-cx / cw) * 100}%`,
              top: `${(-cy / ch) * 100}%`,
            }}
          />
        </div>
      </div>

      {!plain && (
        <div className={styles.layer} aria-hidden>
          {measures.map((m, i) => {
            const pct = (x: number, y: number) => [((x - cx) / cw) * 100, ((y - cy) / ch) * 100] as const;
            const [ax, ay] = pct(m.a[0], m.a[1]);
            const [bx, by] = pct(m.b[0], m.b[1]);
            const off = m.offset ?? -6;
            return (
              <div key={`m${i}`} className={styles.measure} style={{ ['--i' as string]: i + hotspots.length }}>
                <svg className={styles.measureSvg} width="100%" height="100%">
                  <line x1={`${ax}%`} y1={`${ay + off}%`} x2={`${bx}%`} y2={`${by + off}%`} className={styles.mLine} pathLength={1} />
                  <line x1={`${ax}%`} y1={`${ay}%`} x2={`${ax}%`} y2={`${ay + off}%`} className={styles.mTick} />
                  <line x1={`${bx}%`} y1={`${by}%`} x2={`${bx}%`} y2={`${by + off}%`} className={styles.mTick} />
                </svg>
                <span className={`mono ${styles.mLabel}`} style={{ left: `${(ax + bx) / 2}%`, top: `${(ay + by) / 2 + off}%` }}>
                  {m.label}
                </span>
              </div>
            );
          })}

          {hotspots.map((h, i) => {
            const dir = h.dir ?? 'ne';
            const sx = dir.endsWith('e') ? 1 : -1;
            const sy = dir.startsWith('n') ? 1 : -1;
            return (
              <div
                key={h.title + i}
                className={styles.hs}
                style={
                  {
                    ...at(h.x, h.y),
                    ['--sx' as string]: sx,
                    ['--sy' as string]: sy,
                    ['--d' as string]: `${h.d ?? 46}px`,
                    ['--t' as string]: `${h.t ?? 54}px`,
                    ['--i' as string]: i,
                  } as CSSProperties
                }
              >
                <span className={styles.dot} />
                <span className={styles.arm}>
                  <span className={styles.diag} />
                  <span className={styles.tail} />
                </span>
                <span className={`${styles.label} ${sx === 1 ? styles.labelR : styles.labelL}`}>
                  <span className={`mono ${styles.title}`}>
                    <b>{String(i + 1).padStart(2, '0')}</b>
                    {h.title}
                  </span>
                  {h.detail && <span className={`mono mono--faint ${styles.detail}`}>{h.detail}</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {(caption || index) && (
        <figcaption className={`mono mono--faint ${styles.caption}`}>
          {index && <b>{index}</b>}
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
