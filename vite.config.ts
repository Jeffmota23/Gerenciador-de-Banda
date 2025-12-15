import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Aumenta o limite de aviso para 1600kb para evitar alertas falsos positivos em builds grandes
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Estratégia de divisão de código para otimizar o carregamento
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react'],
          'vendor-ai': ['@google/genai'],
        },
      },
    },
  },
});