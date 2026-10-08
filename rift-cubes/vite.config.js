import {defineConfig} from 'vite';

// Relative assets work at the domain root and /any-repository/ on GitHub Pages.
export default defineConfig({
  base: './',
  build: {rollupOptions: {output: {manualChunks: {three: ['three']}}}},
});
