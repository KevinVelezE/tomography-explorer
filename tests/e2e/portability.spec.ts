import { test, expect } from '@playwright/test';

test('production assets, worker, fonts and export work without third-party requests', async ({ page, baseURL }) => {
  const external: string[] = [], errors: string[] = [], failed: string[] = [];
  page.on('request', request => { if (new URL(request.url()).origin !== new URL(baseURL!).origin) external.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
  await page.goto('./'); await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
  await page.locator('[data-step="5"]').click(); await page.locator('.chapter:not([hidden]) summary').click();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.locator('.katex').first().evaluate(e => getComputedStyle(e).fontFamily)).toContain('KaTeX');
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export experiment JSON' }).click();
  expect((await download).suggestedFilename()).toBe('tomography-experiment.json');
  expect(external).toEqual([]); expect(errors).toEqual([]); expect(failed).toEqual([]);
});
test('five browser runs report actual compute and end-to-end timings', async ({ page }, testInfo) => {
  const compute: number[] = [], total: number[] = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now(); await page.goto('./');
    await page.locator('[data-step="1"]').click(); await expect(page.locator('#title-1')).toBeFocused();
    await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
    total.push(performance.now() - start); compute.push(Number(await page.locator('#experiment-summary').getAttribute('data-compute-ms')));
  }
  const median = (a: number[]) => [...a].sort((a, b) => a - b)[2];
  const report = { compute, endToEnd: total, computeMedian: median(compute), computeMax: Math.max(...compute), endToEndMedian: median(total), endToEndMax: Math.max(...total) };
  await testInfo.attach('performance', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
  console.log(JSON.stringify(report)); expect(report.computeMedian).toBeLessThan(1000);
});
