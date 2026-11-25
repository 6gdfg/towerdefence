import assert from 'node:assert/strict';
import test from 'node:test';
import { MAPS, type MapSpec } from '../src/td/maps';
import { normalizeMapPaths } from '../src/td/mapPath';
import { DIFFICULTY_CONFIG, MONSTER_BASE_STATS } from '../src/td/levels';
import { useTDStore } from '../src/td/store';
import type { Position } from '../src/types/game';
import type { Enemy, WaveDef } from '../src/td/types';

const straightMap: MapSpec = {
  id: -1, name: 'summoner-test', size: { w: 22, h: 12 }, roadWidthCells: 1,
  path: [{ x: 0, y: 5 }, { x: 20, y: 5 }], plantGrid: [],
};

function reset(map = straightMap, wave: WaveDef = { groups: [] }) {
  useTDStore.getState().loadLevel({ startGold: 500, lives: 20, waves: [wave] }, map, {
    autoStartFirstWave: false,
    labOverrides: { monsters: { summoner: { speed: 0 }, circle: { speed: 0 } } },
  });
}

function advance(seconds: number) {
  for (let tick = 0; tick < seconds * 8; tick += 1) useTDStore.getState().update(0.125);
}

function children() {
  return useTDStore.getState().enemies.filter(enemy => enemy.id.startsWith('e-summoned-'));
}

function parentAt(path: Position[], pathIndex: number, t: number, overrides: Partial<Enemy> = {}): Enemy {
  const lengths = path.slice(1).map((point, index) => Math.hypot(point.x - path[index].x, point.y - path[index].y));
  const distance = lengths.slice(0, pathIndex).reduce((sum, length) => sum + length, 0) + t * lengths[pathIndex];
  const a = path[pathIndex];
  const b = path[pathIndex + 1];
  return {
    id: 'summoner', shape: 'summoner', hp: 250, maxHp: 250, speed: 0, leakDamage: 2, level: 1,
    pos: { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t },
    pathId: 0, pathIndex, t, progress: distance / lengths.reduce((sum, length) => sum + length, 0),
    specialTimer: 0, ...overrides,
  };
}

test('a wave-spawned summoner first summons after five seconds and repeats every five seconds', () => {
  reset(straightMap, { groups: [{ type: 'summoner', count: 1, level: 10, interval: 0.4 }] });
  useTDStore.getState().startWave();
  advance(0.125);
  assert.equal(useTDStore.getState().enemies.length, 1);
  advance(4.875);
  assert.equal(children().length, 0);
  advance(0.125);
  assert.equal(children().length, 1);
  advance(4.875);
  assert.equal(children().length, 1);
  advance(0.125);
  assert.equal(children().length, 2);
  advance(5);
  assert.equal(children().length, 3);
});

test('pausing does not advance the summoning countdown', () => {
  reset();
  useTDStore.setState({ enemies: [parentAt(normalizeMapPaths(straightMap.path)[0], 0, 0.5, { specialTimer: 5 })] });
  advance(4);
  useTDStore.getState().togglePause();
  advance(20);
  assert.equal(useTDStore.getState().gameTime, 4);
  assert.equal(children().length, 0);
  useTDStore.getState().togglePause();
  advance(1);
  assert.equal(children().length, 1);
});

test('each summoner has an independent countdown and children retain level, path and endless wave', () => {
  const paths = [normalizeMapPaths(straightMap.path)[0], [{ x: 0, y: 7 }, { x: 20, y: 7 }]];
  reset({ ...straightMap, path: paths });
  useTDStore.setState({ enemies: [
    parentAt(paths[0], 0, 0.5, { id: 'first', specialTimer: 1 }),
    parentAt(paths[1], 0, 0.5, { id: 'second', pathId: 1, level: 25, isBoss: true, endlessWaveNumber: 7, specialTimer: 3 }),
  ] });
  advance(1);
  assert.equal(children().length, 1);
  assert.equal(children()[0].pathId, 0);
  advance(2);
  assert.equal(children().length, 2);
  const child = children().find(enemy => enemy.pathId === 1)!;
  assert.equal(child.shape, 'circle');
  assert.equal(child.level, 25);
  assert.equal(child.endlessWaveNumber, 7);
  assert.equal(child.isBoss, undefined);
  assert.equal(child.hp, Math.round(MONSTER_BASE_STATS.circle.hp * (1 + DIFFICULTY_CONFIG.LEVEL_MULTIPLIER * 24)));
  assert.equal(child.leakDamage, MONSTER_BASE_STATS.circle.leakDamage);
  assert.equal(child.pos.y, 7);
  advance(3);
  assert.equal(children().length, 3);
});

for (const map of MAPS) {
  test(`summoners produce living children with finite positions on every path of map ${map.id}`, () => {
    const paths = normalizeMapPaths(map.path);
    reset(map, { groups: [{ type: 'summoner', count: paths.length, level: 1, interval: 0.125 }] });
    useTDStore.getState().startWave();
    advance(6);
    assert.equal(children().length, paths.length);
    assert.deepEqual(children().map(enemy => enemy.pathId).sort(), paths.map((_, index) => index));
    for (const child of children()) {
      assert.ok(child.hp > 0);
      assert.ok(Number.isFinite(child.pos.x) && Number.isFinite(child.pos.y));
      assert.ok(child.progress > 0 && child.progress < 1);
    }
  });
}

test('summoning advances exactly half a cell across unequal-length turns on map 9', () => {
  const map = MAPS.find(map => map.id === 9)!;
  const path = normalizeMapPaths(map.path)[0];
  reset(map);
  useTDStore.setState({ enemies: [parentAt(path, 1, 0.8)] });
  advance(0.125);
  const child = children()[0];
  assert.ok(child);
  assert.equal(child.pathIndex, 2);
  assert.ok(Math.abs(child.pos.x - (path[2].x + 0.3)) < 1e-8);
  assert.equal(child.pos.y, path[2].y);
});

test('a summon near the house stays ahead of its parent and inside the path', () => {
  reset();
  const parent = parentAt(normalizeMapPaths(straightMap.path)[0], 0, 0.9999);
  useTDStore.setState({ enemies: [parent] });
  advance(0.125);
  assert.equal(children().length, 1);
  assert.ok(children()[0].progress >= parent.progress);
  assert.ok(children()[0].progress < 1);
  advance(0.125);
  assert.equal(children().length, 1);
  assert.equal(useTDStore.getState().lives, 20);
});
