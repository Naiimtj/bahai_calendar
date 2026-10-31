import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          [
            '@locator/babel-jsx/dist',
            {
              env: 'development',
            },
          ],
        ],
      },
    }),
  ],
  css: {
    postcss: {
      plugins: [tailwindcss('./tailwind.config.js'), autoprefixer()],
    },
  },
  build: {
    target: 'chrome91',
    cssTarget: 'chrome91',
  },
  server: {
    port: 4100,
    open: true,
    host: '0.0.0.0',
  },
});
