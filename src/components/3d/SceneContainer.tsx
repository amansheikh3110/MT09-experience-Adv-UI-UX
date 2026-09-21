'use client';

import { PerformanceMonitor } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Tier, detectTier, qualityFor } from '@/lib/quality';
import { bootStore, stage } from '@/lib/stage';
import { updateCanvasVisibility } from '@/scroll/pose';
import { Experience } from './Experience';

/**
 * Pauses rendering whenever an opaque editorial section fully covers the canvas.
 * Runs on its own rAF so it keeps working while the render loop is stopped.
 */
function FrameGate() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let raf = 0;
    let last: 'always' | 'never' = 'never';
    const tick = () => {
      const visible = updateCanvasVisibility(window.innerHeight);
      // never render before shaders are compiled, never render while fully covered
      const want = visible && bootStore.get().ready ? 'always' : 'never';
      if (want !== last) {
        last = want;
        setFrameloop(want);
        if (want === 'always') invalidate();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [setFrameloop, invalidate]);
  return null;
}

const forcedTier = (): Tier | null => {
  const q = new URLSearchParams(window.location.search).get('q');
  return q === 'high' || q === 'mid' || q === 'low' ? q : null;
};

export default function SceneContainer() {
  const [tier, setTier] = useState<Tier>(() => forcedTier() ?? detectTier());
  const quality = useMemo(() => qualityFor(tier), [tier]);

  return (
    <div className="canvas-container" id="stage-canvas" aria-hidden>
      <Canvas
        shadows="percentage"
        frameloop="never"
        dpr={quality.dpr}
        camera={{ fov: 30, near: 0.1, far: 90, position: [0, 1, 6.6] }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          toneMapping: THREE.NeutralToneMapping,
          toneMappingExposure: 1,
        }}
      >
        <PerformanceMonitor
          onDecline={() => {
            // never downgrade during the opening — shader compilation would trip it
            if (!stage.introDone || forcedTier()) return;
            setTier((t) => (t === 'high' ? 'mid' : 'low'));
          }}
        />
        <FrameGate />
        <Suspense fallback={null}>
          <Experience quality={quality} />
        </Suspense>
      </Canvas>
    </div>
  );
}
