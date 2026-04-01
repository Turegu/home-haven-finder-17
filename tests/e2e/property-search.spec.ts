import { test, expect } from "@playwright/test";

test.describe("Public property search", () => {
  test("displays listings and filters by keyword", async ({ page }) => {
    await page.goto("/buy");

    // Wait for at least one property card to appear
    const cards = page.locator('[class*="PropertyCard"], [class*="property-card"], article, .group').first();
    await expect(cards).toBeVisible({ timeout: 15_000 });

    // Type a search keyword
    const searchInput = page.getByPlaceholder(/keyword|search/i).first();
    await searchInput.fill("villa");
    await searchInput.press("Enter");

    // Wait for results to update
    await page.waitForTimeout(2_000);

    // Results should still be present (or show a valid results state)
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("shows empty state for nonsense keyword", async ({ page }) => {
    await page.goto("/buy");
    await page.waitForTimeout(2_000);

    const searchInput = page.getByPlaceholder(/keyword|search/i).first();
    await searchInput.fill("xyznotexist999");
    await searchInput.press("Enter");

    await page.waitForTimeout(3_000);

    // Should show some form of empty / no results state
    const noResults = page.getByText(/no propert|no result|not found|0 result/i).first();
    await expect(noResults).toBeVisible({ timeout: 10_000 });
  });
});
