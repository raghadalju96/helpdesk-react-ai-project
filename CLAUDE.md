# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An AI-powered helpdesk ticket management system. Support emails arrive, tickets are created, and Claude AI auto-classifies tickets, generates summaries, and suggests replies. Agents can manage and respond to tickets through a web UI.

**User roles:** Admin (manages agents) and Agent (manages tickets).  
**Ticket statuses:** Open, Resolved, Closed.  
**Ticket categories:** General Question, Technical Question, Refund Request.

## Monorepo Structure

npm workspaces with two packages:
- `client/` — React + TypeScript + Vite frontend
- `server/` — Express + TypeScript backend

The client proxies all `/api/*` requests to the server at `http://localhost:3000` (configured in `client/vite.config.ts`).

## Development Commands

Run from the **repo root**:

```bash
# Start both dev servers (run in separate terminals)
npm run dev:server    # Express on http://localhost:3000
npm run dev:client    # Vite on http://localhost:5173

# Build
npm run build         # builds both server and client
npm run build:server  # tsc → dist/
npm run build:client  # tsc + vite build

# Lint (client only)
npm run lint --workspace=client
```

Run from the **server workspace**:
```bash
npm run dev     # tsx watch src/index.ts
npm run start   # node dist/index.js (after build)
```

No test runner is configured yet.

## Planned Tech Stack (not yet implemented)

As development progresses, these will be added:
- **Database:** PostgreSQL via **Prisma** ORM
- **Auth:** Session-based authentication (express-session)
- **Frontend routing:** React Router
- **Styling:** Tailwind CSS
- **AI:** Claude API (Anthropic) — ticket classification, summaries, suggested replies
- **Email:** SendGrid or Mailgun — inbound webhooks and outbound replies
- **Deployment:** Docker + cloud provider

## Key Conventions

- use context7 mcp to fetch up-to-date docs for libraries
- use typscript

## Architecture Patterns to Follow

When implementing new features, structure the server as:
- `server/src/routes/` — Express route handlers
- `server/src/middleware/` — Auth and role-based access middleware
- `server/src/prisma/` — Prisma schema and client

The client proxies to the server, so frontend `fetch('/api/...')` calls work in dev without CORS issues.

## Implementation Status

See `implementation-plan.md` for the full 8-phase plan. Currently at **Phase 1** (project scaffolding complete, no database or auth yet).
