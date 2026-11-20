import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAPS, getPlantGrid, isPositionCoveredByRoad } from '../src/td/maps';
import { normalizeMapPaths } from '../src/td/mapPath';
import { MONSTER_BASE_STATS, LEVELS, getLevelSpecForDifficulty } from '../src/td/levels';
import { BALANCE_LAB_LEVEL_DRAFTS } from '../src/td/balanceDraft.generated';
import { useTDStore, hasWonLevel } from '../src/td/store';
import type { Enemy, Tower, WaveDef } from '../src/td/types';

const path = [{ x: 0, y: 5 }, { x: 100, y: 5 }];
function reset(waves: WaveDef[] = [{ groups: [] }]) {
  useTDStore.getState().loadLevel({ startGold: 1000, lives: 20, waves }, {
    path, size: { w: 102, h: 12 }, roadWidthCells: 1, plantGrid: [{ x: 5, y: 3 }],
  }, { autoStartFirstWave: false });
}
function enemy(id: string, overrides: Partial<Enemy> = {}): Enemy {
  return { id, shape: 'jackInTheBox', pos: { x: 5, y: 5 }, hp: 80, maxHp: 80,
    speed: 0, leakDamage: 1, level: 1, pathId: 0, pathIndex: 0, t: 0.05, progress: 0.05,
    specialTimer: 8, ...overrides };
}
function plant(id: string, x = 5, y = 3): Tower {
  return { id, type: 'bottleGrass', pos: { x, y }, level: 1, range: 0, damage: 0, fireRate: 0, lastShotTime: 0 };
}
function arm(enemies: Enemy[], towers: Tower[] = []) {
  useTDStore.setState({ gameTime: 8, enemies, towers: towers.map(tower => ({ ...tower, frozenUntil: 100 })),
    nextSkySunAt: null, plantCovers: [] });
}

test('Z has a true diagonal, one outer planting row per horizontal road and no plant-road overlap', () => {
  const map = MAPS.find(map => map.id === 18)!;
  assert.equal(map.name, 'Z');
  assert.deepEqual(map.size, { w: 40, h: 20 });
  assert.deepEqual(normalizeMapPaths(map.path), [[
    { x: 2.5, y: 3.5 }, { x: 37.5, y: 3.5 }, { x: 2.5, y: 16.5 }, { x: 37.5, y: 16.5 },
  ]]);
  const grid = getPlantGrid(map);
  assert.deepEqual([...new Set(grid.filter(p => p.y < 3.5).map(p => p.y))], [1.5]);
  assert.deepEqual([...new Set(grid.filter(p => p.y > 16.5).map(p => p.y))], [18.5]);
  assert.ok(grid.filter(p => p.y === 1.5).length >= 30);
  assert.ok(grid.filter(p => p.y === 18.5).length >= 30);
  assert.ok(grid.some(p => p.y > 4.5 && p.y < 15.5));
  for (const p of grid) assert.equal(isPositionCoveredByRoad(map, p), false, JSON.stringify(p));
  assert.equal(isPositionCoveredByRoad(map, { x: 20, y: 10 }), true);
});

test('movement carries distance correctly from the top road into the Z diagonal and lower road', () => {
  const map = MAPS.find(map => map.id === 18)!;
  useTDStore.getState().loadLevel({ startGold: 1000, lives: 20, waves: [] }, { ...map, plantGrid: getPlantGrid(map) });
  assert.equal(useTDStore.getState().activeMapId, 18);
  const diagonalLength = Math.hypot(35, 13);
  for (const [index, segmentLength, nextIndex, start, end] of [
    [0, 35, 1, { x: 37.5, y: 3.5 }, { x: 2.5, y: 16.5 }],
    [1, diagonalLength, 2, { x: 2.5, y: 16.5 }, { x: 37.5, y: 16.5 }],
  ] as const) {
    useTDStore.setState({ enemies: [enemy('moving', { shape: 'circle', pathIndex: index,
      t: (segmentLength - 0.5) / segmentLength, speed: 2, pos: start })] });
    useTDStore.getState().update(0.5);
    const moved = useTDStore.getState().enemies[0];
    const nextLength = Math.hypot(end.x - start.x, end.y - start.y);
    assert.equal(moved.pathIndex, nextIndex);
    assert.ok(Math.abs(moved.t - 0.5 / nextLength) < 1e-10);
    assert.ok(Math.abs(moved.pos.x - (start.x + (end.x - start.x) * moved.t)) < 1e-10);
    assert.ok(Math.abs(moved.pos.y - (start.y + (end.y - start.y) * moved.t)) < 1e-10);
  }
});

