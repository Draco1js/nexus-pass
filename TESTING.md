# Testing Guide

This project uses a comprehensive testing suite with both unit/integration tests for backend logic and end-to-end tests for the full application.

## Backend Testing (Vitest + convex-test)

Backend tests use `vitest` and `convex-test` to test Convex functions in isolation.

### Running Backend Tests

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:once

# Run tests with coverage
pnpm test:coverage

# Debug tests
pnpm test:debug
```

### Test Files

- `convex/tickets.test.ts` - Tests for ticket queries and operations
- `convex/events.test.ts` - Tests for event queries and mutations
- `convex/events-extended.test.ts` - Extended event tests (city filtering, ticket types, related artists)
- `convex/search.test.ts` - Search functionality tests

### Skipped Tests

Some tests are currently skipped because they require the `better-auth` component to be registered in `convex-test`. These tests involve authenticated operations:

- `getUserTickets` - Requires authenticated user context
- `getTicket` - Requires authenticated user context  
- `createEvent` - Requires authenticated artist context
- `createTicketType` - Requires authenticated artist context

These tests can be enabled once better-auth component registration is properly configured in the test environment. The skipped tests are marked with `it.skip()` and include comments explaining why they're skipped.

### Writing Backend Tests

Example test structure:

```typescript
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "../lib/test.setup";
import { setupConvexTest } from "../lib/test-helpers";

describe("my function", () => {
  it("should work correctly", async () => {
    const t = setupConvexTest(convexTest(schema, modules));
    
    // Test unauthenticated queries
    const result = await t.query(api.myModule.myQuery);
    expect(result).toEqual(expectedValue);
  });
});
```

## End-to-End Testing (Playwright)

E2E tests use Playwright to test the full application flow in a real browser.

### Running E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Debug E2E tests
pnpm test:e2e:debug
```

### Test Files

- `e2e/purchase.spec.ts` - Tests for purchase flow and navigation
- `e2e/auth.spec.ts` - Tests for authentication flow

### E2E Test Configuration

The E2E tests run against the Next.js frontend only (`dev:frontend`) to avoid Convex deployment conflicts. The tests verify:
- Page loading and navigation
- Search functionality
- Authentication flows
- Basic UI interactions

## Test Configuration

- `vitest.config.ts` - Vitest configuration with edge-runtime environment for Convex tests
- `playwright.config.ts` - Playwright configuration with dev server auto-start
- `lib/test.setup.ts` - Convex test module loader (moved out of convex/ to avoid deployment)
- `lib/test-helpers.ts` - Test helper functions (moved out of convex/ to avoid deployment)

## CI/CD Integration

GitHub Actions workflow (`.github/workflows/test.yml`) runs automatically on every commit to `main`:
- Backend tests run in parallel
- E2E tests run with Playwright
- Test reports are uploaded as artifacts

## Notes

- Test helper files (`test-helpers.ts`, `test.setup.ts`) are in `lib/` folder, not `convex/`, to prevent Convex from trying to deploy them
- Convex automatically ignores `.test.ts` files in the `convex/` folder
- E2E tests use `dev:frontend` to avoid Convex dev server conflicts
- Some backend tests are skipped due to better-auth component registration requirements

