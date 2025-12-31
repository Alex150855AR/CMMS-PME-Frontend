import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Esto permite acceder desde tu celular (IP de red local)
    port: 5173  // Puerto por defecto
  }
})