import assert from 'node:assert/strict';
import test from 'node:test';
import { randomInt } from 'node:crypto';
import { createDailyShopProducts, DAILY_SHOP_PLANT_POOL, DAILY_SHOP_PRODUCT_IDS } from '../shared/shop';
import { ELEMENT_ITEM_IDS, NON_UPGRADEABLE_PLANT_ITEMS } from '../shared/unlocks';

test('daily shop generates three distinct plant offers and one element offer with server prices', () => {
  for (let run = 0; run < 100; run += 1) {
    const products = createDailyShopProducts(randomInt);
    assert.deepEqual(products.map(product => product.id), [...DAILY_SHOP_PRODUCT_IDS]);
    const plants = products.slice(0, 3);
    assert.equal(new Set(plants.map(product => product.itemId)).size, 3);
    for (const product of plants) {
      assert.ok((DAILY_SHOP_PLANT_POOL as readonly string[]).includes(product.itemId));
      assert.ok(!(NON_UPGRADEABLE_PLANT_ITEMS as readonly string[]).includes(product.itemId));
      assert.ok(product.amount >= 1 && product.amount <= 10);
      assert.equal(product.currency, 'coins');
      assert.equal(product.price, product.amount * 500);
    }
    const element = products[3];
    assert.ok((ELEMENT_ITEM_IDS as readonly string[]).includes(element.itemId));
    assert.ok(element.amount >= 1 && element.amount <= 4);
    assert.equal(element.currency, 'diamonds');
    assert.equal(element.price, element.amount);
  }
});

test('minimum and maximum quantities include 1/10 plant and 1/4 element shards', () => {
  const minimum = createDailyShopProducts(() => 0);
  const maximum = createDailyShopProducts(limit => limit - 1);
  assert.deepEqual(minimum.map(product => product.amount), [1, 1, 1, 1]);
  assert.deepEqual(maximum.map(product => product.amount), [10, 10, 10, 4]);
});
