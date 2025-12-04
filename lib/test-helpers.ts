import type { convexTest } from "convex-test";

/**
 * Helper to set up convex-test
 * Note: Component registration may not be needed or may need different approach
 * For now, we'll just return the test instance
 */
export function setupConvexTest(test: ReturnType<typeof convexTest>) {
  // Components are registered via convex.config.ts in the actual app
  // In tests, we may need to mock or work around component dependencies
  return test;
}
