import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { DATABASE_MIGRATIONS } from '../api/_migrations';
import { issueToken } from '../api/_auth';
import { CHEST_REWARD_CONFIG, CHEST_SHARD_REWARD_POOL } from '../shared/rewards';
import { BALANCE_LAB_LEVEL_DRAFTS } from '../src/td/balanceDraft.generated';
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
let garden: Handler;
let tasks: Handler;
let upgrade: Handler;
let submissions: Handler;
let shop: Handler;
let transactionTail = Promise.resolve();
let transactionBarrier: (() => Promise<void>) | null = null;

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
      await transactionBarrier?.();
      const previous = transactionTail;
      let release: () => void = () => {};
      transactionTail = new Promise<void>(resolve => { release = resolve; });
      await previous;
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
      } finally { release(); }
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
  garden = (await server.ssrLoadModule('/api/garden.ts')).default;
  tasks = (await server.ssrLoadModule('/api/tasks.ts')).default;
  upgrade = (await server.ssrLoadModule('/api/upgrade.ts')).default;
  submissions = (await server.ssrLoadModule('/api/level-submissions.ts')).default;
  shop = (await server.ssrLoadModule('/api/shop.ts')).default;
});

beforeEach(async () => {
  if (!modulePath) return;
  await db.exec('ALTER TABLE player_notifications DROP CONSTRAINT IF EXISTS reject_champion');
  await db.exec('ALTER TABLE inventory_shards DROP CONSTRAINT IF EXISTS reject_shop_delivery');
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

async function campaignBody(levelId='L15', difficulty='EZ', challenges: string[]=[], pid='a') {
  const draft = BALANCE_LAB_LEVEL_DRAFTS.find(draft => draft.sourceLevelId===levelId && draft.difficulty===difficulty)!;
  assert.ok(draft);
  if (draft.levelNumber>1) await db.query(`INSERT INTO player_progress(player_id,level_id,max_star)
    VALUES ($1,$2,3) ON CONFLICT(player_id,level_id) DO NOTHING`,[pid,`L${draft.levelNumber-1}`]);
  if (difficulty==='AT') await db.query(`INSERT INTO player_progress(player_id,level_id,max_star,in_full_health_clear)
    VALUES ($1,$2,3,TRUE) ON CONFLICT(player_id,level_id) DO UPDATE SET in_full_health_clear=TRUE`,[pid,levelId]);
  const started=await request(progress,{ action:'startCampaignRun',levelId,difficulty,challenges },{},pid);
  assert.equal(started.status,200,JSON.stringify(started.data));
  await db.query(`UPDATE campaign_runs SET started_at=NOW()-INTERVAL '1 day' WHERE player_id=$1`,[pid]);
  return { action:'setStar',runId:started.data.runId,levelId,difficulty,
    star:difficulty==='EZ' ? 1 : difficulty==='HD' ? 2 : 3,
    endLives:challenges.includes('halfHealth') ? Math.max(1,Math.ceil(draft.lives/2)) : draft.lives,
    wavesCleared:draft.waves.length };
}

async function raceRequests(handler: Handler,bodies: Record<string,unknown>[]) {
  let arrivals=0;
  let allArrived: () => void=()=>{};
  let release: () => void=()=>{};
  const ready=new Promise<void>(resolve=>{allArrived=resolve;});
  const gate=new Promise<void>(resolve=>{release=resolve;});
  transactionBarrier=()=>{ if (++arrivals===bodies.length) allArrived(); return gate; };
  const calls=bodies.map(body=>request(handler,body));
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([ready,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('transaction barrier timed out')),5000);})]);
  } finally { clearTimeout(timeout); transactionBarrier=null; release(); }
  return Promise.all(calls);
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
  const inClear = await request(progress, await campaignBody('L15','IN'));
  assert.equal(inClear.status, 200);
  assert.ok(!inClear.data.newUnlocks.includes('fourLeafClover'));
  const atClear = await request(progress, await campaignBody('L15','AT'));
  assert.equal(atClear.status, 200);
  assert.deepEqual(atClear.data.newUnlocks, ['fourLeafClover']);
  assert.equal(atClear.data.atCleared, true);
  const repeat = await request(progress, await campaignBody('L15','AT'));
  assert.equal(repeat.status, 200);
  assert.deepEqual(repeat.data.newUnlocks, []);
  assert.equal((await db.query(`SELECT * FROM unlocked_items WHERE player_id='a' AND item_id='fourLeafClover' AND unlocked=TRUE`)).rows.length, 1);
});

