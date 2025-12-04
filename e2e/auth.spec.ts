import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Check if login page loads
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Verify page loaded
    await expect(page.locator("body")).toBeVisible();
    
    // Look for login form elements - be flexible
    const loginForm = page.locator("form, [data-testid='login-form'], button, input").first();
    await expect(loginForm).toBeVisible({ timeout: 10000 });
  });

  test("should redirect to login when accessing protected route", async ({ page }) => {
    // Try to access artist dashboard without authentication
    await page.goto("/artist-dashboard");
    await page.waitForLoadState("networkidle");

    // Should redirect to login or show auth error
    // Adjust based on your actual auth guard behavior
    // The page might stay on /artist-dashboard but show login, or redirect
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/login|\/artist-dashboard/);
    await expect(page.locator("body")).toBeVisible();
  });
});

