import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';

const modulePath = process.env.TD_TEST_PLAYWRIGHT;
const baseUrl = process.env.TD_TEST_URL ?? 'http://localhost:5176';
let browser: any;
const options = { skip: !modulePath };
const fixture = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="stylesheet" href="/src/index.css"></head>
<script type="module">
import RefreshRuntime from '/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => type => type;
window.__vite_plugin_react_preamble_installed__ = true;
</script>
<body><div class="app-shell"><div class="stage-container stage-container-idle"><div id="fixture"></div></div></div><script type="module">
import React from '/node_modules/.vite/deps/react.js';
import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
import TDGame, { __testStore as useTDStore } from '/src/td/TDGame.tsx';
import BalanceLabPage from '/src/td/BalanceLabPage.tsx';
import { MAPS, getPlantGrid } from '/src/td/maps.ts';
import { PLANT_TYPES, ELEMENT_TYPES } from '/src/td/appConfig.ts';
import { CELL_SIZE } from '/src/config/mapConfig.ts';
const map = MAPS.find(map => map.id === 10);
const levels = Object.fromEntries([...PLANT_TYPES, ...ELEMENT_TYPES.map(id=>'element:'+id)].map(id=>[id,10]));
const atModeConfig = window.__fixtureMode === 'conveyor' ? {type:'conveyor',conveyor:{intervalSec:100,maxQueue:25,pool:[{kind:'plant',id:'bottleGrass',weight:100}]}}
  : window.__fixtureMode === 'whackAMole' ? {type:'whackAMole',whackAMole:{plants:['bottleGrass'],hammerBaseDamage:30}} : null;
useTDStore.getState().loadLevel({startGold:100000,lives:20,waves:[{groups:[{type:'bunker',count:2,interval:1,level:10,isBoss:true,bossSpeed:0.01}]}]},
{...map,plantGrid:getPlantGrid(map)},{towerLevels:levels,allowedPlants:PLANT_TYPES,allowedElements:ELEMENT_TYPES,autoStartFirstWave:false,atModeConfig});
if (atModeConfig?.type === 'conveyor') useTDStore.setState({conveyorQueue:Array.from({length:20},(_,index)=>index===19?{kind:'element',id:'fire'}:{kind:'plant',id:'bottleGrass'})});
window.__tdStore = useTDStore;
window.__tdCellSize = CELL_SIZE;
const element = window.__fixtureMode?.startsWith('lab')
  ? React.createElement(BalanceLabPage,{onBack:()=>{},onStartTest:config=>window.__labTestConfig=config})
  : React.createElement(TDGame,{difficultyLabel:'AT Lv.18',onExit:()=>window.__exited=true});
ReactDOM.createRoot(document.getElementById('fixture')).render(React.createElement(React.StrictMode, null, element));
</script></body></html>`;

before(async () => {
  if (!modulePath) return;
  const { chromium } = await import(pathToFileURL(modulePath).href);
  browser = await chromium.launch({ headless: true, executablePath: process.env.TD_TEST_CHROMIUM });
  await mkdir('node_modules/.mobile-screenshots', { recursive: true });
});
after(async () => { await browser?.close(); });

async function openFixture(width: number, height: number, phone = true, mode?: string, touch = phone) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: phone,
    ...(phone ? { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' } : {}) });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  if (mode) await page.addInitScript((mode: string) => {
    (window as any).__fixtureMode = mode;
    if (mode.startsWith('lab')) localStorage.setItem('td-balance-lab-config-v2', JSON.stringify({
      sourceLevelId: 'L15', levelName: '2-7', contributor: 'fixture', targetDifficulty: 'AT', mapId: 10,
      startGold: 900, lives: 20, autoStartFirstWave: false, firstWaveDelaySec: 0.8,
      difficultyRatings: { EZ: 1, HD: 5, IN: 10, AT: 18 }, towerLevels: { bottleGrass: 10 },
      waves: [{ groups: [{ type: 'circle', count: 3, interval: 0.4, level: 123 }] }],
      atModeConfig: mode === 'labPhantom'
        ? { type: 'phantom', phantom: { subMode: 'cardSelect' }, cardSelect: { maxPlants: 5, maxElements: 2, monsterLevelMultiplier: 10 } }
        : { type: 'cardSelect', cardSelect: { maxPlants: 5, maxElements: 2, monsterLevelMultiplier: 10 } },
    }));
  }, mode);
  page.on('pageerror', (error: Error) => errors.push(error.message));
  page.on('console', (message: any) => { if (message.type() === 'error') errors.push(message.text()); });
  // Direct fixture imports otherwise miss Vite's HMR query and can create a second store.
  await page.route('**/src/td/TDGame.tsx*', async (route: any) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nexport { useTDStore as __testStore };` });
  });
  await page.route('**/mobile-fixture', (route: any) => route.fulfill({ contentType: 'text/html', body: fixture }));
  await page.goto(`${baseUrl}/mobile-fixture`);
  try {
    await page.locator(mode?.startsWith('lab') ? '.balance-lab-page' : '.game-map-svg').waitFor();
  } catch (error) {
    const diagnostic = await page.evaluate(() => {
      const shell = document.querySelector('.game-shell');
      const map = document.querySelector('.game-map-svg');
      return { shell: shell?.getBoundingClientRect().toJSON(), map: map?.getBoundingClientRect().toJSON(), html: document.getElementById('fixture')?.innerHTML.slice(0, 200) };
    });
    await context.close();
    throw new Error(`Game fixture did not mount: ${errors.join('; ')}; ${JSON.stringify(diagnostic)}; ${String(error)}`);
  }
  await page.waitForTimeout(300);
  return { context, page, errors };
}

