import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png", "favicon.png", "logo.png"],
      manifest: {
        name: "Solara",
        short_name: "Solara",
        description: "Track a monthly budget by category, log transactions, and sync across devices.",
        start_url: ".",
        scope: ".",
        display: "standalone",
        background_color: "#fbf6f2",
        theme_color: "#fbf6f2",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
