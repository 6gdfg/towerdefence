import assert from 'node:assert/strict';
import test from 'node:test';
import { getEndlessModeReward } from '../shared/rewards';
import { useTDStore } from '../src/td/store';
import type { WaveDef } from '../src/td/types';
import {
  createEndlessModeWave,
  ENDLESS_MODE_ENEMIES_PER_WAVE,
  ENDLESS_MODE_SPAWN_INTERVAL,
  getEndlessModeEnemyPool,
  getEndlessModeMonsterLevel,
  ENDLESS_MODE_FIRST_WAVE_DELAY,
  ENDLESS_MODE_SPECIAL_ENEMY_CHANCE,
  getEndlessModeMinimumDurationSeconds,
} from '../src/td/funModes';

test('endless monster levels rise once every two waves', () => {
  assert.equal(getEndlessModeMonsterLevel(1), 1);
  assert.equal(getEndlessModeMonsterLevel(2), 1);
  assert.equal(getEndlessModeMonsterLevel(3), 2);
  assert.equal(getEndlessModeMonsterLevel(4), 2);
  assert.equal(getEndlessModeMonsterLevel(5), 3);
  assert.equal(getEndlessModeMonsterLevel(100), 50);
});

test('endless enemy pool unlocks milestone monsters', () => {
  assert.equal(getEndlessModeEnemyPool(19).includes('bunker'), false);
  assert.equal(getEndlessModeEnemyPool(20).includes('bunker'), true);
  assert.equal(getEndlessModeEnemyPool(40).includes('balloonSoldier'), true);
  assert.equal(getEndlessModeEnemyPool(60).includes('windEye'), true);
  assert.equal(getEndlessModeEnemyPool(80).includes('freezer'), true);
});

test('every endless wave contains exactly 50 enemies at 0.4 second intervals', () => {
  const wave = createEndlessModeWave(81, () => 0.25);
  assert.equal(wave.groups.reduce((sum, group) => sum + group.count, 0), ENDLESS_MODE_ENEMIES_PER_WAVE);
  assert.ok(wave.groups.every(group => group.interval === ENDLESS_MODE_SPAWN_INTERVAL));
  assert.ok(wave.groups.every(group => group.level === 41));
  assert.ok(wave.groups.every(group => !group.isBoss));
});

test('every third wave after wave 100 includes one tank', () => {
  assert.equal(createEndlessModeWave(101, () => 0).groups.some(group => group.type === 'tank'), false);
  assert.equal(createEndlessModeWave(102, () => 0).groups.some(group => group.type === 'tank'), false);
  const wave103 = createEndlessModeWave(103, () => 0);
  assert.equal(wave103.groups.find(group => group.type === 'tank')?.count, 1);
  assert.equal(wave103.groups.find(group => group.type === 'tank')?.isBoss, true);
  assert.equal(wave103.groups.reduce((sum, group) => sum + group.count, 0), ENDLESS_MODE_ENEMIES_PER_WAVE);
});

test('endless rewards convert every eight common units into one legendary chest', () => {
  assert.deepEqual(getEndlessModeReward(192), {
    wavesCleared: 192,
    coins: 9600,
    chestTypes: ['legendary', 'common'],
  });
  assert.deepEqual(getEndlessModeReward(220).chestTypes, ['legendary', 'rare', 'common']);
});

test('endless rewards grant fifty coins per cleared wave', () => {
  for (const waves of [0, 1, 19, 20, 192, 220]) {
    assert.equal(getEndlessModeReward(waves).coins, waves * 50);
  }
});

function circleWave(): WaveDef {
  return { groups: Array.from({ length: 5 }, (_, index) => ({
    type: 'circle', count: 10, interval: 0.4, level: 1, startDelay: index * 4,
  })) };
}

