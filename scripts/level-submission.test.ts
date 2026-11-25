import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BALANCE_LAB_LEVEL_DRAFTS } from '../src/td/balanceDraft.generated';
import { getLevelSpecForDifficulty, hasLevelDifficultyDraft, LEVELS, MONSTER_BASE_STATS } from '../src/td/levels';
import { getLevelDifficultyRatings } from '../src/td/levelRatings';
import { MAPS } from '../src/td/maps';
import { hasWonLevel, useTDStore } from '../src/td/store';
import { ELEMENT_ITEM_IDS, LEVEL_UNLOCK_REQUIREMENTS, PLANT_ITEM_IDS } from '../shared/unlocks';
import { CURRENT_RELEASE } from '../shared/releaseNotes';

const draft = BALANCE_LAB_LEVEL_DRAFTS.find(value => value.sourceLevelId === 'L15' && value.difficulty === 'AT')!;
const level = LEVELS.find(value => value.id === 'L15')!;

test('the 2-7 AT submission preserves its metadata and all five wave configurations', () => {
  assert.ok(draft);
  assert.deepEqual({ ...draft, waves: undefined }, {
    sourceLevelId: 'L15', levelNumber: 15, levelName: '2-7', contributor: 'hebscyf',
    difficulty: 'AT', rating: 18, mapId: 10, mapName: '交错回环', startGold: 1000,
    lives: 20, autoStartFirstWave: true, firstWaveDelaySec: 0.8, waves: undefined,
    atModeConfig: { type: 'normal' },
    specialEnemyConfig: { enabled: true, type: 'charityAmbassador', chance: 0.1 },
    unlockRewards: ['fourLeafClover'],
  });
  const groups = draft.waves.map(wave => wave.groups.map(group => [
    group.type, group.count, group.interval, group.level,
    group.startDelay ?? null, !!group.isBoss, group.bossSpeed ?? null,
  ]));
  assert.deepEqual(groups, [
    [['circle', 10, 0.4, 40, 0, false, null], ['balloonSoldier', 10, 2, 100, 1, false, null], ['triangle', 10, 1.1, 40, 1, false, null]],
    [['summoner', 1, 0.4, 1500, 0, true, 1], ['taunter', 1, 0.4, 1500, 0, true, 1], ['summoner', 50, 0.11, 300, null, false, null]],
    [['freezer', 10, 0.5, 301, 0, false, null], ['angryWriter', 10, 3.1, 1500, 0, true, null], ['taunter', 100, 0.1, 500, 0, false, null], ['armored', 521, 0.1, 500, 0, false, null]],
    [['healer', 50, 3, 2000, 0, true, 0.21], ['armorRepairer', 50, 3, 2000, 0, true, 0.21], ['bunker', 500, 0.1, 1000, 1, false, null]],
    [['tank', 20, 5, 100, 1, false, null], ['tank', 5, 20, 600, 1, true, null]],
  ]);
});

test('the runtime resolves 2-7 AT without changing its other three difficulties', () => {
  assert.ok(['EZ', 'HD', 'IN', 'AT'].every(difficulty => hasLevelDifficultyDraft(level, difficulty as 'EZ' | 'HD' | 'IN' | 'AT')));
  const runtime = getLevelSpecForDifficulty(level, 'AT');
  assert.equal(runtime.name, '2-7');
  assert.equal(runtime.contributor, 'hebscyf');
  assert.equal(runtime.mapId, 10);
  assert.equal(runtime.startGold, 1000);
  assert.equal(runtime.lives, 20);
  assert.deepEqual(runtime.waves, draft.waves);
  assert.deepEqual(runtime.atModeConfig, { type: 'normal' });
  assert.deepEqual(runtime.specialEnemyConfig, draft.specialEnemyConfig);
  assert.deepEqual(runtime.unlockRewards, ['fourLeafClover']);
  assert.equal(getLevelDifficultyRatings('L15', 15).AT, 18);
  assert.equal(getLevelSpecForDifficulty(level, 'EZ').contributor, undefined);
});

