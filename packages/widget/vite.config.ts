import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "ICSMulti",
      fileName: "widget",
      formats: ["iife"],
    },
    cssCodeSplit: false,
  },
});
