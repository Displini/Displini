import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// Nodig omdat __dirname niet standaard bestaat in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    // Performance optimizations
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
    minify: 'esbuild', // Use esbuild (faster and built-in)
    // Code splitting configuration
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks only (Vite handles feature chunks automatically)
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'date-vendor': ['date-fns'],
          'ui-vendor': ['lucide-react'],
          'router-vendor': ['wouter'],
          'query-vendor': ['@tanstack/react-query'],
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit (we have good code splitting now)
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173, 
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'date-fns',
      'wouter',
      '@tanstack/react-query',
    ],
  },
});