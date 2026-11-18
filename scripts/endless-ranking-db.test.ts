import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { DATABASE_MIGRATIONS } from '../api/_migrations';
import { issueToken } from '../api/_auth';
import { CHEST_REWARD_CONFIG, CHEST_SHARD_REWARD_POOL } from '../shared/rewards';
import type { VercelRequest, VercelResponse } from '@vercel/node';

type Db = { exec: (sql: string) => Promise<unknown>; query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, any>[] }>; close: () => Promise<void> };
type Query = { text: string; params: unknown[] };
type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown>;
const modulePath = process.env.TD_TEST_PGLITE;
let db: Db;
let server: ViteDevServer;
let progress: Handler;
let ranking: Handler;
let chest: Handler;

function queuedSql(strings: TemplateStringsArray, ...params: unknown[]): Query {
  return { text: strings.reduce((text, part, index) => text + part + (index < params.length ? `$${index + 1}` : ''), ''), params };
}

before(async () => {
  if (!modulePath) return;
  const { PGlite } = await import(pathToFileURL(modulePath).href);
  db = new PGlite() as Db;
  for (const migration of DATABASE_MIGRATIONS) for (const statement of migration.statements) await db.exec(statement);
  const execute = async (query: Query) => {
    return (await db.query(query.text, query.params)).rows;
  };
  const sql = Object.assign(async (strings: TemplateStringsArray, ...params: unknown[]) => execute(queuedSql(strings, ...params)), {
    query: (text: string, params: unknown[] = []) => execute({ text, params }),
    transaction: async (factory: (tx: unknown) => Query[]) => {
      const tx = Object.assign(queuedSql, { query: (text: string, params: unknown[] = []) => ({ text, params }) });
      await db.exec('BEGIN');
      try {
        const results = [];
        for (const query of factory(tx)) results.push(await execute(query));
        await db.exec('COMMIT');
        return results;
      } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
      }
    },
  });
  Object.assign(globalThis, { __tdRankingTestSql: sql });
  server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom',
    cacheDir: 'node_modules/.vite-ranking-db-tests', optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [{ name: 'isolated-ranking-db', enforce: 'pre',
      resolveId(source, importer) { if (/_db\.(js|ts)$/.test(source) && importer?.replaceAll('\\', '/').includes('/api/')) return '\0ranking-test-db'; },
      load(id) {
        if (id !== '\0ranking-test-db') return;
        return `import crypto from 'node:crypto';
          export const getSql = () => globalThis.__tdRankingTestSql;
          export const ensureTables = async () => {};
          export const ensurePlayer = async () => {};
          export const createId = prefix => prefix + '_' + crypto.randomUUID();`;
      },
    }],
  });
  progress = (await server.ssrLoadModule('/api/progress.ts')).default;
  ranking = (await server.ssrLoadModule('/api/ranking.ts')).default;
  chest = (await server.ssrLoadModule('/api/chest.ts')).default;
});

beforeEach(async () => {
  if (!modulePath) return;
  await db.exec('ALTER TABLE player_notifications DROP CONSTRAINT IF EXISTS reject_champion');
  await db.exec(`TRUNCATE players CASCADE;
    UPDATE endless_ranking_state SET week_start=date_trunc('week', (NOW() AT TIME ZONE 'Asia/Shanghai') + INTERVAL '1 day')::date - 1;
    INSERT INTO players(player_id) VALUES ('a'), ('b');
    INSERT INTO user_accounts(username,password_hash,player_id) VALUES ('Alice','test','a'), ('Bob','test','b');
    INSERT INTO player_wallet(player_id,coins,experience) VALUES ('a',0,0), ('b',0,0);`);
});
after(async () => {
  await server?.close();
  await db?.close();
  Reflect.deleteProperty(globalThis, '__tdRankingTestSql');
});

async function request(handler: Handler, body?: Record<string, unknown>, query: Record<string, string> = {}, pid = 'a') {
  let status = 200;
  let data: any;
  const response = { setHeader() {}, status(code: number) { status = code; return this; }, json(value: unknown) { data = value; return this; } };
  await handler({ method: body ? 'POST' : 'GET', body, query, headers: { authorization: `Bearer ${issueToken({ pid })}` } } as VercelRequest, response as VercelResponse);
  return { status, data };
}

async function finish(waves: number, pid = 'a') {
  const started = await request(progress, { action: 'startEndlessRun' }, {}, pid);
  const runId = started.data.runId;
  await db.query(`UPDATE endless_mode_claims SET started_at=NOW() - INTERVAL '1 day' WHERE player_id=$1`, [pid]);
  const result = await request(progress, { action: 'claimEndlessReward', runId, wavesCleared: waves }, {}, pid);
  assert.equal(result.status, 200, JSON.stringify(result.data));
  return { ...result, runId };
}

