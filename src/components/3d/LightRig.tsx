'use client';

import { Environment, Lightformer } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clamp, lerp, smooth } from '@/lib/math';
import { Quality } from '@/lib/quality';
import { stage } from '@/lib/stage';
import { LightCone } from './Volumetrics';

/** Peak light values (candela-ish). All animated multiplicatively by the stage. */
const KEY_MAX = 1150;
const FILL_MAX = 95;
const RIM_MAX = 300;
const BACK_MAX = 150;
const WASH_MAX = 90;
const FRONT_MAX = 70;

const KEY_POS = new THREE.Vector3(0.5, 7.6, 1.1);
const AIM_HEAD = new THREE.Vector3(0, 0.62, 1.0);
const AIM_CENTER = new THREE.Vector3(0, 0.45, 0);

/**
 * The lighting rig. Every light is driven by `stage` (opening timeline × scroll pose),
 * so the same rig can be powered on, dimmed to a single spot and returned to black.
 *
 *   1  key       — very narrow overhead spot, casts the only real shadow
 *   2  fill      — soft, wide, overhead
 *   3  rim ×2    — behind-left cool / behind-right warm, gives the silhouette
 *   4  headlight — lives on the bike (see <HeadlightRig/>)
 *   5  environment (strip lights baked once) — supplies the paint reflections
 *   +  back light through the doorway, wall wash
 */
