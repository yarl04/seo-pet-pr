import { expect, type Page } from '@playwright/test';

export async function capturePage(page: Page, path: string) {
  // Снимок всей страницы сам по себе не запускает загрузку изображений с loading="lazy" за пределами экрана.
  for (const image of await page.locator('img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty('complete', true);
    expect(await image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path, fullPage: true });
}
