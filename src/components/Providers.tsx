'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ReactNode, useEffect } from 'react';
import { prefersReducedMotion } from '@/lib/quality';
import { lockScroll, setLenis } from '@/scroll/lenis';

gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth scrolling. Lenis owns the scroll position; GSAP's ticker drives it so
 * ScrollTrigger, the R3F render loop and the DOM all read the same frame.
 * Scrolling stays locked until the opening sequence ends (see scroll/intro.ts).
 */
export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !prefersReducedMotion(),
      touchMultiplier: 1.35,
      autoRaf: false,
    });
    setLenis(lenis);
    lockScroll();

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);
    lenis.on('scroll', ScrollTrigger.update);

    // images / fonts change layout height after load — keep triggers honest
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);

    return () => {
      window.removeEventListener('load', refresh);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return <>{children}</>;
}