test('jack base stats follow circle except HP; each spawn receives a fixed 8-20s fuse', t => {
  assert.deepEqual(MONSTER_BASE_STATS.jackInTheBox, { ...MONSTER_BASE_STATS.circle, hp: 80 });
  for (const random of [0, 0.5, 0.999999]) {
    reset([{ groups: [{ type: 'jackInTheBox', count: 1, interval: 1, level: 1, isBoss: true, bossSpeed: 0.01 }] }]);
    const mock = t.mock.method(Math, 'random', () => random);
    useTDStore.getState().startWave();
    useTDStore.getState().update(0.1);
    const spawned = useTDStore.getState().enemies[0];
    assert.equal(spawned.hp, 80);
    assert.equal(spawned.speed, 0.01);
    assert.equal(spawned.specialTimer, 0.1 + 8 + random * 12);
    const fuse = spawned.specialTimer;
    useTDStore.getState().update(0.2);
    assert.equal(useTDStore.getState().enemies[0].specialTimer, fuse);
    mock.mock.restore();
  }
});

test('warning lasts 1.5s, stops movement and respects game pause', () => {
  reset();
  arm([enemy('jack', { speed: 2.5 })], [plant('edge')]);
  useTDStore.getState().update(0.1);
  assert.equal(useTDStore.getState().enemies[0].explosionAt, 9.5);
  assert.deepEqual(useTDStore.getState().enemies[0].pos, { x: 5, y: 5 });
  useTDStore.getState().togglePause();
  useTDStore.getState().update(100);
  assert.equal(useTDStore.getState().gameTime, 8.1);
  useTDStore.getState().togglePause();
  useTDStore.getState().update(1.39);
  assert.equal(useTDStore.getState().towers.length, 1);
  useTDStore.getState().update(0.02);
  assert.equal(useTDStore.getState().towers.length, 0);
  assert.equal(useTDStore.getState().enemies.length, 0);
  assert.equal(useTDStore.getState().combo, 1);
  assert.equal(useTDStore.getState().gold, 1007);
  useTDStore.getState().update(0.1);
  assert.equal(useTDStore.getState().combo, 1);
});

test('freeze pauses the fuse and only counts frozen time when thawing during an update', () => {
  reset();
  arm([enemy('jack', { specialTimer: 9, freezeUntil: 10.5 })], [plant('edge')]);
  useTDStore.getState().update(2);
  let jack = useTDStore.getState().enemies[0];
  assert.equal(jack.specialTimer, 11);
  assert.equal(jack.explosionAt, undefined);
  useTDStore.getState().update(0.75);
  jack = useTDStore.getState().enemies[0];
  assert.equal(jack.specialTimer, 11.5);
  assert.equal(jack.explosionAt, undefined);
  useTDStore.getState().update(0.75);
  assert.equal(useTDStore.getState().enemies[0].explosionAt, 13);
  useTDStore.getState().update(1.49);
  assert.equal(useTDStore.getState().towers.length, 1);
  useTDStore.getState().update(0.02);
  assert.equal(useTDStore.getState().combo, 1);
  assert.equal(useTDStore.getState().towers.length, 0);
});

