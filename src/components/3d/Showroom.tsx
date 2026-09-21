'use client';

import { ContactShadows, MeshReflectorMaterial } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { makeConcrete } from '@/lib/textures';
import { Quality } from '@/lib/quality';
import { DOOR, Shutter } from './Shutter';

const WALL_Z = -4.6;
const WALL_T = 0.7;
const CEIL = 10;
const SIDE = 15;

/**
 * The dark architectural showroom: poured-concrete walls, an industrial opening with
 * the shutter recessed behind it, a polished floor. Geometry is deliberately simple —
 * the drama comes from light, haze and the negative space.
 */
export function Showroom({ quality }: { quality: Quality }) {
  const wall = useMemo(() => {
    const t = makeConcrete({ size: 512, seamsX: 256, seamsY: 256, seed: 11, tone: 0.2, contrast: 0.1 });
    [t.map, t.roughnessMap, t.bumpMap].forEach((x) => x.repeat.set(5, 2));
    return t;
  }, []);

  const floor = useMemo(() => {
    const t = makeConcrete({ size: 512, seamsX: 0, seamsY: 0, seed: 23, tone: 0.11, contrast: 0.14 });
    [t.map, t.roughnessMap, t.bumpMap].forEach((x) => x.repeat.set(9, 9));
    return t;
  }, []);

  const wallMat = (
    <meshStandardMaterial
      map={wall.map}
      roughnessMap={wall.roughnessMap}
      bumpMap={wall.bumpMap}
      bumpScale={1.4}
      color="#7c7c80"
      roughness={1}
      metalness={0}
    />
  );

  const hw = DOOR.halfWidth;
  const sideW = SIDE - hw;

  return (
    <group>
      {/* ── floor (inside the room only) ─────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (DOOR.z + 25) / 2]} receiveShadow>
        <planeGeometry args={[SIDE * 2, 25 - DOOR.z]} />
        {quality.reflector ? (
          <MeshReflectorMaterial
            map={floor.map}
            roughnessMap={floor.roughnessMap}
            bumpMap={floor.bumpMap}
            bumpScale={0.15}
            color="#2c2c2e"
            metalness={0.55}
            roughness={0.66}
            blur={[300, 100]}
            resolution={512}
            mixBlur={2.4}
            mixStrength={1.3}
            mirror={0.85}
            depthScale={0.6}
            minDepthThreshold={0.5}
            maxDepthThreshold={1.5}
          />
        ) : (
          <meshStandardMaterial
            map={floor.map}
            roughnessMap={floor.roughnessMap}
            bumpMap={floor.bumpMap}
            bumpScale={0.05}
            color="#2c2c2e"
            metalness={0.08}
            roughness={0.85}
          />
        )}
      </mesh>
      {/* the ground outside the doorway: near-black, lit only by haze */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, DOOR.z - 15]}>
        <planeGeometry args={[80, 30]} />
        <meshBasicMaterial color="#060606" fog={false} />
      </mesh>

      <ContactShadows
        position={[0, 0.006, 0]}
        opacity={0.85}
        scale={7}
        blur={2.6}
        far={1.4}
        resolution={quality.contactShadowRes}
        color="#000000"
        frames={Infinity}
      />

      {/* ── back wall: two blocks either side of the opening + lintel ── */}
      <mesh position={[-(hw + sideW / 2), CEIL / 2, WALL_Z]} receiveShadow>
        <boxGeometry args={[sideW, CEIL, WALL_T]} />
        {wallMat}
      </mesh>
      <mesh position={[hw + sideW / 2, CEIL / 2, WALL_Z]} receiveShadow>
        <boxGeometry args={[sideW, CEIL, WALL_T]} />
        {wallMat}
      </mesh>
      <mesh position={[0, DOOR.height + (CEIL - DOOR.height) / 2, WALL_Z]} receiveShadow>
        <boxGeometry args={[hw * 2, CEIL - DOOR.height, WALL_T]} />
        {wallMat}
      </mesh>

      {/* piers framing the opening, standing proud of the wall */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (hw + 0.85), CEIL / 2, WALL_Z + WALL_T / 2 + 0.28]} castShadow receiveShadow>
          <boxGeometry args={[1.5, CEIL, 0.56]} />
          {wallMat}
        </mesh>
      ))}
      {/* steel guide rails */}
      {[-1, 1].map((s) => (
        <mesh key={`r${s}`} position={[s * (hw + 0.06), DOOR.height / 2, DOOR.z + 0.15]}>
          <boxGeometry args={[0.16, DOOR.height, 0.3]} />
          <meshStandardMaterial color="#141414" metalness={0.9} roughness={0.45} />
        </mesh>
      ))}

      {/* ── side walls + ceiling + roof beams ─────────────────── */}
      <mesh position={[-SIDE, CEIL / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[40, CEIL]} />
        <meshStandardMaterial color="#1a1a1b" roughness={1} />
      </mesh>
      <mesh position={[SIDE, CEIL / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[40, CEIL]} />
        <meshStandardMaterial color="#1a1a1b" roughness={1} />
      </mesh>
      <mesh position={[0, CEIL, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[SIDE * 2, 40]} />
        <meshStandardMaterial color="#0e0e0f" roughness={1} />
      </mesh>
      {[-3, 0, 3, 6].map((z) => (
        <mesh key={z} position={[0, CEIL - 0.45, z]} castShadow>
          <boxGeometry args={[SIDE * 2, 0.9, 0.45]} />
          <meshStandardMaterial color="#0c0c0d" roughness={0.9} metalness={0.2} />
        </mesh>
      ))}
      {/* rear-of-camera wall so reflections/haze have something to sit against */}
      <mesh position={[0, CEIL / 2, 16]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[SIDE * 2, CEIL]} />
        <meshStandardMaterial color="#060606" roughness={1} />
      </mesh>

      <Shutter />
    </group>
  );
}

export const showroomFog = new THREE.FogExp2('#030303', 0.03);
