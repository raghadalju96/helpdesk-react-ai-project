# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An AI-powered helpdesk ticket management system. Support emails arrive, tickets are created, and Claude AI auto-classifies tickets, generates summaries, and suggests replies. Agents can manage and respond to tickets through a web UI.

**User roles:** Admin (manages agents) and Agent (manages tickets).
**Ticket statuses:** Open, Resolved, Closed.
**Ticket categories:** General Question, Technical Question, Refund Request.

## Monorepo Structure

npm workspaces with two packages:

- `client/` — React + TypeScript + Vite + Tailwind v4 + shadcn/ui
- `server/` — Express + TypeScript + Prisma + better-auth

The client proxies all `/api/*` requests to the server at `http://localhost:3000`.

## Development Commands

Run from the **repo root**:

```bash
npm run dev:server    # Express on http://localhost:3000
npm run dev:client    # Vite on http://localhost:5173
```

## Tech Stack

- **Frontend:** React 19, TypeScript 6, Vite, Tailwind CSS v4, shadcn/ui, React Router v7, react-hook-form + zod
- **Backend:** Express, TypeScript, Prisma (PostgreSQL), better-auth
- **Planned:** Claude API (AI features), SendGrid/Mailgun (email), Docker (deployment)
- **Path alias:** `@/` → `src/` in the client

## Authentication

- **Library:** better-auth with email/password (sign-up disabled — Admin creates accounts only)
- **Session:** cookie-based; sent automatically with every request
- **Roles:** `admin` | `agent` stored on the `User` model, default `agent`, set server-side only (`input: false` — cannot be set by the user)
- **Server config:** `server/src/auth.ts` — uses Prisma adapter (PostgreSQL), trusted origin `http://localhost:5173`
- **Server route guard:** `requireAuth` middleware (`server/src/middleware/requireAuth.ts`) — validates session via `auth.api.getSession()`, attaches `res.locals.user` and `res.locals.session`, returns 401 if unauthenticated
- **Role-based access:** check `res.locals.user.role` after `requireAuth`; return 403 if the role doesn't match
- **Client auth:** `authClient` from `client/src/lib/auth-client.ts` — `authClient.useSession()`, `authClient.signIn.email({ email, password })`, `authClient.signOut()`
- **Client route guard:** `ProtectedRoute` component — uses `authClient.useSession()`, redirects to `/login` if no session
- **Mount order:** auth handler (`/api/auth/*splat`) must be registered **before** `express.json()` in `server/src/index.ts`

## Key Conventions

- Use **context7 MCP** to fetch up-to-date docs for any library before writing code
- Use **TypeScript** — no plain JS files
- Use **shadcn/ui components** for all UI — avoid raw HTML `<button>`, `<input>`, `<label>`
- Use **shadcn design tokens** (`text-primary`, `border-border`, etc.) — the old `--accent`, `--accent-bg`, `--accent-border` CSS variables were overwritten by shadcn and must not be used
- Add shadcn components with: `cd client && npx shadcn@latest add <component>`

## Architecture

- `server/src/routes/` — Express route handlers
- `server/src/middleware/` — auth and role-based access middleware
- `server/src/prisma/` — Prisma schema and client

## Implementation Status

Currently at **Phase 2** complete. See `implementation-plan.md` for the full plan.

**Done:** Project scaffolding, auth (better-auth, login page, protected routes), Tailwind v4 + shadcn/ui setup.

**Next:** Phase 3 — Core ticket CRUD (Prisma schema, ticket list/detail/create pages).