test('freezing an active warning preserves its remaining time without restarting it', () => {
  reset();
  arm([enemy('jack', { explosionAt: 9.5, freezeUntil: 10.5 })], [plant('edge')]);
  useTDStore.getState().update(2);
  assert.equal(useTDStore.getState().enemies[0].explosionAt, 11.5);
  useTDStore.getState().update(0.75);
  assert.equal(useTDStore.getState().enemies[0].explosionAt, 12);
  useTDStore.getState().update(1.24);
  assert.equal(useTDStore.getState().towers.length, 1);
  useTDStore.getState().update(0.02);
  assert.equal(useTDStore.getState().combo, 1);
  assert.equal(useTDStore.getState().towers.length, 0);
});

test('repeat freezes extend only frozen time; slow does not pause or reroll the fuse', t => {
  reset();
  arm([enemy('jack', { specialTimer: 9, freezeUntil: 10 })]);
  const mock = t.mock.method(Math, 'random', () => 0.5);
  useTDStore.getState().update(1);
  useTDStore.getState().enemies[0].freezeUntil = 12;
  useTDStore.getState().update(2);
  useTDStore.getState().update(1.5);
  assert.equal(useTDStore.getState().enemies[0].specialTimer, 13);
  assert.equal(mock.mock.callCount(), 0);
  useTDStore.getState().enemies[0].slowUntil = 100;
  useTDStore.getState().enemies[0].slowPct = 0.9;
  useTDStore.getState().update(0.5);
  assert.equal(useTDStore.getState().enemies[0].explosionAt, 14.5);
});

test('a freezing cast landing on the explosion frame prevents detonation until thaw', () => {
  reset();
  arm([enemy('jack', { explosionAt: 8.1, hp: 10000, maxHp: 10000 })], [plant('edge')]);
  useTDStore.setState({ singleUseCasts: [{ id: 'ice', element: 'ice', pos: { x: 5, y: 5 }, level: 1, triggerTime: 8.1 }] });
  useTDStore.getState().update(0.1);
  assert.equal(useTDStore.getState().enemies[0].freezeUntil, 12.1);
  assert.equal(useTDStore.getState().towers.length, 1);
  useTDStore.getState().update(3.99);
  assert.equal(useTDStore.getState().combo, 0);
  assert.equal(useTDStore.getState().towers.length, 1);
  useTDStore.getState().update(0.02);
  assert.equal(useTDStore.getState().combo, 1);
  assert.equal(useTDStore.getState().towers.length, 0);
});

test('two jacks spawned together keep independent fuse durations', t => {
  reset([{ groups: [{ type: 'jackInTheBox', count: 2, interval: 0.1, level: 1 }] }]);
  const rolls = [0.1, 0.25, 0.2, 0.75];
  t.mock.method(Math, 'random', () => rolls.shift() ?? 0.5);
  useTDStore.getState().startWave();
  useTDStore.getState().update(0.1);
  useTDStore.getState().update(0.1);
  const [first, second] = useTDStore.getState().enemies;
  assert.equal(first.specialTimer, 11.1);
  assert.equal(second.specialTimer, 17.2);
});

test('the circular blast removes uncovered plants, consumes only covers and leaves outside plants/projectiles intact', () => {
  reset();
  arm([enemy('jack')], [plant('edge'), plant('covered', 6, 5), plant('outside', 7.01, 5), plant('diagonal', 6.5, 6.5)]);
  useTDStore.setState({ plantCovers: [{ id: 'cover', type: 'pumpkinHead', towerId: 'covered' }],
    projectiles: [{ id: 'stray', from: 'bottleGrass', pos: { x: 5, y: 5 }, speed: 0, damage: 0, unguided: true, direction: { x: 1, y: 0 } }] });
  useTDStore.getState().update(1.5);
  assert.deepEqual(useTDStore.getState().towers.map(t => t.id), ['covered', 'outside', 'diagonal']);
  assert.equal(useTDStore.getState().plantCovers.length, 0);
  assert.equal(useTDStore.getState().projectiles.length, 1);
});

