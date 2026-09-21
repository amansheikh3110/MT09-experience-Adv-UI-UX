'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clamp } from '@/lib/math';
import { Quality } from '@/lib/quality';
import { stage } from '@/lib/stage';
import { makeGlow } from '@/lib/textures';

/* ───────────────────────── shared noise chunk ───────────────────────── */

const NOISE = /* glsl */ `
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i=0;i<4;i++){ v += a*vnoise(p); p = p*2.03 + 7.1; a *= 0.5; }
  return v;
}
`;

/* ───────────────────────── light cone (volumetric shaft) ───────────────────────── */

const coneVert = /* glsl */ `
varying vec3 vNormalV;
varying vec3 vViewV;
varying float vT;
varying vec2 vObj;
uniform float uHeight;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormalV = normalize(normalMatrix * normal);
  vViewV = normalize(-mv.xyz);
  vT = clamp(-position.y / uHeight, 0.0, 1.0);
  vObj = position.xz;
  gl_Position = projectionMatrix * mv;
}`;

const coneFrag = /* glsl */ `
${NOISE}
varying vec3 vNormalV;
varying vec3 vViewV;
varying float vT;
varying vec2 vObj;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
uniform float uFloorBias;
uniform float uEndFade;
void main(){
  float facing = abs(dot(normalize(vNormalV), normalize(vViewV)));
  float edge = pow(facing, 1.7);
  float along = smoothstep(0.0, 0.14, vT) * mix(0.55, 1.0, vT * uFloorBias);
  along *= 1.0 - smoothstep(uEndFade, 1.0, vT);
  float ang = atan(vObj.y, vObj.x);
  float n = fbm(vec2(ang * 2.2 + uTime * 0.02, vT * 3.2 - uTime * 0.05));
  float a = uOpacity * edge * along * (0.55 + 0.9 * n);
  gl_FragColor = vec4(uColor * a, a);
}`;

export type ConeProps = {
  /** height of the shaft in metres */
  height: number;
  /** half-angle (radians) at which the geometry is built; scale animates from it */
  baseAngle: number;
  color?: string;
  /** called each frame → { opacity, angle } */
  drive: () => { opacity: number; angle: number };
  floorBias?: number;
  /** fraction of the shaft (apex → floor) at which it starts dissolving */
  endFade?: number;
} & Omit<React.ComponentProps<'group'>, 'ref'>;

export function LightCone({ height, baseAngle, color = '#fff1dc', drive, floorBias = 1, endFade = 0.93, ...group }: ConeProps) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);

  const geo = useMemo(() => {
    const r = Math.tan(baseAngle) * height;
    const g = new THREE.ConeGeometry(r, height, 56, 1, true);
    g.translate(0, -height / 2, 0); // apex at origin, opening downwards (−Y)
    return g;
  }, [height, baseAngle]);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uHeight: { value: height },
      uFloorBias: { value: floorBias },
      uEndFade: { value: endFade },
    }),
    [color, height, floorBias, endFade],
  );

  useFrame(({ clock }) => {
    const { opacity, angle } = drive();
    uniforms.uOpacity.value = opacity;
    uniforms.uTime.value = clock.elapsedTime;
    if (mesh.current) {
      const s = Math.tan(clamp(angle, 0.005, 1.2)) / Math.tan(baseAngle);
      mesh.current.scale.set(s, 1, s);
      mesh.current.visible = opacity > 0.0005;
    }
  });

  return (
    <group {...group}>
      <mesh ref={mesh} geometry={geo} frustumCulled={false} renderOrder={5}>
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={coneVert}
          fragmentShader={coneFrag}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </mesh>
    </group>
  );
}

/* ───────────────────────── floor mist ───────────────────────── */

const mistVert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const mistFrag = /* glsl */ `
${NOISE}
varying vec2 vUv;
uniform float uTime;
uniform float uOpacity;
uniform vec3 uColor;
uniform vec2 uCenter;
uniform vec2 uRadius;
uniform float uSeed;
uniform float uDrift;
void main(){
  vec2 p = vUv * vec2(4.0, 1.6) + vec2(uSeed, uSeed * 0.37);
  float t = uTime * uDrift;
  float n = fbm(p + vec2(t, t * 0.3)) * 0.65 + fbm(p * 2.1 - vec2(t * 1.4, 0.0)) * 0.35;
  n = smoothstep(0.28, 0.85, n);
  vec2 d = (vUv - uCenter) / uRadius;
  float mask = exp(-dot(d, d) * 1.6);
  float floorFade = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.35, 1.0, vUv.y));
  float a = uOpacity * n * mask * floorFade;
  gl_FragColor = vec4(uColor * a, a);
}`;

type MistProps = {
  position: [number, number, number];
  size: [number, number];
  center: [number, number];
  radius: [number, number];
  color?: string;
  seed?: number;
  drift?: number;
  /** returns the current opacity multiplier */
  drive: () => number;
  base?: number;
};