for (const [width, height] of [[568, 320], [667, 375], [844, 390], [915, 412]]) {
  test(`landscape phone ${width}x${height} keeps the map visible and places plants at the touched grid`, options, async () => {
    const { context, page, errors } = await openFixture(width, height);
    try {
      assert.equal(await page.locator('.game-phone').count(), 1);
      assert.equal(await page.getByRole('button', { name: '关于', exact: true }).count(), 0);
      assert.equal(await page.getByRole('link', { name: 'GitHub' }).count(), 0);
      const map = await page.locator('.game-map-svg').boundingBox();
      assert.ok(map.width > width * 0.55 && map.height > height * 0.6, JSON.stringify(map));
      assert.ok(map.x >= 0 && map.y >= 0 && map.x + map.width <= width + 1 && map.y + map.height <= height + 1);
      await page.getByRole('button', { name: '放大地图', exact: true }).click();
      await page.getByRole('button', { name: '放大地图', exact: true }).click();
      await page.getByRole('button', { name: /^瓶子草，/ }).click();
      const target = await page.evaluate(() => {
        const state = (window as any).__tdStore.getState();
        const grid = state.plantGrid.reduce((nearest: any, point: any) => Math.hypot(point.x-state.mapWidth/2, point.y-state.mapHeight/2) < Math.hypot(nearest.x-state.mapWidth/2, nearest.y-state.mapHeight/2) ? point : nearest);
        const svg = document.querySelector('.game-map-svg') as SVGSVGElement;
        const point = svg.createSVGPoint();
        point.x = grid.x * (window as any).__tdCellSize;
        point.y = grid.y * (window as any).__tdCellSize;
        const screen = point.matrixTransform(svg.getScreenCTM()!);
        return { grid, x: screen.x, y: screen.y };
      });
      await page.touchscreen.tap(target.x, target.y);
      const towers = await page.evaluate(() => (window as any).__tdStore.getState().towers);
      assert.equal(towers.length, 1);
      assert.deepEqual(towers[0].pos, target.grid);
      assert.equal(towers[0].level, 10);
      await page.getByRole('tab', { name: '元素', exact: true }).click();
      await page.getByRole('button', { name: /^火元素，/ }).click();
      await page.touchscreen.tap(target.x, target.y);
      assert.equal(await page.evaluate(() => (window as any).__tdStore.getState().towers[0].element.type), 'fire');
      await page.getByRole('button', { name: '铲子', exact: true }).click();
      await page.touchscreen.tap(target.x, target.y);
      assert.equal(await page.evaluate(() => (window as any).__tdStore.getState().towers.length), 0);
      await page.getByRole('button', { name: '显示完整地图', exact: true }).click();
      await page.screenshot({ path: `node_modules/.mobile-screenshots/phone-${width}.png` });
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}

test('two-finger pinch and pan stay inside the map without accidentally planting', options, async () => {
  const { context, page, errors } = await openFixture(844, 390);
  try {
    await page.getByRole('button', { name: /^瓶子草，/ }).click();
    const map = await page.locator('.game-map-svg').boundingBox();
    const client = await context.newCDPSession(page);
    const centerX = map.x + map.width/2;
    const centerY = map.y + map.height/2;
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: centerX-30, y: centerY, id: 0 }, { x: centerX+30, y: centerY, id: 1 }] });
    for (const distance of [45, 60, 75]) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: centerX-distance+10, y: centerY, id: 0 }, { x: centerX+distance+10, y: centerY, id: 1 }] });
      await page.waitForTimeout(40);
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const view = await page.evaluate(() => {
      const box = (document.querySelector('.game-map-svg') as SVGSVGElement).viewBox.baseVal;
      return { x: box.x, y: box.y, width: box.width, height: box.height, towers: (window as any).__tdStore.getState().towers.length };
    });
    assert.ok(view.width < 600 && view.x >= 0 && view.x+view.width <= 1200);
    assert.ok(view.y >= 0 && view.y+view.height <= 600);
    assert.equal(view.towers, 0);
    await page.screenshot({ path: 'node_modules/.mobile-screenshots/phone-zoom.png' });
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('portrait blocks play, rotation resumes only an unpaused game and never advances portrait time', options, async () => {
  const { context, page, errors } = await openFixture(390, 844);
  try {
    await page.getByRole('dialog', { name: '请横屏游玩' }).waitFor();
    const startTime = await page.evaluate(() => (window as any).__tdStore.getState().gameTime);
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => (window as any).__tdStore.getState().running), false);
    assert.equal(await page.evaluate(() => (window as any).__tdStore.getState().gameTime), startTime);
    await page.screenshot({ path: 'node_modules/.mobile-screenshots/phone-portrait.png' });
    await page.setViewportSize({ width: 844, height: 390 });
    await page.getByRole('button', { name: '暂停', exact: true }).waitFor();
    await page.waitForTimeout(150);
    assert.equal(await page.getByRole('dialog', { name: '请横屏游玩' }).count(), 0);
    assert.equal(await page.evaluate(() => (window as any).__tdStore.getState().running), true);
    await page.getByRole('button', { name: '暂停', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('dialog', { name: '请横屏游玩' }).waitFor();
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => (window as any).__tdStore.getState().running), false);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

for (const [width, height] of [[1440, 900], [1024, 768]]) {
  test(`desktop/tablet layout ${width}x${height} retains its toolbar and map`, options, async () => {
    const { context, page, errors } = await openFixture(width, height, false, undefined, width === 1024);
    try {
      assert.equal(await page.locator('.game-phone').count(), 0);
      assert.equal(await page.getByRole('button', { name: '关于', exact: true }).count(), 1);
      const map = await page.locator('.game-map-svg').boundingBox();
      assert.ok(map.width > 600 && map.height > 250);
      await page.screenshot({ path: `node_modules/.mobile-screenshots/desktop-${width}.png` });
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}

async function screenPoint(page: any, position: { x: number; y: number }) {
  return page.evaluate((position: { x: number; y: number }) => {
    const svg = document.querySelector('.game-map-svg') as SVGSVGElement;
    const point = svg.createSVGPoint();
    point.x = position.x * (window as any).__tdCellSize;
    point.y = position.y * (window as any).__tdCellSize;
    const screen = point.matrixTransform(svg.getScreenCTM()!);
    return { x: screen.x, y: screen.y };
  }, position);
}

test('sun taps take priority over planting and do not collect twice', options, async () => {
  const { context, page, errors } = await openFixture(844, 390);
  try {
    await page.getByRole('button', { name: '暂停', exact: true }).click();
    await page.getByRole('button', { name: '放大地图', exact: true }).click();
    await page.getByRole('button', { name: /^瓶子草，/ }).click();
    const grid = await page.evaluate(() => {
      const state = (window as any).__tdStore.getState();
      const grid = state.plantGrid.reduce((nearest: any, point: any) => Math.hypot(point.x-state.mapWidth/2, point.y-state.mapHeight/2) < Math.hypot(nearest.x-state.mapWidth/2, nearest.y-state.mapHeight/2) ? point : nearest);
      (window as any).__tdStore.setState({ sunPickups: [{ id: 'touch-sun', pos: grid, value: 20, source: 'plant', createdAt: state.gameTime, expiresAt: state.gameTime+20 }] });
      return grid;
    });
    const point = await screenPoint(page, grid);
    await page.touchscreen.tap(point.x, point.y);
    assert.deepEqual(await page.evaluate(() => {
      const state = (window as any).__tdStore.getState();
      return { gold: state.gold, towers: state.towers.length, collecting: state.sunPickups[0].collecting };
    }), { gold: 100020, towers: 0, collecting: true });
    await page.evaluate(() => (window as any).__tdStore.getState().collectSun('touch-sun'));
    assert.equal(await page.evaluate(() => (window as any).__tdStore.getState().gold), 100020);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('conveyor cards remain scrollable and preserve account levels and free placement', options, async () => {
  const { context, page, errors } = await openFixture(667, 375, true, 'conveyor');
  try {
    assert.equal(await page.getByRole('tab').count(), 0);
    await page.getByRole('button', { name: '瓶子草', exact: true }).first().click();
    const grid = await page.evaluate(() => {
      const state = (window as any).__tdStore.getState();
      return state.plantGrid.reduce((nearest: any, point: any) => Math.hypot(point.x-state.mapWidth/2, point.y-state.mapHeight/2) < Math.hypot(nearest.x-state.mapWidth/2, nearest.y-state.mapHeight/2) ? point : nearest);
    });
    const point = await screenPoint(page, grid);
    await page.touchscreen.tap(point.x, point.y);
    await page.getByRole('button', { name: '火元素', exact: true }).click();
    await page.touchscreen.tap(point.x, point.y);
    const state = await page.evaluate(() => {
      const state = (window as any).__tdStore.getState();
      return { gold: state.gold, level: state.towers[0].level, element: state.towers[0].element.type, count: state.conveyorQueue.length };
    });
    assert.deepEqual(state, { gold: 100000, level: 10, element: 'fire', count: 18 });
    await page.evaluate(() => {
      const store = (window as any).__tdStore;
      store.setState({ conveyorQueue: [...store.getState().conveyorQueue, { kind: 'element', id: 'fire' }], elementCooldowns: { fire: store.getState().gameTime+5 } });
    });
    const fireCard = page.getByRole('button', { name: '火元素', exact: true });
    await fireCard.scrollIntoViewIfNeeded();
    assert.match(await fireCard.textContent(), /[45]s/);
    await page.screenshot({ path: 'node_modules/.mobile-screenshots/phone-conveyor.png' });
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('small-phone hammer controls and multiple boss bars stay outside the map', options, async () => {
  const { context, page, errors } = await openFixture(568, 320, true, 'whackAMole');
  try {
    await page.getByRole('button', { name: '升级锤子，200阳光', exact: true }).click();
    assert.equal(await page.evaluate(() => (window as any).__tdStore.getState().hammerLevel), 2);
    await page.getByRole('button', { name: '开始/下一波', exact: true }).click();
    await page.waitForFunction(() => (window as any).__tdStore.getState().enemies.length === 2);
    const enemy = await page.evaluate(() => (window as any).__tdStore.getState().enemies[0]);
    const point = await screenPoint(page, enemy.pos);
    await page.touchscreen.tap(point.x, point.y);
    const damaged = await page.evaluate((id: string) => (window as any).__tdStore.getState().enemies.find((enemy: any) => enemy.id === id), enemy.id);
    assert.equal(enemy.hp + (enemy.armorHp ?? 0) - damaged.hp - (damaged.armorHp ?? 0), 50);
    const map = await page.locator('.game-map-svg').boundingBox();
    const bars = await page.locator('.boss-health-area').boundingBox();
    assert.ok(map.width > 300 && map.height > 190);
    assert.ok(bars.y + bars.height <= map.y + 1, JSON.stringify({ bars, map }));
    const upgrade = await page.getByRole('button', { name: '升级锤子，300阳光', exact: true }).boundingBox();
    assert.ok(upgrade.x+upgrade.width <= 128 && upgrade.y+upgrade.height < 320);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await page.screenshot({ path: 'node_modules/.mobile-screenshots/phone-hammer-boss.png' });
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

for (const mode of ['lab', 'labPhantom']) {
  test(`AT laboratory removes card selection and safely re-exports old ${mode} caches`, options, async () => {
    const { context, page, errors } = await openFixture(1440, 900, false, mode);
    try {
      assert.equal(await page.getByRole('button', { name: '选卡', exact: true }).count(), 0);
      assert.equal(await page.locator('.lab-mode-card').count(), mode === 'labPhantom' ? 10 : 6);
      await page.getByRole('button', { name: '导出配置', exact: true }).click();
      const source = await page.locator('.lab-export-textarea').inputValue();
      assert.equal(source.includes('cardSelect'), false);
      assert.equal(source.includes('monsterLevelMultiplier'), false);
      assert.ok(source.includes('"level": 123'));
      await page.getByRole('button', { name: '测试当前配置', exact: true }).click();
      const config = await page.evaluate(() => (window as any).__labTestConfig);
      assert.deepEqual(config.atModeConfig, mode === 'labPhantom' ? { type: 'phantom', phantom: { subMode: 'normal' } } : { type: 'normal' });
      assert.equal(config.waves[0].groups[0].level, 123);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}
