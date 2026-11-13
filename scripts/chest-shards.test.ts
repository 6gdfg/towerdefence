import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHEST_SHARD_REWARD_POOL, pickChestShardReward } from '../shared/rewards';
import { ELEMENT_ITEM_IDS, NON_UPGRADEABLE_PLANT_ITEMS, PLANT_ITEM_IDS } from '../shared/unlocks';

test('the shared chest pool includes each upgradeable plant and every element exactly once', () => {
  const expected = [...PLANT_ITEM_IDS.filter(id => !(NON_UPGRADEABLE_PLANT_ITEMS as readonly string[]).includes(id)), ...ELEMENT_ITEM_IDS];
  assert.deepEqual(CHEST_SHARD_REWARD_POOL, expected);
  assert.equal(new Set(CHEST_SHARD_REWARD_POOL).size, CHEST_SHARD_REWARD_POOL.length);
  assert.equal(CHEST_SHARD_REWARD_POOL.length, 29);
  assert.ok(!CHEST_SHARD_REWARD_POOL.includes('pumpkinHead'));
  for (const id of ['sniper', 'machineGun', 'sunlightFlower', 'dandelion']) assert.ok(CHEST_SHARD_REWARD_POOL.includes(id));
});

test('equal-width random intervals select every fragment equally without weighted bias', context => {
  let random = 0;
  context.mock.method(Math, 'random', () => random);
  const size = CHEST_SHARD_REWARD_POOL.length;
  const counts = new Map<string, number>();
  for (let index = 0; index < size; index++) {
    for (let sample = 0; sample < 100; sample++) {
      random = (index + (sample + 0.5) / 100) / size;
      const id = pickChestShardReward();
      assert.equal(id, CHEST_SHARD_REWARD_POOL[index]);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  assert.equal(counts.size, size);
  assert.ok([...counts.values()].every(count => count === 100));
});

test('random endpoints stay in range and independent rolls may repeat', context => {
  let random = 0;
  context.mock.method(Math, 'random', () => random);
  assert.equal(pickChestShardReward(), CHEST_SHARD_REWARD_POOL[0]);
  random = 1 - Number.EPSILON;
  assert.equal(pickChestShardReward(), CHEST_SHARD_REWARD_POOL.at(-1));
  assert.equal(pickChestShardReward(), CHEST_SHARD_REWARD_POOL.at(-1));
});