test('2-7 EZ, HD and IN settle progress, rewards and fractional challenges together', options, async () => {
  let expectedCoins = 0;
  for (const [index, difficulty] of ['EZ', 'HD', 'IN'].entries()) {
    const result = await request(progress, await campaignBody('L15',difficulty,['fullHealth','halfHealth']));
    assert.equal(result.status, 200, JSON.stringify(result.data));
    assert.equal(result.data.star, index + 1);
    assert.equal(result.data.newRecord, true);
    assert.equal(result.data.diamondReward, 1);
    expectedCoins += result.data.rewardCoins;
    const saved = (await db.query(`SELECT * FROM player_progress WHERE player_id='a' AND level_id='L15'`)).rows[0];
    assert.equal(saved.max_star, index + 1);
    assert.equal(saved.in_full_health_clear, difficulty === 'IN');
    assert.equal(Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='a'`)).rows[0].coins), expectedCoins);
  }
  assert.equal((await db.query(`SELECT * FROM chests WHERE player_id='a'`)).rows.length, 3);
  assert.equal((await db.query(`SELECT * FROM campaign_clear_claims WHERE player_id='a'`)).rows.length, 3);
});

test('retries return the exact campaign reward once even after a later difficulty clear', options, async () => {
  const body = await campaignBody('L15','EZ',['halfHealth']);
  const first = await request(progress, body);
  const second = await request(progress, body);
  assert.equal(first.status, 200, JSON.stringify(first.data));
  assert.deepEqual(second.data, first.data);
  assert.equal((await db.query(`SELECT * FROM chests WHERE player_id='a'`)).rows.length, 1);
  assert.equal(Number((await db.query(`SELECT diamonds FROM player_wallet WHERE player_id='a'`)).rows[0].diamonds), 5.5);
  const harder = await request(progress, await campaignBody('L15','HD'));
  const retry = await request(progress, body);
  assert.deepEqual(retry.data, first.data);
  assert.equal(Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='a'`)).rows[0].coins), first.data.rewardCoins + harder.data.rewardCoins);
  assert.equal((await db.query(`SELECT max_star FROM player_progress WHERE player_id='a' AND level_id='L15'`)).rows[0].max_star, 2);
});