async function dueWeek() {
  await db.exec(`UPDATE endless_ranking_state SET week_start=week_start - 7`);
}

const options = { skip: !modulePath };
test('higher endless records replace the best; lower and equal scores preserve it', options, async () => {
  const result = await finish(70);
  assert.equal(result.data.rewardCoins, 3500);
  assert.equal(Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='a'`)).rows[0].coins), 3500);
  const first = (await db.query(`SELECT * FROM endless_weekly_records WHERE player_id='a'`)).rows[0];
  await finish(30);
  await finish(70);
  const unchanged = (await db.query(`SELECT * FROM endless_weekly_records WHERE player_id='a'`)).rows[0];
  assert.equal(unchanged.best_waves, 70);
  assert.equal(String(unchanged.achieved_at), String(first.achieved_at));
  await finish(100);
  assert.equal((await db.query(`SELECT best_waves FROM endless_weekly_records WHERE player_id='a'`)).rows[0].best_waves, 100);
  assert.equal((await request(ranking, undefined, { board: 'endless' })).data.ranking[0].value, 100);
});

test('voluntary exits cannot claim rewards or save a leaderboard record', options, async () => {
  const started = await request(progress, { action: 'startEndlessRun' });
  const runId = started.data.runId;
  await request(progress, { action: 'abandonEndlessRun', runId });
  const claim = await request(progress, { action: 'claimEndlessReward', runId, wavesCleared: 100 });
  assert.equal(claim.status, 409);
  assert.equal(Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='a'`)).rows[0].coins), 0);
  assert.equal((await db.query(`SELECT * FROM endless_weekly_records`)).rows.length, 0);
});

test('weekly settlement pays exactly once, clears only endless records, and notifications delete after acknowledgement', options, async () => {
  await db.exec(`INSERT INTO endless_weekly_records(player_id,best_waves,achieved_at) VALUES ('a',192,NOW() - INTERVAL '1 hour'),('b',100,NOW());
    INSERT INTO player_progress(player_id,level_id,max_star) VALUES ('a','L1',3);`);
  await dueWeek();
  assert.equal((await request(ranking, undefined, { board: 'endless' })).data.ranking.length, 0);
  let wallet = (await db.query(`SELECT coins,experience FROM player_wallet WHERE player_id='a'`)).rows[0];
  assert.equal(Number(wallet.coins), 20000);
  assert.equal(Number(wallet.experience), 100);
  await request(ranking, undefined, { board: 'endless' });
  wallet = (await db.query(`SELECT coins,experience FROM player_wallet WHERE player_id='a'`)).rows[0];
  assert.equal(Number(wallet.coins), 20000);
  assert.equal((await db.query(`SELECT * FROM player_progress WHERE player_id='a'`)).rows.length, 1);
  const notice = (await request(progress, { action: 'getNextNotification' })).data.notification;
  assert.equal(notice.type, 'endless_weekly_champion');
  assert.equal(notice.payload.bestWaves, 192);
  await request(progress, { action: 'markNotificationRead', notificationId: notice.id });
  assert.equal((await request(progress, { action: 'getNextNotification' })).data.notification, null);
});

test('settlement failures leave wallet, records and the cursor untouched', options, async () => {
  await db.exec(`INSERT INTO endless_weekly_records(player_id,best_waves) VALUES ('a',100)`);
  await dueWeek();
  const before = (await db.query(`SELECT week_start FROM endless_ranking_state`)).rows[0].week_start;
  await db.exec(`ALTER TABLE player_notifications ADD CONSTRAINT reject_champion CHECK (notification_type <> 'endless_weekly_champion')`);
  assert.equal((await request(ranking, undefined, { board: 'endless' })).status, 500);
  assert.equal(Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='a'`)).rows[0].coins), 0);
  assert.equal((await db.query(`SELECT * FROM endless_weekly_records`)).rows.length, 1);
  assert.equal(String((await db.query(`SELECT week_start FROM endless_ranking_state`)).rows[0].week_start), String(before));
  await db.exec('ALTER TABLE player_notifications DROP CONSTRAINT reject_champion');
  assert.equal((await request(ranking, undefined, { board: 'endless' })).status, 200);
  assert.equal(Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='a'`)).rows[0].coins), 20000);
});

