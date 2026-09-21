import { createElement } from 'react';
import styles from './SplitText.module.css';

/**
 * Splits a headline into masked characters (`.c`) grouped in words (`.w`).
 * Animate `.c` with yPercent from a scrub timeline for the "cut out of the dark" reveal.
 * Server-renderable; the visible text is exposed once via aria-label.
 */
export function SplitText({
  text,
  as = 'span',
  className,
}: {
  text: string;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
}) {
  const words = text.split(' ');
  return createElement(
    as,
    { className: `${styles.split} ${className ?? ''}`, 'aria-label': text, 'data-split': '' },
    words.map((word, wi) => (
      <span key={wi} className={styles.w} aria-hidden>
        {Array.from(word).map((ch, ci) => (
          <span key={ci} className={`${styles.c} c`}>
            {ch}
          </span>
        ))}
        {wi < words.length - 1 ? ' ' : null}
      </span>
    )),
  );
}