test('campaign failures roll back every reward and can safely retry the same clear', options, async () => {
  await db.exec(`INSERT INTO tower_levels(player_id,tower_type,level) VALUES ('a','bottleGrass',27);
    ALTER TABLE chests ADD CONSTRAINT reject_campaign_chest CHECK (chest_id NOT LIKE 'c_%')`);
  const body = await campaignBody('L15','AT',['fullHealth','halfHealth']);
  try {
    const failed = await request(progress, body);
    assert.equal(failed.status, 500);
    assert.equal((await db.query(`SELECT at_cleared FROM player_progress WHERE player_id='a' AND level_id='L15'`)).rows[0].at_cleared,false);
    assert.equal((await db.query(`SELECT completed FROM campaign_runs WHERE player_id='a'`)).rows[0].completed,false);
    assert.equal((await db.query(`SELECT * FROM campaign_clear_claims WHERE player_id='a'`)).rows.length, 0);
    assert.equal((await db.query(`SELECT * FROM unlocked_items WHERE player_id='a' AND item_id='fourLeafClover'`)).rows.length, 0);
    assert.equal(Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='a'`)).rows[0].coins), 0);
    assert.equal((await db.query(`SELECT level FROM tower_levels WHERE player_id='a' AND tower_type='bottleGrass'`)).rows[0].level, 27);
  } finally { await db.exec('ALTER TABLE chests DROP CONSTRAINT reject_campaign_chest'); }
  const retried = await request(progress, body);
  assert.equal(retried.status, 200, JSON.stringify(retried.data));
  assert.equal(retried.data.atFirstClear, true);
  assert.equal(retried.data.diamondReward, 2);
  assert.deepEqual(retried.data.newUnlocks, ['fourLeafClover']);
});

test('campaign chest capacity is enforced atomically without blocking coins or progress', options, async () => {
  for (let index = 0; index < 20; index++) await db.query(`INSERT INTO chests(chest_id,player_id,status) VALUES ($1,'a','locked')`, [`full-${index}`]);
  const result = await request(progress, await campaignBody('L15','AT'));
  assert.equal(result.status, 200, JSON.stringify(result.data));
  assert.equal(result.data.chestInventoryFull, true);
  assert.deepEqual(result.data.chestTypes, []);
  assert.ok(result.data.rewardCoins >= 5000);
  assert.equal(result.data.atCleared, true);
  assert.equal((await db.query(`SELECT * FROM chests WHERE player_id='a'`)).rows.length, 20);
});

test('campaign requests with new clear IDs still earn the existing repeat rewards', options, async context => {
  context.mock.method(Math, 'random', () => 0.75);
  for (const [index, difficulty] of ['EZ', 'HD', 'IN', 'AT'].entries()) {
    const star = Math.min(3, index + 1);
    const first = await request(progress, await campaignBody('L15',difficulty));
    const replay = await request(progress, await campaignBody('L15',difficulty));
    assert.equal(replay.status, 200, JSON.stringify(replay.data));
    assert.equal(replay.data.newRecord, false);
    assert.deepEqual(replay.data.chestTypes, difficulty === 'IN' ? ['common', 'common'] : difficulty === 'AT' ? ['rare', 'rare'] : ['common']);
    if (difficulty !== 'AT') assert.equal(replay.data.rewardCoins, star === 1 ? first.data.rewardCoins : Math.floor(first.data.rewardCoins * 0.5));
  }
});

test('campaign retry records stay bounded and are removed with the account', options, async () => {
  let oldest: Record<string,unknown>={};
  for (let index = 0; index < 22; index++) {
    const body=await campaignBody();
    if (index===0) oldest=body;
    const result = await request(progress, body);
    assert.equal(result.status, 200, JSON.stringify(result.data));
  }
  assert.equal((await db.query(`SELECT * FROM campaign_clear_claims WHERE player_id='a'`)).rows.length, 20);
  assert.equal((await request(progress,oldest)).status,409);
  const other = await request(progress,await campaignBody('L15','EZ',[],'b'),{},'b');
  assert.equal(other.data.newRecord, true);
  await request(progress, { action: 'deleteAccount', confirm: true });
  assert.equal((await db.query(`SELECT * FROM campaign_clear_claims WHERE player_id='a'`)).rows.length, 0);
  assert.equal((await db.query(`SELECT * FROM campaign_clear_claims WHERE player_id='b'`)).rows.length, 1);
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

test('direct fake clears, empty drafts and locked difficulties cannot create progress or rewards',options,async()=>{
  for (const body of [
    {action:'setStar',levelId:'L1',difficulty:'EZ',star:3,fullHealth:true,challengeDiamonds:9999},
    {action:'setStar',levelId:'L999',difficulty:'AT',star:3,clearId:'fake'},
    {action:'startCampaignRun',levelId:'L48',difficulty:'EZ'},
    {action:'startCampaignRun',levelId:'L15',difficulty:'IN'},
    {action:'startCampaignRun',levelId:'L1',difficulty:'AT'},
    {action:'startCampaignRun',levelId:'L1',difficulty:'EZ',challenges:['halfHealth','halfHealth']},
  ]) assert.ok((await request(progress,body)).status>=400);
  assert.equal((await db.query(`SELECT * FROM player_progress`)).rows.length,0);
  assert.equal((await db.query(`SELECT * FROM chests`)).rows.length,0);
  assert.equal(Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='a'`)).rows[0].coins),0);
});