test('an already-claimed old run cannot reappear on the new week leaderboard', options, async () => {
  const finished = await finish(192);
  await dueWeek();
  await request(ranking, undefined, { board: 'endless' });
  const before = Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='a'`)).rows[0].coins);
  await request(progress, { action: 'claimEndlessReward', runId: finished.runId, wavesCleared: 192 });
  assert.equal((await db.query(`SELECT * FROM endless_weekly_records`)).rows.length, 0);
  assert.equal(Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='a'`)).rows[0].coins), before);
});

test('full chest inventory does not prevent saving an endless best', options, async () => {
  for (let index = 0; index < 20; index++) await db.query(`INSERT INTO chests(chest_id,player_id) VALUES ($1,'a')`, [`chest-${index}`]);
  const result = await finish(192);
  assert.equal(result.data.chestInventoryFull, true);
  assert.equal(result.data.chestTypes.length, 0);
  assert.equal((await db.query(`SELECT best_waves FROM endless_weekly_records WHERE player_id='a'`)).rows[0].best_waves, 192);
});

test('ties favor the earliest achievement and empty weeks produce no prize', options, async () => {
  await db.exec(`INSERT INTO endless_weekly_records(player_id,best_waves,achieved_at) VALUES ('a',100,NOW()),('b',100,NOW() - INTERVAL '1 hour')`);
  assert.equal((await request(ranking, undefined, { board: 'endless' })).data.ranking[0].username, 'Bob');
  await dueWeek();
  await request(ranking, undefined, { board: 'endless' });
  assert.equal(Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='b'`)).rows[0].coins), 20000);
  await dueWeek();
  await request(ranking, undefined, { board: 'endless' });
  assert.equal((await db.query(`SELECT * FROM player_notifications`)).rows.length, 1);
  assert.equal(Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='b'`)).rows[0].coins), 20000);
});

test('coin and clear boards rank cumulative account values', options, async () => {
  await db.exec(`UPDATE player_wallet SET coins=5000 WHERE player_id='b';
    INSERT INTO player_progress(player_id,level_id,max_star) VALUES ('a','L1',3),('a','L2',1),('b','L1',3);`);
  const clears = await request(ranking, undefined, { board: 'clears' });
  assert.equal(clears.data.ranking[0].username, 'Alice');
  assert.equal(clears.data.ranking[0].value, 2);
  const coins = await request(ranking, undefined, { board: 'coins' });
  assert.equal(coins.data.ranking[0].username, 'Bob');
  assert.equal(coins.data.ranking[0].value, 5000);
});

test('a fresh score after rollover starts a new weekly best and does not erase champion rewards', options, async () => {
  await finish(192);
  const previousCoins = Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='a'`)).rows[0].coins);
  await dueWeek();
  await finish(20);
  assert.equal((await db.query(`SELECT best_waves FROM endless_weekly_records WHERE player_id='a'`)).rows[0].best_waves, 20);
  assert.equal(Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='a'`)).rows[0].coins), previousCoins + 20000 + 1000);
  assert.equal((await db.query(`SELECT * FROM player_notifications`)).rows.length, 1);
});

test('zero cleared waves earn nothing and never enter the leaderboard', options, async () => {
  const result = await finish(0);
  assert.equal(result.data.rewardCoins, 0);
  assert.deepEqual(result.data.chestTypes, []);
  assert.equal((await db.query(`SELECT * FROM endless_weekly_records`)).rows.length, 0);
});

test('delayed exits do not delete a newer run or the previous best', options, async () => {
  const finished = await finish(20);
  const started = await request(progress, { action: 'startEndlessRun' });
  await request(progress, { action: 'abandonEndlessRun', runId: finished.runId });
  assert.equal((await db.query(`SELECT run_id FROM endless_mode_claims WHERE player_id='a'`)).rows[0].run_id, started.data.runId);
  await request(progress, { action: 'abandonEndlessRun', runId: started.data.runId });
  assert.equal((await db.query(`SELECT best_waves FROM endless_weekly_records WHERE player_id='a'`)).rows[0].best_waves, 20);
});

test('champion and submission notices are delivered and removed independently', options, async () => {
  await db.exec(`INSERT INTO player_notifications(notification_id,player_id,notification_type,payload,created_at)
    VALUES ('approved','a','level_submission_approved','{"levelName":"2-7","difficulty":"EZ"}',NOW() - INTERVAL '1 hour');
    INSERT INTO endless_weekly_records(player_id,best_waves) VALUES ('a',100)`);
  await dueWeek();
  const approval = (await request(progress, { action: 'getNextNotification' })).data.notification;
  assert.equal(approval.type, 'level_submission_approved');
  await request(progress, { action: 'markNotificationRead', notificationId: approval.id });
  const champion = (await request(progress, { action: 'getNextNotification' })).data.notification;
  assert.equal(champion.type, 'endless_weekly_champion');
  await request(progress, { action: 'markNotificationRead', notificationId: champion.id });
  assert.equal((await request(progress, { action: 'getNextNotification' })).data.notification, null);
});

