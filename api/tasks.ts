import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensurePlayer, ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { getErrorMessage } from './_errors.js';

const DAILY_BROWSE_TARGET = 15;
const DAILY_PRACTICE_TARGET = 50;

type Reward = { coins: number; experience: number; diamonds: number };
type TaskState = { complete: boolean; claimed: boolean };
type TaskProgress = {
  dailyKey: string;
  weeklyKey: string;
  browseSeen: number[];
  browse: TaskState;
  practice: TaskState & { runs: number };
};

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
  const weeklyKey = date.toISOString().slice(0, 10);
  return { dailyKey, weeklyKey };
}

function defaultProgress(): TaskProgress {
  const { dailyKey, weeklyKey } = getBeijingKeys();
  return {
    dailyKey,
    weeklyKey,
    browseSeen: [],
    browse: { complete: false, claimed: false },
    practice: { complete: false, claimed: false, runs: 0 },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readBoolean(value: unknown) {
  return value === true || value === 'true' || value === 1;
}

function normalizeProgress(value: unknown): TaskProgress {
  const fallback = defaultProgress();
  if (!isRecord(value)) return fallback;
  const keys = getBeijingKeys();
  if (value.dailyKey !== keys.dailyKey) return fallback;
  const browseSeen = Array.isArray(value.browseSeen)
    ? Array.from(new Set(value.browseSeen
      .map(item => Math.floor(Number(item)))
      .filter(item => Number.isFinite(item) && item >= 0 && item < 100_000)))
      .slice(0, DAILY_BROWSE_TARGET)
    : [];
  const browseRaw = isRecord(value.browse) ? value.browse : {};
  const practiceRaw = isRecord(value.practice) ? value.practice : {};
  return {
    dailyKey: keys.dailyKey,
    weeklyKey: value.weeklyKey === keys.weeklyKey ? keys.weeklyKey : keys.weeklyKey,
    browseSeen,
    browse: {
      complete: readBoolean(browseRaw.complete) || browseSeen.length >= DAILY_BROWSE_TARGET,
      claimed: readBoolean(browseRaw.claimed),
    },
    practice: {
      complete: readBoolean(practiceRaw.complete),
      claimed: readBoolean(practiceRaw.claimed),
      runs: Math.max(0, Math.min(1_000, Math.floor(Number(practiceRaw.runs) || 0))),
    },
  };
}

function taskPayload(progress: TaskProgress) {
  return {
    daily: [
      {
        id: 'browse15',
        title: '浏览15个单词及词组',
        progress: progress.browseSeen.length,
        target: DAILY_BROWSE_TARGET,
        complete: progress.browse.complete,
        claimed: progress.browse.claimed,
        reward: { coins: 100, experience: 10, diamonds: 0 },
      },
      {
        id: 'dailyPractice',
        title: '完成每日练习',
        progress: progress.practice.complete ? 1 : 0,
        target: 1,
        complete: progress.practice.complete,
        claimed: progress.practice.claimed,
        reward: { coins: 200, experience: 10, diamonds: 1 },
      },
    ],
    weekly: [],
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
    ? (() => {
        try { return JSON.parse(stored); } catch { return null; }
      })()
    : stored;
  return normalizeProgress(raw);
}

async function saveProgress(playerId: string, progress: TaskProgress) {
  const sql = getSql();
  await sql`INSERT INTO player_task_progress (player_id, progress, updated_at)
    VALUES (${playerId}, ${JSON.stringify(progress)}::jsonb, NOW())
    ON CONFLICT (player_id) DO UPDATE SET progress=EXCLUDED.progress, updated_at=NOW()`;
}

async function getWallet(playerId: string) {
  const sql = getSql();
  const rows = await sql`SELECT coins, diamonds, experience FROM player_wallet WHERE player_id=${playerId}`;
  return {
    coins: Number(rows[0]?.coins ?? 0),
    diamonds: Number(rows[0]?.diamonds ?? 0),
    experience: Number(rows[0]?.experience ?? 0),
  };
}

async function grantReward(playerId: string, reward: Reward) {
  const sql = getSql();
  await sql`UPDATE player_wallet
    SET coins = coins + ${reward.coins},
        diamonds = diamonds + ${reward.diamonds},
        experience = experience + ${reward.experience},
        updated_at = NOW()
    WHERE player_id=${playerId}`;
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
    const progress = await readProgress(playerId);

    if (action === 'browse') {
      const index = Math.floor(Number(req.body?.index));
      if (!Number.isFinite(index) || index < 0 || index >= 100_000) return res.status(400).json({ error: 'invalid browse index' });
      if (!progress.browse.complete && !progress.browseSeen.includes(index)) {
        progress.browseSeen.push(index);
        progress.browseSeen = progress.browseSeen.slice(0, DAILY_BROWSE_TARGET);
        progress.browse.complete = progress.browseSeen.length >= DAILY_BROWSE_TARGET;
        await saveProgress(playerId, progress);
      }
      return res.json(taskPayload(progress));
    }

    if (action === 'completeDailyPractice') {
      const correct = Math.max(0, Math.min(DAILY_PRACTICE_TARGET, Math.floor(Number(req.body?.correct) || 0)));
      progress.practice.runs += 1;
      if (!progress.practice.complete) progress.practice.complete = true;
      await saveProgress(playerId, progress);
      const reward: Reward = { coins: 0, experience: 10, diamonds: correct >= 48 ? 1 : 0 };
      await grantReward(playerId, reward);
      const wallet = await getWallet(playerId);
      return res.json({ ...taskPayload(progress), runReward: reward, wallet });
    }

    if (action === 'claim') {
      const taskId = req.body?.taskId;
      let reward: Reward | null = null;
      if (taskId === 'browse15' && progress.browse.complete && !progress.browse.claimed) {
        progress.browse.claimed = true;
        reward = { coins: 100, experience: 10, diamonds: 0 };
      } else if (taskId === 'dailyPractice' && progress.practice.complete && !progress.practice.claimed) {
        progress.practice.claimed = true;
        reward = { coins: 200, experience: 10, diamonds: 1 };
      }
      if (!reward) return res.status(400).json({ error: 'task unavailable' });
      await saveProgress(playerId, progress);
      await grantReward(playerId, reward);
      const wallet = await getWallet(playerId);
      return res.json({ ...taskPayload(progress), claimedReward: reward, wallet });
    }

    return res.status(400).json({ error: 'bad action' });
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
