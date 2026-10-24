import assert from 'node:assert/strict';
import { test } from 'node:test';
import { useTDStore } from '../src/td/store';
import { BASE_PLANTS_CONFIG, computePlantStats, ELEMENT_PLANT_CONFIG } from '../src/td/plants';
import { MONSTER_BASE_STATS } from '../src/td/levels';
import type { Enemy, PlantType, Projectile, Tower } from '../src/td/types';

const path = [{ x: 0, y: 5 }, { x: 20, y: 5 }];

function reset() {
  useTDStore.getState().loadLevel({ startGold: 10000, lives: 20, waves: [{ groups: [] }] }, {
    path, size: { w: 22, h: 12 }, roadWidthCells: 1,
    plantGrid: [{ x: 5, y: 3 }, { x: 10, y: 3 }],
  }, { allowedPlants: ['antiAirTree', 'bottleGrass'], allowedElements: ['wind', 'fire', 'ice'] });
}

function enemy(id = 'tank', overrides: Partial<Enemy> = {}): Enemy {
  return {
    id, shape: 'tank', pos: { x: 0, y: 5 }, hp: 10000, maxHp: 10000,
    armorHp: 5000, maxArmorHp: 5000, speed: 0.1, leakDamage: 999,
    pathId: 0, pathIndex: 0, progress: 0, t: 0, level: 1, specialTimer: 30,
    ...overrides,
  };
}

function tower(id = 'tree', type: PlantType = 'antiAirTree', x = 5, y = 3): Tower {
  return {
    id, type, pos: { x, y }, level: 1,
    ...computePlantStats(BASE_PLANTS_CONFIG[type], 1), lastShotTime: 0,
  };
}

test('anti-air radius, price, cooldown and element restrictions', () => {
  reset();
  const config = BASE_PLANTS_CONFIG.antiAirTree;
  assert.equal(computePlantStats(config, 1).range, 4.1);
  assert.equal(computePlantStats(config, 10).range, 5);
  assert.equal(computePlantStats(config, 500).range, 6);
  useTDStore.getState().placeTower('antiAirTree', { x: 5, y: 3 });
  assert.equal(useTDStore.getState().gold, 9000);
  assert.equal(useTDStore.getState().plantCooldowns.antiAirTree, 90);
  useTDStore.getState().placeTower('antiAirTree', { x: 10, y: 3 });
  assert.equal(useTDStore.getState().towers.length, 1);
  useTDStore.getState().applyElement('fire', { x: 5, y: 3 });
  assert.equal(useTDStore.getState().towers[0].element, undefined);
  useTDStore.getState().applyElement('wind', { x: 5, y: 3 });
  assert.equal(useTDStore.getState().towers[0].element?.type, 'wind');
  assert.equal(useTDStore.getState().towers[0].fireRate, 0);
});

test('tank spawns with base armor and HP; boss speed stays configurable', () => {
  reset();
  useTDStore.setState({ waves: [{ groups: [{ type: 'tank', count: 1, level: 1, interval: 1, isBoss: true, bossSpeed: 0.2 }] }] });
  useTDStore.getState().startWave();
  useTDStore.getState().update(0.1);
  const tank = useTDStore.getState().enemies[0];
  assert.equal(tank.hp, 10000);
  assert.equal(tank.armorHp, 5000);
  assert.equal(tank.speed, 0.2);
  assert.equal(tank.specialTimer, 30.1);
  assert.equal(MONSTER_BASE_STATS.tank.leakDamage, 999);
});

test('boss speed accepts 0.05 and 0.01 without raising them to 0.1', () => {
  for (const speed of [0.05, 0.01, 0]) {
    reset();
    useTDStore.setState({ waves: [{ groups: [{ type: 'tank', count: 1, level: 1, interval: 1, isBoss: true, bossSpeed: speed }] }] });
    useTDStore.getState().startWave();
    useTDStore.getState().update(0.1);
    assert.equal(useTDStore.getState().enemies[0].speed, Math.max(0.01, speed));
  }
});