export function LightRig({ quality }: { quality: Quality }) {
  const { gl, scene } = useThree();
  const key = useRef<THREE.SpotLight>(null);
  const fill = useRef<THREE.SpotLight>(null);
  const rimL = useRef<THREE.SpotLight>(null);
  const rimR = useRef<THREE.SpotLight>(null);
  const back = useRef<THREE.SpotLight>(null);
  const wash = useRef<THREE.SpotLight>(null);
  const front = useRef<THREE.SpotLight>(null);

  const keyTarget = useMemo(() => new THREE.Object3D(), []);
  const bikeTarget = useMemo(() => new THREE.Object3D(), []);
  const washTarget = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 2.2, -4.9);
    return o;
  }, []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (key.current) key.current.target = keyTarget;
    [fill, rimL, rimR, back, front].forEach((r) => {
      if (r.current) r.current.target = bikeTarget;
    });
    if (wash.current) wash.current.target = washTarget;
    bikeTarget.position.set(0, 0.6, 0);
  }, [keyTarget, bikeTarget, washTarget]);

  useFrame(() => {
    const c = stage.cur;
    const power = clamp(stage.power);

    // key: aim moves from the headlight to the whole machine, cone opens up
    tmp.lerpVectors(AIM_HEAD, AIM_CENTER, smooth(clamp(stage.keyAim)));
    keyTarget.position.copy(tmp);
    if (key.current) {
      key.current.intensity = KEY_MAX * stage.key * c.key * power;
      key.current.angle = stage.keyAngle;
    }
    const amb = clamp(stage.ambient) * c.ambient;
    if (fill.current) fill.current.intensity = FILL_MAX * clamp(stage.fill) * c.fill * amb * power;
    const rim = clamp(stage.rim) * c.rim * power;
    if (rimL.current) rimL.current.intensity = RIM_MAX * rim;
    if (rimR.current) rimR.current.intensity = RIM_MAX * 0.9 * rim;

    const open = clamp(Math.min(stage.shutter, c.shutter));
    if (back.current) back.current.intensity = BACK_MAX * smooth(clamp((open - 0.05) / 0.6)) * c.rim * power;
    if (wash.current) wash.current.intensity = WASH_MAX * amb * power;
    if (front.current) front.current.intensity = FRONT_MAX * clamp(stage.fill) * c.fill * power;

    // environment (reflections) rises with ambient; never fully off once lit
    scene.environmentIntensity = lerp(0.0, 0.85, clamp(amb * 0.9 + stage.key * 0.12)) * power;
    gl.toneMappingExposure = 1.12 * c.exposure;
  });

  const shadowRes = quality.shadowMap;

  return (
    <>
      <primitive object={keyTarget} />
      <primitive object={bikeTarget} />
      <primitive object={washTarget} />

      {/* 1 — key spot */}
      <spotLight
        ref={key}
        position={KEY_POS.toArray()}
        angle={0.05}
        penumbra={0.85}
        intensity={0}
        distance={0}
        decay={2}
        color="#fff2df"
        castShadow
        shadow-mapSize={[shadowRes, shadowRes]}
        shadow-bias={-0.00025}
        shadow-normalBias={0.02}
        shadow-camera-near={3}
        shadow-camera-far={14}
        shadow-radius={5}
      />

      {/* 2 — soft overhead fill */}
      <spotLight ref={fill} position={[0, 8.5, 1.5]} angle={0.9} penumbra={1} intensity={0} decay={2} color="#dfe4ea" />

      {/* 3 — rim lights */}
      <spotLight ref={rimL} position={[-3.6, 2.4, -3.4]} angle={0.5} penumbra={0.95} intensity={0} decay={2} color="#c9dcff" />
      <spotLight ref={rimR} position={[3.6, 2.2, -3.2]} angle={0.5} penumbra={0.95} intensity={0} decay={2} color="#ffd8b0" />

      {/* back light — the doorway, only alive once the shutter lifts */}
      <spotLight ref={back} position={[0, 3.2, -8.5]} angle={0.5} penumbra={1} intensity={0} decay={2} color="#b9cde0" />

      {/* soft camera-side card so the front of the machine keeps its form */}
      <spotLight ref={front} position={[-2.6, 2.0, 5.5]} angle={0.5} penumbra={1} intensity={0} decay={2} color="#e9ecf0" />

      {/* wall wash so the shutter/piers read as a surface, not a void */}
      <spotLight ref={wash} position={[0, 6.5, 4]} angle={0.55} penumbra={1} intensity={0} decay={2} color="#e7d6c1" />

      {/* the visible shaft: hangs BEHIND the machine so it reads against the dark room
          (like the reference renders) and the bike is depth-tested in front of it.
          A tight bright core plus a wide soft body; both dissolve before the floor. */}
      <group position={[0.1, KEY_POS.y, -2.1]}>
        <LightCone
          height={KEY_POS.y}
          baseAngle={0.22}
          color="#ffeed8"
          floorBias={0}
          endFade={0.8}
          drive={() => ({
            opacity: stage.key * stage.cur.key * clamp(stage.power) * (quality.mist ? 0.5 : 0.28),
            angle: 0.035 + stage.keyAngle * 0.3,
          })}
        />
        <LightCone
          height={KEY_POS.y}
          baseAngle={0.22}
          color="#ffe6cc"
          floorBias={0.5}
          endFade={0.9}
          drive={() => ({
            opacity: stage.key * stage.cur.key * clamp(stage.power) * (quality.mist ? 0.2 : 0.1),
            angle: 0.06 + stage.keyAngle * 0.75,
          })}
        />
      </group>

      {/* 5 — environment: baked once, strip boxes supply long reflections on the paint */}
      <Environment resolution={256} frames={1} background={false}>
        <color attach="background" args={['#000000']} />
        <Lightformer form="rect" intensity={3.4} position={[0, 6, 0.5]} scale={[9, 2.6, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={2.2} position={[-6, 2.2, -1]} scale={[1.2, 6, 1]} rotation-y={Math.PI / 2} color="#cfe0ff" />
        <Lightformer form="rect" intensity={1.8} position={[6, 2.2, -1.5]} scale={[1.2, 6, 1]} rotation-y={-Math.PI / 2} color="#ffd9b8" />
        <Lightformer form="rect" intensity={1.4} position={[0, 2.5, -7]} scale={[12, 2.6, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[0, 1.4, 7]} scale={[8, 2.4, 1]} rotation-y={Math.PI} />
      </Environment>
    </>
  );
}
