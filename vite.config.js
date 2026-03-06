import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import mkcert from 'vite-plugin-mkcert';
import { visualizer } from "rollup-plugin-visualizer";
import { viteStaticCopy } from 'vite-plugin-static-copy';
// import vueDevTools from 'vite-plugin-vue-devtools';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import Components from 'unplugin-vue-components/vite';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isBuild = command === 'build';
  const isAnalyze = isBuild && mode === 'analyze';

  return {
    plugins: [
      vue(),
      svgLoader(),
      command === 'serve' && mkcert(),
      // vueDevTools(),
      isAnalyze && visualizer({ filename: 'stats.html', open: false, gzipSize: true, brotliSize: true }),
      viteStaticCopy({
        targets: [
          {
            src: 'src/assets/icons',
            dest: 'src/assets',
          }
        ],
      }),
      Components({
        resolvers: [
          PrimeVueResolver()
        ]
      })
    ].filter(Boolean),
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      reportCompressedSize: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return;
            if (id.includes('/vue/') || id.includes('/vue-router/') || id.includes('/pinia/')) return 'vue-core';
            if (id.includes('/primevue/')) {
              const primevuePart = id.split('/primevue/')[1] || '';
              const primevueEntry = primevuePart.split('/')[0];
              const primevueCoreEntries = new Set([
                'core',
                'icons',
                'utils',
                'usestyle',
                'basecomponent',
                'basedirective',
                'baseeditableholder',
                'config'
              ]);
              if (primevueCoreEntries.has(primevueEntry)) return 'primevue-core';
              return `pv-${primevueEntry}`;
            }
            if (id.includes('/@primevue/') || id.includes('/primeicons/')) return 'primevue-shared';
            if (id.includes('/quill/')) return 'editor';
            if (id.includes('/axios/') || id.includes('/qs/') || id.includes('/date-fns-tz/')) return 'network-utils';
            if (id.includes('/lodash/')) return 'lodash';
            return 'vendor';
          }
        }
      }
    },
    esbuild: {
      drop: isBuild ? ['console', 'debugger'] : [],
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
  };
});
