import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createServer, type ViteDevServer } from 'vite';
import type * as GardenApi from '../src/garden/gardenApi';

let server: ViteDevServer;
let api: typeof GardenApi;
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const entries = new Map<string, string>();
const storage = { getItem: (key: string) => entries.get(key) ?? null,
  setItem: (key: string, value: string) => entries.set(key, value), removeItem: (key: string) => entries.delete(key) };

before(async () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: storage } });
  server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom',
    cacheDir: 'node_modules/.vite-garden-tests', optimizeDeps: { noDiscovery: true, include: [] } });
  api = await server.ssrLoadModule('/src/garden/gardenApi.ts') as typeof GardenApi;
});
beforeEach(() => entries.clear());
after(async () => {
  await server?.close();
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else Reflect.deleteProperty(globalThis, 'localStorage');
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

test('bulk planting fills empty unlocked land with only the selected plant seeds', async () => {
  const result = await api.plantAllGardenSeeds('plant');
  assert.equal(result.plots.length, 8);
  assert.equal(result.plantSeeds, 4);
  assert.equal(result.chestSeeds, 8);
  assert.ok(result.plots.every(plot => plot.seedType === 'plant' && plot.targetItem));
  assert.deepEqual(result.plantingSummary, { seedType: 'plant', plantedCount: 8 });
  assert.equal((await api.fetchGarden()).plantingSummary, undefined);
});

test('few seeds fill the earliest empty plots without replacing growing or mature crops', async () => {
  const garden = await api.fetchGarden();
  const originalPlots: GardenApi.GardenPlot[] = [{ index: 0, seedType: 'chest', targetItem: null,
    plantedAt: new Date(0).toISOString(), readyAt: new Date(0).toISOString() }, {
    index: 3, seedType: 'plant', targetItem: 'bottleGrass', plantedAt: new Date().toISOString(),
    readyAt: new Date(Date.now() + 100000).toISOString(),
  }];
  entries.set('td-garden-dev-preview-v1', JSON.stringify({ ...garden, plantSeeds: 2, plots: originalPlots }));
  const result = await api.plantAllGardenSeeds('plant');
  assert.equal(result.plantSeeds, 0);
  assert.deepEqual(result.plots.slice(0, 2), originalPlots);
  assert.deepEqual(result.plots.slice(2).map(plot => plot.index), [1, 2]);
});

test('chest seed batches respect unlocked plot count and leave plant seeds alone', async () => {
  const garden = await api.fetchGarden();
  entries.set('td-garden-dev-preview-v1', JSON.stringify({ ...garden, unlockedPlots: 3 }));
  const result = await api.plantAllGardenSeeds('chest');
  assert.equal(result.plots.length, 3);
  assert.equal(result.chestSeeds, 5);
  assert.equal(result.plantSeeds, 12);
  assert.ok(result.plots.every(plot => plot.seedType === 'chest' && plot.targetItem === null && plot.index < 3));
});

test('full land or an empty seed inventory cannot deduct more seeds', async () => {
  await api.plantAllGardenSeeds('plant');
  await assert.rejects(api.plantAllGardenSeeds('chest'), /NO_EMPTY_PLOTS/);
  assert.equal((await api.fetchGarden()).chestSeeds, 8);
  entries.clear();
  const garden = await api.fetchGarden();
  entries.set('td-garden-dev-preview-v1', JSON.stringify({ ...garden, chestSeeds: 0 }));
  await assert.rejects(api.plantAllGardenSeeds('chest'), /种子不足/);
  assert.equal((await api.fetchGarden()).plots.length, 0);
});

test('single planting still works and bulk maturity uses the current efficiency', async () => {
  await api.plantGardenSeed(4, 'plant');
  const garden = await api.fetchGarden();
  entries.set('td-garden-dev-preview-v1', JSON.stringify({ ...garden, efficiencyLevel: 5, efficiencyReductionPct: 4 }));
  const result = await api.plantAllGardenSeeds('chest');
  assert.equal(result.plots.find(plot => plot.index === 4)?.seedType, 'plant');
  assert.equal(result.chestSeeds, 1);
  const chestPlots = result.plots.filter(plot => plot.seedType === 'chest');
  assert.equal(new Set(chestPlots.map(plot => plot.readyAt)).size, 1);
  const duration = new Date(chestPlots[0].readyAt).getTime() - new Date(chestPlots[0].plantedAt).getTime();
  assert.equal(duration, 38400);
});
