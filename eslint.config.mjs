import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // React Three Fiber drives three.js imperatively: uniforms, lights and cameras are
    // mutated inside useFrame on purpose (no React re-render per frame). The React Compiler
    // "immutability" rule is written for render-pure UI code and misfires on that pattern.
    files: ["src/components/3d/**/*.{ts,tsx}"],
    rules: { "react-hooks/immutability": "off" },
  },
]);

export default eslintConfig;
