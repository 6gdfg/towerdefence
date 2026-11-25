import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
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

async function withProductionPage(run: (page: any, origin: string) => Promise<void>, phone = false) {
  const root = resolve('dist');
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
      const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (!file.startsWith(`${root}${sep}`)) { response.writeHead(403); response.end(); return; }
      const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
      response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
      response.end(await readFile(file));
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const context = await browser.newContext({ viewport: phone ? { width: 844, height: 390 } : { width: 1024, height: 768 }, hasTouch: phone, isMobile: phone });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    await run(page, `http://127.0.0.1:${address.port}`);
  } finally {
    await context.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
}

test('production login really renders the supplied font from two same-origin WOFF2 assets', options, async () => {
  await withProductionPage(async (page, origin) => {
    const fontResponses: { url: string; status: number }[] = [];
    const fontErrors: string[] = [];
    page.on('response', (response: any) => { if (response.url().includes('.woff2')) fontResponses.push({ url: response.url(), status: response.status() }); });
    page.on('console', (message: any) => { if (/font|OTS parsing/i.test(message.text()) && message.type() === 'error') fontErrors.push(message.text()); });
    const html = await (await page.request.get(origin)).text();
    assert.doesNotMatch(html, /as="font"|game-font.*\.css/);
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: '登录 / 注册', exact: true }).waitFor();
    await page.waitForFunction(() => Array.from(document.fonts).some(font => font.family.includes('Tower Defence') && font.status === 'loaded'));
    await page.evaluate(() => document.fonts.ready);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root: documentNode } = await cdp.send('DOM.getDocument');
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: documentNode.nodeId, selector: 'h1' });
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    assert.equal(fontResponses.length, 2);
    assert.ok(fontResponses.every(response => response.status === 200 && response.url.startsWith(`${origin}/assets/game-`)));
    assert.deepEqual(fontErrors, []);
    assert.ok(fonts.length > 0 && fonts.every((font: any) => font.isCustomFont), 'The production heading must use the supplied webfont, not a system fallback');
    await page.screenshot({ path: `${screenshots}/production-auth-tablet.png` });
  });
});

test('production login stays usable when the optional font stylesheet fails', options, async () => {
  await withProductionPage(async (page, origin) => {
    const errors: string[] = [];
    let failedFontStyles = 0;
    page.on('pageerror', (error: Error) => errors.push(error.message));
    await page.route('**/assets/game-font-*.css', (route: any) => { failedFontStyles++; return route.abort(); });
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: '登录 / 注册', exact: true }).waitFor();
    assert.equal(await page.getByPlaceholder('用户名', { exact: true }).isVisible(), true);
    assert.equal(failedFontStyles, 1);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `${screenshots}/production-font-css-fallback.png` });
  });
});

test('production login renders before a stalled optional font stylesheet finishes', options, async () => {
  await withProductionPage(async (page, origin) => {
    let release: () => void = () => {};
    const gate = new Promise<void>(resolve => { release = resolve; });
    let fontStyleRequested = false;
    await page.route('**/assets/game-font-*.css', async (route: any) => { fontStyleRequested = true; await gate; await route.continue(); });
    try {
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { name: '登录 / 注册', exact: true }).waitFor();
      assert.equal(fontStyleRequested, true);
      assert.equal(await page.evaluate(() => document.fonts.size), 0);
      assert.equal(await page.getByPlaceholder('用户名', { exact: true }).isVisible(), true);
    } finally { release(); }
    await page.waitForFunction(() => Array.from(document.fonts).some(font => font.family.includes('Tower Defence') && font.status === 'loaded'));
  });
});

test('production phone login appears while every WOFF2 request is still stalled', options, async () => {
  await withProductionPage(async (page, origin) => {
    let release: () => void = () => {};
    const gate = new Promise<void>(resolve => { release = resolve; });
    let fontRequests = 0;
    const errors: string[] = [];
    page.on('pageerror', (error: Error) => errors.push(error.message));
    await page.route('**/*.woff2', async (route: any) => { fontRequests++; await gate; await route.abort(); });
    try {
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { name: '登录 / 注册', exact: true }).waitFor();
      assert.equal(fontRequests, 2);
      assert.equal(await page.getByPlaceholder('用户名', { exact: true }).isVisible(), true);
      assert.equal(await page.evaluate(() => Array.from(document.fonts).some(font => font.status === 'loaded')), false);
      await page.getByPlaceholder('用户名', { exact: true }).fill('slow-network');
      assert.equal(await page.getByPlaceholder('用户名', { exact: true }).inputValue(), 'slow-network');
      assert.deepEqual(errors, []);
      release();
      await page.screenshot({ path: `${screenshots}/production-font-stalled-phone.png` });
    } finally { release(); }
  }, true);
});

