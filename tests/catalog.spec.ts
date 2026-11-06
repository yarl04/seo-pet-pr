import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { recipes } from '../src/data/recipes';
import { categories } from '../src/data/categories';
import { capturePage } from './helpers';
import { appPath, siteOrigin, previewOrigin } from './urls';

test('every static page has landmarks, unique metadata, working links and images', async ({ page }) => {
  const paths = ['/', '/recipes/', ...categories.map((c) => `/categories/${c.id}/`), ...recipes.map((r) => `/recipes/${r.slug}/`)];
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const path of paths) {
    const response = await page.goto(appPath(path));
    expect(response!.status()).toBe(200);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('contentinfo')).toHaveCount(1);
    const title = await page.title();
    expect(titles.has(title), `duplicate title: ${path}`).toBe(false);
    titles.add(title);
    const description = (await page.locator('meta[name="description"]').getAttribute('content'))!;
    expect(description.length).toBeGreaterThan(40);
    expect(descriptions.has(description), `duplicate description: ${path}`).toBe(false);
    descriptions.add(description);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${siteOrigin}${appPath(path)}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `${siteOrigin}${appPath(path)}`);
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', appPath('/favicon.svg'));
    const ogImage = new URL((await page.locator('meta[property="og:image"]').getAttribute('content'))!);
    expect(ogImage.origin).toBe(siteOrigin);
    expect(ogImage.pathname.startsWith(appPath('/images/'))).toBe(true);
    const assets = await page.locator('link[rel="stylesheet"], link[rel="icon"], script[src]').evaluateAll((elements) => elements.map((el) => el.getAttribute('href') ?? el.getAttribute('src')!));
    for (const asset of assets) {
      expect(asset.startsWith(appPath('/'))).toBe(true);
      expect((await page.request.get(asset)).ok(), asset).toBe(true);
    }
    for (const property of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']) {
      await expect(page.locator(`meta[property="${property}"]`)).toHaveAttribute('content', /.+/);
    }
    expect(await page.locator('img').evaluateAll((images) => images.every((image) => image.hasAttribute('alt')))).toBe(true);
    // Проверяем доступность файлов, даже если изображения с отложенной загрузкой находятся за пределами экрана.
    for (const src of await page.locator('img').evaluateAll((images) => images.map((image) => image.getAttribute('src')!))) {
      expect(src.startsWith(appPath('/images/'))).toBe(true);
      expect((await page.request.get(src)).ok(), src).toBe(true);
    }
    const links = await page.locator('a[href^="/"]').evaluateAll((elements) => elements.map((el) => new URL((el as HTMLAnchorElement).href).pathname));
    for (const href of links) expect(paths.map(appPath), `broken internal route: ${href}`).toContain(href);
    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    schemas.forEach((schema) => {
      const data = JSON.parse(schema);
      expect(data['@context']).toBe('https://schema.org');
      for (const item of data.itemListElement ?? []) {
        const url = new URL(item.item ?? item.url);
        expect(url.origin).toBe(siteOrigin);
        expect(paths.map(appPath)).toContain(url.pathname);
      }
    });
    const ids = await page.locator('[id]').evaluateAll((elements) => elements.map((element) => element.id));
    expect(new Set(ids).size).toBe(ids.length);
  }
});

test('Recipe JSON-LD matches visible ingredients, steps, time and photo', async ({ page }) => {
  for (const recipe of recipes) {
    await page.goto(appPath(`/recipes/${recipe.slug}/`));
    const schema = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((value) => JSON.parse(value)).find((value) => value['@type'] === 'Recipe');
    expect(schema.name).toBe(await page.locator('h1').textContent());
    expect(schema.recipeIngredient).toEqual(await page.locator('.ingredients li').allTextContents());
    expect(schema.recipeInstructions.map((step: { text: string }) => step.text)).toEqual(await page.locator('.instructions li p').allTextContents());
    expect(schema.totalTime).toBe(await page.locator('.recipe-facts time').getAttribute('datetime'));
    expect(recipe.prepMinutes + recipe.cookMinutes).toBeLessThanOrEqual(30);
    expect(schema.image[0]).toBe(`${siteOrigin}${await page.locator('.recipe-main-photo').getAttribute('src')}`);
    expect(schema.url).toBe(`${siteOrigin}${appPath(`/recipes/${recipe.slug}/`)}`);
    for (const [index, step] of schema.recipeInstructions.entries()) {
      expect(step.url).toBe(`${schema.url}#step-${index + 1}`);
      await expect(page.locator(new URL(step.url).hash)).toHaveCount(1);
    }
  }
});

