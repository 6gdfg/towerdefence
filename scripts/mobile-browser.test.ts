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
const map = MAPS.find(map => map.id === (window.__fixtureMode === 'Z' ? 18 : 10));
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
  if (mode?.includes('fullscreen') || mode === 'safari-standalone') await page.addInitScript({ content: `
    const mode = ${JSON.stringify(mode)};
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false });
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { configurable: true, value: undefined });
    Object.defineProperty(HTMLElement.prototype, 'webkitRequestFullscreen', { configurable: true, value: undefined });
    if (mode === 'safari-standalone') Object.defineProperty(navigator, 'standalone', { configurable: true, value: true });
    if (mode === 'webkit-fullscreen') {
      let active = null;
      Object.defineProperty(document, 'webkitFullscreenElement', { configurable: true, get: () => active });
      Object.defineProperty(document, 'webkitFullscreenEnabled', { configurable: true, value: true });
      Object.defineProperty(HTMLElement.prototype, 'webkitRequestFullscreen', { configurable: true, value: function () {
        active = this;
        document.dispatchEvent(new Event('webkitfullscreenchange'));
      } });
      Object.defineProperty(document, 'webkitExitFullscreen', { configurable: true, value: () => {
        active = null;
        document.dispatchEvent(new Event('webkitfullscreenchange'));
      } });
    }
  ` });
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

