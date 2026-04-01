import { test, expect } from "@playwright/test";

test.describe("PWA assets", () => {
  test("manifest is accessible and valid", async ({ request }) => {
    const resp = await request.get("/manifest.webmanifest");
    expect(resp.status()).toBe(200);

    const body = await resp.json();
    expect(body.name).toBeTruthy();
  });

  test("service worker file is accessible", async ({ request }) => {
    const resp = await request.get("/sw.js");
    // sw.js should return 200 in production build
    expect(resp.status()).toBe(200);
  });
});
