import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/Project-ZAR/", // 👈 Add this line for your repo name
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "globalThis", // Fix for amazon-cognito-identity-js
  },
  optimizeDeps: {
    include: ["amazon-cognito-identity-js"],
    esbuildOptions: {
      define: {
        global: "globalThis", // Also needed here
      },
    },
  },
  build: {
    target: "es2020",
    rollupOptions: {
      external: [], // Ensure nothing is externalized
      // 👇 Add this for SPA routing
      input: {
        main: "index.html",
        "404": "404.html"
      }
    },
  },
}));