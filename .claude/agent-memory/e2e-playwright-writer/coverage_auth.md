---
name: Auth spec coverage
description: What auth flows are covered by e2e/auth.spec.ts and key selectors used
type: project
---

`e2e/auth.spec.ts` covers the full authentication surface as of Phase 2:

- Login page UI (field visibility, auto-focus, heading)
- Client-side zod validation (empty form, bad email, missing password, error clearing)
- Server-side errors (wrong password, non-existent email, no navigation on error)
- Successful login (redirect to /, loading state "Signing in…", home page content)
- Already-authenticated redirect (/login → /)
- Sign out (redirect to /login, subsequent / visit bounces back)
- Unauthenticated protected routes (/, /users, unknown route all → /login)
- Admin role access (/users accessible, NavBar visible)

Key selectors established:
- Email field: `page.getByLabel('Email')` (id="email", Label htmlFor="email")
- Password field: `page.getByLabel('Password')` (id="password")
- Submit button: `page.getByRole('button', { name: /^sign in$/i })`
- Loading button: `page.getByRole('button', { name: /signing in…/i })`
- Sign out button: `page.getByRole('button', { name: /sign out/i })` — lives in NavBar
- Validation errors: `page.getByText('Invalid email address')`, `page.getByText('Password is required')`
- Server error: `page.locator('p.text-destructive').last()`
- Users heading: `page.getByRole('heading', { name: 'Users' })`

**Why:** sign-in API route intercepted at `**/api/auth/sign-in/email` to test loading state.
**How to apply:** reuse these selectors in any future auth-related test additions.
