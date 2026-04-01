import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "ICSMulti",
      fileName: "widget",
      formats: ["iife"],
    },
    // Pas de fichier .css séparé — le CSS est une string inline dans le TS
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
