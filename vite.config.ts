
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Setting base to './' ensures the app works correctly in any subfolder (like /heicconverter2/)
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Generate sourcemaps for easier debugging if needed
    sourcemap: true,
  },
});
