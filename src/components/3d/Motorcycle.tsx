'use client';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { MODEL } from '@/config/assets';
import { CATEGORIES, CategoryId, DEFAULT_SELECTION } from '@/config/finishes';
import { configStore } from '@/lib/configStore';
import { clamp, damp } from '@/lib/math';
import { Quality } from '@/lib/quality';
import { sceneRefs, stage } from '@/lib/stage';
import { HeadlightRig } from './Volumetrics';

/** The model is normalised to this length (front toward +Z, floor at y = 0). */
export const BIKE_LENGTH = 2.15;

/**
 * Which GLB materials each configurator group recolours.
 * (Names come straight from the supplied Sketchfab model.)
 */
export const ROLES: Record<CategoryId, string[]> = {
  body: ['vehicle_generic_smallspecmap_PRIMARY', 'material', 'blue'],
  wheels: ['material_42'],
  seat: ['Material.010'],
  details: ['Material.015', 'gold.001'], // Material.015 = drive chain
};

/**
 * Materials whose baked colour texture must be tinted cleanly: the texture is reduced to
 * luminance (alpha kept) and the stock colour is carried by `color` instead. Look unchanged.
 */
const TINTABLE: Record<string, string> = { 'Material.015': '#e2c24a' };

/** Luminance-only copy of a texture (keeps alpha, orientation and sampling). */
function desaturate(tex: THREE.Texture): THREE.Texture {
  const img = tex.image as CanvasImageSource & { width: number; height: number };
  if (!img || !img.width) return tex;
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height);
  let max = 1;
  for (let i = 0; i < d.data.length; i += 4) {
    const l = 0.2126 * d.data[i] + 0.7152 * d.data[i + 1] + 0.0722 * d.data[i + 2];
    d.data[i] = d.data[i + 1] = d.data[i + 2] = l;
    if (d.data[i + 3] > 200 && l > max) max = l;
  }
  const k = 255 / max; // normalise so the brightest link reads as full colour
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.min(255, d.data[i] * k);
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
  }
  g.putImageData(d, 0, 0);
  const out = new THREE.CanvasTexture(c);
  out.flipY = tex.flipY;
  out.colorSpace = tex.colorSpace;
  out.wrapS = tex.wrapS;
  out.wrapT = tex.wrapT;
  out.anisotropy = tex.anisotropy;
  return out;
}

const HEADLIGHT_MATERIALS = ['headlight', 'material_22'];
const TAILLIGHT_MATERIALS = ['taillight'];
const DIAL_MATERIALS = ['speed', 'script_rt_dials_race', 'script_rt_dials_race.001', 'script_rt_dials_race.002', 'script_rt_dials_race.003'];

type Look = { color: THREE.Color; metalness: number; roughness: number; clearcoat: number };
type Anim = Look & { mat: THREE.MeshStandardMaterial; orig: Look };

