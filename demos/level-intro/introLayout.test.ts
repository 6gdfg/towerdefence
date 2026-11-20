import assert from 'node:assert/strict';
import test from 'node:test';
import { MONSTER_LABELS } from '../../src/td/appConfig';
import type { ShapeType } from '../../src/td/types';
import { fitIntroScale, getIntroMonsters } from './introLayout';
import { INTRO_TIPS } from './tips';

test('tips stay concise and cover each special AT mode and companion page without duplicates', () => {
  assert.equal(new Set(INTRO_TIPS).size, INTRO_TIPS.length);
  for (const tip of INTRO_TIPS) assert.ok(tip.trim() && Array.from(tip).length <= 50, tip);
  for (const topic of ['传送带', '孤注一掷', '灵活多变', '打地鼠', '神出鬼没', '无尽', '实验室', '花园', '图鉴', '学习', '排行榜']) {
    assert.ok(INTRO_TIPS.some(tip => tip.includes(topic)), topic);
  }
});

test('intro fitting preserves 16:9 and stays within any available rectangle', () => {
  for (const [width, height] of [[1024, 768], [1920, 1080], [2560, 1080], [844, 390], [390, 844]]) {
    const scale = fitIntroScale(width, height);
    assert.ok(1440 * scale <= width && 810 * scale <= height);
    assert.ok(Math.abs(1440 * scale - width) < 0.001 || Math.abs(810 * scale - height) < 0.001);
  }
  assert.equal(fitIntroScale(0, 0), 0);
});

test('monster preview excludes basic shapes and empty groups and preserves first appearance order', () => {
  const groups = (types: ShapeType[]) => types.map(type => ({ type, count: 1 }));
  assert.deepEqual(getIntroMonsters([{ groups: groups(['circle', 'square', 'triangle']) }]), []);
  assert.deepEqual(getIntroMonsters([
    { groups: [...groups(['circle', 'balloonSoldier', 'taunter']), { type: 'healer', count: 0 }] },
    { groups: groups(['taunter', 'bunker', 'balloonSoldier', 'healer']) },
  ]), ['balloonSoldier', 'taunter', 'bunker', 'healer']);
});

test('monster preview stops at the first twelve distinct eligible types without changing the draft', () => {
  const types = Object.keys(MONSTER_LABELS) as ShapeType[];
  const waves = [{ groups: types.map(type => ({ type, count: 1 })) }];
  const original = JSON.stringify(waves);
  const expected = types.filter(type => !['circle', 'square', 'triangle'].includes(type)).slice(0, 12);
  assert.deepEqual(getIntroMonsters(waves), expected);
  assert.equal(JSON.stringify(waves), original);
});
