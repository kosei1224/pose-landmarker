import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true
  },
  build: {
    outDir: 'docs',
  },
  plugins: [
    react(),
    basicSsl()
  ],
  base: '/pose-landmarker/',
})