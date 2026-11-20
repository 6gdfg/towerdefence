import assert from 'node:assert/strict';
import { test } from 'node:test';
import { useTDStore } from '../src/td/store';
import { BASE_PLANTS_CONFIG, computePlantStats } from '../src/td/plants';
import type { Enemy, Projectile, PlantType, Tower } from '../src/td/types';

const path = [{ x: 0, y: 5 }, { x: 20, y: 5 }];
function reset() {
  useTDStore.getState().loadLevel({ startGold: 10000, lives: 20, waves: [{ groups: [] }, { groups: [] }] }, {
    path, size: { w: 22, h: 12 }, roadWidthCells: 1, plantGrid: [],
  }, { allowedPlants: ['hotPepper', 'frostBlastShroom'], allowedElements: ['wind'] });
}
function enemy(id: string, overrides: Partial<Enemy> = {}): Enemy {
  return { id, shape: 'circle', pos: { x: 10, y: 5 }, hp: 10, maxHp: 10, speed: 0, leakDamage: 1,
    pathId: 0, pathIndex: 0, progress: 0.5, t: 0.5, level: 1, ...overrides };
}
function projectile(target: Enemy, overrides: Partial<Projectile> = {}): Projectile {
  return { id: `shot-${target.id}`, from: 'bottleGrass', pos: { ...target.pos }, targetId: target.id,
    speed: 100, damage: 100, ...overrides };
}
function instantPlant(type: PlantType): Tower {
  return { id: 'instant', type, pos: { x: 10, y: 5 }, ...computePlantStats(BASE_PLANTS_CONFIG[type], 1),
    level: 1, lastShotTime: 0, expiresAt: 0 };
}

test('direct and splash projectile kills count once each; armor damage does not count', () => {
  reset();
  const armored = enemy('armor', { hp: 100, maxHp: 100, armorHp: 500, maxArmorHp: 500 });
  useTDStore.setState({ enemies: [armored], projectiles: [projectile(armored)] });
  useTDStore.getState().update(0.01);
  assert.equal(useTDStore.getState().combo, 0);
  const first = enemy('first');
  const second = enemy('second');
  useTDStore.setState({ enemies: [first, second], projectiles: [projectile(first, { splashRadius: 2, splashPercent: 1 }), projectile(second)] });
  useTDStore.getState().update(0.01);
  assert.equal(useTDStore.getState().combo, 2);
  useTDStore.getState().update(0.01);
  assert.equal(useTDStore.getState().combo, 2);
});

test('burning and wind-aura kills count even when kill rewards are disabled', () => {
  reset();
  const target = enemy('burn', { hp: 1, burnDamagePerSec: 100, burnUntil: 5 });
  useTDStore.setState({ disableKillRewards: true, enemies: [target] });
  useTDStore.getState().update(0.1);
  assert.equal(useTDStore.getState().combo, 1);
  assert.equal(useTDStore.getState().gold, 10000);
  const tower: Tower = { id: 'aura', type: 'cycloneShroom', pos: { x: 10, y: 4 },
    ...computePlantStats(BASE_PLANTS_CONFIG.cycloneShroom, 1), lastShotTime: 0, level: 1,
    element: { type: 'wind', level: 1 } };
  useTDStore.setState({ enemies: [enemy('aura-target', { hp: 0.001 })], towers: [tower] });
  useTDStore.getState().update(0.1);
  assert.equal(useTDStore.getState().combo, 2);
});

test('wind single-use kills every balloon regardless of health and counts each', () => {
  reset();
  useTDStore.setState({ enemies: [enemy('air-1', { shape: 'balloonSoldier', hp: 100000 }),
    enemy('air-2', { shape: 'balloonSoldier', hp: 100000 }), enemy('ground')],
    singleUseCasts: [{ id: 'wind', element: 'wind', level: 1, pos: { x: 0, y: 0 }, triggerTime: 0 }] });
  useTDStore.getState().update(0.01);
  assert.equal(useTDStore.getState().combo, 3);
  assert.equal(useTDStore.getState().enemies.length, 0);
});

