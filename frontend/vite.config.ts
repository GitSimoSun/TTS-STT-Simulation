import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import mkcert from 'vite-plugin-mkcert'
// import basicSsl from '@vitejs/plugin-basic-ssl'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()], //, mkcert(), basicSsl()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5001/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/socket.io': {
        target: "http://localhost:5001/",
        ws: true,
      },
    },
  }
})
