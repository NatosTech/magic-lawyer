import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Rodar testes em paralelo */
  fullyParallel: false, // Desabilitar para evitar conflitos com DB
  /* Falhar build se algum teste falhar */
  forbidOnly: !!process.env.CI,
  /* Não executar testes em CI sem Playwright instalado */
  retries: process.env.CI ? 2 : 0,
  /* Limite de workers em CI */
  workers: process.env.CI ? 1 : 1,
  /* Configuração de reporter */
  reporter: 'html',
  /* Compartilhar configuração para todos os projetos */
  use: {
    /* Base URL para usar em navegação */
    baseURL: process.env.BASE_URL || 'http://localhost:9192',
    /* Coletar trace quando retentar um teste falho */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  /* Configurar projetos para os navegadores */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Executar servidor de desenvolvimento antes dos testes */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:9192',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

