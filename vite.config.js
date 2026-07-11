import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

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
    tailwindcss(),
  ],
  server: {
    port: 4100,
    open: true,
    host: '0.0.0.0',
  },
});
