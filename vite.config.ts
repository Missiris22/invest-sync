import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables from .env files
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_API_KEY": JSON.stringify(env.VITE_API_KEY || ""),
      "process.env.API_KEY": JSON.stringify(env.API_KEY || ""),
    },
  };
});
