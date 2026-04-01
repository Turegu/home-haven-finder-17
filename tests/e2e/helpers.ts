import { type Page, expect } from "@playwright/test";

/**
 * Login helper — navigates to /company/login, fills credentials, submits.
 * Waits until the company dashboard is visible.
 */
export async function loginAsCompany(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/company/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log ?in|enter/i }).click();
  // Wait for navigation away from login page
  await expect(page).not.toHaveURL(/\/company\/login/, { timeout: 15_000 });
}
