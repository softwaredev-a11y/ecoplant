import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config///ecoplant
export default defineConfig(({ command }) => ({
    base: command === 'serve' ? '/' : '/apps/ecoplant/',
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost',
                changeOrigin: true,
            }
        }
    }
}))