test('blast hits ground/air units, applies 2000 base damage through armor and grants combo/rewards/death effects once', () => {
  reset();
  arm([
    enemy('jack', { isBoss: true, hp: 1e9, maxHp: 1e9, specialType: 'charityAmbassador' }),
    enemy('ground', { shape: 'circle', hp: 2500, maxHp: 2500 }),
    enemy('air', { shape: 'balloonSoldier', hp: 100, maxHp: 100 }),
    enemy('armor', { shape: 'armored', hp: 1000, maxHp: 1000, armorHp: 1500, maxArmorHp: 1500 }),
    enemy('ice', { shape: 'iceShell', hp: 4500, maxHp: 4500, burnUntil: 50, burnDamagePerSec: 0 }),
    enemy('outside', { shape: 'circle', pos: { x: 7.01, y: 5 }, t: 0.0701, hp: 100, maxHp: 100 }),
  ]);
  useTDStore.setState({ lives: 19 });
  useTDStore.getState().update(1.5);
  const state = useTDStore.getState();
  assert.deepEqual(state.enemies.map(e => [e.id, e.hp]), [['ground', 500], ['armor', 500], ['ice', 500], ['outside', 100]]);
  assert.equal(state.enemies.find(e => e.id === 'armor')!.armorHp, 0);
  assert.equal(state.combo, 2);
  assert.equal(state.gold, 1504);
  assert.equal(state.lives, 20);
});

test('killing a warning jack cancels its blast; lethal chain damage does not trigger a second explosion', () => {
  reset();
  arm([enemy('dead', { explosionAt: 9.5 })], [plant('safe')]);
  useTDStore.setState({ projectiles: [{ id: 'interrupt', from: 'bottleGrass', pos: { x: 5, y: 4.9 },
    targetId: 'dead', speed: 20, damage: 100 }] });
  useTDStore.getState().update(0.1);
  assert.equal(useTDStore.getState().enemies.length, 0);
  useTDStore.getState().update(1.4);
  assert.equal(useTDStore.getState().towers.length, 1);
  assert.equal(useTDStore.getState().combo, 1);
  reset();
  arm([enemy('first'), enemy('second', { pos: { x: 6, y: 5 }, t: 0.06, specialTimer: 8.2 })], [plant('safe', 7.5, 5)]);
  useTDStore.getState().update(1.5);
  assert.equal(useTDStore.getState().enemies.length, 0);
  assert.equal(useTDStore.getState().towers.length, 1);
  assert.equal(useTDStore.getState().combo, 2);
  assert.equal(useTDStore.getState().gold, 1014);
});

test('a later healer cannot revive self-destructed jacks; final blast ends the wave without clearing bullets', () => {
  reset();
  arm([enemy('jack'), enemy('healer', { shape: 'healer', hp: 10000, maxHp: 10000, specialTimer: 0 })]);
  useTDStore.getState().update(1.5);
  assert.deepEqual(useTDStore.getState().enemies.map(e => e.id), ['healer']);
  assert.equal(useTDStore.getState().combo, 1);
  reset();
  arm([enemy('last')]);
  useTDStore.setState({ isWaveActive: true, spawnCursor: null,
    projectiles: [{ id: 'stray', from: 'bottleGrass', pos: { x: 5, y: 5 }, speed: 0, damage: 0, unguided: true, direction: { x: 1, y: 0 } }] });
  useTDStore.getState().update(1.5);
  assert.equal(hasWonLevel(useTDStore.getState()), true);
  assert.equal(useTDStore.getState().projectiles.length, 1);
});

