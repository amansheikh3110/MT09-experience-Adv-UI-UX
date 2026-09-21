# MT—09 SP — cinematic launch experience

Next.js 16 · React 19 · Three.js / React Three Fiber · GSAP ScrollTrigger · Lenis.
One continuous scroll: black → power failure → focused light → shutter → the machine → nine chapters → back to the dark.

```bash
npm run dev      # http://localhost:3000
npm run build && npm start
```

Dev/test switches (URL): `?intro=off` skips the opening · `?q=high|mid|low` forces a quality tier.

## Where to change things

| I want to…                            | Edit                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| swap the model / any image path        | `src/config/assets.ts` (single source of truth)                                                       |
| re-crop a render, move a label         | `CROPS` in `assets.ts`; hotspots are in each section (source-image fractions)                       |
| add coastal / night / mountain scenes  | `ENVIRONMENTS` in `assets.ts` (flip `enabled`, set `picture`)                                   |
| change copy, specs, 3D study labels    | `src/config/content.ts`                                                                               |
| retime the camera / lights per chapter | `src/config/shots.ts` (keyframes per section)                                                         |
| retime the opening sequence            | `src/scroll/intro.ts`                                                                                 |
| change configurator options            | `src/config/finishes.ts` (+ `ROLES` in `components/3d/Motorcycle.tsx` maps them to GLB materials) |
| colours / type / tokens                | `src/app/globals.css`                                                                                 |

## Architecture

- `src/lib/stage.ts` — one mutable "stage" object (lighting state, camera pose, pointer). GSAP and scroll write it; the R3F scene reads it every frame. No React re-renders per frame.
- `src/scroll/pose.ts` — reads the scroll position, finds the active 3D chapter, samples its keyframe track → camera + bike yaw + light multipliers. `CameraRig` damps toward it.
- `src/components/3d/*` — isolated scene: `Showroom`, `Shutter` (instanced slats that really stack into the housing), `LightRig`, `Volumetrics` (shader light shafts, mist, flares), `Motorcycle`, `CameraRig`. Rendering pauses while an opaque chapter covers the canvas.
- `src/components/sections/*` — the nine chapters. 3D chapters are tall + `position: sticky`; editorial chapters are opaque and slide over the fixed canvas.
- `src/components/ui/Plate.tsx` — a supplied render cropped in CSS with dot / hairline / mono-label annotations that stay glued to the right part of the bike. `Annotations.tsx` does the same for the live 3D model (projected every frame).

## The 3D model

The download is 42 MB. The site loads `public/assets/model/mt09.glb` (6 MB), produced with:

```bash
gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp \
  --texture-size 2048 --join false --palette false --simplify true --simplify-error 0.0005
```

`--palette false` matters: the default merges flat-colour materials into palette textures and the configurator can no longer recolour paint, wheels and chain.

Images: `node scripts/optimize-images.mjs` regenerates the WebP variants in `public/assets/img`. The exploded-view renders are intentionally unused. The original 42 MB GLB and the `scene.gltf/bin` copy are not loaded by the site — delete them from `public/` before deploying if you want a lighter bundle.

## Licence / credit

Model: “2025 Yamaha MT-09 SP V4” by VTX, **CC BY-NC-SA 4.0** — attribution is shown in the final chapter and the menu (`MODEL_CREDIT`). Non-commercial only. Specs in `content.ts` are placeholder launch copy for the machine shown; replace them with real figures.
