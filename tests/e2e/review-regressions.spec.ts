import { test, expect } from '@playwright/test';

test('a persisted pagehide/pageshow lifecycle keeps subsequent real calculations available', async ({ page }) => {
  await page.goto('./'); await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
  // Exercise the browser lifecycle boundary explicitly; this is not a claim
  // that this automation session actually entered the browser's BFCache.
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  await page.getByRole('combobox', { name: 'Projection views' }).selectOption('12');
  await expect(page.locator('#experiment-summary')).toContainText('12 views');
  await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
});
test('the normal-direction label has a dark backing even over a bright uniform disk', async ({ page }) => {
  await page.goto('./'); await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
  await page.getByRole('combobox', { name: 'Phantom', exact: true }).selectOption('disk');
  await expect(page.locator('#experiment-summary')).toContainText('disk;');
  await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
  const pixel = await page.locator('[data-kind="object"]').evaluate((canvas: HTMLCanvasElement) => [...canvas.getContext('2d')!.getImageData(319, 230, 1, 1).data]);
  expect(pixel[0] + pixel[1] + pixel[2]).toBeLessThan(200);
});