for (const [width, height, phone] of [[1797, 900, false], [1024, 768, false], [844, 390, true], [568, 320, true]] as const) {
  test(`combo is centered and does not overlap stats or controls at ${width}x${height}`, options, async () => {
    const { context, page, errors } = await openFixture(width, height, phone);
    try {
      assert.equal(await page.getByRole('button', { name: '关于', exact: true }).count(), 0);
      assert.equal(await page.getByRole('link', { name: 'GitHub' }).count(), 0);
      const comboBox = await page.locator('.game-combo').evaluate((node: HTMLElement) => node.getBoundingClientRect().toJSON());
      for (const combo of [0, 1, 2]) {
        await page.evaluate((combo: number) => (window as any).__tdStore.setState({ combo }), combo);
        assert.equal(await page.locator('.game-combo').isVisible(), false);
      }
      await page.evaluate(() => (window as any).__tdStore.setState({ combo: 3 }));
      assert.equal(await page.getByRole('group', { name: 'Combo 3', exact: true }).isVisible(), true);
      const visibleBox = await page.locator('.game-combo').boundingBox();
      assert.equal(visibleBox.width, comboBox.width);
      for (const combo of [775, 123456789]) {
        await page.evaluate((combo: number) => (window as any).__tdStore.setState({ combo }), combo);
        await page.waitForTimeout(200);
        const badge = await page.locator('.game-combo').boundingBox();
        const header = await page.locator('.game-topbar').boundingBox();
        const stats = await page.locator('.game-stats').boundingBox();
        const controls = await page.locator('.game-actions').boundingBox();
        assert.ok(Math.abs(badge.x + badge.width / 2 - (header.x + header.width / 2)) < 1);
        assert.ok(stats.x + stats.width <= badge.x && badge.x + badge.width <= controls.x);
        assert.equal(await page.locator('.game-combo-number').textContent(), String(combo));
        const text = await page.locator('.game-combo-number').evaluate((node: HTMLElement) => ({ width: node.clientWidth, scroll: node.scrollWidth }));
        assert.ok(text.scroll <= text.width + 1);
        for (const control of await page.locator('.game-actions > *').all()) {
          const rect = await control.boundingBox();
          assert.ok(rect.x >= controls.x - 1 && rect.x + rect.width <= controls.x + controls.width + 1);
          assert.ok(rect.y + rect.height <= header.y + header.height + 1);
        }
      }
      await page.evaluate(() => (window as any).__tdStore.setState({ combo: 775 }));
      await page.waitForTimeout(200);
      const map = await page.locator('.game-map-svg').boundingBox();
      assert.ok(map.width > width * 0.5 && map.height > height * 0.4);
      await page.screenshot({ path: `node_modules/.mobile-screenshots/combo-${width}.png` });
      await page.evaluate(() => (window as any).__tdStore.setState({ combo: 0 }));
      assert.equal(await page.locator('.game-combo').isVisible(), false);
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}

for (const [width, height, phone] of [[1440, 900, false], [844, 390, true]] as const) {
  test(`level 5000 sniper keeps SVG geometry bounded and remains playable at ${width}x${height}`, options, async t => {
    const { context, page, errors } = await openFixture(width, height, phone);
    try {
      const snapshot = await page.evaluate(() => {
        const store = (window as any).__tdStore;
        const state = store.getState();
        store.setState({ towerLevelMap: { sniper: 5000, holyFlower: 5000 }, availablePlants: ['sniper', 'holyFlower'] });
        const center = state.plantGrid.reduce((best: any, point: any) =>
          Math.hypot(point.x - state.mapWidth / 2, point.y - state.mapHeight / 2)
          < Math.hypot(best.x - state.mapWidth / 2, best.y - state.mapHeight / 2) ? point : best);
        store.getState().placeTower('sniper', center);
        store.getState().applyElement('light', center);
        const tower = store.getState().towers[0];
        store.setState({ enemies: Array.from({ length: 60 }, (_, index) => ({
          id: `stress-${index}`, shape: 'circle', pos: { x: 10 + index * 0.05, y: 8 },
          hp: 1e10, maxHp: 1e10, speed: 0, leakDamage: 1, pathId: 0, pathIndex: 0, t: 0.1, progress: index / 100,
        })) });
        return { id: tower.id, range: tower.range, damage: tower.damage, fireRate: tower.fireRate,
          legacyDiameter: tower.range * (window as any).__tdCellSize * 2 };
      });
      assert.equal(snapshot.range, 5048.01);
      assert.ok(snapshot.legacyDiameter > 300000);
      assert.ok(snapshot.damage > 60000 && snapshot.fireRate > 30);
      const tower = page.locator(`[data-tower-id="${snapshot.id}"]`);
      await tower.waitFor();
      const bounds = await tower.evaluate((node: SVGGraphicsElement) => {
        const box = node.getBBox();
        return { width: box.width, height: box.height, filter: getComputedStyle(node).filter,
          largeCircles: [...node.querySelectorAll('circle')].filter(circle => circle.r.baseVal.value > 1000).length };
      });
      assert.ok(bounds.width < 120 && bounds.height < 120, JSON.stringify(bounds));
      assert.equal(bounds.filter, 'none');
      assert.equal(bounds.largeCircles, 0);
      assert.equal(await tower.locator('.tower-range').count(), 0);
      const frames = await page.evaluate(`new Promise(resolve => {
        let frames = 0;
        const start = performance.now();
        const tick = () => { frames++; if (performance.now() - start >= 1200) resolve(frames); else requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      })`);
      assert.ok(frames > 5, `Browser stopped responding: ${frames} frames`);
      t.diagnostic(`Level 5000 with light / 60 enemies: ${frames} frames in 1.2s; tower bounds ${bounds.width}x${bounds.height}px`);
      assert.ok(await page.evaluate(() => (window as any).__tdStore.getState().projectiles.length) > 0);
      assert.ok(await page.evaluate(() => (window as any).__tdStore.getState().gameTime) > 1);
      assert.ok(await page.locator('.game-map-svg').isVisible());
      await page.screenshot({ path: `node_modules/.mobile-screenshots/sniper-5000-${width}.png` });
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}

for (const [width, height, phone] of [[1440, 900, false], [844, 390, true]] as const) {
  test(`Z map and normal/boss jack warnings render correctly at ${width}x${height}`, options, async () => {
    const { context, page, errors } = await openFixture(width, height, phone, 'Z');
    try {
      await page.evaluate(() => {
        const store = (window as any).__tdStore;
        store.setState({ running: false });
        store.getState().placeTower('bottleGrass', { x: 20.5, y: 1.5 });
        store.getState().placeTower('pumpkinHead', { x: 20.5, y: 1.5 });
        const state = store.getState();
        store.setState({ gameTime: 8, running: true, nextSkySunAt: null,
          towers: state.towers.map((t: any) => ({ ...t, frozenUntil: 100 })),
          enemies: [
            { id: 'jack-warning', shape: 'jackInTheBox', pos: { x: 20.5, y: 3.5 }, hp: 80, maxHp: 80,
              speed: 2.5, leakDamage: 1, pathId: 0, pathIndex: 0, t: 18 / 35, progress: 0.1, specialTimer: 8 },
            { id: 'boss-warning', shape: 'jackInTheBox', pos: { x: 6.5, y: 16.5 }, hp: 8072, maxHp: 8072,
              speed: 0.6, leakDamage: 1, isBoss: true, level: 1000, pathId: 0, pathIndex: 2, t: 4 / 35, progress: 0.7, specialTimer: 8 },
          ] });
        store.getState().update(0.1);
        store.setState({ running: false });
      });
      await page.locator('.jack-explosion-warning').first().waitFor();
      assert.equal(await page.locator('.jack-explosion-warning').count(), 2);
      const warnings = await page.locator('.jack-explosion-warning').evaluateAll((nodes: SVGCircleElement[]) => nodes.map(node => ({
        radius: node.r.baseVal.value, pointerEvents: getComputedStyle(node).pointerEvents,
        animation: getComputedStyle(node).animationName, fill: node.getAttribute('fill'),
      })));
      for (const warning of warnings) {
        assert.equal(warning.radius, 60);
        assert.equal(warning.pointerEvents, 'none');
        assert.equal(warning.animation, 'jack-warning');
      }
      assert.equal(await page.locator('[data-enemy-id="jack-warning"] text').first().textContent(), '!');
      assert.equal(await page.locator('[data-enemy-id="boss-warning"] > g svg').getAttribute('width'), '48');
      const lines = await page.locator('.map-switch-layer polyline').evaluateAll((nodes: SVGPolylineElement[]) => nodes.map(n => n.getAttribute('points')));
      assert.ok(lines.includes('75,105 1125,105 75,495 1125,495'));
      const snapshot = await page.evaluate(() => {
        const state = (window as any).__tdStore.getState();
        return { width: state.mapWidth, height: state.mapHeight, towers: state.towers.length, covers: state.plantCovers.length };
      });
      assert.deepEqual(snapshot, { width: 40, height: 20, towers: 1, covers: 1 });
      await page.screenshot({ path: `node_modules/.mobile-screenshots/Z-jack-${width}.png` });
      const frozen = await page.evaluate(() => {
        const store = (window as any).__tdStore;
        const state = store.getState();
        store.setState({ running: true, enemies: state.enemies.map((e: any) => ({ ...e, freezeUntil: state.gameTime + 2 })) });
        store.getState().update(1);
        store.setState({ running: false });
        return store.getState().enemies.map((e: any) => e.explosionAt);
      });
      assert.deepEqual(frozen, [10.5, 10.5]);
      assert.equal(await page.locator('.jack-explosion-warning').count(), 2);
      assert.equal(await page.locator('.jack-explosion-warning').first().evaluate((node: SVGCircleElement) => getComputedStyle(node).animationPlayState), 'paused');
      await page.evaluate(() => {
        const store = (window as any).__tdStore;
        store.setState({ running: true, enemies: store.getState().enemies.map((e: any) => ({ ...e, freezeUntil: undefined })) });
        store.getState().update(1.5);
        store.setState({ running: false });
      });
      assert.equal(await page.locator('.jack-explosion-warning').count(), 0);
      const after = await page.evaluate(() => {
        const state = (window as any).__tdStore.getState();
        return { towers: state.towers.length, covers: state.plantCovers.length, enemies: state.enemies.length, combo: state.combo };
      });
      assert.deepEqual(after, { towers: 1, covers: 0, enemies: 0, combo: 2 });
      assert.deepEqual(errors, []);
    } finally { await context.close(); }
  });
}

for (const [width, height] of [[568, 320], [667, 375], [844, 390], [915, 412]]) {
  test(`landscape phone ${width}x${height} keeps the map visible and places plants at the touched grid`, options, async () => {
    const { context, page, errors } = await openFixture(width, height);
    try {
      assert.equal(await page.locator('.game-phone').count(), 1);
      const resetView = page.getByRole('button', { name: '重置地图视野', exact: true });
      assert.equal(await resetView.isDisabled(), true);
      assert.equal(await resetView.locator('.lucide-rotate-ccw').count(), 1);
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
      await page.getByRole('button', { name: '重置地图视野', exact: true }).click();
      assert.equal(await resetView.isDisabled(), true);
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
      assert.equal(await page.getByRole('button', { name: '关于', exact: true }).count(), 0);
      assert.equal(await page.getByRole('link', { name: 'GitHub' }).count(), 0);
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

test('unsupported iPhone fullscreen explains the home-screen option and pauses safely across rotation', options, async () => {
  const { context, page, errors } = await openFixture(844, 390, true, 'safari-no-fullscreen');
  try {
    await page.getByRole('button', { name: '全屏', exact: true }).click();
    await page.getByRole('dialog', { name: 'iPhone / iPad 全屏游玩' }).waitFor();
    assert.match(await page.locator('.game-fullscreen-dialog').textContent(), /添加到主屏幕/);
    assert.equal(await page.evaluate(() => (window as any).__tdStore.getState().running), false);
    const time = await page.evaluate(() => (window as any).__tdStore.getState().gameTime);
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => (window as any).__tdStore.getState().gameTime), time);
    await page.screenshot({ path: 'node_modules/.mobile-screenshots/safari-fullscreen-help.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: '确定', exact: true }).click();
    assert.equal(await page.evaluate(() => (window as any).__tdStore.getState().running), false);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.getByRole('button', { name: '暂停', exact: true }).waitFor();
    await page.getByRole('button', { name: '暂停', exact: true }).click();
    await page.getByRole('button', { name: '全屏', exact: true }).click();
    await page.getByRole('button', { name: '确定', exact: true }).click();
    assert.equal(await page.evaluate(() => (window as any).__tdStore.getState().running), false);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('WebKit fullscreen updates the button and exits through the prefixed API', options, async () => {
  const { context, page, errors } = await openFixture(844, 390, true, 'webkit-fullscreen');
  try {
    await page.getByRole('button', { name: '全屏', exact: true }).click();
    await page.getByRole('button', { name: '退出全屏', exact: true }).waitFor();
    assert.equal(await page.locator('.game-fullscreen-dialog').count(), 0);
    await page.getByRole('button', { name: '退出全屏', exact: true }).click();
    await page.getByRole('button', { name: '全屏', exact: true }).waitFor();
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('installed iPhone standalone windows do not show an unusable fullscreen toggle', options, async () => {
  const { context, page, errors } = await openFixture(844, 390, true, 'safari-standalone');
  try {
    assert.equal(await page.getByRole('button', { name: '全屏', exact: true }).count(), 0);
    assert.equal(await page.locator('.game-fullscreen-dialog').count(), 0);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('native fullscreen keeps its exit control and restores the normal phone layout', options, async () => {
  const { context, page, errors } = await openFixture(844, 390);
  try {
    await page.getByRole('button', { name: '全屏', exact: true }).click();
    await page.getByRole('button', { name: '退出全屏', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.fullscreenElement?.classList.contains('game-shell')), true);
    assert.equal(await page.locator('.game-fullscreen-dialog').count(), 0);
    await page.getByRole('button', { name: '退出全屏', exact: true }).click();
    await page.getByRole('button', { name: '全屏', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.fullscreenElement), null);
    const map = await page.locator('.game-map-svg').boundingBox();
    assert.ok(map.x >= 0 && map.x + map.width <= 845 && map.y + map.height <= 391);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