test('wind projectiles cannot damage or apply statuses to a tank', () => {
  for (const piercing of [false, true]) {
    reset();
    const tank = enemy('tank', { pos: { x: 5, y: 5 }, t: 0.25, progress: 0.25, speed: 0 });
    const projectile: Projectile = {
      id: 'wind', pos: { x: 4, y: 5 }, from: 'bottleGrass', damage: 900,
      targetId: tank.id, speed: 20, elementType: 'wind', knockbackDistance: 3,
      slowPct: 0.5, slowDuration: 5, burnDamagePerSec: 10, burnDuration: 5,
      breakArmorDuration: 5, piercing, direction: { x: 1, y: 0 },
    };
    useTDStore.setState({ enemies: [tank], projectiles: [projectile] });
    useTDStore.getState().update(0.1);
    const result = useTDStore.getState().enemies[0];
    assert.equal(result.armorHp, 5000);
    assert.equal(result.hp, 10000);
    assert.equal(result.pos.x, 5);
    assert.equal(result.slowUntil, undefined);
    assert.equal(result.burnUntil, undefined);
    assert.equal(result.armorBreakUntil, undefined);
  }
});

test('active fire deals double damage; active wind still damages without knockback', () => {
  reset();
  useTDStore.setState({ enemies: [enemy('tank', { speed: 0, pos: { x: 5, y: 5 }, progress: 0.25, t: 0.25 })],
    singleUseCasts: [{ id: 'fire', element: 'fire', pos: { x: 5, y: 5 }, level: 1, triggerTime: 0 }] });
  useTDStore.getState().update(0.1);
  assert.equal(useTDStore.getState().enemies[0].armorHp, 3300);
  useTDStore.setState({ singleUseCasts: [{ id: 'wind', element: 'wind', pos: { x: 5, y: 5 }, level: 1, triggerTime: 0 }] });
  useTDStore.getState().update(0.1);
  assert.equal(useTDStore.getState().enemies[0].armorHp, 3276);
  assert.equal(useTDStore.getState().enemies[0].pos.x, 5);
});

test('tank clear uses a 3x3 square and respects pumpkin covers', () => {
  reset();
  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    useTDStore.setState({ gameTime: 29.9, enemies: [enemy()], towers: [
      tower('center', 'bottleGrass', 5, 3), tower('corner', 'bottleGrass', 6, 4),
      tower('protected', 'bottleGrass', 4, 3), tower('outside', 'bottleGrass', 7, 3),
    ], plantCovers: [{ id: 'cover', type: 'pumpkinHead', towerId: 'protected' }] });
    useTDStore.getState().update(0.2);
    assert.deepEqual(useTDStore.getState().towers.map(item => item.id), ['protected', 'outside']);
    assert.equal(useTDStore.getState().plantCovers.length, 1);
    assert.ok(Math.abs(useTDStore.getState().enemies[0].specialTimer! - 60.1) < 1e-8);
  } finally {
    Math.random = originalRandom;
  }
});

test('freeze pauses the clear countdown, including partial expiry frames', () => {
  reset();
  useTDStore.setState({ gameTime: 29, enemies: [enemy('tank', { freezeUntil: 31.5 })],
    towers: [tower('plant', 'bottleGrass', 5, 3)] });
  useTDStore.getState().update(1);
  assert.equal(useTDStore.getState().enemies[0].specialTimer, 31);
  assert.equal(useTDStore.getState().enemies[0].pos.x, 0);
  useTDStore.getState().update(2);
  assert.equal(useTDStore.getState().enemies[0].specialTimer, 32.5);
  assert.equal(useTDStore.getState().towers.length, 1);
  assert.ok(Math.abs(useTDStore.getState().enemies[0].pos.x - 0.05) < 1e-8);
  useTDStore.getState().update(0.5);
  assert.equal(useTDStore.getState().towers.length, 0);
});

