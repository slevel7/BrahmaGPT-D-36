import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000",
      cwd: "../../services/api",
      url: "http://127.0.0.1:8000/health",
      reuseExistingServer: !process.env.CI,
      env: {
        DEMO_MODE: "true",
        DATABASE_URL: `sqlite:///${path.resolve(`../../.local/e2e-${Date.now()}.db`).replaceAll("\\", "/")}`,
        STORAGE_DIR: path.resolve("../../.local/e2e-files"),
      },
    },
    {
      command: "npm run start",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
