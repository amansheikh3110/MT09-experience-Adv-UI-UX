'use client';

import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { Quality } from '@/lib/quality';
import { bootStore } from '@/lib/stage';
import { CameraRig } from './CameraRig';
import { LightRig } from './LightRig';
import { Motorcycle } from './Motorcycle';
import { Showroom } from './Showroom';
import { Mist } from './Volumetrics';

/**
 * Mounts only after the model has resolved. The render loop is held back (see FrameGate)
 * until every shader has been compiled with the parallel-compile extension, so the
 * preloader stays smooth and the first visible frame never hitches.
 */
function ReadySignal() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let cancelled = false;
    const done = () => !cancelled && bootStore.set({ ready: true });
    gl.compileAsync(scene, camera).then(done, done);
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);
  return null;
}

/** The whole 3D world. Everything reads the shared `stage`; nothing here uses React state. */
export function Experience({ quality }: { quality: Quality }) {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <fogExp2 attach="fog" args={['#030303', 0.028]} />

      <CameraRig />
      <LightRig quality={quality} />
      <Showroom quality={quality} />
      <Mist quality={quality} />
      <Motorcycle quality={quality} />

      <ReadySignal />
    </>
  );
}
