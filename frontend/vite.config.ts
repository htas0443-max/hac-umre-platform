import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import obfuscatorPlugin from 'rollup-plugin-obfuscator';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      tsconfigPaths(),

      // Gzip sıkıştırma (sadece production)
      ...(isProduction ? [
        viteCompression({
          algorithm: 'gzip',
          ext: '.gz',
          threshold: 1024, // 1KB üzeri dosyaları sıkıştır
        }),
        viteCompression({
          algorithm: 'brotliCompress',
          ext: '.br',
          threshold: 1024,
        }),
      ] : []),
    ],

    define: {
      'process.env': {}
    },

    server: {
      port: 3000,
      host: true,
      strictPort: true,
      allowedHosts: [
        'hajj-travel-assist.preview.emergentagent.com',
        'hacveumreturlari.com',
        'www.hacveumreturlari.com',
        'localhost',
        '127.0.0.1'
      ],
      hmr: {
        clientPort: 3000
      }
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },

    build: {
      outDir: 'dist',
      sourcemap: false, // Production'da sourcemap KAPALI
      chunkSizeWarningLimit: 1000,

      // Terser minification: console.log silme + agresif sıkıştırma
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,     // console.log, console.warn vs. sil
          drop_debugger: true,    // debugger statement'ları sil
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
        mangle: {
          toplevel: true,         // Üst seviye değişken adlarını karıştır
        },
        format: {
          comments: false,        // Tüm yorumları sil
        },
      },

      rollupOptions: {
        output: {
          // Hash'li chunk isimleri
          chunkFileNames: 'assets/js/[hash].js',
          entryFileNames: 'assets/js/[hash].js',
          assetFileNames: 'assets/[ext]/[hash].[ext]',
        },
        plugins: [
          // JavaScript obfuscation (sadece production)
          ...(isProduction ? [
            obfuscatorPlugin({
              options: {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.5,  // %50 — performans dengesi
                deadCodeInjection: true,
                deadCodeInjectionThreshold: 0.2,       // %20 — boyut dengesi
                stringArray: true,
                stringArrayRotate: true,
                stringArrayShuffle: true,
                stringArrayThreshold: 0.5,
                stringArrayEncoding: ['base64'],
                disableConsoleOutput: true,
                identifierNamesGenerator: 'hexadecimal',
                renameGlobals: false,    // Global'leri rename etme (React uyumluluğu)
                selfDefending: false,    // Performans için kapalı
                splitStrings: true,
                splitStringsChunkLength: 5,
                transformObjectKeys: false, // React props uyumluluğu
                unicodeEscapeSequence: false,
              },
            }),
          ] : []),
        ],
      },
    },

    preview: {
      port: 3000,
      host: true
    }
  };
});
