import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensurePlayer, ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { ApiError, getErrorMessage } from './_errors.js';
import { startPracticeRun, validatePracticeRun } from './_practice.js';

const DAILY_BROWSE_TARGET = 15;
const WEEKLY_BROWSE_TARGET = 50;
const WEEKLY_PRACTICE_TARGET = 5;

type Reward = { coins: number; coinsMax?: number; experience: number; diamonds: number };
type TaskState = { complete: boolean; claimed: boolean };
type TaskProgress = {
  dailyKey: string;
  weeklyKey: string;
  browseSeen: number[];
  weeklyBrowseSeen: number[];
  signIn: TaskState;
  browse: TaskState;
  practice: TaskState & { runs: number };
  levelClear: TaskState;
  chestOpen: TaskState;
  weeklyBrowse: TaskState;
  weeklyPractice: TaskState & { runs: number };
};

export type PlayerTaskEvent = 'levelClear' | 'chestOpen';

function beijingDateParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(new Date());
  const read = (type: string) => parts.find(part => part.type === type)?.value ?? '';
  return { year: read('year'), month: read('month'), day: read('day'), weekday: read('weekday') };
}

function getBeijingKeys() {
  const { year, month, day, weekday } = beijingDateParts();
  const dailyKey = `${year}-${month}-${day}`;
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayOffset = Math.max(0, weekdays.indexOf(weekday));
  const date = new Date(`${dailyKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - dayOffset);
  return { dailyKey, weeklyKey: date.toISOString().slice(0, 10) };
}

function freshDaily() {
  return {
    browseSeen: [] as number[],
    signIn: { complete: true, claimed: false },
    browse: { complete: false, claimed: false },
    practice: { complete: false, claimed: false, runs: 0 },
    levelClear: { complete: false, claimed: false },
    chestOpen: { complete: false, claimed: false },
  };
}

function freshWeekly() {
  return {
    weeklyBrowseSeen: [] as number[],
    weeklyBrowse: { complete: false, claimed: false },
    weeklyPractice: { complete: false, claimed: false, runs: 0 },
  };
}

function defaultProgress(): TaskProgress {
  const { dailyKey, weeklyKey } = getBeijingKeys();
  return { dailyKey, weeklyKey, ...freshDaily(), ...freshWeekly() };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readBoolean(value: unknown) {
  return value === true || value === 'true' || value === 1;
}

function readState(value: unknown, complete = false): TaskState {
  const raw = isRecord(value) ? value : {};
  return { complete: complete || readBoolean(raw.complete), claimed: readBoolean(raw.claimed) };
}

function readRuns(value: unknown) {
  const raw = isRecord(value) ? value : {};
  return Math.max(0, Math.min(10_000, Math.floor(Number(raw.runs) || 0)));
}

function readIndexes(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value
    .map(item => Math.floor(Number(item)))
    .filter(item => Number.isFinite(item) && item >= 0 && item < 100_000)))
    .slice(0, limit);
}

function normalizeProgress(value: unknown): TaskProgress {
  const fallback = defaultProgress();
  if (!isRecord(value)) return fallback;
  const keys = getBeijingKeys();
  const dailyCurrent = value.dailyKey === keys.dailyKey;
  const weeklyCurrent = value.weeklyKey === keys.weeklyKey;
  const daily = dailyCurrent
    ? {
        browseSeen: readIndexes(value.browseSeen, DAILY_BROWSE_TARGET),
        signIn: readState(value.signIn, true),
        browse: readState(value.browse),
        practice: { ...readState(value.practice), runs: readRuns(value.practice) },
        levelClear: readState(value.levelClear),
        chestOpen: readState(value.chestOpen),
      }
    : freshDaily();
  daily.browse.complete = daily.browse.complete || daily.browseSeen.length >= DAILY_BROWSE_TARGET;

  const weekly = weeklyCurrent
    ? {
        weeklyBrowseSeen: readIndexes(value.weeklyBrowseSeen, WEEKLY_BROWSE_TARGET),
        weeklyBrowse: readState(value.weeklyBrowse),
        weeklyPractice: { ...readState(value.weeklyPractice), runs: readRuns(value.weeklyPractice) },
      }
    : freshWeekly();
  weekly.weeklyBrowse.complete = weekly.weeklyBrowse.complete || weekly.weeklyBrowseSeen.length >= WEEKLY_BROWSE_TARGET;
  weekly.weeklyPractice.complete = weekly.weeklyPractice.complete || weekly.weeklyPractice.runs >= WEEKLY_PRACTICE_TARGET;

  return { dailyKey: keys.dailyKey, weeklyKey: keys.weeklyKey, ...daily, ...weekly };
}

function taskPayload(progress: TaskProgress) {
  return {
    daily: [
      { id: 'dailySignIn', title: '每日签到', progress: progress.signIn.claimed ? 1 : 0, target: 1, complete: true, claimed: progress.signIn.claimed, claimLabel: '签到', reward: { coins: 1000, coinsMax: 2000, experience: 0, diamonds: 0 } },
      { id: 'browse15', title: '浏览15个单词及词组', progress: progress.browseSeen.length, target: DAILY_BROWSE_TARGET, complete: progress.browse.complete, claimed: progress.browse.claimed, reward: { coins: 500, experience: 10, diamonds: 0 } },
      { id: 'dailyPractice', title: '完成每日练习', progress: progress.practice.complete ? 1 : 0, target: 1, complete: progress.practice.complete, claimed: progress.practice.claimed, reward: { coins: 1000, experience: 10, diamonds: 1 } },
      { id: 'levelClear', title: '任意通关一个关卡', progress: progress.levelClear.complete ? 1 : 0, target: 1, complete: progress.levelClear.complete, claimed: progress.levelClear.claimed, reward: { coins: 500, experience: 0, diamonds: 0 } },
      { id: 'chestOpen', title: '打开一个宝箱', progress: progress.chestOpen.complete ? 1 : 0, target: 1, complete: progress.chestOpen.complete, claimed: progress.chestOpen.claimed, reward: { coins: 500, experience: 0, diamonds: 0 } },
    ],
    weekly: [
      { id: 'weeklyBrowse50', title: '浏览50个单词', progress: progress.weeklyBrowseSeen.length, target: WEEKLY_BROWSE_TARGET, complete: progress.weeklyBrowse.complete, claimed: progress.weeklyBrowse.claimed, reward: { coins: 3000, experience: 100, diamonds: 0 } },
      { id: 'weeklyPractice5', title: '完成5次每日练习', progress: progress.weeklyPractice.runs, target: WEEKLY_PRACTICE_TARGET, complete: progress.weeklyPractice.complete, claimed: progress.weeklyPractice.claimed, reward: { coins: 5000, experience: 100, diamonds: 1 } },
    ],
    dailyPracticeRuns: progress.practice.runs,
  };
}

function getRequiredPlayerId(req: VercelRequest, res: VercelResponse) {
  const playerId = getAuthPlayerId(req);
  if (!playerId) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  return playerId;
}

async function readProgress(playerId: string) {
  const sql = getSql();
  const rows = await sql`SELECT progress FROM player_task_progress WHERE player_id=${playerId}`;
  const stored = rows[0]?.progress;
  const raw = typeof stored === 'string'
    ? (() => { try { return JSON.parse(stored); } catch { return null; } })()
    : stored;
  return normalizeProgress(raw);
}

async function getWallet(playerId: string) {
  const sql = getSql();
  const rows = await sql`SELECT coins, diamonds, experience FROM player_wallet WHERE player_id=${playerId}`;
  return { coins: Number(rows[0]?.coins ?? 0), diamonds: Number(rows[0]?.diamonds ?? 0), experience: Number(rows[0]?.experience ?? 0) };
}

type TaskMutation = { reward?: Reward; rewardKey?: 'runReward' | 'claimedReward' };

async function mutateTasks(playerId: string, change: (progress: TaskProgress) => TaskMutation, practiceRunId: string | null = null) {
  const sql = getSql();
  await sql`INSERT INTO player_task_progress(player_id,progress) VALUES (${playerId},'{}'::jsonb) ON CONFLICT(player_id) DO NOTHING`;
  // Optimistic comparison prevents losing another task event. The wallet lock
  // and conditional writes put the claim flag and its reward in one transaction.
  for (let attempt=0; attempt<5; attempt++) {
    if (practiceRunId) {
      const cached = await sql`SELECT response FROM practice_runs WHERE player_id=${playerId} AND run_id=${practiceRunId}`;
      if (cached[0]?.response) return cached[0].response as ReturnType<typeof taskPayload> & { runReward: Reward };
    }
    const rows = await sql`SELECT progress FROM player_task_progress WHERE player_id=${playerId}`;
    const original = rows[0]?.progress ?? {};
    const progress = normalizeProgress(typeof original === 'string' ? JSON.parse(original) : original);
    const mutation = change(progress);
    const reward = mutation.reward ?? { coins: 0, experience: 0, diamonds: 0 };
    const payload = { ...taskPayload(progress), ...(mutation.rewardKey ? { [mutation.rewardKey]: reward } : {}) };
    const results = await sql.transaction(tx => [
      tx`SELECT player_id FROM player_wallet WHERE player_id=${playerId} FOR UPDATE`,
      tx.query(`WITH saved AS (
          UPDATE player_task_progress SET progress=$3::jsonb,updated_at=NOW()
          WHERE player_id=$1::text AND progress=$2::jsonb AND ($4::text IS NULL OR EXISTS (
            SELECT 1 FROM practice_runs WHERE player_id=$1::text AND run_id=$4::text AND response IS NULL
              AND started_at<=NOW()-INTERVAL '50 seconds' AND started_at>=NOW()-INTERVAL '1 day'
          )) RETURNING player_id
        ), finished AS (
          UPDATE practice_runs SET response=$8::jsonb FROM saved
          WHERE practice_runs.player_id=saved.player_id AND run_id=$4::text AND response IS NULL RETURNING run_id
        ), credited AS (
          UPDATE player_wallet SET coins=coins+$5::bigint,experience=experience+$6::bigint,diamonds=diamonds+$7::numeric,updated_at=NOW()
          FROM saved WHERE player_wallet.player_id=saved.player_id AND ($4::text IS NULL OR EXISTS (SELECT 1 FROM finished))
          RETURNING player_wallet.player_id
        ) SELECT player_id FROM credited`,
      [playerId, typeof original === 'string' ? original : JSON.stringify(original), JSON.stringify(progress), practiceRunId,
        reward.coins, reward.experience, reward.diamonds, JSON.stringify(payload)]),
    ]) as unknown[][];
    if (results[1].length) return payload;
  }
  throw new ApiError(409, '任务状态已变化，请重试。');
}

export async function recordPlayerTaskEvent(playerId: string, event: PlayerTaskEvent) {
  await mutateTasks(playerId, progress => {
    (event === 'levelClear' ? progress.levelClear : progress.chestOpen).complete = true;
    return {};
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureTables();
    const playerId = getRequiredPlayerId(req, res);
    if (!playerId) return;
    await ensurePlayer(playerId);

    if (req.method === 'GET') {
      const [progress, wallet] = await Promise.all([readProgress(playerId), getWallet(playerId)]);
      return res.json({ ...taskPayload(progress), wallet });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

    const action = req.body?.action;
    if (action === 'browse') {
      const index = Math.floor(Number(req.body?.index));
      if (!Number.isFinite(index) || index < 0 || index >= 100_000) return res.status(400).json({ error: 'invalid browse index' });
      const payload = await mutateTasks(playerId, progress => {
        if (!progress.browseSeen.includes(index) && progress.browseSeen.length < DAILY_BROWSE_TARGET) {
          progress.browseSeen.push(index);
          progress.browse.complete = progress.browseSeen.length >= DAILY_BROWSE_TARGET;
        }
        if (!progress.weeklyBrowseSeen.includes(index) && progress.weeklyBrowseSeen.length < WEEKLY_BROWSE_TARGET) {
          progress.weeklyBrowseSeen.push(index);
          progress.weeklyBrowse.complete = progress.weeklyBrowseSeen.length >= WEEKLY_BROWSE_TARGET;
        }
        return {};
      });
      return res.json(payload);
    }

    if (action === 'startDailyPractice') {
      return res.json(await startPracticeRun(playerId, req.body?.restart === true));
    }

    if (action === 'completeDailyPractice') {
      const validated = await validatePracticeRun(playerId, req.body?.runId, req.body?.answers);
      if ('cached' in validated) return res.json({ ...validated.cached, wallet: await getWallet(playerId) });
      const payload = await mutateTasks(playerId, progress => {
        progress.practice.runs += 1;
        progress.practice.complete = true;
        progress.weeklyPractice.runs += 1;
        progress.weeklyPractice.complete = progress.weeklyPractice.runs >= WEEKLY_PRACTICE_TARGET;
        return { reward: { coins: 0, experience: 10, diamonds: validated.correct>=48 ? 1 : 0 }, rewardKey: 'runReward' };
      }, validated.runId);
      return res.json({ ...payload, wallet: await getWallet(playerId) });
    }

    if (action === 'claim') {
      const taskId = req.body?.taskId;
      const payload = await mutateTasks(playerId, progress => {
        let reward: Reward | null = null;
        if (taskId === 'dailySignIn' && !progress.signIn.claimed) {
          progress.signIn.claimed = true;
          reward = { coins: Math.floor(Math.random() * 1001) + 1000, experience: 0, diamonds: 0 };
        } else if (taskId === 'browse15' && progress.browse.complete && !progress.browse.claimed) {
          progress.browse.claimed = true;
          reward = { coins: 500, experience: 10, diamonds: 0 };
        } else if (taskId === 'dailyPractice' && progress.practice.complete && !progress.practice.claimed) {
          progress.practice.claimed = true;
          reward = { coins: 1000, experience: 10, diamonds: 1 };
        } else if (taskId === 'levelClear' && progress.levelClear.complete && !progress.levelClear.claimed) {
          progress.levelClear.claimed = true;
          reward = { coins: 500, experience: 0, diamonds: 0 };
        } else if (taskId === 'chestOpen' && progress.chestOpen.complete && !progress.chestOpen.claimed) {
          progress.chestOpen.claimed = true;
          reward = { coins: 500, experience: 0, diamonds: 0 };
        } else if (taskId === 'weeklyBrowse50' && progress.weeklyBrowse.complete && !progress.weeklyBrowse.claimed) {
          progress.weeklyBrowse.claimed = true;
          reward = { coins: 3000, experience: 100, diamonds: 0 };
        } else if (taskId === 'weeklyPractice5' && progress.weeklyPractice.complete && !progress.weeklyPractice.claimed) {
          progress.weeklyPractice.claimed = true;
          reward = { coins: 5000, experience: 100, diamonds: 1 };
        }
        if (!reward) throw new ApiError(400, 'task unavailable');
        return { reward, rewardKey: 'claimedReward' };
      });
      return res.json({ ...payload, wallet: await getWallet(playerId) });
    }

    return res.status(400).json({ error: 'bad action' });
  } catch (error: unknown) {
    if (!(error instanceof ApiError)) console.error(error);
    return res.status(error instanceof ApiError ? error.status : 500).json({ error: getErrorMessage(error) });
  }
}
