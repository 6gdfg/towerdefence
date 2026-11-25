import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { clearCloudProgressCache, getAtClearSync, getMaxStarSync, hydrateCloudProgressCache, setStarCleared } from '../src/td/progress';
import LevelSelectPage from '../src/td/LevelSelectPage';
import { hasLevelDifficultyDraft, LEVELS } from '../src/td/levels';
import { getChapterForLevelIndex } from '../src/td/chapters';
import { isAtDifficultyUnlocked } from '../src/td/levelUnlockLogic';
import type { CloudProgress } from '../src/td/appTypes';

let token = 'test-player';
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
beforeEach(() => {
  token = 'test-player';
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => token } });
  clearCloudProgressCache();
});
afterEach(() => {
  clearCloudProgressCache();
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else Reflect.deleteProperty(globalThis, 'localStorage');
});

function payload(extra: Partial<CloudProgress> = {}): CloudProgress {
  return { coins: 0, magicKeys: 0, diamonds: 0, shards: {}, plantShards: {}, elementShards: {},
    towerLevels: {}, chests: [], unlockedItems: [], ...extra };
}

test('existing AT clear flags hydrate separately from core stars and never leak to another account', () => {
  hydrateCloudProgressCache(payload({ stars: { L1: 3 }, atClears: { L1: true } }));
  assert.equal(getAtClearSync('L1'), true);
  assert.equal(getAtClearSync('L2'), false);
  assert.equal(getMaxStarSync('L1'), 3);
  token = 'another-player';
  assert.equal(getAtClearSync('L1'), false);
});

test('IN full-health clears unlock AT but do not mark it cleared', () => {
  hydrateCloudProgressCache(payload({ stars: { L1: 3 }, fullHealthClears: { L1: true } }));
  assert.equal(getAtClearSync('L1'), false);
});

test('a successful AT completion updates the in-memory clear flag immediately', async context => {
  hydrateCloudProgressCache(payload({ stars: { L1: 3 } }));
  context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    ok: true, star: 3, rewardCoins: 10, atCleared: true,
  }), { headers: { 'Content-Type': 'application/json' } }));
  await setStarCleared('L1', 3, { difficulty: 'AT', runId: 'campaign_test', endLives: 20, wavesCleared: 1 });
  assert.equal(getAtClearSync('L1'), true);
});

test('failed campaign saves report server errors without claiming local progress', async context => {
  hydrateCloudProgressCache(payload());
  context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: 'temporary settlement failure' }), {
    status: 503, headers: { 'Content-Type': 'application/json' },
  }));
  await assert.rejects(setStarCleared('L15', 3, { difficulty: 'IN', runId: 'campaign_test', endLives: 20, wavesCleared: 1 }), /temporary settlement failure/);
  assert.equal(getMaxStarSync('L15'), 0);
  assert.equal(getAtClearSync('L15'), false);
});

test('campaign save timeouts abort the request and leave progress available for retry', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  hydrateCloudProgressCache(payload());
  let signal: AbortSignal | undefined;
  context.mock.method(globalThis, 'fetch', (_url: unknown, init: RequestInit) => {
    signal = init.signal as AbortSignal;
    return new Promise((_resolve, reject) => signal!.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
  });
  const failed = assert.rejects(setStarCleared('L15', 3, { difficulty: 'IN', runId: 'campaign_test', endLives: 20, wavesCleared: 1 }), /请求超时/);
  context.mock.timers.tick(20_000);
  await failed;
  assert.equal(signal?.aborted, true);
  assert.equal(getMaxStarSync('L15'), 0);
});

test('a delayed clear response cannot overwrite a newly signed-in account cache', async context => {
  hydrateCloudProgressCache(payload());
  let finish: (response: Response) => void = () => {};
  context.mock.method(globalThis, 'fetch', () => new Promise<Response>(resolve => { finish = resolve; }));
  const pending = setStarCleared('L15', 3, { difficulty: 'AT', runId: 'campaign_test', endLives: 20, wavesCleared: 1 });
  token = 'another-player';
  hydrateCloudProgressCache(payload({ stars: { L15: 1 } }));
  finish(new Response(JSON.stringify({ ok: true, star: 3, rewardCoins: 100, atCleared: true }), {
    headers: { 'Content-Type': 'application/json' },
  }));
  await pending;
  assert.equal(getMaxStarSync('L15'), 1);
  assert.equal(getAtClearSync('L15'), false);
});

test('the AT tile and level summary show CLEAR for a saved AT clear', () => {
  const index = LEVELS.findIndex(level => hasLevelDifficultyDraft(level, 'AT'));
  assert.ok(index >= 0);
  const level = LEVELS[index];
  hydrateCloudProgressCache(payload({ stars: { [level.id]: 3 }, fullHealthClears: { [level.id]: true }, atClears: { [level.id]: true } }));
  const markup = renderToStaticMarkup(createElement(LevelSelectPage, {
    unlocked: LEVELS.length, magicKeys: 0, starSel: { [index]: 'AT' }, challengeSel: {},
    unlockedItemsSet: new Set<string>(), chapterId: getChapterForLevelIndex(index).id,
    onBack() {}, onSelectDifficulty() {}, onOpenChallengeConfig() {}, onStartLevel() {}, onUnlockLevel() {},
  }));
  assert.match(markup, /phigros-diff-tile diff-at[^"<]*is-cleared/);
  assert.match(markup, /AT CLEAR/);
});

test('prior 2-7 IN full-health records unlock the new AT, show its contributor and advertise four-leaf clover', () => {
  const index = LEVELS.findIndex(level => level.id === 'L15');
  hydrateCloudProgressCache(payload({ stars: { L15: 3 } }));
  assert.equal(isAtDifficultyUnlocked(LEVELS, index), false);
  hydrateCloudProgressCache(payload({ stars: { L15: 3 }, fullHealthClears: { L15: true } }));
  assert.equal(isAtDifficultyUnlocked(LEVELS, index), true);
  const markup = renderToStaticMarkup(createElement(LevelSelectPage, {
    unlocked: LEVELS.length, magicKeys: 0, starSel: { [index]: 'AT' }, challengeSel: {},
    unlockedItemsSet: new Set<string>(), chapterId: 2,
    onBack() {}, onSelectDifficulty() {}, onOpenChallengeConfig() {}, onStartLevel() {}, onUnlockLevel() {},
  }));
  assert.ok(markup.includes('Provided by hebscyf'));
  assert.ok(markup.includes('通关AT可获得四叶草'));
});
