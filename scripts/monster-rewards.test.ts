import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { MONSTER_BASE_STATS } from '../src/td/levels';
import { BALANCE_LAB_LEVEL_DRAFTS } from '../src/td/balanceDraft.generated';
import { useTDStore } from '../src/td/store';
import { getConveyorItemLevel } from '../src/td/atMode';
import type { Enemy, ShapeType } from '../src/td/types';

const rewards: Record<ShapeType, number> = {
  circle: 7, triangle: 5, square: 10, healer: 12, evilSniper: 15, rager: 12, summoner: 15,
  igniter: 4, armored: 15, iceShell: 13, freezer: 7, taunter: 12, purifier: 9,
  angryWriter: 17, bunker: 20, windShield: 7, windEye: 14, balloonSoldier: 7,
  armorRepairer: 11, tank: 7, jackInTheBox: 7,
};
function reset() {
  useTDStore.getState().loadLevel({ startGold: 1000, lives: 20, waves: [{ groups: [] }] }, {
    path: [{ x: 0, y: 5 }, { x: 100, y: 5 }], size: { w: 102, h: 12 }, roadWidthCells: 1,
    plantGrid: [{ x: 5, y: 3 }, { x: 10, y: 3 }],
  }, { atModeConfig: { type: 'whackAMole', whackAMole: { plants: ['bottleGrass'], hammerBaseDamage: 30 } } });
}
function enemy(shape: ShapeType, isBoss = false): Enemy {
  return { id: 'target', shape, isBoss, pos: { x: 5, y: 5 }, hp: 1, maxHp: 1,
    speed: 0, leakDamage: 1, pathId: 0, pathIndex: 0, t: 0.05, progress: 0.05, specialTimer: 100 };
}

test('all enemy rewards match the reduced schedule, bosses pay 497, and rewards only pay once', () => {
  assert.deepEqual(Object.keys(rewards).sort(), Object.keys(MONSTER_BASE_STATS).sort());
  for (const shape of Object.keys(rewards) as ShapeType[]) {
    for (const isBoss of [false, true]) {
      reset();
      useTDStore.setState({ enemies: [enemy(shape, isBoss)] });
      useTDStore.getState().hitEnemyWithHammer('target');
      assert.equal(useTDStore.getState().gold, 1000 + (isBoss ? 497 : rewards[shape]), `${shape}, boss=${isBoss}`);
      useTDStore.getState().hitEnemyWithHammer('target');
      useTDStore.getState().update(0.1);
      assert.equal(useTDStore.getState().gold, 1000 + (isBoss ? 497 : rewards[shape]));
      assert.equal(useTDStore.getState().combo, 1);
    }
  }
});

test('the documented kill sunlight agrees with runtime rewards for every monster', () => {
  const docs = readFileSync('docs/game-data.md', 'utf8');
  for (const [shape, amount] of Object.entries(rewards)) {
    const row = docs.split('\n').find(line => line.startsWith(`| ${shape} |`))!;
    assert.ok(row, shape);
    assert.equal(Number.parseInt(row.split('|')[7].trim(), 10), amount, shape);
  }
});

test('last stand overrides including zero remain unchanged for ordinary enemies and bosses', () => {
  for (const reward of [0, 25]) {
    for (const isBoss of [false, true]) {
      reset();
      useTDStore.setState({ killRewardOverride: reward, enemies: [enemy('bunker', isBoss)] });
      useTDStore.getState().hitEnemyWithHammer('target');
      assert.equal(useTDStore.getState().gold, 1000 + reward);
      assert.equal(useTDStore.getState().combo, 1);
    }
  }
});

test('conveyor missing items use half the rating, while unlocked items keep account levels', () => {
  assert.equal(getConveyorItemLevel(17, false), 8);
  assert.equal(getConveyorItemLevel(17.9, false, 99), 8);
  assert.equal(getConveyorItemLevel(16, false), 8);
  assert.equal(getConveyorItemLevel(1, false), 1);
  assert.equal(getConveyorItemLevel(undefined, false), 1);
  assert.equal(getConveyorItemLevel(NaN, false), 1);
  assert.equal(getConveyorItemLevel(17, true, 3), 3);
  assert.equal(getConveyorItemLevel(17, true, 27), 27);
  assert.equal(getConveyorItemLevel(17, true), 1);
});

