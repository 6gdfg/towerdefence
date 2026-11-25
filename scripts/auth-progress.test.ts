import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fetchCloudProgress, getToken } from '../src/td/authProgress';

const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
before(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key: string) => key === 'td_token' ? 'retained-account-token' : null },
  });
});
after(() => {
  if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
  else Reflect.deleteProperty(globalThis, 'localStorage');
});

test('progress loads normally with authorization and clears its timeout', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let signal: AbortSignal | undefined;
  context.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    assert.equal(url, '/api/progress');
    assert.deepEqual(init.headers, { Authorization: 'Bearer retained-account-token' });
    signal = init.signal as AbortSignal;
    return new Response(JSON.stringify({ coins: 7773, towerLevels: { bottleGrass: 27 } }), { headers: { 'content-type': 'application/json' } });
  });
  const progress = await fetchCloudProgress();
  assert.equal(progress.coins, 7773);
  assert.equal(progress.towerLevels?.bottleGrass, 27);
  context.mock.timers.tick(20_000);
  assert.equal(signal?.aborted, false);
  assert.equal(getToken(), 'retained-account-token');
});

test('a stalled progress connection is canceled after 20 seconds without clearing login', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let signal: AbortSignal | undefined;
  context.mock.method(globalThis, 'fetch', (_url: string, init: RequestInit) => {
    signal = init.signal as AbortSignal;
    return new Promise((_resolve, reject) => signal!.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
  });
  const request = fetchCloudProgress();
  const failure = assert.rejects(request, /云端存档加载超时/);
  context.mock.timers.tick(19_999);
  assert.equal(signal?.aborted, false);
  context.mock.timers.tick(1);
  await failure;
  assert.equal(signal?.aborted, true);
  assert.equal(getToken(), 'retained-account-token');
});

test('the progress timeout also covers a stalled response body', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let bodyStarted: () => void = () => {};
  const bodyRequested = new Promise<void>(resolve => { bodyStarted = resolve; });
  context.mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => ({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    text: () => {
      bodyStarted();
      return new Promise((_resolve, reject) => init.signal!.addEventListener('abort', () => reject(new Error('aborted body')), { once: true }));
    },
  }));
  const request = fetchCloudProgress();
  const failure = assert.rejects(request, /云端存档加载超时/);
  await bodyRequested;
  context.mock.timers.tick(20_000);
  await failure;
  assert.equal(getToken(), 'retained-account-token');
});

test('progress preserves server errors instead of misreporting them as timeouts', async context => {
  context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: 'original server error' }), {
    status: 500, headers: { 'content-type': 'application/json' },
  }));
  await assert.rejects(fetchCloudProgress(), /original server error/);
  assert.equal(getToken(), 'retained-account-token');
});
