import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/k8s-incident-simulator/',
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173 },
})
