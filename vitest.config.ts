import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Entorno de pruebas: jsdom simula el navegador
      environment: 'jsdom',
      
      // Archivos globales de setup (opcional)
      // setupFiles: ['./tests/setup.ts'],
      
      // Cobertura de código
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'dist/',
          '**/*.config.*',
          '**/*.d.ts',
          'tests/',
          '**/*.spec.ts',
          '**/*.test.ts',
        ],
      },
      
      // Globals (opcional - permite usar describe/it/expect sin imports)
      globals: true,
      
      // Incluir archivos de test
      include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      
      // Excluir
      exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'tests/e2e/**'],
    },
  })
)
