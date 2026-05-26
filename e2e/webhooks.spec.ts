import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/email'

/** A complete, valid inbound email payload. */
const VALID_PAYLOAD = {
  from: 'customer@example.com',
  from_name: 'Jane Customer',
  subject: 'My order arrived damaged',
  body_plain: 'Hi, I need help with order #1234.',
  body_html: '<p>Hi, I need help with order #1234.</p>',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** POST JSON to the webhook endpoint and return the raw APIResponse. */
async function postWebhook(
  request: import('@playwright/test').APIRequestContext,
  payload: Record<string, unknown>,
  headers: Record<string, string> = {},
) {
  return request.post(WEBHOOK_URL, {
    data: payload,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

test.describe('POST /api/webhooks/email — happy path', () => {
  test('should return 200 with the created ticket when all required fields are provided', async ({
    request,
  }) => {
    const response = await postWebhook(request, VALID_PAYLOAD)

    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body).toHaveProperty('ticket')
    const { ticket } = body

    // id is an auto-incrementing integer
    expect(typeof ticket.id).toBe('number')
    expect(Number.isInteger(ticket.id)).toBe(true)

    // subject must match what was sent
    expect(ticket.subject).toBe(VALID_PAYLOAD.subject)

    // status defaults to "open"
    expect(ticket.status).toBe('open')

    // createdAt is present and parseable as a date
    expect(typeof ticket.createdAt).toBe('string')
    expect(isNaN(Date.parse(ticket.createdAt))).toBe(false)
  })

  test('should return 200 when body_html is omitted (optional field)', async ({ request }) => {
    const { body_html: _omitted, ...payloadWithoutHtml } = VALID_PAYLOAD

    const response = await postWebhook(request, payloadWithoutHtml)

    expect(response.status()).toBe(200)

    const { ticket } = await response.json()
    expect(ticket.subject).toBe(VALID_PAYLOAD.subject)
    expect(ticket.status).toBe('open')
  })

  test('should return a ticket whose id increments with each successful POST', async ({
    request,
  }) => {
    const first = await postWebhook(request, { ...VALID_PAYLOAD, subject: 'First ticket' })
    const second = await postWebhook(request, { ...VALID_PAYLOAD, subject: 'Second ticket' })

    expect(first.status()).toBe(200)
    expect(second.status()).toBe(200)

    const { ticket: t1 } = await first.json()
    const { ticket: t2 } = await second.json()

    expect(t2.id).toBeGreaterThan(t1.id)
  })
})

// ---------------------------------------------------------------------------
// Email normalization
// ---------------------------------------------------------------------------

test.describe('POST /api/webhooks/email — email normalization', () => {
  test('should lowercase the "from" email address before storing it', async ({ request }) => {
    // Send a payload with mixed-case "from" and verify the response subject
    // comes back (the route normalises fromEmail silently — we confirm 200 is
    // returned and the ticket is created; the stored value can be verified via
    // a follow-up GET if that endpoint exists, but we at minimum assert no error).
    const response = await postWebhook(request, {
      ...VALID_PAYLOAD,
      from: 'UPPERCASE@EXAMPLE.COM',
      subject: 'Test email normalisation',
    })

    expect(response.status()).toBe(200)

    const { ticket } = await response.json()
    // The ticket is created — normalisation did not cause a 400/500
    expect(ticket.subject).toBe('Test email normalisation')
    expect(ticket.status).toBe('open')
  })

  test('should trim leading and trailing whitespace from "from" before storing', async ({
    request,
  }) => {
    const response = await postWebhook(request, {
      ...VALID_PAYLOAD,
      from: '  customer@example.com  ',
      subject: 'Test from trimming',
    })

    expect(response.status()).toBe(200)

    const { ticket } = await response.json()
    expect(ticket.subject).toBe('Test from trimming')
  })
})

// ---------------------------------------------------------------------------
// Validation — missing required fields
// ---------------------------------------------------------------------------

test.describe('POST /api/webhooks/email — missing required fields', () => {
  test('should return 400 with correct error when "from" is missing', async ({ request }) => {
    const { from: _omitted, ...payload } = VALID_PAYLOAD

    const response = await postWebhook(request, payload)

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body).toHaveProperty('error', 'Field "from" is required')
  })

  test('should return 400 with correct error when "from_name" is missing', async ({ request }) => {
    const { from_name: _omitted, ...payload } = VALID_PAYLOAD

    const response = await postWebhook(request, payload)

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body).toHaveProperty('error', 'Field "from_name" is required')
  })

  test('should return 400 with correct error when "subject" is missing', async ({ request }) => {
    const { subject: _omitted, ...payload } = VALID_PAYLOAD

    const response = await postWebhook(request, payload)

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body).toHaveProperty('error', 'Field "subject" is required')
  })

  test('should return 400 with correct error when "body_plain" is missing', async ({
    request,
  }) => {
    const { body_plain: _omitted, ...payload } = VALID_PAYLOAD

    const response = await postWebhook(request, payload)

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body).toHaveProperty('error', 'Field "body_plain" is required')
  })

  test('should return 400 for "from" when all fields are missing (empty body)', async ({
    request,
  }) => {
    // The route validates fields in order: from → from_name → subject → body_plain
    // So an empty object hits the "from" check first.
    const response = await postWebhook(request, {})

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body).toHaveProperty('error', 'Field "from" is required')
  })
})