function resetEndless(wave = circleWave()) {
  useTDStore.getState().loadLevel({ startGold: 500, lives: 15, waves: [wave] }, {
    path: [[{ x: 0, y: 3 }, { x: 20, y: 3 }], [{ x: 0, y: 7 }, { x: 20, y: 7 }]],
    size: { w: 22, h: 12 }, roadWidthCells: 1, plantGrid: [{ x: 5, y: 5 }],
  }, {
    mode: 'endless', autoStartFirstWave: true, firstWaveDelaySec: ENDLESS_MODE_FIRST_WAVE_DELAY,
    endlessWaveFactory: circleWave, allowedPlants: ['bottleGrass'], allowedElements: ['fire'],
    towerLevels: { bottleGrass: 10, 'element:fire': 5 },
    specialEnemyConfig: { enabled: true, type: 'charityAmbassador', chance: ENDLESS_MODE_SPECIAL_ENEMY_CHANCE },
    labOverrides: { monsters: { circle: { speed: 0 }, summoner: { speed: 0 } } },
  });
}

function advance(seconds: number) {
  for (let i = 0; i < Math.round(seconds / 0.05); i++) useTDStore.getState().update(0.05);
}

test('endless waits ten seconds, preserves card limits and account levels, and cannot skip preparation', () => {
  resetEndless();
  useTDStore.getState().startWave();
  advance(9.9);
  assert.equal(useTDStore.getState().enemies.length, 0);
  advance(0.15);
  const state = useTDStore.getState();
  assert.equal(state.enemies.length, 1);
  assert.equal(state.gold, 500);
  assert.equal(state.lives, 15);
  assert.equal(state.maxLives, 15);
  assert.deepEqual(state.availablePlants, ['bottleGrass']);
  assert.deepEqual(state.availableElements, ['fire']);
  state.placeTower('bottleGrass', { x: 5, y: 5 });
  assert.equal(useTDStore.getState().towers[0].level, 10);
  assert.equal(state.specialEnemyConfig?.chance, 0.02);
});

test('spawn intervals stay 0.4s across group boundaries and new waves start while old enemies remain', () => {
  resetEndless();
  const seen = new Set<string>();
  const times: number[] = [];
  for (let tick = 0; tick < 610; tick++) {
    useTDStore.getState().update(0.05);
    const state = useTDStore.getState();
    for (const enemy of state.enemies) {
      if (!seen.has(enemy.id)) { seen.add(enemy.id); times.push(state.gameTime); }
    }
  }
  assert.equal(times.length, 50);
  for (let i = 1; i < times.length; i++) assert.ok(Math.abs(times[i] - times[i - 1] - 0.4) < 0.051);
  const state = useTDStore.getState();
  assert.equal(state.waveIndex, 1);
  assert.equal(state.wavesCleared, 0);
  assert.equal(state.waves.length, 1);
  assert.deepEqual(state.endlessPendingClearWaves, [1]);
  assert.equal(state.enemies.filter(enemy => enemy.pathId === 0).length, 25);
  assert.equal(state.enemies.filter(enemy => enemy.pathId === 1).length, 25);
  assert.ok(Math.abs((state.nextWaveStartTime ?? 0) - times.at(-1)! - 2) < 0.051);
  advance(1.25);
  assert.equal(useTDStore.getState().enemies.length, 51);
  assert.equal(useTDStore.getState().enemies.at(-1)?.endlessWaveNumber, 2);
});

test('clear counts are independent of the spawning wave and ignore bullets', () => {
  resetEndless();
  advance(32);
  useTDStore.setState({
    enemies: useTDStore.getState().enemies.map(enemy => enemy.endlessWaveNumber === 1 ? { ...enemy, hp: 0 } : enemy),
    projectiles: [{ id: 'bounce', from: 'bottleGrass', pos: { x: 0, y: 0 }, damage: 0,
      speed: 0, direction: { x: 1, y: 0 }, unguided: true, maxBounces: 5 }],
  });
  advance(0.05);
  assert.equal(useTDStore.getState().wavesCleared, 1);
  assert.ok(useTDStore.getState().projectiles.length > 0);
  assert.ok(useTDStore.getState().enemies.some(enemy => enemy.endlessWaveNumber === 2));
  advance(0.2);
  assert.equal(useTDStore.getState().wavesCleared, 1);
});

