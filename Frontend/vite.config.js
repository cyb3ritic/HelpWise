import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // resolve: {
  //   alias: {
  //     '@': path.resolve(__dirname, './src'), // Simplify import paths with '@'
  //   },
  // },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:9001', // Backend server URL
        changeOrigin: true,
        secure: false, // Set to true if backend uses HTTPS
        // Optional: Rewrite the path if backend API doesn't use '/api' prefix
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
    // Optional: Specify host and port if different from defaults
    // host: '0.0.0.0',
    // port: 3000,
  },
})
