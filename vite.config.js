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
                target: 'http://localhost', // La URL base de tu servidor XAMPP
                changeOrigin: true, // Necesario para que el servidor de destino reciba la petición correctamente
            }
        }
    }
}))