import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, sep, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getLevelSpecForDifficulty, LEVELS } from '../src/td/levels';
import { PLANT_TYPES, ELEMENT_TYPES } from '../src/td/appConfig';
import { getIntroMonsters } from '../src/td/introLayout';

const modulePath = process.env.TD_TEST_PLAYWRIGHT;
const baseUrl = process.env.TD_TEST_URL ?? 'http://localhost:5176';
const options = { skip: !modulePath };
const screenshots = 'node_modules/.level-start-screenshots';
let browser: any;

before(async () => {
  if (!modulePath) return;
  const { chromium } = await import(pathToFileURL(modulePath).href);
  browser = await chromium.launch({ headless: true, executablePath: process.env.TD_TEST_CHROMIUM });
  await mkdir(screenshots, { recursive: true });
});
after(async () => { await browser?.close(); });

async function openApp(width = 1440, height = 900, phone = false, reducedMotion = false, fontGate?: Promise<void>, progressOverrides: Record<string, unknown> = {}, selectLevels = true) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: phone, isMobile: phone,
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
    ...(phone ? { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' } : {}) });
  const page = await context.newPage();
  page.setDefaultTimeout(16000);
  if (fontGate) await page.route('**/*.woff2*', async (route: any) => { await fontGate; await route.abort(); });
  const errors: string[] = [];
  const actions: any[] = [];
  page.on('pageerror', (error: Error) => errors.push(error.message));
  await page.addInitScript({ content: `
    localStorage.setItem('td_token', 'intro-test-token');
    localStorage.setItem('td_player_id', 'intro-test-player');
    localStorage.setItem('td_username', 'intro-test');
  ` });
  await page.route('**/src/App.tsx*', async (route: any) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nwindow.__introAppStore = useTDStore;` });
  });
  const progress = {
    unlocked: 48, coins: 9999, magicKeys: 2, diamonds: 5, experience: 20, chests: [],
    stars: Object.fromEntries(LEVELS.map(level => [level.id, 3])),
    fullHealthClears: Object.fromEntries(LEVELS.map(level => [level.id, true])), atClears: {},
    unlockedItems: [...PLANT_TYPES, ...ELEMENT_TYPES.map(element => `element:${element}`)],
    towerLevels: Object.fromEntries([...PLANT_TYPES, ...ELEMENT_TYPES.map(element => `element:${element}`)].map(id => [id, 17])),
    ...progressOverrides,
  };
  await page.route('**/api/**', async (route: any) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    const action = request.method() === 'POST' ? request.postDataJSON() : null;
    if (action) actions.push(action);
    const body = pathname === '/api/announcement' ? { seen: true }
      : action?.action === 'getNextNotification' ? { notification: null }
      : action?.action === 'startCampaignRun' ? { ok: true, runId: `campaign_${String(actions.filter(action=>action.action==='startCampaignRun').length).padStart(8,'0')}-0000-4000-8000-000000000000` }
      : action?.action === 'setStar' ? { ok: true, star: action.star, rewardCoins: 0, newRecord: false }
      : progress;
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
  });
  page.on('dialog', (dialog: any) => dialog.accept());
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  if (selectLevels) {
    await page.getByRole('button', { name: '开始游戏', exact: true }).click();
    await page.getByRole('button', { name: /疾风凌云/ }).click();
    await page.locator('.level-select-page').waitFor();
  }
  return { context, page, errors, actions };
}

function levelCard(page: any, name: string) {
  return page.locator('.phigros-level-card').filter({ has: page.locator('.phigros-level-number', { hasText: name }) }).first();
}

test('the intro waits for a server-issued run; a failed start returns to selection', options, async () => {
  const { context,page,errors }=await openApp(1024,768,false,true);
  let release: () => void=()=>{};
  const gate=new Promise<void>(resolve=>{release=resolve;});
  let fail=true;
  await page.route('**/api/progress',async(route:any)=>{
    const request=route.request();
    if(request.method()!=='POST' || request.postDataJSON().action!=='startCampaignRun') return route.fallback();
    await gate;
    return route.fulfill({status:fail ? 503 : 200,contentType:'application/json',body:JSON.stringify(fail
      ? {error:'start temporarily unavailable'} : {ok:true,runId:'campaign_00000000-0000-4000-8000-000000000000'})});
  });
  try {
    await levelCard(page,'2-7').getByRole('button',{name:'START EZ',exact:true}).click();
    await page.locator('.level-start-transition[data-phase="loading"]').waitFor();
    await page.waitForTimeout(2000);
    assert.equal(await page.locator('.game-map-svg').count(),0);
    assert.equal(await page.locator('.level-start-transition').getAttribute('data-phase'),'loading');
    release();
    await page.locator('.level-start-transition').waitFor({state:'detached'});
    assert.equal(await page.locator('.level-select-page').isVisible(),true);
    fail=false;
    await levelCard(page,'2-7').getByRole('button',{name:'START EZ',exact:true}).click();
    await waitForPlay(page);
    assert.deepEqual(errors,[]);
  } finally {release();await context.close();}
});

async function waitForPlay(page: any) {
  await page.locator('.level-start-transition').waitFor({ state: 'detached' });
  await page.locator('.game-map-svg').waitFor();
}

test('2-7 EZ HD IN enter the result screen before a delayed settlement responds', options, async () => {
  for (const difficulty of ['EZ', 'HD', 'IN']) {
    const { context, page, errors } = await openApp(1024, 768, false, true);
    let release: () => void = () => {};
    const gate = new Promise<void>(resolve => { release = resolve; });
    const calls: any[] = [];
    await page.route('**/api/progress', async (route: any) => {
      const request = route.request();
      if (request.method() !== 'POST' || request.postDataJSON().action !== 'setStar') return route.fallback();
      calls.push(request.postDataJSON());
      await gate;
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, star: calls[0].star, rewardCoins: 700, newRecord: true, chestTypes: ['common'] }) });
    });
    try {
      const card = levelCard(page, '2-7');
      await card.locator(`.diff-${difficulty.toLowerCase()}`).click();
      await card.getByRole('button', { name: `START ${difficulty}`, exact: true }).click();
      await waitForPlay(page);
      await page.evaluate(() => {
        const store = (window as any).__introAppStore;
        store.setState({ waveIndex: store.getState().waves.length, wavesCleared: store.getState().waves.length, isWaveActive: false, enemies: [], running: false });
      });
      await page.getByText('关卡完成', { exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: '结算中...', exact: true }).isDisabled(), true);
      assert.equal(await page.getByRole('button', { name: '下一关', exact: true }).isDisabled(), true);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].levelId, 'L15');
      assert.equal(calls[0].difficulty, difficulty);
      assert.ok(calls[0].runId.startsWith('campaign_'));
      release();
      await page.getByText('+700', { exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: '下一关', exact: true }).isEnabled(), true);
      assert.deepEqual(errors, []);
    } finally { release(); await context.close(); }
  }
});

test('campaign failure retries the issued run and retains both full-health challenges', options, async () => {
  const { context, page, errors, actions } = await openApp(1024, 768, false, true);
  const calls: any[] = [];
  await page.route('**/api/progress', async (route: any) => {
    const request = route.request();
    if (request.method() !== 'POST' || request.postDataJSON().action !== 'setStar') return route.fallback();
    calls.push(request.postDataJSON());
    await route.fulfill({ status: calls.length === 1 ? 503 : 200, contentType: 'application/json', body: JSON.stringify(calls.length === 1
      ? { error: 'temporary settlement failure' }
      : { ok: true, star: 3, rewardCoins: 777, diamondReward: 1, newRecord: true, fullHealthClear: true }) });
  });
  try {
    const card = levelCard(page, '2-7');
    await card.locator('.diff-in').click();
    await card.getByRole('button', { name: '挑战', exact: true }).click();
    for (const name of ['完美防守', '半血开局']) await page.getByRole('button', { name: new RegExp(name) }).click();
    await page.getByRole('button', { name: '确定', exact: true }).click();
    await card.getByRole('button', { name: 'START IN', exact: true }).click();
    await waitForPlay(page);
    await page.evaluate(() => {
      const store = (window as any).__introAppStore;
      store.setState({ waveIndex: store.getState().waves.length, wavesCleared: store.getState().waves.length, isWaveActive: false, enemies: [], running: false });
    });
    await page.getByText(/结算失败：temporary settlement failure/).waitFor();
    assert.equal(await page.getByRole('button', { name: '下一关', exact: true }).isDisabled(), true);
    await page.getByRole('button', { name: '重试结算', exact: true }).click();
    await page.getByText('+777', { exact: true }).waitFor();
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0], calls[1]);
    assert.deepEqual(actions.find(action=>action.action==='startCampaignRun').challenges,['fullHealth','halfHealth']);
    assert.equal(calls[0].endLives,Math.ceil(getLevelSpecForDifficulty(LEVELS[14],'IN').lives/2));
    assert.equal(calls[0].challengeDiamonds,undefined);
    assert.equal(await page.getByRole('button', { name: '下一关', exact: true }).isEnabled(), true);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('endless settlement failure offers a retry and preserves the finished run and waves', options, async () => {
  const { context, page, errors } = await openApp(1024, 768, false, true, undefined, {}, false);
  const claims: any[] = [];
  const runId = 'endless_00000000-0000-4000-8000-000000000000';
  await page.route('**/api/progress', async (route: any) => {
    const request = route.request();
    if (request.method() !== 'POST') return route.fallback();
    const body = request.postDataJSON();
    if (body.action === 'startEndlessRun') return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, runId }) });
    if (body.action !== 'claimEndlessReward') return route.fallback();
    claims.push(body);
    await route.fulfill({ status: claims.length === 1 ? 503 : 200, contentType: 'application/json', body: JSON.stringify(claims.length === 1
      ? { error: 'temporary endless failure' }
      : { ok: true, wavesCleared: 20, rewardCoins: 1000, chestTypes: ['common'] }) });
  });
  try {
    await page.getByRole('button', { name: '趣味模式', exact: true }).click();
    await page.getByRole('button', { name: '选择卡组', exact: true }).click();
    await page.getByRole('button', { name: '开始', exact: true }).click();
    await page.locator('.game-map-svg').waitFor();
    await page.evaluate(() => (window as any).__introAppStore.setState({ lives: 0, wavesCleared: 20, running: false }));
    await page.getByText(/结算失败：temporary endless failure/).waitFor();
    assert.ok(await page.evaluate(() => localStorage.getItem('td_endless_pending:intro-test-player')));
    await page.getByRole('button', { name: '重试结算', exact: true }).click();
    await page.getByText('+1000', { exact: true }).waitFor();
    assert.equal(claims.length, 2);
    assert.deepEqual(claims[0], claims[1]);
    assert.equal(claims[0].runId, runId);
    assert.equal(claims[0].wavesCleared, 20);
    assert.equal(await page.evaluate(() => localStorage.getItem('td_endless_pending:intro-test-player')), null);
    assert.equal(await page.getByRole('button', { name: '返回主界面', exact: true }).isEnabled(), true);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('AT17 conveyor derives missing plant/element levels from rating and keeps unlocked account levels', options, async () => {
  const { context, page, errors } = await openApp(1440, 900, false, true, undefined, {
    unlockedItems: ['sunflower', 'bottleGrass', 'element:wind', 'element:fire'],
    towerLevels: { sunflower: 3, bottleGrass: 27, sniper: 99, 'element:ice': 44, 'element:wind': 11, 'element:fire': 1 },
  });
  try {
    const card = levelCard(page, '2-8');
    await card.locator('.diff-at').click();
    await card.getByRole('button', { name: 'START AT', exact: true }).click();
    await waitForPlay(page);
    const levels = await page.evaluate(() => (window as any).__introAppStore.getState().towerLevelMap);
    assert.equal(levels.sniper, 8);
    assert.equal(levels.rocket, 8);
    assert.equal(levels.sunflower, 3);
    assert.equal(levels.bottleGrass, 27);
    assert.equal(levels['element:ice'], 8);
    assert.equal(levels['element:gold'], 8);
    assert.equal(levels['element:wind'], 11);
    assert.equal(levels['element:fire'], 1);
    assert.equal(levels.pumpkinHead, undefined);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('local guest can play configured difficulties without any API or account writes', options, async () => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await context.newPage();
  page.setDefaultTimeout(16000);
  const apiRequests: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', (error: Error) => errors.push(error.message));
  await page.route('**/api/**', async (route: any) => { apiRequests.push(route.request().url()); await route.abort(); });
  await page.route('**/src/App.tsx*', async (route: any) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nwindow.__introAppStore = useTDStore;` });
  });
  page.on('dialog', (dialog: any) => dialog.accept());
  try {
    await page.goto(baseUrl);
    const originalStorage = await page.evaluate(() => JSON.stringify({ ...localStorage }));
    await page.getByRole('button', { name: '本地试玩关卡', exact: true }).click();
    await page.getByRole('button', { name: /疾风凌云/ }).click();
    const card = levelCard(page, '2-7');
    for (const diff of ['ez', 'hd', 'in', 'at']) assert.equal(await card.locator(`.diff-${diff}`).isEnabled(), true);
    const missing = await page.locator('.phigros-level-card').evaluateAll((cards: HTMLElement[]) =>
      cards.filter(card => card.textContent?.includes('NO DRAFT')).every(card => (card.querySelector('.phigros-play-button') as HTMLButtonElement).disabled));
    assert.equal(missing, true);
    await card.locator('.diff-at').click();
    await card.getByRole('button', { name: 'START AT', exact: true }).click();
    await waitForPlay(page);
    const game = await page.evaluate(() => {
      const state = (window as any).__introAppStore.getState();
      return { plants: state.availablePlants, elements: state.availableElements, levels: state.towerLevelMap, mode: state.mode };
    });
    assert.deepEqual(new Set(game.plants), new Set(PLANT_TYPES));
    assert.deepEqual(new Set(game.elements), new Set(ELEMENT_TYPES));
    assert.equal(game.levels.bottleGrass, 10);
    assert.equal(game.levels['element:fire'], 10);
    assert.equal(game.mode, 'at');
    await page.evaluate(() => {
      const store = (window as any).__introAppStore;
      store.setState({ waveIndex: store.getState().waves.length, wavesCleared: store.getState().waves.length, isWaveActive: false, enemies: [], running: false });
    });
    await page.getByText('本地试玩完成，不保存进度或发放奖励。', { exact: true }).waitFor();
    await page.getByRole('button', { name: '返回关卡', exact: true }).click();
    await page.getByRole('button', { name: '退出试玩', exact: true }).click();
    await page.getByRole('button', { name: '本地试玩关卡', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => JSON.stringify({ ...localStorage })), originalStorage);
    assert.deepEqual(apiRequests, []);
    assert.deepEqual(errors, []);
    await page.reload();
    await page.getByRole('button', { name: '本地试玩关卡', exact: true }).waitFor();
    assert.equal(await page.locator('.chapter-select-page').count(), 0);
  } finally { await context.close(); }
});

