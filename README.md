# 🏍️ Yamaha MT-09 SP — Cinematic WebGL Experience

**Live Demo:** [mt-09-experience-adv-ui-ux.vercel.app](https://mt-09-experience-adv-ui-ux.vercel.app/)

A highly art-directed, immersive, and interactive 3D digital launch experience built specifically for the **2025 Yamaha MT-09 SP**. This project rejects generic web layouts in favor of a scroll-driven, real-time 3D cinematic narrative where Yamaha's masterpiece of "Dark Side of Japan" engineering is the undeniable protagonist.

---

## 🎬 The Core Experience

The website is designed to answer a single question: *"What does it feel like to encounter the MT-09 SP?"* 

Instead of browsing a traditional webpage, users enter a dark, controlled gallery environment. The experience is orchestrated into precise cinematic phases:
1. **Power Restoration:** A subtle electrical glitch initializes the system.
2. **Focused Illumination:** Volumetric spotlights reveal the aggressive silhouette of the MT-09 SP.
3. **The Shutter Reveal:** A heavy, physical industrial shutter rises, bathing the motorcycle in showroom lighting.
4. **Scroll Choreography:** Scroll position physically drives the 3D camera, object rotation, and lighting states, turning the user's scroll wheel into a camera operator's rig tracking every angle of the bike.

---

## 🛠️ Advanced Technical Architecture

This project utilizes a modern, performance-critical stack, abstracting complex WebGL operations into a declarative component tree.

- **Framework:** Next.js (App Router)
- **3D Rendering:** Three.js & React Three Fiber (R3F)
- **3D Utilities:** `@react-three/drei` (Environment, Preload, useGLTF)
- **Animation Engine:** GSAP & ScrollTrigger
- **Smooth Scrolling:** Studio Freight's `Lenis`
- **Analytics:** Vercel Analytics (`@vercel/analytics`)

### 🧠 Architectural Highlights

- **Decoupled Scroll Logic:** Scroll event listeners (`src/scroll/`) are entirely decoupled from the React render cycle. GSAP's `ticker` is synchronized directly with Lenis's `raf`, ensuring zero frame drops during complex 3D camera interpolations around the motorcycle.
- **Componentized 3D Hierarchy:** The scene is heavily modularized (`CameraRig`, `LightRig`, `Showroom`, `Stage`, `Volumetrics`). This prevents massive re-renders and keeps the declarative tree clean, mirroring the structure used by top-tier digital automotive agencies.
- **Custom Asset Pipeline:** Includes a bespoke Node.js build script (`scripts/optimize-images.mjs`) leveraging `sharp` to automatically generate mathematically perfect responsive `.webp` variants of the high-res Yamaha renders, ensuring razor-sharp macro photography without sacrificing load times.
- **Strict Design System:** Bypasses generic utility-class bloat. Uses pure CSS modules and global variables to strictly enforce a premium color palette (Graphite, Charcoal, Warm White, Yamaha Amber) and sophisticated Neo-Grotesk typography (Inter Tight & Geist Mono).
- **PBR Material Overrides:** The Yamaha GLB model is dynamically parsed, with specific nodes intercepted to enforce hyper-realistic Physically Based Rendering (PBR) parameters (roughness, metalness, clearcoat) matching real-world automotive paint and machined metals.

---

## ⚡ Performance & Optimization

Building a 41MB interactive WebGL experience required aggressive optimization to ensure a flawless 60FPS experience across devices:
- **DPR Scaling:** Device Pixel Ratio is capped (`dpr={[1, 2]}`) to prevent thermal throttling and memory crashes on high-density mobile screens.
- **Draw Call Reduction:** Heavy geometry and textures are pre-loaded via Drei's `<Preload all />` while a minimal, DOM-based Initializer masks the WebGL compilation phase.
- **Vercel Edge CDN:** Large `.bin` and `.glb` model files are offloaded to Vercel's global edge network, minimizing TTFB (Time to First Byte) globally.

---

## 💻 Running Locally

To experience the project in your local development environment:

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Run the image optimization pipeline
node scripts/optimize-images.mjs

# 3. Start the Next.js development server
npm run dev
```

Navigate to `http://localhost:3000` to view the experience.

---

*Designed and engineered as a masterclass in WebGL product storytelling for the Yamaha MT-09 SP.*
