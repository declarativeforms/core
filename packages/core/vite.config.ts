import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@declarativeforms/common": path.resolve(
        __dirname,
        "../common/src/index.ts",
      ),
      "@declarativeforms/runtime": path.resolve(
        __dirname,
        "../runtime/src/index.ts",
      ),
      "@declarativeforms/types": path.resolve(
        __dirname,
        "../types/src/index.ts",
      ),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
