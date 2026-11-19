import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { defineConfig, devices } from '@playwright/test';

// Pile E2E isolée : ports dédiés et base SQLite jetable (la base de développement n'est jamais touchée).
const BACKEND_PORT = 8100;
const FRONTEND_PORT = 5174;
const backendDir = resolve('..', 'backend');
const venvPython = join(backendDir, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const python = process.env.E2E_PYTHON ?? (existsSync(venvPython) ? `"${venvPython}"` : 'python');

const dbDir = join(tmpdir(), 'youth-city-e2e');
const dbPath = join(dbDir, 'e2e.sqlite3');
mkdirSync(dbDir, { recursive: true });
// Le fichier ne doit être recréé qu'au lancement principal, pas dans chaque worker Playwright.
if (!process.env.TEST_WORKER_INDEX) rmSync(dbPath, { force: true });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  use: {
    baseURL: `http://127.0.0.1:${FRONTEND_PORT}`,
    locale: 'fr-FR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `${python} manage.py migrate --noinput && ${python} manage.py seed_game_data && ${python} manage.py runserver 127.0.0.1:${BACKEND_PORT} --noreload`,
      cwd: backendDir,
      env: { DJANGO_DB_PATH: dbPath, DJANGO_DEBUG: 'True' },
      url: `http://127.0.0.1:${BACKEND_PORT}/api/v1/auth/me/`, // 401 sans jeton = serveur prêt
      timeout: 120_000,
      reuseExistingServer: false,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${FRONTEND_PORT} --strictPort`,
      env: { VITE_PROXY_TARGET: `http://127.0.0.1:${BACKEND_PORT}` },
      url: `http://127.0.0.1:${FRONTEND_PORT}`,
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
});
