'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clamp, noise1, smooth } from '@/lib/math';
import { stage } from '@/lib/stage';

/** Physical layout, shared with <Showroom/> (metres). */
export const DOOR = {
  z: -4.95,
  halfWidth: 2.6,
  height: 3.1,
  /** where the stacked slats come to rest above the opening (hidden behind the lintel) */
  housingTop: 4.05,
};

const SLATS = 36;
const PITCH = DOOR.height / SLATS;
const SLAT_H = PITCH * 0.965;
const STACK_PITCH = 0.012;
const TRAVEL = DOOR.housingTop - (SLATS - 1) * STACK_PITCH;

function slatGeometry(width: number) {
  const s = new THREE.Shape();
  const h = SLAT_H;
  s.moveTo(0, 0);
  s.lineTo(0.018, 0.005);
  s.quadraticCurveTo(0.05, h * 0.5, 0.018, h - 0.005);
  s.lineTo(0, h);
  s.lineTo(-0.014, h);
  s.lineTo(-0.014, 0);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false, curveSegments: 5 });
  g.translate(0, 0, -width / 2);
  g.rotateY(-Math.PI / 2);
  return g;
}

/**
 * The industrial roller shutter. Slats really stack into the housing as it rises,
 * the motion is heavy and slightly uneven, and it reports `stage.rumble` for the camera.
 */
export function Shutter() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const leakBar = useRef<THREE.Mesh>(null);
  const spill = useRef<THREE.Mesh>(null);
  const outside = useRef<THREE.Mesh>(null);
  const prev = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const geo = useMemo(() => slatGeometry(DOOR.halfWidth * 2 + 0.3), []);

  const spillTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 8;
    c.height = 256;
    const g = c.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 8, 256);
    return new THREE.CanvasTexture(c);
  }, []);

  const outsideTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const g = c.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#050505');
    grad.addColorStop(0.5, '#0d0f11');
    grad.addColorStop(0.68, '#1c2023');
    grad.addColorStop(1, '#050505');
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const col = new THREE.Color();
    for (let i = 0; i < SLATS; i++) {
      const v = 0.75 + Math.sin(i * 12.9898) * 0.5 * 0.5 + 0.12;
      col.setRGB(0.3 * v, 0.29 * v, 0.28 * v);
      m.setColorAt(i, col);
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.max(rawDt, 1e-4);
    const m = mesh.current;
    if (!m) return;
    const open = clamp(Math.min(stage.shutter, stage.cur.shutter));

    // rumble follows how fast the door is moving
    const speed = Math.abs(open - prev.current) / dt;
    prev.current = open;
    stage.rumble += (clamp(speed * 6) - stage.rumble) * Math.min(1, dt * 6);

    const t = clock.elapsedTime;
    const moving = clamp(speed * 10);
    // stepped, slightly uneven travel of a heavy mechanism
    const lift = TRAVEL * open + Math.sin(open * 210 + t * 3) * 0.006 * moving + noise1(t * 6) * 0.004 * moving;
    const sway = noise1(t * 9) * 0.0035 * moving;

    for (let i = 0; i < SLATS; i++) {
      const rest = i * PITCH;
      const stacked = DOOR.housingTop - (SLATS - 1 - i) * STACK_PITCH;
      const y = Math.min(rest + lift, stacked);
      dummy.position.set(sway * (1 + (i % 3) * 0.3), y, DOOR.z);
      dummy.scale.set(1, i === 0 ? 1.55 : 1, i === 0 ? 1.6 : 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;

    const bottom = Math.min(lift, stacked0());
    if (leakBar.current) {
      leakBar.current.position.set(0, bottom + 0.005, DOOR.z + 0.03);
      const on = smooth(clamp(open * 14)) * (1 - smooth(clamp((open - 0.55) / 0.4))) * 0.9;
      (leakBar.current.material as THREE.MeshBasicMaterial).opacity = on;
    }
    if (spill.current) {
      const on = smooth(clamp(open * 10)) * (1 - 0.35 * smooth(clamp((open - 0.5) / 0.5)));
      (spill.current.material as THREE.MeshBasicMaterial).opacity = on * 0.045 * stage.power;
    }
    if (outside.current) {
      const v = smooth(clamp((open - 0.02) / 0.5));
      (outside.current.material as THREE.MeshBasicMaterial).color.setScalar(v * 0.32);
    }
  });

  return (
    <group>
      <instancedMesh ref={mesh} args={[geo, undefined, SLATS]} castShadow receiveShadow frustumCulled={false}>
        <meshStandardMaterial color="#ffffff" metalness={0.85} roughness={0.5} />
      </instancedMesh>

      {/* light leaking under the door as it lifts */}
      <mesh ref={leakBar} position={[0, 0, DOOR.z + 0.03]}>
        <boxGeometry args={[DOOR.halfWidth * 2, 0.03, 0.02]} />
        <meshBasicMaterial color="#ffd2a1" transparent opacity={0} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={spill} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, DOOR.z + 2.6]}>
        <planeGeometry args={[DOOR.halfWidth * 2.2, 5.2]} />
        <meshBasicMaterial map={spillTex} color="#cfe0f0" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* the world outside — only lit once the door is up */}
      <mesh ref={outside} position={[0, 4, DOOR.z - 4.5]}>
        <planeGeometry args={[30, 12]} />
        <meshBasicMaterial map={outsideTex} color="#000000" fog={false} />
      </mesh>
    </group>
  );
}

function stacked0() {
  return DOOR.housingTop - (SLATS - 1) * STACK_PITCH;
}