for (const type of ['hotPepper', 'frostBlastShroom'] as const) {
  test(`${type} counts ground and airborne kills before early dead-enemy removal`, () => {
    reset();
    useTDStore.setState({ towers: [instantPlant(type)], enemies: [enemy('air', { shape: 'balloonSoldier' }), enemy('ground')] });
    useTDStore.getState().update(0.01);
    assert.equal(useTDStore.getState().combo, 2);
    assert.equal(useTDStore.getState().enemies.length, 0);
  });
}

test('summoned monsters count normally and are not counted just for appearing', () => {
  reset();
  useTDStore.setState({ enemies: [enemy('summoner', { shape: 'summoner', hp: 1000, specialTimer: 0 })] });
  useTDStore.getState().update(0.01);
  const spawned = useTDStore.getState().enemies.find(target => target.id.startsWith('e-summoned-'))!;
  assert.ok(spawned);
  assert.equal(useTDStore.getState().combo, 0);
  useTDStore.setState({ projectiles: [projectile(spawned, { damage: 100000 })] });
  useTDStore.getState().update(0.01);
  assert.equal(useTDStore.getState().combo, 1);
  assert.equal(useTDStore.getState().enemies.length, 1);
});

test('hammer kills count immediately and are never counted again by update or duplicate clicks', () => {
  reset();
  useTDStore.setState({ atModeConfig: { type: 'whackAMole', whackAMole: { plants: ['bottleGrass'], hammerBaseDamage: 30 } },
    enemies: [enemy('hammer')] });
  useTDStore.getState().hitEnemyWithHammer('hammer');
  assert.equal(useTDStore.getState().combo, 1);
  useTDStore.getState().hitEnemyWithHammer('hammer');
  useTDStore.getState().update(0.01);
  assert.equal(useTDStore.getState().combo, 1);
});

for (const shape of ['circle', 'balloonSoldier', 'tank'] as const) {
  test(`${shape} escaping clears combo rather than counting a kill`, () => {
    reset();
    useTDStore.setState({ combo: 775, enemies: [enemy('leak', { shape, speed: 10, t: 0.9999, progress: 0.9999,
      pos: { x: 19.998, y: 5 }, specialTimer: 1000 })] });
    useTDStore.getState().update(0.01);
    assert.equal(useTDStore.getState().combo, 0);
    assert.equal(useTDStore.getState().enemies.length, 0);
  });
}

test('a leak resets combo even if charity healing restores the same life total in that update', () => {
  reset();
  const charity = enemy('charity', { specialType: 'charityAmbassador' });
  useTDStore.setState({ combo: 30, lives: 10, maxLives: 20,
    enemies: [enemy('leak', { speed: 10, t: 0.9999, progress: 0.9999, pos: { x: 19.998, y: 5 } }), charity],
    projectiles: [projectile(charity)] });
  useTDStore.getState().update(0.01);
  assert.equal(useTDStore.getState().lives, 10);
  assert.equal(useTDStore.getState().combo, 1);
});

test('combo survives waves, pauses and non-death removals, but resets on a new run', () => {
  reset();
  useTDStore.setState({ combo: 775, isWaveActive: true, spawnCursor: null, enemies: [] });
  useTDStore.getState().update(0.01);
  assert.equal(useTDStore.getState().combo, 775);
  useTDStore.getState().startWave();
  assert.equal(useTDStore.getState().combo, 775);
  useTDStore.getState().togglePause();
  useTDStore.getState().update(1);
  assert.equal(useTDStore.getState().combo, 775);
  reset();
  assert.equal(useTDStore.getState().combo, 0);
  useTDStore.setState({ combo: 10 });
  useTDStore.getState().resetTD();
  assert.equal(useTDStore.getState().combo, 0);
});
