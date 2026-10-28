import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 1440]) test(`all chapters reflow at ${width}px with open mathematics and pass axe`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.goto('./');
  await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
  for (let step = 0; step < 6; step++) {
    await page.locator(`[data-step="${step}"]`).click();
    const chapter = page.locator('.chapter:not([hidden])'); await chapter.locator('summary').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const formula = chapter.locator('.formula'); await chapter.locator('summary').focus(); await page.keyboard.press('Tab'); await expect(formula).toBeFocused();
    expect(await formula.evaluate(e => getComputedStyle(e).outlineStyle)).not.toBe('none');
    const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations;
    expect(violations).toEqual([]);
    if (width === 320 && [0, 5].includes(step)) await page.screenshot({ path: `test-results/mobile-${step}.png`, fullPage: true });
  }
});
test('200 percent text and reduced motion retain keyboard navigation and local formula scroll', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.setViewportSize({ width: 390, height: 900 }); await page.goto('./');
  await page.addStyleTag({ content: 'html { font-size: 200%; }' });
  for (let step = 0; step < 6; step++) {
    await page.locator(`[data-step="${step}"]`).click(); await expect(page.locator(`#title-${step}`)).toBeFocused();
    const chapter = page.locator('.chapter:not([hidden])'); await chapter.locator('summary').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  const formula = page.locator('.chapter:not([hidden]) .formula'); await formula.focus(); await page.keyboard.press('ArrowRight');
  await expect.poll(() => formula.evaluate(e => e.scrollLeft)).toBeGreaterThan(0);
});
