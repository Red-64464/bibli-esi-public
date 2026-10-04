import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    strategies: "injectManifest",
    srcDir: "src",
    filename: "sw.js",
    manifest: false,
    injectRegister: false,
    registerType: "autoUpdate",
    injectManifest: { globPatterns: ["**/*.{js,css,html,png,svg,ico,json}"] },
  })],
  server: {
    proxy: {
      "/covers": {
        target: "https://bibliesi-public.75.119.140.201.nip.io",
        changeOrigin: true,
        secure: true,
      },
      "/supabase": {
        target: "https://supabase.75.119.140.201.nip.io",
        changeOrigin: true,
        secure: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/supabase/, ""),
      },
    },
  },
});
