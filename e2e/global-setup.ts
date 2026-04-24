import { execSync } from 'child_process'
import path from 'path'
import { Client } from 'pg'
import type { FullConfig } from '@playwright/test'
import { TEST_DATABASE_URL, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from '../playwright.config'

const SERVER_DIR = path.resolve(__dirname, '../server')

async function createTestDatabaseIfNotExists() {
  const url = new URL(TEST_DATABASE_URL)
  const dbName = url.pathname.slice(1).split('?')[0]

  const adminUrl = new URL(TEST_DATABASE_URL)
  adminUrl.pathname = '/postgres'
  adminUrl.search = ''

  const client = new Client({ connectionString: adminUrl.toString() })
  await client.connect()

  const { rows } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])
  if (rows.length === 0) {
    await client.query(`CREATE DATABASE "${dbName}"`)
    console.log(`[e2e] Created test database: ${dbName}`)
  }

  await client.end()
}

async function globalSetup(_config: FullConfig) {
  console.log('[e2e] Setting up test database...')

  await createTestDatabaseIfNotExists()

  // Reset schema, apply all migrations, and seed the test admin user
  execSync('npx prisma migrate reset --force', {
    cwd: SERVER_DIR,
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
      ADMIN_EMAIL: TEST_ADMIN_EMAIL,
      ADMIN_PASSWORD: TEST_ADMIN_PASSWORD,
    },
    stdio: 'inherit',
  })

  console.log('[e2e] Test database ready.')
}

export default globalSetup
