import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Dev should run at http://localhost:5173/
  // Build can be hosted under a subpath (e.g., GitHub Pages) at /ethereum-lab/
  base: command === 'build' ? '/ethereum-lab/' : '/',
  server: {
    host: true,
    port: 5173,
    // Avoid silently switching ports (breaks our PowerShell automation + student setup redirect)
    strictPort: true
  }
}))
