---
name: Auth test helpers and patterns
description: Reusable helpers and patterns established in auth.spec.ts for use across future specs
type: project
---

Three inline helpers established in auth.spec.ts — copy or extract to a shared helper file when a second spec needs them:

```ts
// Fill and submit the login form without asserting outcome
async function fillAndSubmitLogin(page, email, password) {
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /^sign in$/i }).click()
}

// Full admin login flow — navigates to /login, submits, waits for /
async function loginAsAdmin(page) {
  await page.goto('/login')
  await fillAndSubmitLogin(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
  await page.waitForURL('/')
}

// Drop all cookies to return to unauthenticated state between tests
async function clearSession(page) {
  await page.context().clearCookies()
}
```

Pattern: use `clearSession` in `afterEach` after any test that logs in, and in `beforeEach` for unauthenticated-guard tests.

Loading state interception: slow down the sign-in API via `page.route('**/api/auth/sign-in/email', ...)` with a 1500ms artificial delay — does not require any app changes.

**Why:** workers=1, serial execution means leaked cookies from one test affect the next. clearCookies is the safest reset.
**How to apply:** always pair a login test with clearSession in afterEach or use clearSession in beforeEach when testing unauthenticated states.