test('all drafts have unique keys, valid maps, enemy types and synchronized unlock rewards', () => {
  const keys = BALANCE_LAB_LEVEL_DRAFTS.map(value => `${value.sourceLevelId}:${value.difficulty}`);
  assert.equal(new Set(keys).size, keys.length);
  const allowedItems = new Set<string>([...PLANT_ITEM_IDS, ...ELEMENT_ITEM_IDS]);
  const expectedUnlocks = BALANCE_LAB_LEVEL_DRAFTS.flatMap(value => (value.unlockRewards ?? []).map(itemId => {
    assert.ok(allowedItems.has(itemId), itemId);
    return { level: value.levelNumber, difficulty: value.difficulty, star: value.difficulty === 'EZ' ? 1 : value.difficulty === 'HD' ? 2 : 3, itemId };
  }));
  assert.deepEqual(LEVEL_UNLOCK_REQUIREMENTS, expectedUnlocks);
  for (const value of BALANCE_LAB_LEVEL_DRAFTS) {
    assert.ok(MAPS.some(map => map.id === value.mapId), `${value.sourceLevelId}:${value.difficulty}`);
    for (const group of value.waves.flatMap(wave => wave.groups)) {
      assert.ok(MONSTER_BASE_STATS[group.type], group.type);
      assert.ok(Number.isInteger(group.count) && group.count > 0);
      assert.ok(Number.isFinite(group.interval) && group.interval > 0);
      assert.ok(Number.isInteger(group.level) && group.level >= 1);
    }
  }
});

test('all 1348 configured monsters spawn with valid positions, statistics and boss speeds', () => {
  const map = MAPS.find(value => value.id === draft.mapId)!;
  let total = 0;
  for (const wave of draft.waves) {
    useTDStore.getState().loadLevel({ ...getLevelSpecForDifficulty(level, 'AT'), waves: [wave], autoStartFirstWave: false }, map);
    useTDStore.getState().startWave();
    const actual = new Map<string, number>();
    for (let frame = 0; frame < 10000 && useTDStore.getState().waveIndex === 0; frame++) {
      useTDStore.getState().update(0.05);
      const state = useTDStore.getState();
      for (const enemy of state.enemies) {
        assert.ok(Number.isFinite(enemy.hp) && enemy.hp > 0);
        assert.ok(Number.isFinite(enemy.pos.x) && Number.isFinite(enemy.pos.y));
        assert.ok(enemy.pos.x >= 0 && enemy.pos.x <= map.size.w && enemy.pos.y >= 0 && enemy.pos.y <= map.size.h);
        const key = `${enemy.shape}:${enemy.level}:${!!enemy.isBoss}:${enemy.speed}`;
        actual.set(key, (actual.get(key) ?? 0) + 1);
        total++;
      }
      // Remove each spawned group before its summon timers can create extra units.
      useTDStore.setState({ enemies: [] });
    }
    assert.equal(useTDStore.getState().waveIndex, 1);
    const expected = new Map<string, number>();
    for (const group of wave.groups) {
      const speed = group.isBoss && group.bossSpeed != null ? group.bossSpeed : MONSTER_BASE_STATS[group.type].speed;
      const key = `${group.type}:${group.level}:${!!group.isBoss}:${speed}`;
      expected.set(key, (expected.get(key) ?? 0) + group.count);
    }
    assert.deepEqual(actual, expected);
  }
  assert.equal(total, 1348);
});

test('release 0.6.1 announces the daily shop, balance changes and confirmed fixes', () => {
  assert.equal(CURRENT_RELEASE.version, '0.6.1');
  assert.ok(CURRENT_RELEASE.title.endsWith(CURRENT_RELEASE.version));
  const notes = CURRENT_RELEASE.notes.join('\n');
  for (const text of ['每日商店', '00:00', '3种植物', '1种元素', '限购一次', '500金币', '1钻石',
    '火爆辣椒', '700', 'Boss血条', '生命与护甲', '召唤者', '奖励领取校验', '已有资产和正常奖励不变']) {
    assert.ok(notes.includes(text), text);
  }
});

test('a fatal final-wave leak never becomes a victory, including tanks and ordinary monsters', () => {
  for (const type of ['tank', 'circle'] as const) {
    useTDStore.getState().loadLevel({ startGold: 1000, lives: 1,
      waves: [{ groups: [{ type, count: 1, interval: 0.1, level: 1 }] }] },
    { size: { w: 2, h: 2 }, path: [{ x: 0.5, y: 0.5 }, { x: 0.501, y: 0.5 }], roadWidthCells: 1, plantGrid: [] });
    useTDStore.getState().startWave();
    useTDStore.getState().update(1);
    const state = useTDStore.getState();
    assert.equal(state.lives, 0);
    assert.equal(state.waveIndex, 1);
    assert.equal(state.isWaveActive, false);
    assert.equal(hasWonLevel(state), false);
  }
  assert.equal(hasWonLevel({ mode: 'at', lives: 1, isWaveActive: false, waveIndex: 1, waves: [{ groups: [] }] }), true);
  assert.equal(hasWonLevel({ mode: 'endless', lives: 15, isWaveActive: false, waveIndex: 100, waves: [{ groups: [] }] }), false);
});
