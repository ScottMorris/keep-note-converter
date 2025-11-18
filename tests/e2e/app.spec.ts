import { expect, test } from "@playwright/test";

test.describe("Keep note converter", () => {
  test("loads the homepage and handles sample content", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /convert rich text into google keep friendly notes/i,
      }),
    ).toBeVisible();

    const editor = page.getByTestId("input-editor");
    await expect(editor).toBeVisible();
    await expect(editor).toBeEditable();

    await page.getByRole("button", { name: /load sample/i }).click();
    await expect(editor).toContainText("Workshop Notes");

    await page.getByRole("button", { name: /clear/i }).click();
    await expect(editor).not.toContainText("Workshop Notes");
  });
});
