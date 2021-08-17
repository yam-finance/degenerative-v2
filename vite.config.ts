import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import { resolve } from 'path';
import eslint from '@rollup/plugin-eslint';
import nodePolyfills from 'rollup-plugin-polyfill-node';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    {
      ...eslint({ include: 'src/**/*.+(js|jsx|ts|tsx)' }),
      enforce: 'pre',
    },
    reactRefresh(),
    //nodePolyfills(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
