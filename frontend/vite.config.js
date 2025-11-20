import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    hmr: {
        overlay: false
    },
    // Allow ngrok and other proxy services
    allowedHosts: [
      'localhost',
      '.ngrok-free.dev',
      '.ngrok-free.app', 
      '.ngrok.io',
      '.ngrok.app',
      'unflat-telltalely-clare.ngrok-free.dev'
    ]
  }
})

