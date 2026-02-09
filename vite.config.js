import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [basicSsl()],
  base: '/CoffeeMakerSAE402/',
  server: {
    host: true,
    https: true
  }
})
