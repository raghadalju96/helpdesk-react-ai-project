---
name: coverage-webhooks
description: Describe blocks, scenarios, and key constraints for e2e/webhooks.spec.ts (POST /api/webhooks/email)
metadata:
  type: project
---

# Webhook e2e spec — `e2e/webhooks.spec.ts`

## Endpoint
`POST http://localhost:3000/api/webhooks/email`

## Describe blocks

| Block | What it covers |
|---|---|
| happy path | 200 with full payload; 200 without optional body_html; id increments across calls |
| email normalization | uppercase from → 200 (stored lowercased); whitespace-padded from → 200 |
| missing required fields | 400 for each of: from, from_name, subject, body_plain; empty-object body hits "from" first |
| content type / edge cases | plain-text body → 400; no body → 400; empty-string "from" → 400; empty-string body_plain → 400 |
| webhook secret (WEBHOOK_SECRET not set) | no header → 200; wrong header value → 200 (env not set, check skipped) |
| response shape contract | top-level keys = ["ticket"]; ticket keys = [id, subject, status, createdAt]; no body/bodyHtml/fromEmail/fromName leak; error shape has string "error" field |

## Key findings from implementation

- Validation order in route: from → from_name → subject → body_plain. Empty object returns error for "from".
- `WEBHOOK_SECRET` is NOT set in the test server env (playwright.config.ts webServer.env). The 401 path cannot be exercised in a standard e2e run without restarting the server with that var set.
- `status` is returned as the string `"open"` (Prisma enum serialised as its lowercase string value).
- `id` is `Int @default(autoincrement())` — asserting `typeof === 'number'` and `Number.isInteger`.
- Prisma `select` on the create call only returns `id, subject, status, createdAt` — body/bodyHtml/fromEmail/fromName are intentionally excluded.
- `express.json()` ignores non-JSON content-type → `req.body` stays `{}` → validation fires → 400.

## Related
- [[patterns-api-request]] — these tests use `request` fixture only, no browser.