test('disabled kill rewards do not suppress jack combo or the death effects of blast victims', () => {
  reset();
  arm([enemy('jack'), enemy('freezer', { shape: 'freezer', hp: 50, maxHp: 50, specialTimer: 30 })], [plant('outside', 10, 3)]);
  useTDStore.setState({ towers: [plant('outside', 10, 3)], killRewardOverride: 0 });
  useTDStore.getState().update(1.5);
  assert.equal(useTDStore.getState().combo, 2);
  assert.equal(useTDStore.getState().gold, 1000);
  assert.equal(useTDStore.getState().towers[0].frozenUntil, 10);
});

test('all configured 2-8 enemies spawn on valid Z segments with correct levels and boss speeds', t => {
  let total = 0;
  let waveCount = 0;
  for (const draft of BALANCE_LAB_LEVEL_DRAFTS.filter(d => d.sourceLevelId === 'L16')) {
    const map = MAPS.find(map => map.id === draft.mapId)!;
    for (const wave of draft.waves) {
      waveCount++;
      useTDStore.getState().loadLevel({ startGold: 1000, lives: 20, waves: [wave] }, { ...map, plantGrid: getPlantGrid(map) }, { autoStartFirstWave: false });
      useTDStore.getState().startWave();
      const counts = new Map<string, number>();
      const expected = new Map<string, number>();
      for (const g of wave.groups) {
        const speed = g.isBoss && g.bossSpeed != null ? g.bossSpeed : MONSTER_BASE_STATS[g.type].speed;
        const key = `${g.type}:${g.level}:${!!g.isBoss}:${speed}`;
        expected.set(key, (expected.get(key) ?? 0) + g.count);
      }
      for (let frame = 0; frame < 1000 && useTDStore.getState().waveIndex === 0; frame++) {
        useTDStore.getState().update(0.1);
        for (const e of useTDStore.getState().enemies) {
          assert.ok(Number.isFinite(e.pos.x) && Number.isFinite(e.pos.y) && e.hp > 0);
          assert.equal(e.pathId, 0);
          assert.equal(e.hp, Math.round(MONSTER_BASE_STATS[e.shape].hp * (1 + 0.1 * ((e.level ?? 1) - 1))));
          const key = `${e.shape}:${e.level}:${!!e.isBoss}:${e.speed}`;
          counts.set(key, (counts.get(key) ?? 0) + 1);
          total++;
        }
        useTDStore.setState({ enemies: [] });
      }
      assert.deepEqual(counts, expected);
      assert.equal(useTDStore.getState().waveIndex, 1);
    }
  }
  t.diagnostic(`Validated ${total} configured enemies across all ${waveCount} waves`);
});

test('2-8 EZ/HD have unique drafts, progressive waves, multiple bosses and resolve to Z', () => {
  for (const [difficulty, rating, waveCount] of [['EZ', 11, 6], ['HD', 16, 7]] as const) {
    const drafts = BALANCE_LAB_LEVEL_DRAFTS.filter(d => d.sourceLevelId === 'L16' && d.difficulty === difficulty);
    assert.equal(drafts.length, 1);
    const draft = drafts[0];
    assert.equal(draft.levelName, '2-8');
    assert.equal(draft.rating, rating);
    assert.equal(draft.waves.length, waveCount);
    assert.equal(draft.mapId, 18);
    assert.deepEqual(draft.unlockRewards, []);
    let previousMax = 0;
    for (const wave of draft.waves) {
      const normalMax = Math.max(...wave.groups.filter(g => !g.isBoss).map(g => g.level));
      assert.ok(normalMax > previousMax);
      previousMax = normalMax;
      assert.ok(wave.groups.some(g => g.type === 'jackInTheBox'));
      for (const group of wave.groups) {
        assert.ok(MONSTER_BASE_STATS[group.type]);
        assert.ok(group.interval >= 0.1 && group.count > 0 && group.startDelay != null);
      }
    }
    assert.ok(draft.waves.at(-1)!.groups.filter(g => g.isBoss).reduce((n, g) => n + g.count, 0) >= 4);
    assert.equal(getLevelSpecForDifficulty(LEVELS.find(l => l.id === 'L16')!, difficulty).mapId, 18);
  }
});
