import { test, expect } from "@playwright/test";
import { loginAsCompany } from "./helpers";

test.describe("Membership plan enforcement", () => {
  test("basic plan shows quota limit on properties page", async ({ page }) => {
    await loginAsCompany(page, "turegu.basic1@mailsac.com", "Turegu@Test1");

    await page.goto("/company/properties");
    await page.waitForLoadState("networkidle");

    // Should show some quota indicator like "1 / 1" or "0 remaining"
    const quotaText = page
      .getByText(/\d+\s*\/\s*\d+|remaining|limit|upgrade/i)
      .first();
    await expect(quotaText).toBeVisible({ timeout: 10_000 });

    // Add Property button should be disabled or trigger upgrade prompt
    const addBtn = page
      .getByRole("button", { name: /add property|new property|create/i })
      .first();

    if (await addBtn.isVisible().catch(() => false)) {
      const isDisabled = await addBtn.isDisabled();
      if (!isDisabled) {
        // Click and expect upgrade dialog
        await addBtn.click();
        const upgradeDialog = page.getByText(/upgrade|limit reached|maximum/i).first();
        await expect(upgradeDialog).toBeVisible({ timeout: 5_000 });
      }
    }
  });
});
