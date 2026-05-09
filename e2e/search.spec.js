const { test, expect } = require('@playwright/test');

test.describe('Weather Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
  });

  test('should display the page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('WeatherVue');
  });

  test('should search for a city and show weather', async ({ page }) => {
    await page.fill('#search-input', 'London');
    await page.click('#search-btn');
    await page.waitForSelector('#current-weather:not(.hidden)', { timeout: 15000 });
    await expect(page.locator('#city-name')).toContainText('London');
  });

  test('should toggle temperature units', async ({ page }) => {
    await page.fill('#search-input', 'London');
    await page.click('#search-btn');
    await page.waitForSelector('#current-weather:not(.hidden)', { timeout: 15000 });
    await page.click('#unit-fahrenheit');
    await expect(page.locator('#temperature')).toContainText('°F');
    await page.click('#unit-celsius');
    await expect(page.locator('#temperature')).toContainText('°C');
  });

  test('should show autocomplete suggestions', async ({ page }) => {
    await page.fill('#search-input', 'Lo');
    await page.waitForSelector('#autocomplete-list:not(.hidden)', { timeout: 10000 });
    const items = page.locator('#autocomplete-list .ac-item');
    await expect(items.first()).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    await page.click('#theme-btn');
    await expect(page.locator('html')).toHaveClass(/light-theme/);
    await page.click('#theme-btn');
    await expect(page.locator('html')).not.toHaveClass(/light-theme/);
  });
});
