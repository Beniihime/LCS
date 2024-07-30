import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import mkcert from 'vite-plugin-mkcert';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), svgLoader(), mkcert()],
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
})
