import assert from 'node:assert/strict';
import { test } from 'node:test';
import { useTDStore } from '../src/td/store';
import { BASE_PLANTS_CONFIG, computePlantStats } from '../src/td/plants';
import type { Enemy, Tower } from '../src/td/types';

function flower(id: string, x = 3, overrides: Partial<Tower> = {}): Tower {
  return { id, type: 'sunlightFlower', pos: { x, y: 3 }, level: 1,
    ...computePlantStats(BASE_PLANTS_CONFIG.sunlightFlower, 1), lastShotTime: 0, ...overrides };
}

function enemy(overrides: Partial<Enemy> = {}): Enemy {
  return { id: 'target', shape: 'circle', pos: { x: 4, y: 4 }, hp: 1000, maxHp: 1000,
    speed: 0, leakDamage: 1, pathId: 0, pathIndex: 0, progress: 0.5, t: 0.5, ...overrides };
}

function reset(towers: Tower[], gold = 500, enemies = [enemy()]) {
  useTDStore.getState().loadLevel({ startGold: gold, lives: 15, waves: [{ groups: [] }] }, {
    path: [{ x: 0, y: 4 }, { x: 20, y: 4 }], size: { w: 22, h: 12 },
    roadWidthCells: 1, plantGrid: [],
  });
  useTDStore.setState({ towers, enemies, gameTime: 5 });
}

test('clicking any of ten sunlight flowers fires ten shots and costs 100 sunlight in total', () => {
  reset(Array.from({ length: 10 }, (_, index) => flower(`flower-${index}`, 3 + index * 0.1)));
  useTDStore.getState().manualFireTower('flower-7');
  const state = useTDStore.getState();
  assert.equal(state.gold, 400);
  assert.equal(state.projectiles.length, 10);
  assert.equal(new Set(state.projectiles.map(shot => shot.sourceTowerId)).size, 10);
  assert.ok(state.towers.every(tower => tower.lastShotTime === 5));
  assert.equal(BASE_PLANTS_CONFIG.sunlightFlower.activeAbilityCost, 10);
});

test('frozen and out-of-range flowers skip shooting; clicking a frozen flower can still trigger the others', () => {
  reset([flower('frozen', 3, { frozenUntil: 10 }), flower('ready'), flower('far', 19)]);
  useTDStore.getState().manualFireTower('frozen');
  assert.equal(useTDStore.getState().projectiles.length, 1);
  assert.equal(useTDStore.getState().projectiles[0].sourceTowerId, 'ready');
  assert.equal(useTDStore.getState().gold, 490);
  assert.equal(useTDStore.getState().towers[0].lastShotTime, 0);
});

test('insufficient sunlight, no target, airborne-only targets and frozen-only flowers never charge', () => {
  reset([flower('flower')], 9);
  useTDStore.getState().manualFireTower('flower');
  assert.equal(useTDStore.getState().gold, 9);
  assert.equal(useTDStore.getState().projectiles.length, 0);
  for (const enemies of [[], [enemy({ shape: 'balloonSoldier' })], [enemy({ hp: 0 })]]) {
    reset([flower('flower')], 500, enemies);
    useTDStore.getState().manualFireTower('flower');
    assert.equal(useTDStore.getState().gold, 500);
    assert.equal(useTDStore.getState().projectiles.length, 0);
  }
  reset([flower('flower', 3, { frozenUntil: 10 })]);
  useTDStore.getState().manualFireTower('flower');
  assert.equal(useTDStore.getState().gold, 500);
});

test('pause and clicking a different plant cannot trigger the sunlight volley', () => {
  reset([flower('flower'), flower('other', 3, { type: 'bottleGrass' })]);
  useTDStore.getState().manualFireTower('other');
  assert.equal(useTDStore.getState().projectiles.length, 0);
  useTDStore.getState().togglePause();
  useTDStore.getState().manualFireTower('flower');
  assert.equal(useTDStore.getState().projectiles.length, 0);
  assert.equal(useTDStore.getState().gold, 500);
});

test('each flower retains its own level and attached element', () => {
  reset([flower('base'), flower('ice', 3, { level: 10,
    element: { type: 'ice', level: 3, color: '#00f', bulletColor: '#00f' } })]);
  useTDStore.getState().manualFireTower('base');
  const shots = useTDStore.getState().projectiles;
  assert.equal(shots[0].elementType, undefined);
  assert.equal(shots[1].elementType, 'ice');
  assert.ok(shots[1].damage > shots[0].damage);
  assert.ok((shots[1].slowPct ?? 0) > 0);
  assert.equal(useTDStore.getState().gold, 480);
});

test('volley cost scales with the number of firing flowers', () => {
  for (const count of [1, 3, 10, 11]) {
    reset(Array.from({ length: count }, (_, index) => flower(`flower-${index}`)));
    useTDStore.getState().manualFireTower('flower-0');
    assert.equal(useTDStore.getState().gold, 500 - count * 10);
    assert.equal(useTDStore.getState().projectiles.length, count);
  }
});

test('insufficient funds for the whole volley cause no shots or deductions', () => {
  const towers = Array.from({ length: 10 }, (_, index) => flower(`flower-${index}`));
  reset(towers, 99);
  useTDStore.getState().manualFireTower('flower-0');
  assert.equal(useTDStore.getState().gold, 99);
  assert.equal(useTDStore.getState().projectiles.length, 0);
  assert.ok(useTDStore.getState().towers.every(tower => tower.lastShotTime === 0));
  reset(towers, 100);
  useTDStore.getState().manualFireTower('flower-0');
  assert.equal(useTDStore.getState().gold, 0);
  assert.equal(useTDStore.getState().projectiles.length, 10);
});
