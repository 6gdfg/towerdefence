import assert from 'node:assert/strict';
import test from 'node:test';
import { BASE_PLANTS_CONFIG, computePlantStats } from '../src/td/plants';
import { useTDStore } from '../src/td/store';
import type { Enemy, Tower } from '../src/td/types';

test('hot pepper has 700 base damage and upgrades only its damage', () => {
  const base = BASE_PLANTS_CONFIG.hotPepper;
  assert.equal(base.damage, 700);
  assert.equal(base.cost, 200);
  assert.equal(base.placementCooldown, 60);
  assert.equal(base.elementAllowed, false);
  const stats = computePlantStats(base, 11);
  assert.equal(stats.damage, 1050);
  assert.equal(stats.range, 0);
  assert.equal(stats.fireRate, 0);
  assert.equal(stats.projectileSpeed, 0);
});

for (const [level, damage] of [[1, 700], [11, 1050]] as const) {
  test(`level ${level} hot pepper deals ${damage} cross damage after its delay, including balloons`, () => {
    useTDStore.getState().loadLevel({ startGold: 10000, lives: 20, waves: [{ groups: [] }] }, {
      path: [[{ x: 0, y: 5 }, { x: 20, y: 5 }], [{ x: 0, y: 9 }, { x: 20, y: 9 }]],
      size: { w: 22, h: 12 }, roadWidthCells: 1, plantGrid: [],
    }, { allowedPlants: ['hotPepper'] });
    const tower: Tower = {
      id: 'pepper', type: 'hotPepper', pos: { x: 10, y: 5 }, level,
      ...computePlantStats(BASE_PLANTS_CONFIG.hotPepper, level), lastShotTime: 0, expiresAt: 0.5,
    };
    const ground: Enemy = {
      id: 'ground', shape: 'circle', pos: { x: 10, y: 5 }, hp: 2000, maxHp: 2000,
      speed: 0, leakDamage: 1, level: 1, pathId: 0, pathIndex: 0, t: 0.5, progress: 0.5,
    };
    useTDStore.setState({ towers: [tower], enemies: [
      ground, { ...ground, id: 'air', shape: 'balloonSoldier' },
      { ...ground, id: 'outside', pathId: 1, pos: { x: 15, y: 9 }, t: 0.75, progress: 0.75 },
    ] });
    useTDStore.getState().update(0.25);
    assert.ok(useTDStore.getState().enemies.every(enemy => enemy.hp === 2000));
    useTDStore.getState().update(0.25);
    assert.deepEqual(useTDStore.getState().enemies.map(enemy => [enemy.id, enemy.hp]), [
      ['ground', 2000 - damage], ['air', 2000 - damage], ['outside', 2000],
    ]);
    assert.equal(useTDStore.getState().towers.length, 0);
    useTDStore.getState().update(0.25);
    assert.equal(useTDStore.getState().enemies[0].hp, 2000 - damage);
  });
}
