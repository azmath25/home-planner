import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This 'base' property is the magic line that fixes the blank white screen on GitHub Pages
  base: './', 
})
