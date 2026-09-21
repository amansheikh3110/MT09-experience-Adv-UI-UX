'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { clamp, damp, lerp, noise1 } from '@/lib/math';
import { NUM_POSE_KEYS, sceneRefs, stage } from '@/lib/stage';
import { sampleScrollPose } from '@/scroll/pose';

/**
 * The only thing that moves the camera. Each frame:
 *   scroll → pose target → damped pose → camera (+ pointer parallax, rumble, breathing)
 * so the user is always "in control" — stop scrolling and everything settles.
 */
export function CameraRig() {
  const { camera, size } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      stage.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      stage.pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const cam = camera as THREE.PerspectiveCamera;
    sceneRefs.camera = cam;
    const aspect = size.width / size.height;

    sampleScrollPose(size.height);
    const t = stage.target;
    const c = stage.cur;

    // first frame: start exactly on the target
    const snap = !stage.started && !stage.bike.ready ? 1 : 0;
    const L = snap ? 1 : 1 - Math.exp(-3.4 * dt);
    for (let i = 0; i < 3; i++) {
      c.cam[i] = lerp(c.cam[i], t.cam[i], snap || L);
      c.look[i] = lerp(c.look[i], t.look[i], snap || L);
    }
    NUM_POSE_KEYS.forEach((k) => {
      const lam = k === 'rot' ? 2.4 : k === 'exposure' || k === 'ambient' || k === 'fill' || k === 'rim' || k === 'key' ? 3.2 : 3.4;
      c[k] = snap ? t[k] : damp(c[k], t[k], lam, dt);
    });

    // pointer, smoothed
    const p = stage.pointer;
    p.x = damp(p.x, p.tx, 2.5, dt);
    p.y = damp(p.y, p.ty, 2.5, dt);
    const live = 1 - stage.introDolly;

    // keep the silhouette inside the frame on narrow screens
    const dist = Math.hypot(c.cam[0] - c.look[0], c.cam[1] - c.look[1], c.cam[2] - c.look[2]) || 1;
    const halfW = Math.abs(Math.sin(c.rot)) * (stage.bike.L / 2) + Math.abs(Math.cos(c.rot)) * (stage.bike.W / 2);
    const tanH = Math.tan(THREE.MathUtils.degToRad(c.fov) / 2) * aspect;
    const kFit = Math.max(1, (halfW * 1.2) / tanH / dist);
    const kNarrow = clamp(1 / (aspect * 1.25), 1, 2.4);
    const k = lerp(kNarrow, kFit, clamp(c.fit)) * (1 - 0.3 * stage.introDolly);

    const time = clock.elapsedTime;
    const rumble = stage.rumble * 0.012;
    const breathX = Math.sin(time * 0.13) * 0.03 + noise1(time * 11) * rumble;
    const breathY = Math.sin(time * 0.09 + 1.7) * 0.016 + noise1(time * 13 + 5) * rumble;

    pos.set(
      c.look[0] + (c.cam[0] - c.look[0]) * k + breathX + p.x * 0.24 * live,
      c.look[1] + (c.cam[1] - c.look[1]) * k + breathY + p.y * 0.1 * live,
      c.look[2] + (c.cam[2] - c.look[2]) * k,
    );
    look.set(c.look[0] + p.x * 0.05 * live, c.look[1] + p.y * 0.03 * live, c.look[2]);

    cam.position.copy(pos);
    cam.lookAt(look);
    if (Math.abs(cam.fov - c.fov) > 1e-3 || cam.aspect !== aspect) {
      cam.fov = c.fov;
      cam.aspect = aspect;
      cam.updateProjectionMatrix();
    }

    // compose the frame off-centre without touching perspective
    const landscape = clamp((aspect - 1) / 0.45);
    const sx = c.shiftX * landscape;
    const sy = c.shiftY + (aspect < 1 ? 0.16 * (1 - aspect) : 0);
    const w = size.width;
    const h = size.height;
    if (Math.abs(sx) > 1e-4 || Math.abs(sy) > 1e-4) {
      cam.setViewOffset(w, h, -sx * w * 0.5, sy * h * 0.5, w, h);
    } else if (cam.view?.enabled) {
      cam.clearViewOffset();
    }
  }, -10);

  return null;
}