test('production stalled progress times out without losing the account and reconnect recovers the cloud save', options, async () => {
  await withProductionPage(async (page, origin) => {
    let release: () => void = () => {};
    const gate = new Promise<void>(resolve => { release = resolve; });
    let progressReads = 0;
    const errors: string[] = [];
    page.on('pageerror', (error: Error) => errors.push(error.message));
    await page.addInitScript(() => { localStorage.setItem('td_token', 'slow-progress-token'); localStorage.setItem('td_username', 'slow-progress-player'); });
    await page.route('**/api/**', async (route: any) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === '/api/progress' && ++progressReads === 1) {
        await gate;
        try { await route.abort(); } catch { /* The timeout already canceled this request. */ }
        return;
      }
      const body = pathname === '/api/announcement' ? { seen: true }
        : pathname === '/api/progress' ? { coins: 7773, unlocked: 1, towerLevels: { bottleGrass: 27 }, unlockedItems: ['sunflower', 'bottleGrass'], chests: [] }
        : { notification: null };
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    });
    try {
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.getByText('云端存档加载超时，请检查网络后点击重新连接。', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => localStorage.getItem('td_token')), 'slow-progress-token');
      await page.getByRole('button', { name: '重新连接', exact: true }).click();
      await page.getByRole('heading', { name: '主界面', exact: true }).waitFor();
      await page.getByText('7773', { exact: true }).first().waitFor();
      assert.equal(await page.getByText(/lv\.27 植物碎片/).count(), 1);
      assert.deepEqual(errors, []);
    } finally { release(); }
  });
});

test('auth loads two small subsets and a rare character loads only its own additional subset', options, async () => {
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
    const cdp = await context.newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root: documentNode } = await cdp.send('DOM.getDocument');
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: documentNode.nodeId, selector: 'h1' });
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    console.log('Local heading fonts:', JSON.stringify(fonts));
    assert.ok(fonts.length > 0 && fonts.every((font: any) => font.isCustomFont && font.familyName === 'cmdysj'));
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

test('local subset glyphs render identically to the supplied original Phigros font', options, async () => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  try {
    const page = await context.newPage();
    await page.goto(baseUrl);
    await page.getByRole('heading', { name: '登录 / 注册', exact: true }).waitFor();
    const result = await page.evaluate(async () => {
      const original = await new FontFace('Original Phigros', 'url("/cmdysj.ttf")').load();
      document.fonts.add(original);
      const samples = ['Chart Illustration admin Loading Combo 1234567890', '登录 注册 主界面 不要忘记元素可以单独放置'];
      const comparisons = [];
      for (const text of samples) {
        await document.fonts.load('32px "Tower Defence"', text);
        const renders = [];
        for (const family of ['Tower Defence', 'Original Phigros']) {
          const canvas = document.createElement('canvas');
          canvas.width = 1200;
          canvas.height = 60;
          const ctx = canvas.getContext('2d')!;
          ctx.font = `32px "${family}"`;
          ctx.fillText(text, 0, 40);
          renders.push({ pixels: canvas.toDataURL(), width: ctx.measureText(text).width });
        }
        const [subset, source] = renders;
        comparisons.push({ text, samePixels: subset.pixels === source.pixels, subsetWidth: subset.width, sourceWidth: source.width });
      }
      return comparisons;
    });
    console.log('Original versus optimized font:', JSON.stringify(result));
    assert.ok(result.every((comparison: any) => comparison.samePixels && comparison.subsetWidth === comparison.sourceWidth));
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
          ? { ...wallet, dayKey: '2026-11-25', refreshAt: '2099-01-01T16:00:00.000Z', products: [] }
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
