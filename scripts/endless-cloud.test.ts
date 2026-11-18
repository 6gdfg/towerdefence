import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { abandonEndlessModeRun, claimEndlessModeReward, startEndlessModeRun } from '../src/td/cloudApi';

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
beforeEach(() => {
  const entries = new Map<string, string>([
    ['td_token', 'test-token'], ['td_username', 'test-player'], ['td_player_id', 'test-id'],
  ]);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  } });
});
afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else Reflect.deleteProperty(globalThis, 'localStorage');
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

test('an interrupted reward is retried before starting the next endless run', async context => {
  const calls: Record<string, unknown>[] = [];
  context.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => {
    const body = JSON.parse(String(options.body));
    calls.push(body);
    if (calls.length === 1) throw new Error('offline');
    return body.action === 'claimEndlessReward'
      ? jsonResponse({ ok: true, wavesCleared: 192, rewardCoins: 9600, chestTypes: ['legendary', 'common'] })
      : jsonResponse({ ok: true, runId: 'next-run' });
  });
  await assert.rejects(claimEndlessModeReward('first-run', 192), /offline/);
  assert.ok(localStorage.getItem('td_endless_pending:test-id'));
  assert.equal((await startEndlessModeRun()).runId, 'next-run');
  assert.deepEqual(calls.map(call => call.action), ['claimEndlessReward', 'claimEndlessReward', 'startEndlessRun']);
  assert.deepEqual(calls[0], calls[1]);
  assert.equal(localStorage.getItem('td_endless_pending:test-id'), null);
});

test('unresolved rewards prevent silently abandoning a pending claim', async context => {
  const actions: string[] = [];
  localStorage.setItem('td_endless_pending:test-id', JSON.stringify({ runId: 'old-run', wavesCleared: 20 }));
  context.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => {
    actions.push(JSON.parse(String(options.body)).action);
    return jsonResponse({ error: 'service unavailable' }, 503);
  });
  await assert.rejects(startEndlessModeRun(), /service unavailable/);
  assert.deepEqual(actions, ['claimEndlessReward']);
  assert.ok(localStorage.getItem('td_endless_pending:test-id'));
});

test('an obsolete run from another session does not permanently block new games', async context => {
  localStorage.setItem('td_endless_pending:test-id', JSON.stringify({ runId: 'old-run', wavesCleared: 20 }));
  context.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => {
    const body = JSON.parse(String(options.body));
    return body.action === 'claimEndlessReward'
      ? jsonResponse({ error: 'run superseded' }, 409)
      : jsonResponse({ ok: true, runId: 'next-run' });
  });
  assert.equal((await startEndlessModeRun()).runId, 'next-run');
  assert.equal(localStorage.getItem('td_endless_pending:test-id'), null);
});

test('claims use authenticated progress actions and preserve inventory-full results', async context => {
  const response = { ok: true, wavesCleared: 192, rewardCoins: 9600, chestTypes: [], chestInventoryFull: true };
  context.mock.method(globalThis, 'fetch', async (url: unknown, options: RequestInit) => {
    assert.equal(url, '/api/progress');
    assert.equal((options.headers as Record<string, string>).Authorization, 'Bearer test-token');
    assert.deepEqual(JSON.parse(String(options.body)), { action: 'claimEndlessReward', runId: 'run', wavesCleared: 192 });
    return jsonResponse(response);
  });
  assert.deepEqual(await claimEndlessModeReward('run', 192), response);
  assert.equal(localStorage.getItem('td_endless_pending:test-id'), null);
});

test('voluntary exits only abandon the run and never queue a reward claim', async context => {
  context.mock.method(globalThis, 'fetch', async (url: unknown, options: RequestInit) => {
    assert.equal(url, '/api/progress');
    assert.deepEqual(JSON.parse(String(options.body)), { action: 'abandonEndlessRun', runId: 'run' });
    return jsonResponse({ ok: true });
  });
  assert.deepEqual(await abandonEndlessModeRun('run'), { ok: true });
  assert.equal(localStorage.getItem('td_endless_pending:test-id'), null);
});
