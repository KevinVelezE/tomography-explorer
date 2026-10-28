import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { runExperiment } from '../../src/engine/experiment';

for (const width of [320, 390, 1440]) test(`controls stay adjacent to visible primary figures at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.goto('./');
  await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
  for (const [step, id, kind] of [[0, 'angle', 'object'], [4, 'alpha', 'selected'], [5, 'noise', 'hann']] as const) {
    await page.locator(`[data-step="${step}"]`).click();
    await page.locator('.chapter:not([hidden]) summary').click();
    const control = page.locator(`#${id}`), block = page.locator('.chapter:not([hidden]) [data-interactive]');
    await expect(block.locator(`#${id}`)).toBeVisible();
    await expect(block.locator(`canvas[data-kind="${kind}"]`)).toBeVisible();
    await expect(block.locator('details, .observation')).toHaveCount(0);
    const gap = await block.evaluate(b => {
      const controls = b.querySelector('.experiment-controls')!.getBoundingClientRect();
      const graphics = b.querySelector('.primary-panels')!.getBoundingClientRect();
      return Math.max(0, graphics.top - controls.bottom);
    });
    expect(gap).toBeLessThanOrEqual(96);
    await control.evaluate(e => e.scrollIntoView({ block: 'center' })); await control.focus();
    const visibleTogether = await block.evaluate((b, controlId) => {
      const c = b.querySelector(`#${controlId}`)!.getBoundingClientRect();
      const figures = [...b.querySelectorAll('.primary-panels canvas')].map(e => e.getBoundingClientRect());
      return c.top >= 0 && c.bottom <= innerHeight && figures.some(f => Math.min(f.bottom, innerHeight) - Math.max(0, f.top) >= 32);
    }, id);
    expect(visibleTogether).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await block.screenshot({ path: `test-results/adjacent-${width}-${step}.png` });
  }
  await page.locator('#seed').fill('123');
  for (let i = 0; i < 6; i++) {
    await page.locator(`[data-step="${i}"]`).click();
    expect(await page.locator('#seed').inputValue()).toBe('123');
    const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(n => n.id));
    expect(new Set(ids).size).toBe(ids.length);
  }
});