const asPhysical = (m: THREE.Material): THREE.MeshPhysicalMaterial => {
  if ((m as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial) return m as THREE.MeshPhysicalMaterial;
  const p = new THREE.MeshPhysicalMaterial();
  // Physical.copy() insists on a physical source — use the Standard base copy
  THREE.MeshStandardMaterial.prototype.copy.call(p, m as THREE.MeshStandardMaterial);
  p.name = m.name;
  return p;
};

export function Motorcycle({ quality }: { quality: Quality }) {
  const { scene } = useGLTF(MODEL.bike);
  const yawRef = useRef<THREE.Group>(null);
  const idle = useRef(0);

  // ── one-time preparation: normalise, fix materials, index roles ─────────────
  const prepared = useMemo(() => {
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene, true);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // model faces −Z; length runs along Z
    const scale = BIKE_LENGTH / size.z;
    const offset = new THREE.Vector3(-center.x, -box.min.y, -center.z);

    const byName = new Map<string, THREE.Material>();
    const swaps = new Map<THREE.Material, THREE.Material>();
    const paintish = new Set(Object.values(ROLES).flat());

    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) mesh.frustumCulled = false;

      const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const next = list.map((m) => {
        let mat = swaps.get(m) ?? m;
        if (!swaps.has(m)) {
          if (paintish.has(m.name)) {
            mat = asPhysical(m);
            // these carry a flat colour bitmap — drop it so recolouring is exact
            const std = mat as THREE.MeshStandardMaterial;
            if (TINTABLE[m.name]) {
              if (std.map) std.map = desaturate(std.map);
              std.color.set(TINTABLE[m.name]);
            } else if (m.name !== 'Material.010') {
              std.map = null;
            }
          }
          swaps.set(m, mat);
          byName.set(m.name, mat);
        }
        return mat;
      });
      mesh.material = Array.isArray(mesh.material) ? next : next[0];

      const transparent = next.some((m) => m.transparent);
      mesh.castShadow = !transparent;
      mesh.receiveShadow = true;
    });

    const get = (names: string[]) =>
      names.map((n) => byName.get(n) as THREE.MeshStandardMaterial | undefined).filter(Boolean) as THREE.MeshStandardMaterial[];

    const emissive = {
      head: get(HEADLIGHT_MATERIALS),
      tail: get(TAILLIGHT_MATERIALS),
      dials: get(DIAL_MATERIALS),
    };
    // remember the original intensity of each emissive
    [...emissive.head, ...emissive.tail, ...emissive.dials].forEach((m) => {
      m.userData.baseEmissive = m.emissiveIntensity || 1;
    });

    const roles = {} as Record<CategoryId, Anim[]>;
    (Object.keys(ROLES) as CategoryId[]).forEach((k) => {
      roles[k] = get(ROLES[k]).map((mat) => {
        const look: Look = {
          color: mat.color.clone(),
          metalness: mat.metalness,
          roughness: mat.roughness,
          clearcoat: (mat as THREE.MeshPhysicalMaterial).clearcoat ?? 0,
        };
        return { mat, ...look, color: look.color.clone(), orig: { ...look, color: look.color.clone() } };
      });
    });

    return { scale, offset, size: size.clone().multiplyScalar(scale), emissive, roles };
  }, [scene]);

  // publish the normalised dimensions for camera maths
  useEffect(() => {
    stage.bike.L = prepared.size.z;
    stage.bike.W = prepared.size.x;
    stage.bike.H = prepared.size.y;
    stage.bike.ready = true;
    sceneRefs.bike = yawRef.current;
    if (process.env.NODE_ENV !== 'production') {
      (window as unknown as { __bike: unknown }).__bike = { scene, prepared, THREE, stage };
    }
    return () => {
      sceneRefs.bike = null;
      stage.bike.ready = false;
    };
  }, [prepared, scene]);

  // ── configurator: retarget animated colours whenever the selection changes ──
  useEffect(() => {
    const apply = () => {
      const sel = configStore.get().selection;
      CATEGORIES.forEach((cat) => {
        const opt = cat.options.find((o) => o.id === sel[cat.id]) ?? cat.options[0];
        const isDefault = opt.id === DEFAULT_SELECTION[cat.id];
        prepared.roles[cat.id].forEach((a) => {
          // the stock option is the untouched supplied material
          if (isDefault) {
            a.color.copy(a.orig.color);
            a.metalness = a.orig.metalness;
            a.roughness = a.orig.roughness;
            a.clearcoat = a.orig.clearcoat;
            return;
          }
          a.color.set(opt.color);
          a.metalness = opt.metalness ?? a.orig.metalness;
          a.roughness = opt.roughness ?? a.orig.roughness;
          a.clearcoat = opt.clearcoat ?? a.orig.clearcoat;
        });
      });
    };
    apply();
    return configStore.subscribe(apply);
  }, [prepared]);

  // ── per-frame: yaw, lights on the model, material lerps ─────────────────────
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const g = yawRef.current;
    if (!g) return;

    // idle museum spin — only weighted in where the pose allows it
    const spin = clamp(stage.cur.spin) * stage.introSpin;
    idle.current += dt * 0.06 * spin;
    idle.current *= Math.exp(-dt * 1.1 * (1 - spin));
    idle.current = Math.atan2(Math.sin(idle.current), Math.cos(idle.current));
    const yaw = stage.cur.rot + idle.current;
    g.rotation.y = yaw;
    stage.bike.yaw = yaw;

    // emissives (headlight, tail, dials) follow the lighting state
    const head = clamp(stage.headlight * stage.cur.headlight);
    const tail = clamp(stage.tail * stage.cur.headlight);
    prepared.emissive.head.forEach((m) => (m.emissiveIntensity = m.userData.baseEmissive * 7 * head));
    prepared.emissive.tail.forEach((m) => (m.emissiveIntensity = m.userData.baseEmissive * 4 * tail));
    prepared.emissive.dials.forEach((m) => (m.emissiveIntensity = m.userData.baseEmissive * 1.2 * tail));

    // finishes ease toward their target (never snap)
    (Object.keys(prepared.roles) as CategoryId[]).forEach((k) => {
      prepared.roles[k].forEach((a) => {
        const m = a.mat as THREE.MeshPhysicalMaterial;
        m.color.lerp(a.color, 1 - Math.exp(-dt * 5));
        m.metalness = damp(m.metalness, a.metalness, 5, dt);
        m.roughness = damp(m.roughness, a.roughness, 5, dt);
        if (m.clearcoat !== undefined) m.clearcoat = damp(m.clearcoat, a.clearcoat, 5, dt);
      });
    });
  });

  return (
    <group ref={yawRef}>
      <group scale={prepared.scale} rotation={[0, Math.PI, 0]}>
        <group position={prepared.offset}>
          <primitive object={scene} />
        </group>
      </group>
      <HeadlightRig quality={quality} />
    </group>
  );
}

useGLTF.preload(MODEL.bike);
