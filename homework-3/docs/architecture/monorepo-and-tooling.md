# Monorepo and Tooling (Documentation)

> Standard toolchain for future implementation under [`homework-3/platform/`](../../platform/). **HW3 uses NestJS microservices — not Hono** (homework-1/2 patterns do not apply).

---

## Package manager and layout

| Topic | Decision |
|-------|----------|
| Package manager | **npm** (v10+) |
| Monorepo | **npm workspaces** at `homework-3/platform/package.json` |
| Workspaces | `apps/*`, `services/*` |
| Packages | `apps/web`, `apps/gateway-bff`, `services/identity-household`, `services/bank-connector`, `services/ledger`, `services/budget`, `services/export`, `services/audit` |

Hypothetical root `package.json` (documentation only):

```json
{
  "name": "@hw3/platform",
  "private": true,
  "workspaces": ["apps/*", "services/*"],
  "scripts": {
    "test": "npm run test -ws --if-present",
    "build": "npm run build -ws --if-present"
  }
}
```

Each workspace package defines its own `vitest.config.ts` and `"test": "vitest run"`.

---

## Test stack (single standard)

| Layer | Tool | Pattern |
|-------|------|---------|
| Test runner | **Vitest 2.x** only | No Jest, no `node:test` |
| Unit | Vitest | Pure logic: dedup, redaction, validators |
| Nest integration | `@nestjs/testing` + **supertest** | `Test.createTestingModule` → `app.getHttpServer()` → `request(server).get(...)` |
| MongoDB integration | **mongodb-memory-server** (assumed) | Per-test or per-suite in-memory DB; no Docker required for homework |
| Angular `apps/web` | Vitest for shared libs only (MVP doc) | Full UI E2E remains **E2E-doc** until Playwright is added |

**Forbidden for HW3:** Hono `app.request()`, copying homework-1/2 Vitest patterns without adapting to Nest HTTP server.

### Integration test sketch

```typescript
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Import confirm (MO-2)', () => {
  it('returns 403 for user role', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    const server = app.getHttpServer();
    await request(server)
      .post('/api/v1/households/hh_mars_001/import-previews/prev_x/confirm')
      .set('Authorization', 'Bearer <user-jwt>')
      .expect(403);
    await app.close();
  });
});
```

Run from package root: `npm test` (invokes Vitest).

---

## API contracts

HTTP JSON shapes: [`../api/openapi/`](../api/openapi/). When implementing Nest controllers, align DTOs with OpenAPI components; optional `@nestjs/swagger` decorators in code are an implementation choice, not part of the graded spec package.

---

## Related documents

- [`configuration.md`](configuration.md) — environment variables
- [`../testing/testing-strategy.md`](../testing/testing-strategy.md)
- [`../../agents.md`](../../agents.md) §2, §8
- [`../../platform/README.md`](../../platform/README.md)
