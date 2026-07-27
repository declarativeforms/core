import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: "@declarativeforms/react/styles.css",
        replacement: path.resolve(__dirname, "../react/src/styles.css"),
      },
      {
        find: "@declarativeforms/react",
        replacement: path.resolve(__dirname, "../react/src/index.ts"),
      },
      {
        find: "@declarativeforms/core",
        replacement: path.resolve(__dirname, "../core/src/index.ts"),
      },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
});
