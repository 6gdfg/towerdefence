import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { BALANCE_LAB_LEVEL_DRAFTS } from '../../src/td/balanceDraft.generated';
import { fitIntroScale, getIntroMonsters } from './introLayout';
import { INTRO_TIPS } from './tips';

const modulePath = process.env.TD_TEST_PLAYWRIGHT;
const baseUrl = process.env.TD_TEST_URL ?? 'http://localhost:5176';
const screenshots = 'node_modules/.intro-demo-screenshots';
const options = { skip: !modulePath };
let browser: any;

before(async () => {
  if (!modulePath) return;
  const { chromium } = await import(pathToFileURL(modulePath).href);
  browser = await chromium.launch({ headless: true, executablePath: process.env.TD_TEST_CHROMIUM });
  await mkdir(screenshots, { recursive: true });
});
after(async () => { await browser?.close(); });

async function openDemo(width: number, height: number, phone = false, reducedMotion = false) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: phone, isMobile: phone,
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
    ...(phone ? { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' } : {}) });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors: string[] = [];
  const apiRequests: string[] = [];
  page.on('pageerror', (error: Error) => errors.push(error.message));
  page.on('request', (request: any) => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url()); });
  await page.route('**/demos/level-intro/main.tsx*', async (route: any) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nwindow.__introDemoStore = useTDStore;` });
  });
  await page.goto(`${baseUrl}/demos/level-intro/`);
  await page.locator('.intro-loading-wipe').waitFor();
  await page.evaluate(() => document.fonts.load('16px "Tower Defence"', 'Chart Illustration admin 不要忘记元素可以单独放置！'));
  return { context, page, errors, apiRequests };
}

test('every tip fits the shared intro without clipping or overlapping Loading on phone and tablet', options, async () => {
  const { context, page, errors } = await openDemo(568, 320, true);
  try {
    for (const [width, height] of [[568, 320], [1024, 768]]) {
      await page.setViewportSize({ width, height });
      const failures = await page.locator('.intro-tip').evaluate((element: HTMLElement, tips: string[]) => {
        const loading = document.querySelector('.intro-loading')!.getBoundingClientRect();
        const failures: string[] = [];
        for (const tip of tips) {
          element.textContent = `Tip: ${tip}`;
          const rect = element.getBoundingClientRect();
          if (element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1
            || rect.right > loading.left || rect.left < 0 || rect.bottom > window.innerHeight) failures.push(tip);
        }
        return failures;
      }, [...INTRO_TIPS]);
      assert.deepEqual(failures, [], `${width}x${height}`);
      await page.screenshot({ path: `${screenshots}/tips-${width}.png` });
    }
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('Loading wipes and inverts its text, then reveals the real game without advancing intro time', options, async () => {
  const { context, page, errors, apiRequests } = await openDemo(1440, 900);
  try {
    assert.equal(await page.locator('.intro-title-copy h1').textContent(), '2-7');
    assert.equal(await page.locator('.intro-title-copy p').textContent(), '2-7');
    assert.equal(await page.locator('.intro-rating').textContent(), '18');
    assert.equal(await page.locator('.intro-chart span').textContent(), 'Chart');
    assert.equal(await page.locator('.intro-chart p').textContent(), 'hebscyf');
    assert.equal(await page.locator('.intro-illustration span').textContent(), 'Illustration');
    assert.equal(await page.locator('.intro-illustration p').textContent(), 'admin');
    assert.equal(await page.evaluate(() => document.fonts.check('16px "Tower Defence"', 'Chart 不要忘记元素')), true);
    assert.equal(await page.evaluate(() => Array.from(document.fonts).some(font => font.family.replaceAll('"', '') === 'Tower Defence' && font.status === 'loaded')), true);
    assert.match(await page.locator('.intro-loading').evaluate((element: HTMLElement) => getComputedStyle(element).fontFamily), /Tower Defence/);
    const draft = BALANCE_LAB_LEVEL_DRAFTS.find(draft => draft.sourceLevelId === 'L15' && draft.difficulty === 'AT')!;
    assert.deepEqual(await page.locator('.intro-monster').evaluateAll((elements: HTMLElement[]) => elements.map(element => element.dataset.monster)), getIntroMonsters(draft.waves));
    const clips: string[] = [];
    for (const time of [400, 750, 1150]) {
      clips.push(await page.locator('.intro-loading-wipe').evaluate((element: HTMLElement, time: number) => {
        const animation = element.getAnimations()[0];
        animation.pause();
        animation.currentTime = time;
        return getComputedStyle(element).clipPath;
      }, time));
      await page.screenshot({ path: `${screenshots}/loading-${time}.png` });
    }
    assert.equal(new Set(clips).size, 3);
    assert.deepEqual(await page.locator('.intro-loading-wipe').evaluate((element: HTMLElement) => {
      const style = getComputedStyle(element);
      return { color: style.color, background: style.backgroundColor };
    }), { color: 'rgb(21, 23, 26)', background: 'rgb(255, 255, 255)' });
    await page.locator('.intro-loading-wipe').evaluate((element: HTMLElement) => element.getAnimations()[0].play());
    await page.locator('[data-phase="exiting"]').waitFor();
    assert.equal(await page.locator('.game-shell').count(), 0);
    assert.equal(await page.evaluate(() => (window as any).__introDemoStore.getState().gameTime), 0);
    await page.waitForTimeout(250);
    assert.notEqual(await page.locator('.intro-composition').evaluate((element: HTMLElement) => getComputedStyle(element).transform), 'matrix(1, 0, 0, 1, 0, 0)');
    await page.locator('[data-phase="revealing"]').waitFor();
    assert.equal(await page.locator('.intro-demo-game[inert]').count(), 1);
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => (window as any).__introDemoStore.getState().gameTime), 0);
    await page.screenshot({ path: `${screenshots}/game-fade.png` });
    await page.locator('[data-phase="playing"]').waitFor();
    await page.waitForTimeout(250);
    assert.ok(await page.evaluate(() => (window as any).__introDemoStore.getState().gameTime) > 0);
    await page.screenshot({ path: `${screenshots}/game-desktop.png` });
    assert.deepEqual(errors, []);
    assert.deepEqual(apiRequests, []);
  } finally { await context.close(); }
});

for (const [width, height] of [[831, 479], [844, 390], [568, 320]]) {
  test(`intro fits ${width}x${height} and landscape phones enter the correct game layout`, options, async () => {
    const phone = height < 430;
    const { context, page, errors, apiRequests } = await openDemo(width, height, phone);
    try {
      for (const selector of ['.intro-title-strip', '.intro-credit', '.intro-cover', '.intro-tip', '.intro-loading']) {
        const rect = await page.locator(selector).boundingBox();
        assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x+rect.width <= width+1 && rect.y+rect.height <= height+1, `${selector}: ${JSON.stringify(rect)}`);
      }
      const title = await page.locator('.intro-title-copy').boundingBox();
      const credit = await page.locator('.intro-credit').boundingBox();
      const chart = await page.locator('.intro-chart').boundingBox();
      const illustration = await page.locator('.intro-illustration').boundingBox();
      assert.ok(title.y+title.height < credit.y);
      assert.ok(chart.y + chart.height < illustration.y);
      const canvas = await page.locator('.intro-canvas').boundingBox();
      assert.ok(Math.abs(canvas.width / canvas.height - 16 / 9) < 0.001);
      assert.ok(Math.abs(chart.x - illustration.x - canvas.width * 0.0155) < 1);
      await page.screenshot({ path: `${screenshots}/intro-${width}.png` });
      await page.locator('[data-phase="playing"]').waitFor();
      assert.equal(await page.locator('.game-phone').count(), phone ? 1 : 0);
      const map = await page.locator('.game-map-svg').boundingBox();
      assert.ok(map.width > width*0.45 && map.height > height*0.4);
      await page.screenshot({ path: `${screenshots}/game-${width}.png` });
      assert.deepEqual(errors, []);
      assert.deepEqual(apiRequests, []);
    } finally { await context.close(); }
  });
}

test('preview settings re-export no data, blank contributors show admin, and replay resets timing', options, async () => {
  const { context, page, errors, apiRequests } = await openDemo(1440, 900);
  try {
    await page.locator('[data-phase="playing"]').waitFor();
    await page.getByRole('button', { name: '预览设置', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    assert.equal(await page.evaluate(() => (window as any).__introDemoStore.getState().running), false);
    await page.getByLabel('关卡', { exact: true }).selectOption('L1:EZ');
    await page.getByLabel('Chart', { exact: true }).fill('');
    await page.getByRole('button', { name: '播放', exact: true }).click();
    await page.locator('[data-phase="loading"]').waitFor();
    assert.equal(await page.locator('.intro-title-copy h1').textContent(), '1-1');
    assert.equal(await page.locator('.intro-title-copy p').textContent(), '1-1');
    assert.equal(await page.locator('.intro-chart p').textContent(), 'admin');
    assert.equal(await page.locator('.intro-illustration p').textContent(), 'admin');
    assert.equal(await page.evaluate(() => (window as any).__introDemoStore.getState().gameTime), 0);
    await page.locator('[data-phase="playing"]').waitFor();
    await page.getByRole('button', { name: '重播启动动画', exact: true }).click();
    await page.locator('[data-phase="loading"]').waitFor();
    assert.equal(await page.evaluate(() => (window as any).__introDemoStore.getState().gameTime), 0);
    assert.deepEqual(errors, []);
    assert.deepEqual(apiRequests, []);
  } finally { await context.close(); }
});

const introFixture = `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<script type="module">
import RefreshRuntime from '/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => type => type;
window.__vite_plugin_react_preamble_installed__ = true;
</script></head><body><div id="root"></div><script type="module">
import React from '/node_modules/.vite/deps/react.js';
import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
import LevelIntro from '/demos/level-intro/LevelIntro.tsx';
import { getIntroMonsters } from '/demos/level-intro/introLayout.ts';
import { MONSTER_LABELS } from '/src/td/appConfig.ts';
import '/src/index.css';
import '/demos/level-intro/demo.css';
const types = new URLSearchParams(location.search).has('basic') ? ['circle','square','triangle'] : Object.keys(MONSTER_LABELS);
const monsters = getIntroMonsters([{groups:types.map(type=>({type,count:1}))}]);
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(LevelIntro,{
metadata:{title:'2-7',subtitle:'2-7',contributor:'hebscyf',difficulty:'AT',rating:18,tip:'不要忘记元素可以单独放置！'},
monsters,phase:'loading',onExitComplete:()=>{},onRevealComplete:()=>{}
}));
</script></body></html>`;

test('the whole 16:9 composition scales identically across iPad, fullscreen, ultrawide and rotation', options, async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 810 }, hasTouch: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error: Error) => errors.push(error.message));
  await page.route('**/intro-fixture*', (route: any) => route.fulfill({ contentType: 'text/html', body: introFixture }));
  try {
    await page.goto(`${baseUrl}/intro-fixture`);
    await page.locator('.intro-monster').first().waitFor();
    await page.evaluate(() => document.fonts.load('16px "Tower Defence"'));
    assert.equal(await page.locator('.intro-tip').textContent(), 'Tip: 不要忘记元素可以单独放置！');
    for (const [width, height] of [[1440, 810], [1024, 636], [1024, 768], [1920, 1080], [2560, 1080], [844, 390], [568, 320], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(80);
      const canvas = await page.locator('.intro-canvas').boundingBox();
      const scale = fitIntroScale(width, height);
      assert.ok(Math.abs(canvas.width - 1440 * scale) < 1);
      assert.ok(Math.abs(canvas.height - 810 * scale) < 1);
      assert.ok(Math.abs(canvas.x - (width - canvas.width) / 2) < 1);
      assert.ok(Math.abs(canvas.y - (height - canvas.height) / 2) < 1);
      for (const selector of ['.intro-title-strip', '.intro-credit', '.intro-cover', '.intro-tip', '.intro-loading']) {
        const rect = await page.locator(selector).boundingBox();
        assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= width + 1 && rect.y + rect.height <= height + 1, selector);
      }
      const title = await page.locator('.intro-title-strip').boundingBox();
      assert.ok(Math.abs((title.x - canvas.x) / scale - 93.6) < 1);
      assert.ok(Math.abs(title.height / scale - 107.9) < 1);
      const cover = await page.locator('.intro-cover').boundingBox();
      const rows = await page.locator('.intro-monster-row').all();
      assert.equal(rows.length, 3);
      assert.equal(await page.locator('.intro-monster').count(), 12);
      for (const row of rows) {
        assert.equal(await row.locator('.intro-monster').count(), 4);
      }
      // Every item, including its name, must lie inside the slanted cover polygon.
      for (const item of await page.locator('.intro-monster').all()) {
        const rect = await item.boundingBox();
        const left = (rect.x - cover.x) / scale;
        const right = (rect.x + rect.width - cover.x) / scale;
        const top = (rect.y - cover.y) / scale;
        const bottom = (rect.y + rect.height - cover.y) / scale;
        assert.ok(top >= 0 && bottom <= 383.04);
        assert.ok(left > 732.7 * 0.13687 * (1 - top / 383.04));
        assert.ok(right < 732.7 * (1 - 0.13687 * bottom / 383.04));
        assert.equal(await item.locator('svg').count(), 1);
        const name = await item.locator('span').boundingBox();
        assert.ok(name.x >= rect.x - 1 && name.x + name.width <= rect.x + rect.width + 1);
      }
      await page.screenshot({ path: `${screenshots}/fixed-${width}-${height}.png` });
    }
    await page.goto(`${baseUrl}/intro-fixture?basic=1`);
    await page.locator('.intro-cover').waitFor();
    assert.equal(await page.locator('.intro-monster-grid').count(), 0);
    assert.equal(await page.locator('.intro-cover').textContent(), '');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('portrait and reduced-motion previews never get stuck or start gameplay before landscape', options, async () => {
  const { context, page, errors } = await openDemo(390, 844, true, true);
  try {
    await page.screenshot({ path: `${screenshots}/intro-portrait.png` });
    await page.locator('[data-phase="playing"]').waitFor();
    await page.getByRole('dialog', { name: '请横屏游玩' }).waitFor();
    assert.equal(await page.evaluate(() => (window as any).__introDemoStore.getState().gameTime), 0);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(200);
    assert.ok(await page.evaluate(() => (window as any).__introDemoStore.getState().gameTime) > 0);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('long preview metadata stays inside the smallest phone without overlapping Loading', options, async () => {
  const { context, page, errors } = await openDemo(568, 320, true);
  try {
    await page.locator('[data-phase="playing"]').waitFor();
    await page.getByRole('button', { name: '预览设置', exact: true }).click();
    await page.getByLabel('主关卡名', { exact: true }).fill('A long level title '.repeat(3));
    await page.getByLabel('副关卡名', { exact: true }).fill('2-7 '.repeat(15));
    await page.getByLabel('Chart', { exact: true }).fill('关卡贡献者'.repeat(16));
    await page.getByLabel('Tip', { exact: true }).fill('在道路旁边布置防线'.repeat(12));
    await page.getByRole('button', { name: '播放', exact: true }).click();
    await page.locator('[data-phase="loading"]').waitFor();
    const title = await page.locator('.intro-title-copy').boundingBox();
    const credit = await page.locator('.intro-credit').boundingBox();
    const tip = await page.locator('.intro-tip').boundingBox();
    const loading = await page.locator('.intro-loading').boundingBox();
    assert.ok(title.y + title.height < credit.y);
    assert.ok(credit.y + credit.height < tip.y);
    assert.ok(tip.x + tip.width < loading.x);
    assert.ok(credit.x + credit.width <= 568 && tip.y + tip.height <= 320);
    await page.screenshot({ path: `${screenshots}/intro-long-metadata.png` });
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('a slow or failed font request holds the wipe, then reveals readable fallback gameplay', options, async () => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/*.woff2*', async (route: any) => { await gate; await route.abort(); });
  try {
    await page.goto(`${baseUrl}/demos/level-intro/`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-phase="loading"]').waitFor();
    await page.waitForTimeout(3300);
    assert.equal(await page.locator('[data-phase="loading"]').count(), 1);
    assert.equal(await page.locator('.game-shell').count(), 0);
    release();
    await page.locator('[data-phase="playing"]').waitFor();
    assert.equal(await page.evaluate(() => Array.from(document.fonts).some(font => font.family.replaceAll('"', '') === 'Tower Defence' && font.status === 'error')), true);
    assert.ok(await page.locator('.game-map-svg').isVisible());
    await page.screenshot({ path: `${screenshots}/game-font-fallback.png` });
  } finally { release(); await context.close(); }
});
