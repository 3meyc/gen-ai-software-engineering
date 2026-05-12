# Homework 1: Build a Simple Banking Transactions API Using AI Assistance

## Scope
This homework is fully isolated from other experiments in the repository.

Do NOT:
- modify files outside `homework-1`
- introduce shared packages
- refactor repository-wide configs
- change root tooling unless explicitly requested

## Goal
Build a tiny REST API.

Requirements:
- minimal dependencies
- fast iteration
- simple architecture
- TypeScript only
- no enterprise patterns

## Tech Stack
- Node.js
- TypeScript
- Hono
- Vitest
- tsx

## Architecture Rules
- Keep everything inside `src/`
- Prefer functional style
- No DI containers
- No ORM initially
- No classes unless necessary
- No global state

## API Philosophy
This is intentionally small:
- up to 10 endpoints
- simple JSON responses
- no auth initially
- Use in-memory storage (object) - no database abstraction layer unless requested
- return appropriate HTTP status codes (200, 201, 400, 404)
- include error handling

## Testing
Use:
- Vitest
- Hono native request testing

Avoid:
- supertest
- heavy integration frameworks

## Non-Goals
Do NOT add:
- NestJS
- Express
- Redux-like patterns
- CQRS
- microservices
- Docker orchestration
- Kubernetes configs

## Dependency Philosophy
Prefer:
- zero dependencies
- native Node APIs
- lightweight libraries

## Expected Project Structure
src/
  app.ts
  server.ts
  routes/
test/

## Important
Treat this homework as disposable experimentation code optimized for learning and speed, not enterprise scalability.