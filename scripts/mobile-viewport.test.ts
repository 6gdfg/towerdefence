import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyGameViewport } from '../src/td/useGameViewport';
import { clampMapView } from '../src/td/useMobileMapView';

test('phone classification persists after rotating beyond the former 900px breakpoint', () => {
  assert.equal(classifyGameViewport({ width: 412, height: 915, coarsePointer: true }).isPhone, true);
  const landscape = classifyGameViewport({ width: 915, height: 412, coarsePointer: true });
  assert.equal(landscape.isPhone, true);
  assert.equal(landscape.isPortrait, false);
});

test('a small desktop window is not forced to rotate and a normal tablet is not a phone', () => {
  assert.equal(classifyGameViewport({ width: 500, height: 900, coarsePointer: false }).isPhone, false);
  assert.equal(classifyGameViewport({ width: 768, height: 1024, coarsePointer: true }).isPhone, false);
});

test('mobile hints and phone user agents remain usable when pointer detection is unavailable', () => {
  assert.equal(classifyGameViewport({ width: 1000, height: 700, coarsePointer: false, mobileHint: true }).isPhone, true);
  assert.equal(classifyGameViewport({ width: 1000, height: 700, coarsePointer: false, userAgent: 'iPhone' }).isPhone, true);
});

test('zoom and pan clamp to map bounds and full view always returns to the center', () => {
  assert.deepEqual(clampMapView({ zoom: 0.5, x: -1000, y: 1000 }, 1200, 600), { zoom: 1, x: 600, y: 300 });
  assert.deepEqual(clampMapView({ zoom: 4, x: -1000, y: 1000 }, 1200, 600), { zoom: 3, x: 200, y: 500 });
  assert.deepEqual(clampMapView({ zoom: 2, x: 600, y: 300 }, 1200, 600), { zoom: 2, x: 600, y: 300 });
});