test('session ownership, duration, waves and difficulty are checked; client rewards are ignored',options,async()=>{
  const body=await campaignBody('L1','EZ');
  assert.equal((await request(progress,body,{},'b')).status,409);
  await db.exec(`UPDATE campaign_runs SET started_at=NOW()`);
  assert.equal((await request(progress,body)).status,400);
  await db.exec(`UPDATE campaign_runs SET started_at=NOW()-INTERVAL '1 hour'`);
  for(const override of [{difficulty:'IN'},{star:3},{levelId:'L2'},{wavesCleared:999},{endLives:999},{endLives:0}]) {
    assert.equal((await request(progress,{...body,...override})).status,400);
  }
  const valid=await request(progress,{...body,fullHealth:true,challengeDiamonds:99999});
  assert.equal(valid.status,200,JSON.stringify(valid.data));
  assert.equal(valid.data.diamondReward,0);
  assert.equal(valid.data.fullHealthClear,false);
});

test('simultaneous settlement retries pay exactly once',options,async()=>{
  const body=await campaignBody('L1','EZ',['fullHealth','halfHealth','elementless','twilightForest']);
  const results=await raceRequests(progress,[body,body]);
  assert.ok(results.every(result=>result.status===200),JSON.stringify(results));
  assert.deepEqual(results[0].data,results[1].data);
  assert.equal(results[0].data.diamondReward,3);
  assert.equal(Number((await db.query(`SELECT diamonds FROM player_wallet WHERE player_id='a'`)).rows[0].diamonds),8);
  assert.equal((await db.query(`SELECT * FROM chests`)).rows.length,1);
});

test('overlapping single and bulk chest opens cannot duplicate rewards',options,async()=>{
  await db.exec(`INSERT INTO chests(chest_id,player_id,status,coin_reward) VALUES ('one','a','ready',500)`);
  const results=await raceRequests(chest,[{action:'open',chestId:'one'},{action:'openAll'}]);
  assert.deepEqual(results.map(result=>result.status).sort(),[200,409]);
  assert.equal(Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='a'`)).rows[0].coins),500);
  assert.equal((await db.query(`SELECT * FROM chests`)).rows.length,0);
});

test('failed chest credits preserve the chest and all other rewards',options,async()=>{
  await db.exec(`INSERT INTO chests(chest_id,player_id,status,coin_reward) VALUES ('one','a','ready',500);
    ALTER TABLE player_wallet ADD CONSTRAINT reject_credit CHECK (coins<500)`);
  try {
    assert.equal((await request(chest,{action:'open',chestId:'one'})).status,500);
    assert.equal((await db.query(`SELECT * FROM chests WHERE chest_id='one'`)).rows.length,1);
    assert.equal((await db.query(`SELECT * FROM inventory_shards`)).rows.length,0);
  } finally {await db.exec(`ALTER TABLE player_wallet DROP CONSTRAINT reject_credit`);}
  assert.equal((await request(chest,{action:'open',chestId:'one'})).status,200);
});

test('concurrent skipping and crafting consume currency or materials once',options,async()=>{
  await db.exec(`UPDATE player_wallet SET coins=100000,diamonds=100 WHERE player_id='a';
    INSERT INTO chests(chest_id,player_id,status,unlock_ready_at) VALUES ('skip','a','unlocking',NOW()+INTERVAL '1 hour')`);
  const skipped=await raceRequests(chest,[{action:'skip',chestId:'skip',currency:'coins'},{action:'skip',chestId:'skip',currency:'coins'}]);
  const paid=skipped.filter(result=>result.status===200);
  assert.equal(paid.length,1,JSON.stringify(skipped));
  assert.equal(Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='a'`)).rows[0].coins),100000-paid[0].data.cost);
  for(const [type,count] of [['epic',2],['rare',5],['common',10]] as const) {
    for(let i=0;i<count;i++) await db.query(`INSERT INTO chests(chest_id,player_id,chest_type) VALUES ($1,'a',$2)`,[`${type}-${i}`,type]);
  }
  const crafted=await raceRequests(chest,[{action:'craftLegendary'},{action:'craftLegendary'}]);
  assert.deepEqual(crafted.map(result=>result.status).sort(),[200,409]);
  assert.equal((await db.query(`SELECT * FROM chests WHERE chest_type='legendary'`)).rows.length,1);
});

