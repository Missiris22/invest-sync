import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Determine how to handle process.env for the API key in local dev
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});