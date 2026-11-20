import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { test } from 'node:test';
import { getRangeDisplayKind } from '../src/td/rangeDisplay';
import { BASE_PLANTS_CONFIG, computePlantStats } from '../src/td/plants';
import { useTDStore } from '../src/td/store';
import type { Enemy, Tower } from '../src/td/types';

test('range display omits off-map edges, preserves partial circles and rejects invalid ranges', () => {
  assert.equal(getRangeDisplayKind({ x: 5, y: 5 }, 3.2, 20, 10), 'circle');
  assert.equal(getRangeDisplayKind({ x: 5, y: 5 }, 99, 20, 10), 'full');
  assert.equal(getRangeDisplayKind({ x: 5, y: 5 }, 5048.01, 20, 10), 'full');
  assert.equal(getRangeDisplayKind({ x: -10, y: 5 }, 2, 20, 10), 'none');
  for (const invalid of [0, -1, NaN, Infinity]) {
    assert.equal(getRangeDisplayKind({ x: 5, y: 5 }, invalid, 20, 10), 'none');
  }
  assert.equal(getRangeDisplayKind({ x: 0, y: 0 }, Math.hypot(20, 10), 20, 10), 'full');
  assert.equal(getRangeDisplayKind({ x: 0, y: 0 }, Math.hypot(20, 10) - 0.01, 20, 10), 'circle');
});

test('range visualization never changes attack stats, including level 5000 full-map plants', () => {
  for (const type of ['sniper', 'holyFlower', 'bottleGrass'] as const) {
    for (const level of [1, 10, 5000]) {
      const stats = computePlantStats(BASE_PLANTS_CONFIG[type], level);
      assert.equal(stats.range, Number((BASE_PLANTS_CONFIG[type].range * (1 + (level - 1) * 0.01)).toFixed(2)));
      if (type !== 'bottleGrass') assert.equal(getRangeDisplayKind({ x: 10, y: 5 }, stats.range, 20, 10), 'full');
    }
  }
});

test('a level 5000 sniper continues targeting and firing without range-proportional simulation work', t => {
  const durations: number[] = [];
  for (const level of [1, 5000]) {
    useTDStore.getState().loadLevel({ startGold: 10000, lives: 20, waves: [{ groups: [] }] }, {
      path: [{ x: 0, y: 5 }, { x: 20, y: 5 }], size: { w: 22, h: 12 }, roadWidthCells: 1, plantGrid: [],
    });
    const tower: Tower = { id: 'sniper', type: 'sniper', pos: { x: 2, y: 3 }, level,
      ...computePlantStats(BASE_PLANTS_CONFIG.sniper, level), lastShotTime: 0 };
    const enemies: Enemy[] = Array.from({ length: 500 }, (_, index) => ({ id: `target-${index}`, shape: 'circle',
      pos: { x: 10, y: 5 }, hp: 1e10 + index, maxHp: 1e10 + index, speed: 0, leakDamage: 1,
      pathId: 0, pathIndex: 0, t: 0.5, progress: 0.5 }));
    useTDStore.setState({ towers: [tower], enemies });
    const start = performance.now();
    for (let frame = 0; frame < 120; frame++) useTDStore.getState().update(1 / 30);
    const duration = performance.now() - start;
    durations.push(duration);
    assert.equal(useTDStore.getState().towers[0].lockedTargetId, 'target-499');
    assert.ok(useTDStore.getState().enemies.at(-1)!.hp < 1e10 + 499);
    assert.ok(duration < 3000, `Simulation stalled: ${duration.toFixed(1)}ms`);
  }
  t.diagnostic(`120 updates / 500 enemies: level 1 ${durations[0].toFixed(1)}ms; level 5000 ${durations[1].toFixed(1)}ms`);
});

test('boomerang leaf placement charges 180 sunlight', () => {
  useTDStore.getState().loadLevel({ startGold: 500, lives: 20, waves: [] }, {
    path: [{ x: 0, y: 5 }, { x: 20, y: 5 }], size: { w: 22, h: 12 }, roadWidthCells: 1,
    plantGrid: [{ x: 2, y: 3 }],
  }, { allowedPlants: ['boomerangLeaf'] });
  assert.equal(BASE_PLANTS_CONFIG.boomerangLeaf.cost, 180);
  useTDStore.getState().placeTower('boomerangLeaf', { x: 2, y: 3 });
  assert.equal(useTDStore.getState().gold, 320);
  assert.equal(useTDStore.getState().towers.length, 1);
});