test('single and bulk harvests share atomic consumption and preserve immature crops',options,async()=>{
  await db.exec(`INSERT INTO player_garden(player_id) VALUES ('a');
    INSERT INTO garden_plots(player_id,plot_index,seed_type,target_item,ready_at) VALUES
      ('a',0,'plant','bottleGrass',NOW()-INTERVAL '1 hour'),('a',1,'chest',NULL,NOW()+INTERVAL '1 hour')`);
  const results=await raceRequests(garden,[{action:'harvest',plotIndex:0},{action:'harvestAll'}]);
  assert.deepEqual(results.map(result=>result.status).sort(),[200,409],JSON.stringify(results));
  assert.equal((await db.query(`SELECT shards FROM inventory_shards WHERE player_id='a' AND tower_type='bottleGrass'`)).rows[0].shards,1);
  assert.deepEqual((await db.query(`SELECT plot_index FROM garden_plots`)).rows.map(row=>row.plot_index),[1]);
});

test('harvest rollback leaves mature crop available; a full chest inventory does not consume chest crops',options,async()=>{
  await db.exec(`INSERT INTO player_garden(player_id) VALUES ('a');
    INSERT INTO garden_plots(player_id,plot_index,seed_type,ready_at) VALUES ('a',0,'chest',NOW()-INTERVAL '1 hour');
    ALTER TABLE chests ADD CONSTRAINT reject_harvest CHECK (chest_id NOT LIKE 'c_%')`);
  try {
    assert.equal((await request(garden,{action:'harvestAll'})).status,500);
    assert.equal((await db.query(`SELECT * FROM garden_plots`)).rows.length,1);
  } finally {await db.exec(`ALTER TABLE chests DROP CONSTRAINT reject_harvest`);}
  for(let i=0;i<20;i++) await db.query(`INSERT INTO chests(chest_id,player_id) VALUES ($1,'a')`,[`full-${i}`]);
  assert.equal((await request(garden,{action:'harvest',plotIndex:0})).status,400);
  assert.equal((await db.query(`SELECT * FROM garden_plots`)).rows.length,1);
});

test('daily practice refuses a self-reported score and pays only one verified round',options,async()=>{
  assert.equal((await request(tasks,{action:'completeDailyPractice',correct:50})).status,400);
  const started=await request(tasks,{action:'startDailyPractice'});
  assert.equal(started.status,200,JSON.stringify(started.data));
  assert.equal(started.data.questions.length,50);
  assert.ok(started.data.questions.every((question:any)=>question.correctIndex===undefined));
  const stored=(await db.query(`SELECT questions FROM practice_runs WHERE player_id='a'`)).rows[0].questions;
  const body={action:'completeDailyPractice',runId:started.data.runId,answers:stored.map((q:any)=>q.correctIndex),correct:0};
  assert.equal((await request(tasks,body)).status,400);
  assert.equal((await request(tasks,body,{},'b')).status,409);
  await db.exec(`UPDATE practice_runs SET started_at=NOW()-INTERVAL '1 hour'`);
  const results=await raceRequests(tasks,[body,body]);
  assert.ok(results.every(result=>result.status===200),JSON.stringify(results));
  assert.equal(Number((await db.query(`SELECT experience FROM player_wallet WHERE player_id='a'`)).rows[0].experience),10);
  assert.equal(Number((await db.query(`SELECT diamonds FROM player_wallet WHERE player_id='a'`)).rows[0].diamonds),6);
  assert.equal((await request(tasks)).data.dailyPracticeRuns,1);
  const next=await request(tasks,{action:'startDailyPractice'});
  const nextStored=(await db.query(`SELECT questions FROM practice_runs WHERE player_id='a'`)).rows[0].questions;
  await db.exec(`UPDATE practice_runs SET started_at=NOW()-INTERVAL '1 hour'`);
  const second=await request(tasks,{action:'completeDailyPractice',runId:next.data.runId,answers:nextStored.map(()=>4),correct:50});
  assert.equal(second.status,200,JSON.stringify(second.data));
  assert.equal(second.data.runReward.diamonds,0);
  assert.equal((await request(tasks)).data.dailyPracticeRuns,2);
});