test('a fatal leak never counts its wave as cleared', () => {
  resetEndless();
  advance(30);
  const one = useTDStore.getState().enemies[0];
  useTDStore.setState({ lives: 1, enemies: [{ ...one, pos: { x: 20, y: 3 }, pathId: 0,
    pathIndex: 0, t: 1, specialType: undefined }] });
  advance(0.05);
  assert.equal(useTDStore.getState().lives, 0);
  assert.equal(useTDStore.getState().wavesCleared, 0);
  assert.equal(useTDStore.getState().running, false);
  assert.equal(useTDStore.getState().nextWaveStartTime, null);
});

test('summons inherit their wave and prevent early clear counting', () => {
  resetEndless({ groups: [{ type: 'summoner', count: 1, interval: 0.4, level: 1, startDelay: 0 }] });
  advance(15.2);
  const children = useTDStore.getState().enemies.filter(enemy => enemy.shape === 'circle' && enemy.endlessWaveNumber === 1);
  assert.ok(children.length > 0);
  useTDStore.setState({ enemies: useTDStore.getState().enemies.filter(enemy => enemy.shape !== 'summoner') });
  advance(0.05);
  assert.equal(useTDStore.getState().wavesCleared, 0);
  useTDStore.setState({ enemies: useTDStore.getState().enemies.filter(enemy => enemy.endlessWaveNumber !== 1) });
  advance(0.05);
  assert.equal(useTDStore.getState().wavesCleared, 1);
});

test('paused time cannot start waves and reload clears endless bookkeeping', () => {
  resetEndless();
  advance(9);
  useTDStore.getState().togglePause();
  advance(20);
  assert.ok(Math.abs(useTDStore.getState().gameTime - 9) < 0.001);
  assert.equal(useTDStore.getState().enemies.length, 0);
  useTDStore.getState().togglePause();
  advance(21);
  assert.deepEqual(useTDStore.getState().endlessPendingClearWaves, [1]);
  resetEndless();
  assert.deepEqual(useTDStore.getState().endlessPendingClearWaves, []);
  assert.equal(useTDStore.getState().waveIndex, 0);
  assert.equal(useTDStore.getState().wavesCleared, 0);
});

test('campaign still waits for its enemies, not bullets, before advancing', () => {
  resetEndless({ groups: [{ type: 'circle', count: 1, interval: 0.4, level: 1 }] });
  useTDStore.setState({ mode: 'campaign', nextWaveStartTime: null, endlessWaveFactory: null });
  useTDStore.getState().startWave();
  advance(0.1);
  assert.equal(useTDStore.getState().isWaveActive, true);
  assert.equal(useTDStore.getState().waveIndex, 0);
  useTDStore.setState({ enemies: [] });
  advance(0.05);
  assert.equal(useTDStore.getState().waveIndex, 1);
  assert.equal(useTDStore.getState().wavesCleared, 1);
});

test('minimum reward duration matches the spawn schedule', () => {
  assert.equal(getEndlessModeMinimumDurationSeconds(0), 0);
  assert.ok(Math.abs(getEndlessModeMinimumDurationSeconds(1) - 29.6) < 1e-9);
  assert.ok(Math.abs(getEndlessModeMinimumDurationSeconds(2) - 51.2) < 1e-9);
  assert.equal(getEndlessModeReward(19).chestTypes.length, 0);
  assert.deepEqual(getEndlessModeReward(20).chestTypes, ['common']);
  assert.deepEqual(getEndlessModeReward(40).chestTypes, ['rare']);
  assert.deepEqual(getEndlessModeReward(80).chestTypes, ['epic']);
  assert.deepEqual(getEndlessModeReward(160).chestTypes, ['legendary']);
});
