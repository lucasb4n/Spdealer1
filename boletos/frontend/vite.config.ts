import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5180,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    target: 'es2015',
    outDir: '../src/main/webapp',
    emptyOutDir: true,
  },
});
