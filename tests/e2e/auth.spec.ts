import { test, expect } from "@playwright/test";
import { loginAsCompany } from "./helpers";

test.describe("Company authentication", () => {
  test("login and logout flow", async ({ page }) => {
    await loginAsCompany(page, "turegu.pro1@mailsac.com", "Turegu@Test1");

    // Should land on /company dashboard
    await expect(page).toHaveURL(/\/company/);

    // Company name or dashboard indicator should be visible
    await expect(
      page.getByText(/dashboard|overview/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Logout
    const logoutBtn =
      page.getByRole("button", { name: /log ?out|sign ?out/i });
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
    } else {
      // Might be in a sidebar/menu — try opening user menu first
      const menuTrigger = page.getByRole("button", { name: /menu|account/i });
      if (await menuTrigger.isVisible().catch(() => false)) {
        await menuTrigger.click();
        await page
          .getByRole("menuitem", { name: /log ?out|sign ?out/i })
          .click();
      }
    }

    // Should redirect back to login
    await expect(page).toHaveURL(/\/company\/login|\/login/, {
      timeout: 10_000,
    });
  });
});
