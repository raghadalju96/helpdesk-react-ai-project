import type { FullConfig } from '@playwright/test'

async function globalTeardown(_config: FullConfig) {
  // The next globalSetup run resets the test database with `prisma migrate reset --force`,
  // so no cleanup is needed here. Add per-run truncation if tests need a mid-run clean state.
}

export default globalTeardown