function MistPlane({ position, size, center, radius, color = '#c9d3dc', seed = 0, drift = 0.03, drive, base = 0.22 }: MistProps) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uCenter: { value: new THREE.Vector2(...center) },
      uRadius: { value: new THREE.Vector2(...radius) },
      uSeed: { value: seed },
      uDrift: { value: drift },
    }),
    [color, center, radius, seed, drift],
  );
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uOpacity.value = base * drive();
  });
  return (
    <mesh position={position} frustumCulled={false} renderOrder={4}>
      <planeGeometry args={size} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={mistVert}
        fragmentShader={mistFrag}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </mesh>
  );
}

/** Low, drifting haze. Bright where the spot lands and around the doorway; dark elsewhere. */
export function Mist({ quality }: { quality: Quality }) {
  if (!quality.mist) return null;
  const lit = () => clamp(stage.key) * stage.cur.mist * clamp(stage.power);
  const doorway = () =>
    clamp(Math.min(stage.shutter, stage.cur.shutter) * 1.6) * stage.cur.mist * clamp(stage.power);
  return (
    <group>
      {/* around the bike, catching the key light */}
      <MistPlane position={[0, 1.15, -1.6]} size={[11, 2.3]} center={[0.5, 0.28]} radius={[0.34, 0.5]} seed={3} drive={lit} base={0.55} />
      <MistPlane position={[0, 1.0, 1.7]} size={[9, 2]} center={[0.5, 0.3]} radius={[0.3, 0.45]} seed={11} drive={lit} base={0.26} drift={0.022} />
      {/* doorway haze, only once the shutter is lifting */}
      <MistPlane position={[0, 1.4, -4.2]} size={[9, 2.8]} center={[0.5, 0.35]} radius={[0.32, 0.6]} seed={19} color="#9fb2c4" drive={doorway} base={0.55} drift={0.02} />
      <MistPlane position={[0, 1.2, -3.0]} size={[10, 2.4]} center={[0.5, 0.3]} radius={[0.36, 0.55]} seed={27} color="#a7b7c6" drive={doorway} base={0.3} drift={0.026} />
    </group>
  );
}

/* ───────────────────────── headlight flare ───────────────────────── */

export function HeadlightFlares() {
  const tex = useMemo(() => makeGlow(128), []);
  const refs = useRef<THREE.Sprite[]>([]);
  const spots: [number, number, number, number][] = [
    // x, y, z (bike space, nose = +z), size
    [-0.028, 0.965, 0.5, 0.13],
    [0.028, 0.965, 0.5, 0.13],
    [-0.115, 0.875, 0.5, 0.2],
    [0.115, 0.875, 0.5, 0.2],
  ];
  useFrame(() => {
    const k = clamp(stage.headlight * stage.cur.headlight);
    refs.current.forEach((s, i) => {
      if (!s) return;
      const m = s.material as THREE.SpriteMaterial;
      m.opacity = k * 0.5;
      const sc = spots[i][3] * (0.7 + 0.5 * k);
      s.scale.set(sc, sc, 1);
      s.visible = k > 0.01;
    });
  });
  return (
    <group>
      {spots.map((p, i) => (
        <sprite key={i} position={[p[0], p[1], p[2]]} ref={(el) => { if (el) refs.current[i] = el; }} renderOrder={6}>
          <spriteMaterial map={tex} color="#fff4e6" transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false} />
        </sprite>
      ))}
    </group>
  );
}

/**
 * Headlight rig — lives INSIDE the bike's yaw group so it turns with the machine:
 * a real spot on the floor, a faint beam in the haze and small flares on the LEDs.
 */
export function HeadlightRig({ quality }: { quality: Quality }) {
  const spot = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 0, 6.5);
    return o;
  }, []);
  useEffect(() => {
    if (spot.current) spot.current.target = target;
  }, [target]);
  useFrame(() => {
    const k = clamp(stage.headlight * stage.cur.headlight) * clamp(stage.power);
    if (spot.current) spot.current.intensity = 60 * k;
  });
  return (
    <group>
      <primitive object={target} />
      <spotLight
        ref={spot}
        position={[0, 0.82, 0.52]}
        angle={0.42}
        penumbra={0.9}
        intensity={0}
        distance={14}
        decay={1.6}
        color="#fff3e2"
        castShadow={false}
      />
      <LightCone
        position={[0, 0.8, 0.54]}
        rotation={[-Math.PI / 2 + 0.05, 0, 0]}
        height={5}
        baseAngle={0.3}
        color="#fff0dd"
        floorBias={0.3}
        drive={() => ({
          opacity: clamp(stage.headlight * stage.cur.headlight) * clamp(stage.power) * (quality.mist ? 0.09 : 0.05),
          angle: 0.3,
        })}
      />
      <HeadlightFlares />
    </group>
  );
}