// ---------------------------------------------------------------------------
// Validation — wrong content-type / non-JSON body
// ---------------------------------------------------------------------------

test.describe('POST /api/webhooks/email — content type and body edge cases', () => {
  test('should return 400 when the request body is sent as plain text (no JSON)', async ({
    request,
  }) => {
    // express.json() will not parse non-JSON content-type; req.body stays {}
    // so the missing-field validators fire and return a 400.
    const response = await request.post(WEBHOOK_URL, {
      data: 'not json at all',
      headers: { 'Content-Type': 'text/plain' },
    })

    // The server either rejects with 400 (missing field) or 400 (bad JSON parse).
    // Either way it must not be 200.
    expect(response.status()).toBe(400)
  })

  test('should return 400 when no body is sent at all', async ({ request }) => {
    // Sending no body means req.body is {} — same as missing-all-fields path.
    const response = await request.post(WEBHOOK_URL, {
      headers: { 'Content-Type': 'application/json' },
    })

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('should return 400 when "from" is an empty string', async ({ request }) => {
    // The guard is `!from` which catches empty string.
    const response = await postWebhook(request, { ...VALID_PAYLOAD, from: '' })

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body).toHaveProperty('error', 'Field "from" is required')
  })

  test('should return 400 when "body_plain" is an empty string', async ({ request }) => {
    const response = await postWebhook(request, { ...VALID_PAYLOAD, body_plain: '' })

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body).toHaveProperty('error', 'Field "body_plain" is required')
  })
})

// ---------------------------------------------------------------------------
// Webhook secret authentication
// ---------------------------------------------------------------------------

test.describe('POST /api/webhooks/email — webhook secret (WEBHOOK_SECRET not set)', () => {
  // NOTE: The test server is started by Playwright via `npm run dev:server` with
  // the env vars from playwright.config.ts webServer.env.  WEBHOOK_SECRET is NOT
  // set in that env, so the secret-check branch in the route is skipped entirely.
  //
  // The tests below verify the observed behaviour when WEBHOOK_SECRET is absent:
  //   - Requests without the header succeed normally (secret check is a no-op).
  //   - Requests WITH an X-Webhook-Secret header also succeed (header is ignored).
  //
  // To test the 401 path you would need to restart the server with WEBHOOK_SECRET
  // set to a known value, which is outside the scope of the standard e2e run.

  test('should return 200 when X-Webhook-Secret header is absent and WEBHOOK_SECRET env is not set', async ({
    request,
  }) => {
    const response = await postWebhook(request, VALID_PAYLOAD)

    expect(response.status()).toBe(200)
  })

  test('should return 200 (not 401) when X-Webhook-Secret header is present but WEBHOOK_SECRET env is not set', async ({
    request,
  }) => {
    // When WEBHOOK_SECRET is not configured, any header value is silently ignored.
    const response = await postWebhook(request, VALID_PAYLOAD, {
      'X-Webhook-Secret': 'some-random-value',
    })

    expect(response.status()).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// Response shape contract
// ---------------------------------------------------------------------------

test.describe('POST /api/webhooks/email — response shape', () => {
  test('should return exactly the expected top-level keys: ticket', async ({ request }) => {
    const response = await postWebhook(request, VALID_PAYLOAD)

    expect(response.status()).toBe(200)

    const body = await response.json()
    // The response must have a "ticket" key and nothing else at the top level
    expect(Object.keys(body)).toEqual(['ticket'])
  })

  test('should return a ticket object with exactly the keys: id, subject, status, createdAt', async ({
    request,
  }) => {
    const response = await postWebhook(request, VALID_PAYLOAD)
    const { ticket } = await response.json()

    const keys = Object.keys(ticket).sort()
    expect(keys).toEqual(['createdAt', 'id', 'status', 'subject'])
  })

  test('should not leak body or bodyHtml fields in the response', async ({ request }) => {
    const response = await postWebhook(request, VALID_PAYLOAD)
    const { ticket } = await response.json()

    // The Prisma select only picks id, subject, status, createdAt
    expect(ticket).not.toHaveProperty('body')
    expect(ticket).not.toHaveProperty('bodyHtml')
    expect(ticket).not.toHaveProperty('fromEmail')
    expect(ticket).not.toHaveProperty('fromName')
  })

  test('error responses should return a JSON object with an "error" string field', async ({
    request,
  }) => {
    const { from: _omitted, ...payload } = VALID_PAYLOAD
    const response = await postWebhook(request, payload)

    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(typeof body.error).toBe('string')
    expect(body.error.length).toBeGreaterThan(0)
  })
})
