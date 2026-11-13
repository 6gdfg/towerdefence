import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getEndlessRankingPeriod, RANKING_BOARDS } from '../shared/ranking';
import RankingPage from '../src/td/RankingPage';
import EndlessChampionModal from '../src/td/EndlessChampionModal';
import { readFileSync } from 'node:fs';

test('Beijing Sunday midnight starts a new endless leaderboard week', () => {
  const before = getEndlessRankingPeriod(new Date('2026-11-14T15:59:59.999Z'));
  const after = getEndlessRankingPeriod(new Date('2026-11-14T16:00:00.000Z'));
  assert.equal(before.weekStart, '2026-11-08');
  assert.equal(before.resetsAt, '2026-11-14T16:00:00.000Z');
  assert.equal(after.weekStart, '2026-11-15');
  assert.equal(after.startsAt, '2026-11-14T16:00:00.000Z');
  assert.equal(after.resetsAt, '2026-11-21T16:00:00.000Z');
});

test('Sunday-based periods survive year boundaries', () => {
  assert.equal(getEndlessRankingPeriod(new Date('2027-01-01T12:00:00Z')).weekStart, '2026-12-27');
  assert.equal(getEndlessRankingPeriod(new Date('2027-01-02T16:00:00Z')).weekStart, '2027-01-03');
});

test('ranking page has the generic title and three independent tabs', () => {
  const html = renderToStaticMarkup(createElement(RankingPage, { onBack() {} }));
  assert.match(html, /<h1>排行榜<\/h1>/);
  assert.doesNotMatch(html, /通关排行榜/);
  for (const board of RANKING_BOARDS) assert.ok(html.includes(board.label));
  assert.equal((html.match(/role="tab"/g) ?? []).length, 3);
});

test('champion notification presents the week, score and reward', () => {
  const html = renderToStaticMarkup(createElement(EndlessChampionModal, {
    weekStart: '2026-11-08', bestWaves: 192, coins: 20000, experience: 100,
    confirming: false, error: null, onConfirm() {},
  }));
  assert.match(html, /恭喜！你获得了无尽模式榜周冠军/);
  assert.ok(html.includes('192'));
  assert.ok(html.includes('20000'));
  assert.ok(html.includes('100'));
});

test('the weekly cron uses UTC Saturday 16:00 without a new API route', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.deepEqual(config.crons, [{ path: '/api/ranking?settle=1', schedule: '0 16 * * 6' }]);
});