test('search, combined filters, empty state, reset and URL restore', async ({ page }) => {
  await page.goto(appPath('/recipes/'));
  const cards = page.locator('[data-recipe]:visible');
  await expect(cards).toHaveCount(12);
  await page.getByLabel('Название или продукт').fill('паста');
  await expect(cards).toHaveCount(2);
  await page.getByLabel('Сколько есть времени?').selectOption('20');
  await expect(cards).toHaveCount(1);
  await expect(page).toHaveURL(/q=.*&time=20/);
  expect(new URL(page.url()).pathname).toBe(appPath('/recipes/'));
  await page.reload();
  await expect(cards).toHaveCount(1);
  await expect(page.getByLabel('Название или продукт')).toHaveValue('паста');
  await page.getByLabel('Что готовим?').selectOption('breakfast');
  await expect(cards).toHaveCount(0);
  await expect(page.getByText('Пока ничего не нашлось')).toBeVisible();
  await page.locator('#clear-empty-filters').click();
  await expect(cards).toHaveCount(12);
  await expect(page.getByLabel('Название или продукт')).toBeFocused();
  await expect(page).toHaveURL(/\/recipes\/$/);
  await page.getByLabel('Без мяса и рыбы').check();
  await expect(cards).toHaveCount(10);
  await page.getByLabel('Сколько есть времени?').selectOption('15');
  await expect(cards).toHaveCount(5);
});

test('navigation, query links, anchors and 404 preserve base', async ({ page }) => {
  await page.goto(appPath('/'));
  await page.getByRole('link', { name: 'Есть только 15 минут?' }).click();
  expect(new URL(page.url()).pathname).toBe(appPath('/recipes/'));
  await expect(page.getByLabel('Сколько есть времени?')).toHaveValue('15');
  await expect(page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Все рецепты' })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: categories[0].name }).click();
  await expect(page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: categories[0].name })).toHaveAttribute('aria-current', 'page');
  await page.locator('.recipe-card a').first().click();
  const recipePath = new URL(page.url()).pathname;
  await page.getByRole('link', { name: 'Начать готовить' }).click();
  expect(new URL(page.url()).pathname).toBe(recipePath);
  expect(new URL(page.url()).hash).toBe('#cooking');
  await page.goto(appPath('/404/'));
  await page.getByRole('link', { name: 'Перейти к рецептам' }).click();
  expect(new URL(page.url()).pathname).toBe(appPath('/recipes/'));
  await page.getByRole('link', { name: 'За 30 минут — главная' }).click();
  expect(new URL(page.url()).pathname).toBe(appPath('/'));
});

test('combobox retains DOM focus and supports arrows, Enter, Escape and Tab', async ({ page }) => {
  await page.goto(appPath('/recipes/'));
  const combo = page.getByRole('combobox', { name: 'Основной ингредиент', exact: true });
  await combo.fill('кур');
  await expect(combo).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(1);
  await combo.press('ArrowDown');
  const active = await combo.getAttribute('aria-activedescendant');
  await expect(page.locator(`#${active}`)).toHaveAttribute('aria-selected', 'true');
  await expect(combo).toBeFocused();
  await combo.press('Enter');
  await expect(combo).toHaveValue('Курица');
  await expect(combo).toHaveAttribute('aria-expanded', 'false');
  await expect(combo).not.toHaveAttribute('aria-activedescendant', /.+/);
  await expect(page.locator('[data-recipe]:visible')).toHaveCount(1);
  await expect(page.locator('[data-recipe="chicken-vegetables"]')).toBeVisible();
  await combo.press('ArrowUp');
  await expect(combo).toHaveAttribute('aria-expanded', 'true');
  await combo.press('Escape');
  await expect(combo).toHaveValue('Курица');
  await combo.fill('гр');
  await combo.press('Tab');
  await expect(page.getByLabel('Сколько есть времени?')).toBeFocused();
  await expect(combo).toHaveValue('Курица');
  await expect(combo).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Сбросить фильтры' }).click();
  await expect(combo).toHaveValue('');
  await combo.fill('неттакого');
  await expect(page.getByText('Такого ингредиента нет. Попробуйте другой.')).toBeVisible();
  await combo.press('ArrowDown');
  await expect(combo).not.toHaveAttribute('aria-activedescendant', /.+/);
  await combo.press('Escape');
  await expect(combo).toHaveValue('');
});

