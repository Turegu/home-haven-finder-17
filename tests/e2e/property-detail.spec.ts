import { test, expect } from "@playwright/test";

test.describe("Property detail page — SEO and contact", () => {
  test("has correct SEO meta tags and contact CTA", async ({ page }) => {
    await page.goto("/property/29693715");
    await page.waitForLoadState("domcontentloaded");

    // Page title should contain something meaningful
    const title = await page.title();
    expect(title.length).toBeGreaterThan(5);

    // OG title meta tag exists
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveCount(1);

    // JSON-LD with RealEstateListing
    const jsonLd = page.locator(
      'script[type="application/ld+json"]',
    );
    const jsonLdCount = await jsonLd.count();
    expect(jsonLdCount).toBeGreaterThanOrEqual(1);

    let foundRealEstate = false;
    for (let i = 0; i < jsonLdCount; i++) {
      const content = await jsonLd.nth(i).textContent();
      if (content && content.includes("RealEstateListing")) {
        foundRealEstate = true;
        break;
      }
    }
    expect(foundRealEstate).toBe(true);

    // Contact / inquiry button or form should be visible
    const contactEl = page
      .getByRole("button", { name: /contact|inquir|call|whatsapp|email/i })
      .first();
    await expect(contactEl).toBeVisible({ timeout: 10_000 });
  });
});