test('account deletion removes endless scores and reward records', options, async () => {
  await finish(20);
  assert.equal((await request(progress, { action: 'deleteAccount', confirm: true })).status, 200);
  assert.equal((await db.query(`SELECT * FROM players WHERE player_id='a'`)).rows.length, 0);
  assert.equal((await db.query(`SELECT * FROM endless_weekly_records WHERE player_id='a'`)).rows.length, 0);
  assert.equal((await db.query(`SELECT * FROM endless_mode_claims WHERE player_id='a'`)).rows.length, 0);
});

test('2-7 AT grants four-leaf clover once; IN clears do not grant its AT reward', options, async () => {
  const inClear = await request(progress, { action: 'setStar', levelId: 'L15', star: 3, difficulty: 'IN', fullHealth: true });
  assert.equal(inClear.status, 200);
  assert.ok(!inClear.data.newUnlocks.includes('fourLeafClover'));
  const atClear = await request(progress, { action: 'setStar', levelId: 'L15', star: 3, difficulty: 'AT' });
  assert.equal(atClear.status, 200);
  assert.deepEqual(atClear.data.newUnlocks, ['fourLeafClover']);
  assert.equal(atClear.data.atCleared, true);
  const repeat = await request(progress, { action: 'setStar', levelId: 'L15', star: 3, difficulty: 'AT' });
  assert.equal(repeat.status, 200);
  assert.deepEqual(repeat.data.newUnlocks, []);
  assert.equal((await db.query(`SELECT * FROM unlocked_items WHERE player_id='a' AND item_id='fourLeafClover' AND unlocked=TRUE`)).rows.length, 1);
});

test('every chest quality uses the same uniform plant fragment pool without altering stored coins or roll counts', options, async context => {
  const itemId = 'sniper';
  const random = (CHEST_SHARD_REWARD_POOL.indexOf(itemId) + 0.5) / CHEST_SHARD_REWARD_POOL.length;
  context.mock.method(Math, 'random', () => random);
  for (const chestType of ['common', 'rare', 'epic', 'legendary'] as const) {
    await db.query(`INSERT INTO chests(chest_id,player_id,status,chest_type,coin_reward) VALUES ($1,'a','ready',$2,500)`, [chestType, chestType]);
    const opened = await request(chest, { action: 'open', chestId: chestType });
    const range = CHEST_REWARD_CONFIG[chestType].shardRolls;
    const expectedCount = range.min + Math.floor(random * (range.max - range.min + 1));
    assert.equal(opened.status, 200, JSON.stringify(opened.data));
    assert.equal(opened.data.coins, 500);
    assert.deepEqual(opened.data.shards, { sniper: expectedCount });
    assert.deepEqual(opened.data.plantShards, { sniper: expectedCount });
    assert.deepEqual(opened.data.elementShards, {});
  }
});

test('bulk opening uses the same uniform element pool and only opens ready chests', options, async context => {
  const random = (CHEST_SHARD_REWARD_POOL.indexOf('element:light') + 0.5) / CHEST_SHARD_REWARD_POOL.length;
  context.mock.method(Math, 'random', () => random);
  let expectedCount = 0;
  for (const chestType of ['common', 'rare', 'epic', 'legendary'] as const) {
    await db.query(`INSERT INTO chests(chest_id,player_id,status,chest_type,coin_reward) VALUES ($1,'a','ready',$2,500)`, [chestType, chestType]);
    const range = CHEST_REWARD_CONFIG[chestType].shardRolls;
    expectedCount += range.min + Math.floor(random * (range.max - range.min + 1));
  }
  await db.exec(`INSERT INTO chests(chest_id,player_id,status) VALUES ('locked','a','locked')`);
  const opened = await request(chest, { action: 'openAll' });
  assert.equal(opened.status, 200, JSON.stringify(opened.data));
  assert.equal(opened.data.openedCount, 4);
  assert.equal(opened.data.coins, 2000);
  assert.deepEqual(opened.data.shards, { 'element:light': expectedCount });
  assert.deepEqual(opened.data.elementShards, { light: expectedCount });
  assert.deepEqual(opened.data.plantShards, {});
  assert.equal((await db.query(`SELECT shards FROM inventory_shards WHERE player_id='a' AND tower_type='element:light'`)).rows[0].shards, expectedCount);
  assert.equal((await db.query(`SELECT chest_id FROM chests WHERE player_id='a'`)).rows[0].chest_id, 'locked');
});