test('production build never exposes the local playtest entry', options, async () => {
  const root = resolve('dist');
  const mime: Record<string, string> = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
      const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (!file.startsWith(`${root}${sep}`)) { response.writeHead(403); response.end(); return; }
      response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
      response.end(await readFile(file));
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  try {
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.getByRole('heading', { name: '登录 / 注册', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: '本地试玩关卡', exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: '游客进入平衡实验室', exact: true }).count(), 0);
  } finally {
    await context.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
});

test('campaign Start wipes from left, previews the chosen AT draft and starts no clocks before the game fade ends', options, async () => {
  const { context, page, errors, actions } = await openApp();
  try {
    assert.match(await page.locator('body').evaluate((element: HTMLElement) => getComputedStyle(element).fontFamily), /Tower Defence/);
    const card = levelCard(page, '2-7');
    await card.locator('.diff-at').click();
    await card.getByRole('button', { name: 'START AT', exact: true }).click();
    await page.locator('.level-start-transition[data-phase="covering"]').waitFor();
    assert.equal(await page.locator('.level-start-modal').count(), 0);
    assert.equal(await page.locator('.game-shell').count(), 0);
    assert.equal(await page.locator('.stage-container[inert]').count(), 1);
    const clips: string[] = [];
    for (const time of [80, 220]) {
      clips.push(await page.locator('.level-intro').evaluate((element: HTMLElement, time: number) => {
        const animation = element.getAnimations()[0];
        animation.pause();
        animation.currentTime = time;
        return getComputedStyle(element).clipPath;
      }, time));
      await page.screenshot({ path: `${screenshots}/cover-${time}.png` });
    }
    assert.notEqual(clips[0], clips[1]);
    await page.locator('.level-intro').evaluate((element: HTMLElement) => element.getAnimations()[0].play());
    await page.locator('.level-start-transition[data-phase="loading"]').waitFor();
    assert.equal(await page.locator('.intro-title-copy h1').textContent(), '2-7');
    assert.equal(await page.locator('.intro-chart p').textContent(), 'hebscyf');
    const expected = getIntroMonsters(getLevelSpecForDifficulty(LEVELS[14], 'AT').waves);
    assert.deepEqual(await page.locator('.intro-monster').evaluateAll((elements: HTMLElement[]) => elements.map(element => element.dataset.monster)), expected);
    const game = await page.evaluate(() => {
      const state = (window as any).__introAppStore.getState();
      return { running: state.running, gameTime: state.gameTime, enemies: state.enemies.length, mode: state.mode, level: state.towerLevelMap.bottleGrass };
    });
    assert.deepEqual(game, { running: false, gameTime: 0, enemies: 0, mode: 'at', level: 17 });
    await page.locator('.level-start-transition[data-phase="revealing"]').waitFor();
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => (window as any).__introAppStore.getState().gameTime), 0);
    assert.equal(await page.locator('.level-game-reveal').count(), 1);
    await page.screenshot({ path: `${screenshots}/game-fade.png` });
    await waitForPlay(page);
    await page.waitForTimeout(150);
    assert.ok(await page.evaluate(() => (window as any).__introAppStore.getState().gameTime) > 0);
    assert.equal(await page.locator('.difficulty-stat').textContent(), 'AT Lv.18');
    assert.equal(actions.filter(action => action.action === 'setStar').length, 0);
    await page.screenshot({ path: `${screenshots}/playing-desktop.png` });
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('multiple campaign challenges survive the intro, and retries and next level each replay it exactly once', options, async () => {
  const { context, page, errors, actions } = await openApp(1024, 768);
  try {
    const card = levelCard(page, '2-1');
    await card.locator('.diff-ez').click();
    await card.getByRole('button', { name: '挑战', exact: true }).click();
    for (const name of ['完美防守', '半血开局', '元素之殇', '暮色森林']) await page.getByRole('button', { name: new RegExp(name) }).click();
    await page.getByRole('button', { name: '确定', exact: true }).click();
    await card.getByRole('button', { name: 'START EZ', exact: true }).click();
    await waitForPlay(page);
    const config = await page.evaluate(() => {
      const state = (window as any).__introAppStore.getState();
      return { lives: state.lives, maxLives: state.maxLives, elements: state.availableElements, nextSkySunAt: state.nextSkySunAt };
    });
    const spec = getLevelSpecForDifficulty(LEVELS[8], 'EZ');
    assert.deepEqual(config, { lives: Math.max(1, Math.ceil(spec.lives / 2)), maxLives: spec.lives, elements: [], nextSkySunAt: null });
    await page.evaluate(() => (window as any).__introAppStore.setState({ lives: 0, running: false }));
    await page.getByRole('button', { name: '重玩', exact: true }).click();
    await page.locator('.level-start-transition[data-phase="covering"]').waitFor();
    await waitForPlay(page);
    await page.evaluate(() => {
      const store = (window as any).__introAppStore;
      store.setState({ waveIndex: store.getState().waves.length, isWaveActive: false, enemies: [], running: false });
    });
    await page.getByRole('button', { name: '下一关', exact: true }).waitFor();
    const rewards = actions.filter(action => action.action === 'setStar');
    assert.equal(rewards.length, 1);
    assert.equal(rewards[0].challengeDiamonds, undefined);
    const starts=actions.filter(action=>action.action==='startCampaignRun');
    assert.equal(starts.length,2);
    assert.deepEqual(starts[1].challenges,['fullHealth','halfHealth','elementless','twilightForest']);
    await page.getByRole('button', { name: '下一关', exact: true }).click();
    await page.locator('.level-start-transition[data-phase="covering"]').waitFor();
    assert.equal(await page.locator('.intro-title-copy p').textContent(), '2-2');
    await waitForPlay(page);
    assert.equal(actions.filter(action => action.action === 'setStar').length, 1);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('phone rotation during the intro never starts gameplay in portrait, including reduced motion', options, async () => {
  const { context, page, errors } = await openApp(844, 390, true, true);
  try {
    const card = levelCard(page, '2-2');
    await card.locator('.diff-at').click();
    await card.getByRole('button', { name: 'START AT', exact: true }).click();
    await page.locator('.level-start-transition[data-phase="loading"]').waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForPlay(page);
    await page.getByRole('dialog', { name: '请横屏游玩' }).waitFor();
    assert.equal(await page.evaluate(() => (window as any).__introAppStore.getState().running), false);
    assert.equal(await page.evaluate(() => (window as any).__introAppStore.getState().gameTime), 0);
    assert.equal(await page.evaluate(() => (window as any).__introAppStore.getState().conveyorQueue.length), 0);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(400);
    assert.ok(await page.evaluate(() => (window as any).__introAppStore.getState().gameTime) > 0);
    assert.ok(await page.evaluate(() => (window as any).__introAppStore.getState().conveyorQueue.length) > 0);
    await page.screenshot({ path: `${screenshots}/playing-phone.png` });
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('browser back cancels an in-flight intro without delayed starts or rewards', options, async () => {
  const { context, page, errors, actions } = await openApp();
  try {
    const card = levelCard(page, '2-7');
    await card.getByRole('button', { name: 'START EZ', exact: true }).click();
    await page.locator('.level-start-transition[data-phase="loading"]').waitFor();
    await page.evaluate(() => window.dispatchEvent(new PopStateEvent('popstate')));
    await page.locator('.level-start-transition').waitFor({ state: 'detached' });
    await page.waitForTimeout(4200);
    assert.equal(await page.locator('.game-shell').count(), 0);
    assert.equal(await page.locator('.level-select-page').count(), 1);
    assert.equal(actions.filter(action => action.action === 'setStar').length, 0);
    // Cancellation also releases the guard for a subsequent Start.
    await levelCard(page, '2-7').getByRole('button', { name: 'START EZ', exact: true }).click();
    await waitForPlay(page);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('a stalled font and missing animation events still finish exactly one campaign start', options, async () => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const { context, page, errors, actions } = await openApp(1440, 900, false, false, gate);
  try {
    await page.addStyleTag({ content: '.level-intro, .intro-composition { animation: none !important; }' });
    await levelCard(page, '2-7').getByRole('button', { name: 'START EZ', exact: true }).click();
    await page.locator('.level-start-transition[data-phase="loading"]').waitFor();
    await page.waitForTimeout(3500);
    assert.equal(await page.evaluate(() => (window as any).__introAppStore.getState().gameTime), 0);
    await waitForPlay(page);
    assert.equal(await page.locator('.game-shell').count(), 1);
    assert.equal(actions.filter(action => action.action === 'setStar').length, 0);
    await page.waitForTimeout(100);
    assert.ok(await page.evaluate(() => (window as any).__introAppStore.getState().gameTime) > 0);
    assert.deepEqual(errors, []);
  } finally { release(); await context.close(); }
});