test('pointer selection, clearing the ingredient, URL and browser Back stay in sync', async ({ page }) => {
  await page.goto(appPath('/recipes/?ingredient=Курица'));
  const combo = page.getByRole('combobox', { name: 'Основной ингредиент', exact: true });
  await expect(combo).toHaveValue('Курица');
  await combo.click();
  await page.getByRole('option', { name: 'Грибы', exact: true }).click();
  await expect(combo).toHaveValue('Грибы');
  await expect(combo).toBeFocused();
  await page.locator('[data-recipe="mushroom-pasta"] a').click();
  await page.goBack();
  await expect(combo).toHaveValue('Грибы');
  await expect(page.locator('[data-recipe]:visible')).toHaveCount(1);
  await combo.fill('');
  await combo.press('Tab');
  await expect(page.locator('[data-recipe]:visible')).toHaveCount(12);
  await page.goto(appPath('/recipes/?time=nope&category=missing&ingredient=missing'));
  await expect(page.locator('[data-recipe]:visible')).toHaveCount(12);
});

test('skip link moves focus to main', async ({ page }) => {
  await page.goto(appPath('/'));
  await page.keyboard.press('Tab');
  await expect(page.getByText('Перейти к содержимому')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

for (const path of ['/', '/recipes/', '/categories/breakfast/', '/recipes/tomato-pasta/', '/404/']) {
  test(`axe WCAG 2.2 AA: ${path}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(appPath(path));
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
    if (['/', '/recipes/', '/recipes/tomato-pasta/'].includes(path)) {
      await capturePage(page, testInfo.outputPath('desktop.png'));
    }
  });
}

test('open combobox passes automated accessibility checks', async ({ page }) => {
  await page.goto(appPath('/recipes/'));
  await page.getByRole('combobox', { name: 'Основной ингредиент', exact: true }).fill('кур');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('mobile layouts have no horizontal overflow', async ({ page }, testInfo) => {
  for (const width of [320, 360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ['/', '/recipes/', '/categories/breakfast/', '/recipes/tomato-pasta/']) {
      await page.goto(appPath(path));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} at ${width}px`).toBe(true);
      if (width === 390 && ['/', '/recipes/', '/recipes/tomato-pasta/'].includes(path)) {
        await capturePage(page, testInfo.outputPath(`mobile-${path.replaceAll('/', '-') || 'home'}.png`));
      }
    }
  }
});

test('content and navigation are usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${previewOrigin}${appPath('/recipes/')}`);
  await expect(page.locator('[data-recipe]:visible')).toHaveCount(12);
  await expect(page.getByText('Для поиска и фильтров включите JavaScript.', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'Паста с томатами и базиликом', exact: true }).click();
  await expect(page.locator('.ingredients li')).toHaveCount(8);
  await expect(page.locator('.instructions li')).toHaveCount(3);
  await context.close();
});

test('sitemap and robots use the deployment URL', async ({ request }) => {
  const sitemap = await request.get(appPath('/sitemap.xml'));
  expect(sitemap.ok()).toBe(true);
  expect((await sitemap.text()).match(/<loc>/g)).toHaveLength(17);
  const robots = await request.get(appPath('/robots.txt'));
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(siteOrigin).hostname);
  expect(await robots.text()).toContain(local ? 'Disallow: /' : 'Allow: /');
  expect(await robots.text()).toContain(`${siteOrigin}${appPath('/sitemap.xml')}`);
  const paths = ['/', '/recipes/', ...categories.map((c) => `/categories/${c.id}/`), ...recipes.map((r) => `/recipes/${r.slug}/`)];
  const urls = [...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  expect(urls).toEqual(paths.map((path) => `${siteOrigin}${appPath(path)}`));
});
