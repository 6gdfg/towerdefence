import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { after, before, test } from 'node:test';

const modulePath = process.env.TD_TEST_PLAYWRIGHT;
const baseUrl = process.env.TD_TEST_URL ?? 'http://localhost:5176';
const options = { skip: !modulePath };
const screenshots = 'node_modules/.game-font-screenshots';
let browser: any;

before(async () => {
  if (!modulePath) return;
  const { chromium } = await import(pathToFileURL(modulePath).href);
  browser = await chromium.launch({ headless: true, executablePath: process.env.TD_TEST_CHROMIUM });
  await mkdir(screenshots, { recursive: true });
});
after(async () => { await browser?.close(); });

test('auth preloads two small subsets and a rare character loads only its own additional subset', options, async () => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await context.newPage();
  const requested = new Set<string>();
  const errors: string[] = [];
  page.on('request', (request: any) => { if (/\.(woff2|ttf)(\?|$)/.test(request.url())) requested.add(new URL(request.url()).pathname); });
  page.on('pageerror', (error: Error) => errors.push(error.message));
  try {
    await page.goto(baseUrl);
    await page.getByRole('heading', { name: '登录 / 注册', exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.deepEqual([...requested].sort(), ['/src/assets/fonts/game-latin.woff2', '/src/assets/fonts/game-ui.woff2']);
    assert.equal(await page.evaluate(() => document.fonts.check('16px "Tower Defence"', '登录 / 注册 Tower Defence')), true);
    for (const selector of ['body', 'h1', 'button', 'input']) {
      assert.match(await page.locator(selector).first().evaluate((element: HTMLElement) => getComputedStyle(element).fontFamily), /Tower Defence/);
    }
    const manifest = JSON.parse(await readFile('src/assets/fonts/manifest.json', 'utf8'));
    const rare = manifest.subsets.find((subset: any) => subset.file === 'game-range-9f00.woff2');
    const text = String.fromCodePoint(parseInt(rare.unicodeRange.split(',')[0].slice(2).split('-')[0], 16));
    await page.evaluate((text: string) => {
      const node = document.createElement('p');
      node.textContent = text;
      document.body.append(node);
      return document.fonts.load('16px "Tower Defence"', text);
    }, text);
    assert.equal(await page.evaluate((text: string) => document.fonts.check('16px "Tower Defence"', text), text), true);
    assert.equal(requested.size, 3);
    assert.ok(requested.has(`/src/assets/fonts/${rare.file}`));
    await page.screenshot({ path: `${screenshots}/auth-tablet.png` });
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('font failure never hides login controls or blocks local playtest', options, async () => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error: Error) => errors.push(error.message));
  await page.route('**/*.woff2*', (route: any) => route.abort());
  try {
    await page.goto(baseUrl);
    await page.getByRole('heading', { name: '登录 / 注册', exact: true }).waitFor();
    assert.equal(await page.getByPlaceholder('用户名', { exact: true }).isVisible(), true);
    await page.getByRole('button', { name: '本地试玩关卡', exact: true }).click();
    await page.getByRole('heading', { name: '章节选择', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: /火之晨曦/ }).isEnabled(), true);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('all companion pages, selectors and laboratory code surfaces inherit the global font', options, async () => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error: Error) => errors.push(error.message));
  try {
    await page.addInitScript(() => {
      if (['/tasks', '/shop'].includes(window.location.pathname)) {
        localStorage.setItem('td_token', 'font-test-token');
        localStorage.setItem('td_username', 'font-test');
      } else {
        localStorage.removeItem('td_token');
      }
    });
    await page.route('**/api/**', (route: any) => {
      const pathname = new URL(route.request().url()).pathname;
      const wallet = { coins: 10000, diamonds: 5, experience: 100 };
      const body = pathname === '/api/tasks'
        ? { daily: [], weekly: [], dailyPracticeRuns: 0, wallet }
        : pathname === '/api/shop'
          ? { ...wallet, buyerId: 'font-test', username: 'font-test', purchases: [] }
          : wallet;
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    });
    for (const path of ['/study', '/tasks', '/garden', '/shop']) {
      await page.goto(`${baseUrl}${path}`);
      await page.locator('h1').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const mismatches = await page.locator('body, h1, button, input, select, textarea, code, pre, table').evaluateAll((elements: HTMLElement[]) =>
        elements.filter(element => !getComputedStyle(element).fontFamily.includes('Tower Defence')).map(element => element.tagName));
      assert.deepEqual(mismatches, [], path);
      await page.screenshot({ path: `${screenshots}/${path.slice(1)}-tablet.png` });
    }
    await page.goto(baseUrl);
    await page.getByRole('button', { name: '游客进入平衡实验室', exact: true }).click();
    await page.locator('.balance-lab-page').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole('button', { name: '导入投稿代码', exact: true }).click();
    const mismatches = await page.locator('body, button, input, select, textarea, code, pre').evaluateAll((elements: HTMLElement[]) =>
      elements.filter(element => !getComputedStyle(element).fontFamily.includes('Tower Defence')).map(element => element.tagName));
    assert.deepEqual(mismatches, []);
    await page.screenshot({ path: `${screenshots}/lab-tablet.png` });
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
