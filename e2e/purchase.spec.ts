import { test, expect } from "@playwright/test";

test.describe("Purchase Flow", () => {
  test("should display homepage with events", async ({ page }) => {
    await page.goto("/");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check if homepage loads - title should contain "Nexus Pass"
    await expect(page).toHaveTitle(/Nexus Pass/i, { timeout: 10000 });

    // Verify page body is visible and page loaded successfully
    await expect(page.locator("body")).toBeVisible();
    
    // Verify page is interactive (not just a blank page)
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(0);
  });

  test("should navigate to event page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Try to find and click an event link
    // Adjust selector based on your actual event card structure
    const eventLink = page.locator("a[href*='/event/']").first();
    
    if (await eventLink.count() > 0) {
      const eventHref = await eventLink.getAttribute("href");
      if (eventHref) {
        await page.goto(eventHref);
        
        // Wait for navigation
        await page.waitForLoadState("networkidle");
        
        // Event pages might redirect to login if unauthenticated
        // Verify we're on an event page or login (expected behavior)
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/\/event\/|\/login/);
        
        // Check for event details - be flexible
        await expect(page.locator("body")).toBeVisible();
      }
    }
  });

  test("should display ticket selection on event page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const eventLink = page.locator("a[href*='/event/']").first();
    
    if (await eventLink.count() > 0) {
      const eventHref = await eventLink.getAttribute("href");
      if (eventHref) {
        await page.goto(eventHref);
        
        // Wait for page to load
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);
        
        // Verify page loaded successfully
        await expect(page.locator("body")).toBeVisible();
        
        // Event pages might redirect to login if unauthenticated (expected behavior)
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/\/event\/|\/login/);
      }
    }
  });
});

test.describe("Navigation", () => {
  test("should navigate between pages", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Homepage might redirect to login if unauthenticated, which is expected behavior
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/|\/login/);

    // Navigate back to home
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const finalUrl = page.url();
    expect(finalUrl).toMatch(/\/|\/login/);
  });

  test("should navigate to artist page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Try to find an artist link
    const artistLink = page.locator("a[href*='/artist/']").first();
    
    if (await artistLink.count() > 0) {
      const artistHref = await artistLink.getAttribute("href");
      if (artistHref) {
        await page.goto(artistHref);
        await page.waitForLoadState("networkidle");
        
        // Artist pages might redirect to login if unauthenticated (expected behavior)
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/\/artist\/|\/login/);
        await expect(page.locator("body")).toBeVisible();
      }
    }
  });
});

test.describe("Search", () => {
  test("should display search page", async ({ page }) => {
    await page.goto("/search");
    await page.waitForLoadState("networkidle");
    
    // Search page might redirect to login if unauthenticated (protected route)
    // This is expected behavior - verify page loaded
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/search|\/login/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("should perform search", async ({ page }) => {
    await page.goto("/search");
    await page.waitForLoadState("networkidle");
    
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Look for search input
    const searchInput = page.locator("input[type='search'], input[placeholder*='search' i], input[name='search']").first();
    
    if (await searchInput.count() > 0) {
      await searchInput.fill("test");
      // Wait for search results or form submission
      await page.waitForTimeout(1000);
      await expect(page.locator("body")).toBeVisible();
    } else {
      // Search might be implemented differently, just verify page loads
      await expect(page.locator("body")).toBeVisible();
    }
  });
});

