import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "ICSMulti",
      fileName: "widget",
      formats: ["iife"],
    },
    // esbuild 0.28+ ne transpile plus le destructuring vers safari<16/ios<16
    // — fixer une cible ES2020 (destructuring natif depuis 2020 partout)
    target: "es2020",
    // Pas de fichier .css séparé — le CSS est une string inline dans le TS
    cssCodeSplit: false,
  },
});
