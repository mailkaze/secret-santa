import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  build: {
    // El SDK de Firestore ocupa ~580 kB por sí solo y no se puede trocear más
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Las librerías van en chunks propios: tras un despliegue solo cambia el de la app
        codeSplitting: {
          groups: [
            { name: 'firebase', test: /node_modules[\\/](firebase|@firebase|re2js|idb)[\\/]/, priority: 3 },
            { name: 'mui', test: /node_modules[\\/](@mui|@emotion|@popperjs|stylis|react-transition-group|@fontsource-variable)[\\/]/, priority: 2 },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-redux|redux|@reduxjs|immer|reselect|use-sync-external-store)[\\/]/, priority: 1 },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