test('task claims and upgrades resist stale concurrent requests',options,async()=>{
  const claims=await raceRequests(tasks,[{action:'claim',taskId:'dailySignIn'},{action:'claim',taskId:'dailySignIn'}]);
  assert.deepEqual(claims.map(result=>result.status).sort(),[200,400],JSON.stringify(claims));
  const paid=claims.find(result=>result.status===200)!;
  assert.equal(Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='a'`)).rows[0].coins),paid.data.claimedReward.coins);
  assert.equal((await request(upgrade,{action:'upgrade',towerType:'madeUp'})).status,400);
  assert.equal((await request(upgrade,{action:'upgrade',towerType:'sniper'})).status,403);
  await db.exec(`UPDATE player_wallet SET coins=1000 WHERE player_id='a';
    INSERT INTO unlocked_items(player_id,item_id,unlocked) VALUES ('a','bottleGrass',TRUE);
    INSERT INTO inventory_shards(player_id,tower_type,shards) VALUES ('a','bottleGrass',5)`);
  const upgraded=await raceRequests(upgrade,[{action:'upgrade',towerType:'bottleGrass'},{action:'upgrade',towerType:'bottleGrass'}]);
  assert.deepEqual(upgraded.map(result=>result.status).sort(),[200,409],JSON.stringify(upgraded));
  assert.equal((await db.query(`SELECT level FROM tower_levels WHERE player_id='a' AND tower_type='bottleGrass'`)).rows[0].level,2);
  assert.equal(Number((await db.query(`SELECT coins FROM player_wallet WHERE player_id='a'`)).rows[0].coins),900);
  assert.equal((await db.query(`SELECT shards FROM inventory_shards WHERE player_id='a'`)).rows[0].shards,0);
});

test('daily shop persists one set per player/day and refreshes at Beijing midnight', options, async () => {
  const first = await request(shop);
  assert.equal(first.status, 200, JSON.stringify(first.data));
  assert.equal(first.data.products.length, 4);
  assert.ok(first.data.products.every((product: any) => !product.purchased));
  const repeated = await request(shop);
  assert.deepEqual(repeated.data, first.data);
  const stored = (await db.query(`SELECT shop_date::text AS day,
    ((shop_date+1)::timestamp AT TIME ZONE 'Asia/Shanghai') AS refresh FROM player_daily_shop WHERE player_id='a'`)).rows[0];
  assert.equal(first.data.dayKey, stored.day);
  assert.equal(first.data.refreshAt, new Date(stored.refresh).toISOString());
  const boundaries = (await db.query(`SELECT
    ('2026-11-25T15:59:59Z'::timestamptz AT TIME ZONE 'Asia/Shanghai')::date::text AS before,
    ('2026-11-25T16:00:00Z'::timestamptz AT TIME ZONE 'Asia/Shanghai')::date::text AS after`)).rows[0];
  assert.deepEqual(boundaries, { before: '2026-11-25', after: '2026-11-26' });
  assert.equal((await request(shop, undefined, {}, 'b')).status, 200);
  assert.equal((await db.query('SELECT COUNT(*)::integer AS count FROM player_daily_shop')).rows[0].count, 2);
});

test('shop purchases credit exact shards, debit the matching currency and do not unlock items', options, async () => {
  await db.exec(`UPDATE player_wallet SET coins=20000, diamonds=10.5, experience=30 WHERE player_id='a'`);
  let state = (await request(shop)).data;
  const plant = state.products[0];
  const element = state.products[3];
  const plantResult = await request(shop, { action: 'purchase', productId: plant.id, dayKey: state.dayKey,
    price: 0, amount: 999999, itemId: 'sniper', playerId: 'b', currency: 'diamonds' });
  assert.equal(plantResult.status, 200, JSON.stringify(plantResult.data));
  state = plantResult.data;
  assert.equal(state.coins, 20000 - plant.price);
  assert.equal(state.diamonds, 10.5);
  assert.equal(state.products[0].purchased, true);
  const elementResult = await request(shop, { action: 'purchase', productId: element.id, dayKey: state.dayKey });
  assert.equal(elementResult.status, 200, JSON.stringify(elementResult.data));
  assert.equal(elementResult.data.coins, state.coins);
  assert.equal(elementResult.data.diamonds, 10.5 - element.price);
  assert.equal(elementResult.data.experience, 30);
  const inventory = (await db.query(`SELECT tower_type, shards FROM inventory_shards WHERE player_id='a'`)).rows;
  assert.equal(Number(inventory.find(row => row.tower_type === plant.itemId)!.shards), plant.amount);
  assert.equal(Number(inventory.find(row => row.tower_type === element.itemId)!.shards), element.amount);
  assert.equal((await db.query(`SELECT COUNT(*)::integer AS count FROM inventory_shards WHERE player_id='b'`)).rows[0].count, 0);
  assert.equal((await db.query(`SELECT COUNT(*)::integer AS count FROM unlocked_items`)).rows[0].count, 0);
  assert.equal((await db.query(`SELECT COUNT(*)::integer AS count FROM shop_purchases`)).rows[0].count, 0);
  assert.deepEqual((await request(shop)).data, elementResult.data);
});

test('daily shop rejects duplicate and simultaneous purchases without duplicate deductions or delivery', options, async () => {
  await db.exec(`UPDATE player_wallet SET coins=20000, diamonds=10 WHERE player_id='a'`);
  const state = (await request(shop)).data;
  const product = state.products[0];
  const body = { action: 'purchase', productId: product.id, dayKey: state.dayKey };
  const responses = await raceRequests(shop, [body, body]);
  assert.deepEqual(responses.map(result => result.status).sort(), [200, 409], JSON.stringify(responses));
  assert.equal((await request(shop, body)).status, 409);
  const latest = (await request(shop)).data;
  assert.equal(latest.coins, 20000 - product.price);
  assert.equal((await db.query(`SELECT shards FROM inventory_shards WHERE player_id='a'`)).rows[0].shards, product.amount);
  const distinct = await raceRequests(shop, [state.products[1], state.products[2]].map(product => (
    { action: 'purchase', productId: product.id, dayKey: state.dayKey }
  )));
  assert.ok(distinct.every(result => result.status === 200), JSON.stringify(distinct));
  const final = (await request(shop)).data;
  assert.deepEqual(final.products.map((product: any) => product.purchased), [true, true, true, false]);
  assert.equal(final.coins, 20000 - state.products.slice(0, 3).reduce((sum: number, product: any) => sum + product.price, 0));
});

test('daily shop insufficient balance and invalid or removed products cannot claim shards or consume purchase slots', options, async () => {
  await db.exec(`UPDATE player_wallet SET diamonds=0 WHERE player_id='a'`);
  const state = (await request(shop)).data;
  for (const product of [state.products[0], state.products[3]]) {
    const denied = await request(shop, { action: 'purchase', productId: product.id, dayKey: state.dayKey });
    assert.equal(denied.status, 409, JSON.stringify(denied.data));
    assert.equal(denied.data.shop.products.find((item: any) => item.id === product.id).purchased, false);
  }
  for (const productId of ['yogurtCup', 'plantShardBox', 'elementShardBox', 'daily-plant-9', '__proto__']) {
    assert.equal((await request(shop, { action: 'purchase', productId, dayKey: state.dayKey })).status, 400);
  }
  assert.equal((await request(shop, { action: 'purchase', productId: state.products[0].id })).status, 400);
  assert.equal((await request(shop, { action: 'purchase', productId: state.products[0].id, dayKey: '2026-99-99' })).status, 409);
  assert.equal((await db.query('SELECT COUNT(*)::integer AS count FROM inventory_shards')).rows[0].count, 0);
  await db.exec(`UPDATE player_wallet SET coins=20000, diamonds=10 WHERE player_id='a'`);
  assert.equal((await request(shop, { action: 'purchase', productId: state.products[0].id, dayKey: state.dayKey })).status, 200);
});

test('next-day shop replaces the same row and stale orders never purchase new offers', options, async () => {
  await db.exec(`UPDATE player_wallet SET coins=20000, diamonds=10 WHERE player_id='a'`);
  const state = (await request(shop)).data;
  await db.exec(`UPDATE player_daily_shop SET shop_date=shop_date-1, purchased_mask=15 WHERE player_id='a'`);
  const oldDate = (await db.query(`SELECT shop_date::text AS day FROM player_daily_shop WHERE player_id='a'`)).rows[0].day;
  const expired = await request(shop, { action: 'purchase', productId: state.products[0].id, dayKey: oldDate });
  assert.equal(expired.status, 409, JSON.stringify(expired.data));
  assert.match(expired.data.error, /已刷新/);
  assert.equal(expired.data.shop.dayKey, state.dayKey);
  assert.ok(expired.data.shop.products.every((product: any) => !product.purchased));
  assert.equal(expired.data.shop.coins, 20000);
  assert.equal((await db.query(`SELECT COUNT(*)::integer AS count FROM inventory_shards`)).rows[0].count, 0);
  assert.equal((await db.query('SELECT COUNT(*)::integer AS count FROM player_daily_shop')).rows[0].count, 1);
  const product = expired.data.shop.products[0];
  assert.equal((await request(shop, { action: 'purchase', productId: product.id, dayKey: state.dayKey })).status, 200);
});

test('failed shard delivery rolls back daily shop debit and purchase flag; account deletion cleans shop state', options, async () => {
  await db.exec(`UPDATE player_wallet SET coins=20000, diamonds=10 WHERE player_id='a'`);
  const state = (await request(shop)).data;
  const product = state.products[0];
  await db.exec(`ALTER TABLE inventory_shards ADD CONSTRAINT reject_shop_delivery CHECK (player_id <> 'a')`);
  const failed = await request(shop, { action: 'purchase', productId: product.id, dayKey: state.dayKey });
  assert.equal(failed.status, 500);
  assert.deepEqual((await request(shop)).data, state);
  await db.exec('ALTER TABLE inventory_shards DROP CONSTRAINT reject_shop_delivery');
  assert.equal((await request(shop, { action: 'purchase', productId: product.id, dayKey: state.dayKey })).status, 200);
  const removed = await request(progress, { action: 'deleteAccount', confirm: true });
  assert.equal(removed.status, 200, JSON.stringify(removed.data));
  assert.equal((await db.query('SELECT COUNT(*)::integer AS count FROM player_daily_shop')).rows[0].count, 0);
});

test('the published admin password cannot review submissions and missing private configuration fails closed',options,async()=>{
  const original=process.env.ADMIN_PASSWORD;
  try {
    Reflect.deleteProperty(process.env,'ADMIN_PASSWORD');
    assert.equal((await request(submissions,{action:'list',password:'csx081028'})).status,503);
    process.env.ADMIN_PASSWORD='short7!';
    const tooShort=await request(submissions,{action:'list',password:process.env.ADMIN_PASSWORD});
    assert.equal(tooShort.status,503);
    assert.match(tooShort.data.error,/至少8个字符/);
    process.env.ADMIN_PASSWORD='test8pwd';
    assert.equal((await request(submissions,{action:'list',password:'wrongpwd'})).status,401);
    assert.equal((await request(submissions,{action:'list',password:process.env.ADMIN_PASSWORD})).status,200);
    process.env.ADMIN_PASSWORD='new-private-secret-for-test';
    assert.equal((await request(submissions,{action:'list',password:'csx081028'})).status,401);
    assert.equal((await request(submissions,{action:'list',password:process.env.ADMIN_PASSWORD})).status,200);
  } finally {
    if(original===undefined) Reflect.deleteProperty(process.env,'ADMIN_PASSWORD'); else process.env.ADMIN_PASSWORD=original;
  }
});
