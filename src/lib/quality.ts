export type Tier = 'high' | 'mid' | 'low';

export type Quality = {
  tier: Tier;
  isTouch: boolean;
  dpr: [number, number];
  shadowMap: number;
  reflector: boolean;
  mist: boolean;
  contactShadowRes: number;
};

const PRESETS: Record<Tier, Omit<Quality, 'tier' | 'isTouch'>> = {
  high: { dpr: [1, 2], shadowMap: 2048, reflector: true, mist: true, contactShadowRes: 768 },
  mid: { dpr: [1, 1.6], shadowMap: 1024, reflector: false, mist: true, contactShadowRes: 512 },
  low: { dpr: [1, 1.4], shadowMap: 512, reflector: false, mist: false, contactShadowRes: 256 },
};

export const getIsTouch = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 720);

export const detectTier = (): Tier => {
  if (typeof window === 'undefined') return 'mid';
  if (getIsTouch()) return 'low';
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (cores >= 8 && mem >= 8) return 'high';
  return 'mid';
};

export const qualityFor = (tier: Tier): Quality => ({
  tier,
  isTouch: getIsTouch(),
  ...PRESETS[tier],
});

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
