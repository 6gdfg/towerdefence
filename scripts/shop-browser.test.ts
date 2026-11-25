import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
import type { DailyShopState } from '../shared/shop';

const modulePath = process.env.TD_TEST_PLAYWRIGHT;
const baseUrl = process.env.TD_TEST_URL ?? 'http://localhost:5176';
const options = { skip: !modulePath };
let browser: any;

before(async () => {
  if (!modulePath) return;
  const { chromium } = await import(pathToFileURL(modulePath).href);
  browser = await chromium.launch({ headless: true, executablePath: process.env.TD_TEST_CHROMIUM });
  await mkdir('node_modules/.shop-screenshots', { recursive: true });
});
after(async () => { await browser?.close(); });

function fixture(): DailyShopState {
  return {
    coins: 20000, diamonds: 5.5, experience: 100,
    dayKey: '2026-11-25', refreshAt: new Date(Date.now() + 3600000).toISOString(),
    products: [
      { id: 'daily-plant-0', itemId: 'doubleBottleGrass', amount: 10, currency: 'coins', price: 5000, purchased: false },
      { id: 'daily-plant-1', itemId: 'frostBlastShroom', amount: 1, currency: 'coins', price: 500, purchased: false },
      { id: 'daily-plant-2', itemId: 'flameBottleGrass', amount: 4, currency: 'coins', price: 2000, purchased: false },
      { id: 'daily-element-0', itemId: 'element:wind', amount: 4, currency: 'diamonds', price: 4, purchased: false },
    ],
  };
}

async function open(width = 1280, height = 800, state = fixture(), failPurchase = false) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  const orders: any[] = [];
  let reads = 0;
  page.on('pageerror', (error: Error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('td_token', 'shop-test-token');
    localStorage.setItem('td_username', 'shop-test');
  });
  await page.route('**/api/**', async (route: any) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname !== '/api/shop') return route.fulfill({ contentType: 'application/json', body: JSON.stringify(state) });
    const order = route.request().postDataJSON();
    if (!order) {
      reads += 1;
      if (Date.now() >= Date.parse(state.refreshAt)) {
        state.dayKey = '2026-11-26';
        state.refreshAt = new Date(Date.now() + 3600000).toISOString();
        state.products = state.products.map(product => ({ ...product, amount: 2, price: product.currency === 'coins' ? 1000 : 2, purchased: false }));
      }
    } else {
      orders.push(order);
      const product = state.products.find(item => item.id === order.productId)!;
      product.purchased = true;
      if (failPurchase) return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: '今日已购买此商品。' }) });
      state[product.currency] -= product.price;
    }
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(state) });
  });
  await page.goto(`${baseUrl}/shop`);
  await page.locator('.shop-product').first().waitFor();
  return { page, context, errors, orders, state, reads: () => reads };
}

for (const [width, height] of [[1280, 800], [1024, 768], [844, 390], [390, 844], [320, 640]]) {
  test(`daily shop has four readable products and no old products/history at ${width}x${height}`, options, async () => {
    const { page, context, errors } = await open(width, height);
    try {
      assert.equal(await page.getByRole('heading', { name: '每日商店', exact: true }).isVisible(), true);
      assert.equal(await page.locator('.shop-product').count(), 4);
      assert.equal(await page.getByRole('heading', { name: /盲盒|酸奶|兑换凭据记录/ }).count(), 0);
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.locator('.shop-product, .shop-product h3, .shop-product button').evaluateAll((nodes: HTMLElement[]) => (
        nodes.filter(node => node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1)
          .map(node => ({ text: node.textContent, width: node.clientWidth, scroll: node.scrollWidth }))
      ));
      assert.deepEqual(overflow, []);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
      await page.screenshot({ path: `node_modules/.shop-screenshots/daily-shop-${width}.png`, fullPage: true });
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}

test('shop confirmation, currency balances and bought state persist across reload without purchase history', options, async () => {
  const { page, context, orders, errors } = await open();
  try {
    const cards = page.locator('.shop-product');
    await cards.first().getByRole('button', { name: '购买', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '确认购买' });
    await dialog.getByRole('button', { name: '取消', exact: true }).click();
    assert.equal(orders.length, 0);
    await cards.first().getByRole('button', { name: '购买', exact: true }).click();
    await dialog.getByRole('button', { name: '确认购买', exact: true }).click();
    await cards.first().getByRole('button', { name: '已购买', exact: true }).waitFor();
    assert.equal(await cards.first().getByRole('button').isDisabled(), true);
    assert.deepEqual(orders[0], { action: 'purchase', productId: 'daily-plant-0', dayKey: '2026-11-25' });
    assert.equal(await page.getByText('金币：15000', { exact: true }).isVisible(), true);
    assert.equal(await page.getByRole('status').textContent(), '双发瓶子草碎片 x10 已到账。');
    await cards.nth(3).getByRole('button', { name: '购买', exact: true }).click();
    await dialog.getByRole('button', { name: '确认购买', exact: true }).click();
    await cards.nth(3).getByRole('button', { name: '已购买', exact: true }).waitFor();
    assert.equal(await page.getByText('钻石：1.5', { exact: true }).isVisible(), true);
    await page.reload();
    await page.locator('.shop-product').first().waitFor();
    assert.equal(await page.getByRole('button', { name: '已购买', exact: true }).count(), 2);
    assert.equal(orders.length, 2);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('shop disables unaffordable products and recovers bought state after a rejected purchase', options, async () => {
  const state = fixture();
  state.coins = 500;
  state.diamonds = 0.5;
  const { page, context, orders, errors } = await open(390, 844, state, true);
  try {
    const cards = page.locator('.shop-product');
    assert.equal(await cards.first().getByRole('button', { name: '金币不足', exact: true }).isDisabled(), true);
    assert.equal(await cards.nth(3).getByRole('button', { name: '钻石不足', exact: true }).isDisabled(), true);
    await cards.nth(1).getByRole('button', { name: '购买', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: '确认购买', exact: true }).click();
    await page.getByRole('alert').waitFor();
    assert.match(await page.getByRole('alert').textContent(), /今日已购买/);
    await cards.nth(1).getByRole('button', { name: '已购买', exact: true }).waitFor();
    assert.equal(orders.length, 1);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('an open shop automatically replaces products after the server-provided refresh deadline', options, async () => {
  const state = fixture();
  state.refreshAt = new Date(Date.now() + 3000).toISOString();
  const { page, context, reads, errors } = await open(1024, 768, state);
  try {
    await page.waitForFunction(() => Array.from(document.querySelectorAll('.shop-product-quantity')).every(node => node.textContent === 'x2'));
    assert.ok(reads() >= 2);
    assert.equal(await page.getByRole('button', { name: '已购买', exact: true }).count(), 0);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
