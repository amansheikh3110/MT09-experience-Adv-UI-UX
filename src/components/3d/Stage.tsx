'use client';

import dynamic from 'next/dynamic';

/** The WebGL layer is client-only and code-split away from the first paint. */
const SceneContainer = dynamic(() => import('./SceneContainer'), { ssr: false });

export function Stage() {
  return <SceneContainer />;
}
