import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { TanStackStartVite } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { getRouterManifest } from "@tanstack/router-manifest";

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    TanStackStartVite(),
    viteReact(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    middlewareMode: true,
  },
  build: {
    target: "ES2022",
  },
});
