import { test, expect, type Page } from '@playwright/test'
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from '../playwright.config'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to /login and fill + submit the form. Does NOT assert the outcome. */
async function fillAndSubmitLogin(page: Page, email: string, password: string) {
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /^sign in$/i }).click()
}

/** Log in as the seeded admin and wait for the home page. */
async function loginAsAdmin(page: Page) {
  await page.goto('/login')
  await fillAndSubmitLogin(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
  await page.waitForURL('/')
}

/** Clear cookies so the next navigation starts unauthenticated. */
async function clearSession(page: Page) {
  await page.context().clearCookies()
}

// ---------------------------------------------------------------------------
// Login page UI
// ---------------------------------------------------------------------------

test.describe('Login page UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should render email field, password field, and Sign in button', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible()
  })

  test('should auto-focus the email input on page load', async ({ page }) => {
    const emailInput = page.getByLabel('Email')
    await expect(emailInput).toBeFocused()
  })

  test('should display the Sign in card heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Client-side validation (zod)
// ---------------------------------------------------------------------------

test.describe('Client-side validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should show both validation errors when submitting an empty form', async ({ page }) => {
    await page.getByRole('button', { name: /^sign in$/i }).click()

    await expect(page.getByText('Invalid email address')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('should show "Invalid email address" for a malformed email', async ({ page }) => {
    await page.getByLabel('Email').fill('notanemail')
    await page.getByRole('button', { name: /^sign in$/i }).click()

    await expect(page.getByText('Invalid email address')).toBeVisible()
    // Password error should NOT appear (field is empty but email error dominates intent)
    // — we only assert the email error here; the password error may or may not show
  })

  test('should show "Password is required" when email is valid but password is empty', async ({
    page,
  }) => {
    await page.getByLabel('Email').fill('valid@example.com')
    await page.getByRole('button', { name: /^sign in$/i }).click()

    await expect(page.getByText('Password is required')).toBeVisible()
    await expect(page.getByText('Invalid email address')).not.toBeVisible()
  })

  test('should clear email validation error once a valid email is typed', async ({ page }) => {
    // Trigger error first
    await page.getByRole('button', { name: /^sign in$/i }).click()
    await expect(page.getByText('Invalid email address')).toBeVisible()

    // Fix the email field — error should disappear
    await page.getByLabel('Email').fill('valid@example.com')
    await page.getByRole('button', { name: /^sign in$/i }).click()

    await expect(page.getByText('Invalid email address')).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Server-side errors
// ---------------------------------------------------------------------------

test.describe('Server-side errors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display a server error for a wrong password', async ({ page }) => {
    await fillAndSubmitLogin(page, TEST_ADMIN_EMAIL, 'WrongPassword999!')

    // A server-side error paragraph should appear and the URL stays at /login
    const serverError = page.locator('p.text-destructive').last()
    await expect(serverError).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('should display a server error for a non-existent email', async ({ page }) => {
    await fillAndSubmitLogin(page, 'nobody@nowhere.com', 'AnyPassword123!')

    const serverError = page.locator('p.text-destructive').last()
    await expect(serverError).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('should not navigate away on server error', async ({ page }) => {
    await fillAndSubmitLogin(page, TEST_ADMIN_EMAIL, 'BadPassword!')

    await expect(page).toHaveURL('/login')
    // Sign in button should be re-enabled after the error
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeEnabled()
  })
})

// ---------------------------------------------------------------------------
// Successful login
// ---------------------------------------------------------------------------

test.describe('Successful login', () => {
  test.afterEach(async ({ page }) => {
    await clearSession(page)
  })

  test('should redirect to / after successful login with admin credentials', async ({ page }) => {
    await page.goto('/login')
    await fillAndSubmitLogin(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)

    await expect(page).toHaveURL('/')
  })

  test('should show "Signing in…" on the button while the request is in flight', async ({
    page,
  }) => {
    await page.goto('/login')

    // Slow down the sign-in API call so we can observe the loading state
    await page.route('**/api/auth/sign-in/email', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await route.continue()
    })

    await page.getByLabel('Email').fill(TEST_ADMIN_EMAIL)
    await page.getByLabel('Password').fill(TEST_ADMIN_PASSWORD)
    await page.getByRole('button', { name: /^sign in$/i }).click()

    // Loading text should appear while request is pending
    await expect(page.getByRole('button', { name: /signing in…/i })).toBeVisible()
    // Button must be disabled during submission
    await expect(page.getByRole('button', { name: /signing in…/i })).toBeDisabled()

    // Eventually lands on home
    await page.waitForURL('/')
  })

  test('should render the home page content after successful login', async ({ page }) => {
    await page.goto('/login')
    await fillAndSubmitLogin(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
    await page.waitForURL('/')

    // HomePage shows the user's email
    await expect(page.getByText(TEST_ADMIN_EMAIL)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Already authenticated — redirect away from /login
// ---------------------------------------------------------------------------

test.describe('Already authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test.afterEach(async ({ page }) => {
    await clearSession(page)
  })

  test('should redirect to / when navigating to /login while already signed in', async ({
    page,
  }) => {
    await page.goto('/login')

    await expect(page).toHaveURL('/')
  })
})

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

test.describe('Sign out', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should redirect to /login after signing out', async ({ page }) => {
    await page.getByRole('button', { name: /sign out/i }).click()

    await expect(page).toHaveURL('/login')
  })

  test('should not be able to access / after signing out', async ({ page }) => {
    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page).toHaveURL('/login')

    // Attempting to go back to home should bounce back to /login
    await page.goto('/')
    await expect(page).toHaveURL('/login')
  })

  test('should show login page (not redirect) after signing out and visiting /login', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page).toHaveURL('/login')

    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Protected routes — unauthenticated access
// ---------------------------------------------------------------------------

test.describe('Protected routes — unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    // Guarantee no session exists before each test
    await clearSession(page)
  })

  test('should redirect / to /login when not authenticated', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL('/login')
  })

  test('should redirect /users to /login when not authenticated', async ({ page }) => {
    await page.goto('/users')

    await expect(page).toHaveURL('/login')
  })

  test('should redirect an unknown route to /login when not authenticated', async ({ page }) => {
    // Catch-all → / → ProtectedRoute → /login
    await page.goto('/nonexistent')

    await expect(page).toHaveURL('/login')
  })

  test('should show the login form when redirected from a protected route', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Role-based access — admin
// ---------------------------------------------------------------------------

test.describe('Role-based access — admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test.afterEach(async ({ page }) => {
    await clearSession(page)
  })

  test('should allow the admin user to access /users without being redirected', async ({
    page,
  }) => {
    await page.goto('/users')

    await expect(page).toHaveURL('/users')
    // UsersPage renders an h1 with "Users"
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
  })

  test('should display the NavBar with a Sign out button on the home page', async ({ page }) => {
    // Confirms admin lands on an authenticated view
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
  })
})
