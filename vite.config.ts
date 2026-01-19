import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import path from "path";
import { fileURLToPath } from "url";

// Nodig omdat __dirname niet standaard bestaat in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      // Provide `from` to silence PostCSS warnings about missing source paths
      from: undefined,
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  root: path.resolve(__dirname),
  publicDir: path.resolve(__dirname, "public"),
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
          'router-vendor': ['react-router-dom'],
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
      'react-router-dom',
      '@tanstack/react-query',
    ],
  },
});