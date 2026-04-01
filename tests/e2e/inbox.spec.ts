import { test, expect } from "@playwright/test";
import { loginAsCompany } from "./helpers";

test.describe("Company inbox", () => {
  test("loads with correct tabs", async ({ page }) => {
    await loginAsCompany(page, "turegu.pro1@mailsac.com", "Turegu@Test1");

    await page.goto("/company/inbox");
    await page.waitForLoadState("networkidle");

    // Three inbox tabs should be visible
    await expect(
      page.getByRole("tab", { name: /inquir/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("tab", { name: /message/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /property request/i }),
    ).toBeVisible();

    // Sidebar inbox link should have a badge (or at least be present)
    const inboxLink = page.getByRole("link", { name: /inbox/i }).first();
    await expect(inboxLink).toBeVisible();
  });
});
