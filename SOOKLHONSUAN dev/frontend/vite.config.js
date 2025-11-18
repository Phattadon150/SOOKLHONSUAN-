import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    allowedHosts: true, // ⭐ แก้ปัญหา ngrok เปลี่ยน URL
    proxy: {
      "/api": {
        target: "http://localhost:4000", // ⭐ backend จริง
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  plugins: [react()],
});