test('fast balloons cannot tunnel through a field, even across path turns', () => {
  reset();
  useTDStore.setState({ paths: [[{ x: 0, y: 0 }, { x: 0, y: 5 }, { x: 20, y: 5 }]],
    enemies: [enemy('balloon', { shape: 'balloonSoldier', pos: { x: 0, y: 0 }, speed: 100 })], towers: [tower()] });
  useTDStore.getState().update(1);
  const stopped = useTDStore.getState().enemies[0];
  assert.ok(stopped);
  assert.equal(stopped.pos.y, 5);
  assert.ok(Math.abs(stopped.pos.x - (5 - Math.sqrt(4.1 ** 2 - 2 ** 2))) < 1e-8);
  useTDStore.getState().update(1);
  assert.equal(useTDStore.getState().enemies[0].pos.x, stopped.pos.x);
  useTDStore.setState({ towers: [] });
  useTDStore.getState().update(0.01);
  assert.ok(useTDStore.getState().enemies[0].pos.x > stopped.pos.x);
});

test('tank consumes a tree before balloon movement, stops and resets countdown', () => {
  reset();
  useTDStore.setState({ enemies: [enemy('balloon', { shape: 'balloonSoldier', speed: 2 }), enemy('tank', { speed: 10, specialTimer: 1 })], towers: [tower()] });
  useTDStore.getState().update(1);
  const state = useTDStore.getState();
  assert.equal(state.towers.length, 0);
  assert.equal(state.enemies[0].pos.x, 2);
  assert.equal(state.enemies[1].immobilizedUntil, 21.5);
  assert.equal(state.enemies[1].specialTimer, 31);
  const stoppedX = state.enemies[1].pos.x;
  useTDStore.getState().update(1);
  assert.equal(useTDStore.getState().enemies[1].pos.x, stoppedX);
  assert.equal(useTDStore.getState().enemies[1].specialTimer, 32);
});

test('multiple tanks and trees are handled independently and stop duration caps at 30', () => {
  reset();
  useTDStore.setState({ towers: [tower('a'), { ...tower('b'), level: 100 }],
    enemies: [enemy('a', { speed: 10 }), enemy('b', { speed: 10 })] });
  useTDStore.getState().update(1);
  assert.equal(useTDStore.getState().towers.length, 0);
  assert.equal(useTDStore.getState().enemies[0].immobilizedUntil, 31);
  assert.equal(useTDStore.getState().enemies[1].immobilizedUntil, 21.5);
});

test('frozen anti-air trees release balloons until thawed', () => {
  reset();
  useTDStore.setState({ towers: [{ ...tower(), frozenUntil: 2 }],
    enemies: [enemy('balloon', { shape: 'balloonSoldier', speed: 2 })] });
  useTDStore.getState().update(1);
  assert.equal(useTDStore.getState().enemies[0].pos.x, 2);
  useTDStore.getState().update(1);
  assert.equal(useTDStore.getState().enemies[0].pos.x, 2);
});

test('wind aura damages tanks without projectiles or knockback', () => {
  reset();
  const element = ELEMENT_PLANT_CONFIG.wind;
  useTDStore.setState({ towers: [{ ...tower(), element: { type: 'wind', level: 1, color: element.color, bulletColor: element.bulletColor } }],
    enemies: [enemy('tank', { pos: { x: 5, y: 5 }, progress: 0.25, t: 0.25, speed: 0, immobilizedUntil: 10 })] });
  useTDStore.getState().update(1);
  assert.equal(useTDStore.getState().enemies[0].armorHp, 4999);
  assert.equal(useTDStore.getState().projectiles.length, 0);
});

test('tank leak defeats even with huge lives, leak overrides or same-frame healing', () => {
  reset();
  useTDStore.setState({ lives: 10000, maxLives: 10000, enemies: [
    enemy('tank', { pos: { x: 19.9, y: 5 }, progress: 0.995, t: 0.995, speed: 1, leakDamage: 0 }),
    enemy('charity', { hp: 0, specialType: 'charityAmbassador' }),
  ] });
  useTDStore.getState().update(1);
  assert.equal(useTDStore.getState().lives, 0);
  assert.equal(useTDStore.getState().running, false);
});

test('tank resists 75% of electric flower channel damage on both armor and body', () => {
  for (const armorHp of [5000, 0]) {
    reset();
    useTDStore.setState({ towers: [tower('flower', 'electricFlower', 5, 3)], enemies: [
      enemy('tank', { pos: { x: 5, y: 5 }, t: 0.25, progress: 0.25, speed: 0, armorHp }),
    ] });
    useTDStore.getState().update(0.1);
    const tank = useTDStore.getState().enemies[0];
    assert.equal(tank.armorHp, armorHp > 0 ? armorHp - 1 : 0);
    assert.equal(tank.hp, armorHp > 0 ? 10000 : 9999);
    assert.equal(useTDStore.getState().damagePopups[0].damage, 1);
  }
});