test('conveyor placement and element attachment/release use resolved levels without sunlight cost', () => {
  reset();
  useTDStore.setState({
    atModeConfig: { type: 'conveyor', conveyor: { intervalSec: 3, maxQueue: 8, pool: [{ kind: 'plant', id: 'sniper' }] } },
    availablePlants: ['sniper', 'bottleGrass'], availableElements: ['ice'],
    towerLevelMap: { sniper: getConveyorItemLevel(17, false), bottleGrass: getConveyorItemLevel(17, true, 27),
      'element:ice': getConveyorItemLevel(17, false) },
    conveyorQueue: [{ kind: 'plant', id: 'sniper' }, { kind: 'plant', id: 'bottleGrass' }],
  });
  useTDStore.getState().placeTowerFromConveyor(0, { x: 5, y: 3 });
  useTDStore.getState().placeTowerFromConveyor(0, { x: 10, y: 3 });
  assert.deepEqual(useTDStore.getState().towers.map(t => [t.type, t.level]), [['sniper', 8], ['bottleGrass', 27]]);
  useTDStore.setState({ conveyorQueue: [{ kind: 'element', id: 'ice' }, { kind: 'element', id: 'ice' }] });
  useTDStore.getState().applyElementFromConveyor(0, { x: 10, y: 3 });
  assert.equal(useTDStore.getState().towers[1].element?.level, 8);
  useTDStore.getState().applyElementFromConveyor(0, { x: 15, y: 3 });
  assert.equal(useTDStore.getState().singleUseCasts[0].level, 8);
  assert.ok(useTDStore.getState().elementCooldowns.ice! > 0);
  assert.equal(useTDStore.getState().gold, 1000);
  assert.equal(useTDStore.getState().conveyorQueue.length, 0);
});

test('2-8 AT preserves the two authored waves and progresses from smaller bosses to the tank finale', () => {
  const draft = BALANCE_LAB_LEVEL_DRAFTS.find(d => d.sourceLevelId === 'L16' && d.difficulty === 'AT')!;
  assert.equal(draft.rating, 17);
  assert.equal(draft.waves.length, 6);
  assert.equal(draft.startGold, 1000);
  assert.equal(draft.lives, 12);
  assert.equal(draft.atModeConfig?.type, 'conveyor');
  assert.equal(draft.atModeConfig?.conveyor?.intervalSec, 3);
  assert.equal(draft.atModeConfig?.conveyor?.maxQueue, 8);
  assert.equal(draft.atModeConfig?.conveyor?.pool.length, 20);
  assert.deepEqual(draft.waves.slice(0, 2), [
    { groups: [
      { type: 'jackInTheBox', count: 10, interval: 0.4, level: 15, startDelay: 4 },
      { type: 'summoner', count: 7, interval: 0.4, level: 34, startDelay: 8 },
      { type: 'square', count: 8, interval: 0.4, level: 37, startDelay: 10 },
    ] },
    { groups: [
      { type: 'igniter', count: 10, interval: 0.4, level: 47, startDelay: 3 },
      { type: 'angryWriter', count: 4, interval: 0.4, level: 56, startDelay: 6 },
      { type: 'windEye', count: 12, interval: 0.4, level: 62, startDelay: 9 },
      { type: 'bunker', count: 1, interval: 0.4, level: 180, startDelay: 12, isBoss: true, bossSpeed: 0.5 },
    ] },
  ]);
  assert.deepEqual(draft.waves.map(w => Math.max(...w.groups.filter(g => !g.isBoss).map(g => g.level))), [37, 62, 78, 95, 115, 140]);
  let previousBossHealth = 0;
  for (const wave of draft.waves.slice(1)) {
    const maximumHealth = Math.max(...wave.groups.filter(g => g.isBoss).map(g => {
      const base = MONSTER_BASE_STATS[g.type];
      return (base.hp + (base.armorHp ?? 0)) * (1 + 0.1 * (g.level - 1));
    }));
    assert.ok(maximumHealth > previousBossHealth);
    previousBossHealth = maximumHealth;
  }
  assert.ok(draft.waves.at(-1)!.groups.some(g => g.type === 'tank' && g.isBoss && g.level === 120));
});
