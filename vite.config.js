import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import mkcert from 'vite-plugin-mkcert';
import { visualizer } from "rollup-plugin-visualizer";
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    svgLoader(),
    mkcert(),
    visualizer(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/assets/icons',
          dest: 'src/assets',
        }
      ]
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    host: "0.0.0.0",
    https: true,
  },
  resolve: { 
    alias: { 
      '@': '/src',
      '~': '/public'
    } 
  },
});

