import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/Project-ZAR/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Only enable in development mode AND not in production build
    process.env.NODE_ENV !== 'production' && mode === "development" && componentTagger()
  ].filter(Boolean),
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
      input: {
        main: "./index.html",
        "404": "./public/404.html"
      }
    },
  },
}));