test('sustained slider changes show real intermediate snapshots and converge to an exportable final value', async ({ page }) => {
  await page.goto('./'); await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
  await page.locator('[data-step="5"]').click();
  const observed = await page.evaluate(async () => {
    const summary = document.querySelector('#experiment-summary')!, status = document.querySelector('#experiment-status')!;
    const updates: { text: string; label: string; pending: boolean; disabled: boolean }[] = [];
    const observer = new MutationObserver(() => updates.push({ text: summary.textContent!, label: document.querySelector('.chapter:not([hidden]) [data-preview-label]')?.textContent ?? '', pending: status.getAttribute('data-status') === 'calculating', disabled: (document.querySelector('#export') as HTMLButtonElement).disabled }));
    observer.observe(summary, { childList: true, subtree: true, characterData: true });
    const slider = document.querySelector('#noise') as HTMLInputElement;
    for (let i = 1; i <= 40; i++) {
      slider.value = (i / 1000).toFixed(3); slider.dispatchEvent(new Event('input', { bubbles: true }));
      if (i === 12 || i === 24) (document.querySelector(`[data-step="${i === 12 ? 4 : 5}"]`) as HTMLButtonElement).click();
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    observer.disconnect(); return updates;
  });
  expect(observed.some(s => s.pending && s.disabled && /noise 0\.0[1-3]\d/.test(s.text))).toBe(true);
  for (const snapshot of observed.filter(s => s.pending)) {
    expect(snapshot.label).toContain('Updating');
    expect(snapshot.label).toContain(snapshot.text.match(/noise [\d.]+/)![0]);
  }
  await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
  await expect(page.locator('#experiment-summary')).toContainText('noise 0.040');
  const event = page.waitForEvent('download'); await page.locator('#export').click();
  const json = JSON.parse(await readFile((await (await event).path())!, 'utf8'));
  expect(json.config.noiseLevel).toBe(0.04);
  expect(json.metrics.hann.rmse).toBeCloseTo(runExperiment(json.config).metrics.hann.rmse, 12);
});

test('invalid input and worker failure after a displayed snapshot cannot authorize stale exports', async ({ page }) => {
  await page.goto('./'); await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
  await page.locator('[data-step="5"]').click();
  await page.locator('#noise').fill('0.021');
  await expect(page.locator('#experiment-summary')).toContainText('noise 0.021');
  await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
  await page.evaluate(() => {
    const seed = document.querySelector('#seed') as HTMLInputElement;
    seed.value = '123'; seed.dispatchEvent(new Event('input', { bubbles: true }));
    seed.value = '-1'; seed.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#input-error')).toBeVisible();
  await page.workers()[0].evaluate(() => new Promise<void>(resolve => setTimeout(resolve, 800)));
  await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'error');
  await expect(page.locator('#export')).toBeDisabled();
  await expect(page.locator('#experiment-summary')).toContainText('seed 42');
  await page.locator('#seed').fill('456');
  await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
  await page.workers()[0].evaluate(() => { setTimeout(() => { throw new Error('Deliberate post-preview crash'); }, 0); });
  await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'error');
  await expect(page.locator('#export')).toBeDisabled();
  await page.locator('#retry').click();
  await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
  await expect(page.locator('#experiment-summary')).toContainText('seed 456');
});

test('angle follows the displayed acquisition during an older 180-view preview and then clamps to 12 views', async ({ page }) => {
  await page.route(/experiment\.worker.*\.js/, async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: 'const send=self.postMessage.bind(self);self.postMessage=(...args)=>setTimeout(()=>send(...args),300);\n' + await response.text() });
  });
  await page.goto('./'); await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
  await page.locator('#angle').fill('179');
  const snapshots = await page.evaluate(() => new Promise<{ summary: string; status: string; max: string; value: string; disabled: boolean }[]>((resolve, reject) => {
    const summary = document.querySelector('#experiment-summary')!, status = document.querySelector('#experiment-status')!;
    const angle = document.querySelector('#angle') as HTMLInputElement;
    const samples: { summary: string; status: string; max: string; value: string; disabled: boolean }[] = [];
    const timeout = setTimeout(() => { observer.disconnect(); reject(new Error(JSON.stringify(samples))); }, 8000);
    const observer = new MutationObserver(() => {
      const sample = { summary: summary.textContent!, status: status.getAttribute('data-status')!, max: angle.max, value: angle.value, disabled: (document.querySelector('#export') as HTMLButtonElement).disabled };
      samples.push(sample);
      if (sample.status === 'ready' && sample.summary.includes('12 views; noise 0.020')) { clearTimeout(timeout); observer.disconnect(); resolve(samples); }
    });
    observer.observe(document.querySelector('#calculation')!, { attributes: true, childList: true, subtree: true, characterData: true });
    const noise = document.querySelector('#noise') as HTMLInputElement, views = document.querySelector('#views') as HTMLSelectElement;
    noise.value = '0.02'; noise.dispatchEvent(new Event('input', { bubbles: true }));
    views.value = '12'; views.dispatchEvent(new Event('input', { bubbles: true }));
  }));
  expect(snapshots).toEqual(expect.arrayContaining([expect.objectContaining({ summary: expect.stringContaining('180 views; noise 0.020'), status: 'calculating', max: '179', value: '179', disabled: true })]));
  await expect(page.locator('#angle')).toHaveAttribute('max', '11');
  await expect(page.locator('#angle')).toHaveValue('11');
});

test('the filter selector stays beside the error map it actually changes in the noise chapter', async ({ page }) => {
  await page.goto('./'); await expect(page.locator('#experiment-status')).toHaveAttribute('data-status', 'ready');
  await page.locator('[data-step="5"]').click();
  const comparison = page.locator('.chapter:not([hidden]) [data-error-comparison]');
  await expect(comparison.locator('#filter')).toBeVisible();
  await expect(comparison.locator('canvas[data-kind="error"]')).toBeVisible();
  const before = await comparison.locator('canvas[data-kind="error"]').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await comparison.locator('#filter').selectOption('hann');
  const after = await comparison.locator('canvas[data-kind="error"]').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  expect(after).not.toBe(before);
  await page.locator('[data-step="4"]').click();
  await expect(page.locator('.chapter:not([hidden]) [data-interactive] #filter')).toHaveValue('hann');
  await page.locator('[data-step="5"]').click();
  await expect(comparison.locator('#filter')).toHaveValue('hann');
});