test('electric flower wind aura receives the same tank resistance; other targets do not', () => {
  for (const shape of ['tank', 'circle'] as const) {
    reset();
    const config = ELEMENT_PLANT_CONFIG.wind;
    useTDStore.setState({ towers: [{ ...tower('flower', 'electricFlower', 5, 3),
      channelNextTickTime: 100, lockedTargetId: 'target', channelDamagePct: 0.008,
      element: { type: 'wind', level: 1, color: config.color, bulletColor: config.bulletColor },
    }], enemies: [enemy('target', { shape, pos: { x: 5, y: 5 }, t: 0.25, progress: 0.25, speed: 0 })] });
    useTDStore.getState().update(1);
    assert.equal(useTDStore.getState().enemies[0].armorHp, shape === 'tank' ? 4999.75 : 4999);
  }
});

test('a tree holds 15 balloons but collapses on the 16th and removes its cover', () => {
  reset();
  const balloons = Array.from({ length: 15 }, (_, index) => enemy(`b${index}`, { shape: 'balloonSoldier', speed: 2 }));
  useTDStore.setState({ towers: [tower()], enemies: balloons,
    plantCovers: [{ id: 'cover', type: 'pumpkinHead', towerId: 'tree' }] });
  useTDStore.getState().update(1);
  assert.equal(useTDStore.getState().towers.length, 1);
  const beforeX = useTDStore.getState().enemies[0].pos.x;
  useTDStore.setState({ enemies: [...useTDStore.getState().enemies, enemy('b15', { shape: 'balloonSoldier', speed: 2 })] });
  useTDStore.getState().update(1);
  assert.equal(useTDStore.getState().towers.length, 0);
  assert.equal(useTDStore.getState().plantCovers.length, 0);
  assert.ok(useTDStore.getState().enemies[0].pos.x > beforeX);
});

test('balloon capacity is simultaneous, not cumulative; dead balloons do not count', () => {
  reset();
  useTDStore.setState({ towers: [tower()], enemies: Array.from({ length: 15 }, (_, index) =>
    enemy(`old${index}`, { shape: 'balloonSoldier', speed: 2 })) });
  useTDStore.getState().update(1);
  useTDStore.setState({ enemies: [useTDStore.getState().enemies[0],
    ...Array.from({ length: 14 }, (_, index) => enemy(`new${index}`, { shape: 'balloonSoldier', speed: 2 })),
    enemy('dead', { shape: 'balloonSoldier', hp: 0, speed: 2 }),
  ] });
  useTDStore.getState().update(1);
  assert.equal(useTDStore.getState().towers.length, 1);
});

test('collapsing fields release balloons into other fields and resolve cascading overloads', () => {
  reset();
  useTDStore.setState({ towers: [tower('first'), tower('second', 'antiAirTree', 10, 3)],
    enemies: Array.from({ length: 16 }, (_, index) => enemy(`b${index}`, { shape: 'balloonSoldier', speed: 10 })) });
  useTDStore.getState().update(1);
  assert.equal(useTDStore.getState().towers.length, 0);
  assert.ok(useTDStore.getState().enemies.every(balloon => balloon.pos.x === 10));
});

test('separate paths have independent tree capacities', () => {
  reset();
  useTDStore.setState({ paths: [path, [{ x: 0, y: 15 }, { x: 20, y: 15 }]],
    towers: [tower('overloaded'), tower('safe', 'antiAirTree', 5, 17)], enemies: [
      ...Array.from({ length: 16 }, (_, index) => enemy(`a${index}`, { shape: 'balloonSoldier', speed: 2 })),
      ...Array.from({ length: 15 }, (_, index) => enemy(`b${index}`, { shape: 'balloonSoldier', speed: 2, pathId: 1, pos: { x: 0, y: 15 } })),
    ] });
  useTDStore.getState().update(1);
  assert.deepEqual(useTDStore.getState().towers.map(tree => tree.id), ['safe']);
});
