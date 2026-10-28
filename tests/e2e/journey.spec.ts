import { test, expect } from '@playwright/test';
const titles = [
  'What does a detector actually measure?', 'How do many projections become a sinogram?',
  'Why is backprojection not the inverse?', 'Where does the missing detail go?',
  'What changes when we filter first?', 'Why can sharper also mean noisier?',
];
test('six chapters retain calculated experiment state and expose real LaTeX', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: titles[0], exact: true })).toBeVisible();
  await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
  await page.getByRole('combobox', { name: 'Phantom', exact: true }).selectOption('disk');
  await expect(page.locator('#experiment-summary')).toContainText('disk');
  await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
  for (let i = 0; i < titles.length; i++) {
    await page.locator(`[data-step="${i}"]`).click();
    await expect(page.getByRole('heading', { name: titles[i], exact: true })).toBeFocused();
    await page.locator('.chapter:not([hidden]) summary').click();
    await expect(page.locator('.chapter:not([hidden]) .katex-mathml math').first()).toBeAttached();
    await expect(page.locator('.katex-error')).toHaveCount(0);
    await expect(page.getByRole('combobox', { name: 'Phantom', exact: true })).toHaveValue('disk');
    await page.screenshot({ path: `test-results/chapter-${i + 1}.png`, fullPage: true });
  }
  await page.getByRole('combobox', { name: 'Phantom', exact: true }).selectOption('asymmetric');
  await expect(page.locator('#experiment-summary')).toContainText('asymmetric');
});
test('angle and detector selection work with the keyboard without recalculation', async ({ page }) => {
  await page.goto('./'); await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
  const summary = await page.locator('#experiment-summary').textContent();
  await page.getByRole('slider', { name: 'Projection angle' }).focus(); await page.keyboard.press('ArrowRight');
  await expect(page.locator('#angle-value')).not.toHaveText('0.0°');
  await page.getByRole('slider', { name: 'Detector position' }).focus(); await page.keyboard.press('ArrowRight');
  await expect(page.locator('#detector-value')).not.toHaveText('0.000');
  await expect(page.locator('#experiment-summary')).toHaveText(summary!);
  await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
});
