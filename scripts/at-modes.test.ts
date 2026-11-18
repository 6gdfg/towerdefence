import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getAtBaseModeType, isPhantomAtMode } from '../src/td/atMode';
import { BALANCE_LAB_LEVEL_DRAFTS } from '../src/td/balanceDraft.generated';
import CardSelectPage from '../src/td/CardSelectPage';
import { ENDLESS_MODE_MAX_ELEMENTS, ENDLESS_MODE_MAX_PLANTS } from '../src/td/funModes';
import type { AtBaseModeType, AtModeConfig } from '../src/td/types';

test('all remaining AT modes resolve normally, including phantom variants', () => {
  const modes: AtBaseModeType[] = ['normal', 'conveyor', 'lastStand', 'flexible', 'whackAMole'];
  for (const type of modes) {
    assert.equal(getAtBaseModeType({ type }), type);
    const phantom: AtModeConfig = { type: 'phantom', phantom: { subMode: type } };
    assert.equal(getAtBaseModeType(phantom), type);
    assert.equal(isPhantomAtMode(phantom), true);
    assert.equal(getAtBaseModeType({ type, phantomSpawn: true }), type);
  }
});

test('removed modes in old caches fall back to normal without losing phantom spawning', () => {
  assert.equal(getAtBaseModeType(null), 'normal');
  for (const raw of [
    { type: 'cardSelect', cardSelect: { maxPlants: 5, maxElements: 2, monsterLevelMultiplier: 10 } },
    { type: 'phantom', phantom: { subMode: 'cardSelect' } },
    { type: 'cardSelect', phantomSpawn: true },
    { type: 'unknown' },
  ]) {
    const config = raw as unknown as AtModeConfig;
    assert.equal(getAtBaseModeType(config), 'normal');
    assert.equal(isPhantomAtMode(config), raw.type === 'phantom' || 'phantomSpawn' in raw);
  }
});

test('current level drafts do not depend on the removed AT mode', () => {
  assert.ok(BALANCE_LAB_LEVEL_DRAFTS.length > 0);
  for (const draft of BALANCE_LAB_LEVEL_DRAFTS) {
    assert.equal(JSON.stringify(draft.atModeConfig ?? {}).includes('cardSelect'), false, `${draft.sourceLevelId}:${draft.difficulty}`);
  }
});

test('endless card selection keeps its ten-plant and three-element limits', () => {
  const markup = renderToStaticMarkup(createElement(CardSelectPage, {
    title: 'Endless', plantOptions: ['sunflower', 'bottleGrass'], elementOptions: ['fire'],
    maxPlants: ENDLESS_MODE_MAX_PLANTS, maxElements: ENDLESS_MODE_MAX_ELEMENTS,
    onBack() {}, onConfirm() {},
  }));
  assert.equal(ENDLESS_MODE_MAX_PLANTS, 10);
  assert.equal(ENDLESS_MODE_MAX_ELEMENTS, 3);
  assert.match(markup, /植物 2 \/ 10/);
  assert.match(markup, /元素 1 \/ 3/);
});
