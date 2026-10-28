import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { runExperiment } from '../../src/engine/experiment';
import { DEFAULT_CONFIG } from '../../src/engine/config';

async function ready(page: Page) { await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready'); }
async function exported(page: Page) {
  const event = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export experiment JSON' }).click();
  const download = await event; return JSON.parse(await readFile((await download.path())!, 'utf8'));
}
test('rapid parameters, latest metrics and real JSON download stay coherent', async ({ page }) => {
  await page.goto('./'); await ready(page); await page.locator('[data-step="5"]').click();
  for (const n of ['12', '360', '90']) await page.getByRole('combobox', { name: 'Projection views' }).selectOption(n);
  await page.locator('#noise').fill('0.021'); await page.locator('#alpha').fill('0.43'); await page.locator('#seed').fill('123');
  await expect(page.getByRole('button', { name: 'Export experiment JSON' })).toBeDisabled();
  await expect(page.locator('#experiment-summary')).toContainText('90 views; noise 0.021; seed 123; Hann α 0.43'); await ready(page);
  const data = await exported(page);
  expect(data.config).toEqual({ ...DEFAULT_CONFIG, views: 90, noiseLevel: 0.021, alpha: 0.43, seed: 123 });
  const reference = runExperiment(data.config);
  for (const kind of ['ramp', 'hann'] as const) {
    expect(data.metrics[kind].rmse).toBeCloseTo(reference.metrics[kind].rmse, 12);
    expect(data.metrics[kind].relativeL2).toBeCloseTo(reference.metrics[kind].relativeL2!, 12);
    expect(data.metrics[kind].sampleCount).toBe(reference.metrics[kind].sampleCount);
  }
  await expect(page.locator('#hann-rmse')).toHaveText(reference.metrics.hann.rmse.toFixed(5));
  await page.locator('[data-step="1"]').click();
  const before = await page.locator('[data-kind="sinogram"]').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.locator('[data-step="5"]').click(); await page.getByRole('combobox', { name: 'Displayed filter' }).selectOption('hann');
  const next = await exported(page); expect(next.config).toEqual(data.config); expect(next.view.filter).toBe('hann');
  expect(await page.locator('[data-kind="sinogram"]').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).toBe(before);
});
test('clamps angle after reducing acquisition views', async ({ page }) => {
  await page.goto('./'); await ready(page); await page.locator('#angle').fill('179');
  await page.getByRole('combobox', { name: 'Projection views' }).selectOption('12');
  await expect(page.locator('#experiment-summary')).toContainText('12 views'); await ready(page);
  expect((await exported(page)).view.angleIndex).toBe(11);
});
test('real worker crash is recoverable and navigation survives', async ({ page }) => {
  await page.route(/experiment\.worker.*\.js/, route => route.fulfill({ contentType: 'text/javascript', body: 'throw new Error("Deliberate worker startup failure");' }));
  await page.goto('./'); await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'error');
  await page.locator('[data-step="3"]').click(); await expect(page.locator('#title-3')).toBeFocused();
  await page.unroute(/experiment\.worker.*\.js/); await page.getByRole('button', { name: 'Retry calculation' }).click();
  await ready(page); await expect(page.locator('#experiment-summary')).toContainText('180 views');
});
test('a late real worker result cannot clear an invalid-input error or enable export', async ({ page }) => {
  await page.route(/experiment\.worker.*\.js/, async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: 'const send=self.postMessage.bind(self);self.postMessage=(...args)=>setTimeout(()=>send(...args),700);\n' + await response.text() });
  });
  await page.goto('./'); await page.locator('[data-step="5"]').click(); await page.locator('#seed').fill('-1');
  await expect(page.locator('#input-error')).toBeVisible();
  // Wait for the real (delayed) calculation to finish, not an arbitrary network-idle event.
  const worker = page.workers()[0];
  await worker.evaluate(() => new Promise<void>(resolve => setTimeout(resolve, 1000)));
  await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'error');
  await expect(page.getByRole('button', { name: 'Export experiment JSON' })).toBeDisabled();
  await page.locator('#seed').fill('42'); await ready(page);
});
test('no-JavaScript fallback explains requirements without fabricated values', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false }); const page = await context.newPage();
  await page.goto(baseURL!); await expect(page.locator('.fallback')).toContainText('JavaScript and Web Workers are required');
  await expect(page.locator('#experiment-summary')).not.toBeVisible();
  await expect(page.locator('#title-5')).toBeVisible(); await context.close();
});
