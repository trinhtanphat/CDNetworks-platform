import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: process.env.CDN_CONSOLE_URL || 'http://localhost:5174',
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    supportFile: 'cypress/support/e2e.ts',
    video: false,
    viewportWidth: 1440,
    viewportHeight: 900,
    env: {
      apiUrl: process.env.CDN_API_URL || 'http://localhost:4000',
      user: 'admin@demo.com',
      pass: 'demo1234',
    },
  },
});
