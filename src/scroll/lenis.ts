import type Lenis from 'lenis';

/** Single Lenis instance shared by the whole app (created in <SmoothScroll/>). */
let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};
export const getLenis = () => instance;

export const lockScroll = () => {
  instance?.stop();
  document.documentElement.classList.add('is-locked');
};

export const unlockScroll = () => {
  document.documentElement.classList.remove('is-locked');
  instance?.start();
};

/** Smooth, cinematic jump to an element / y position. */
export const scrollToTarget = (target: string | number | HTMLElement, offset = 0) => {
  if (instance) {
    instance.scrollTo(target as never, { offset, duration: 2.2, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
  } else if (typeof target === 'string') {
    document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: 'smooth' });
  }
};
