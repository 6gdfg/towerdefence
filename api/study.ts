import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensurePlayer, ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { getErrorMessage } from './_errors.js';

const STUDY_MODES = new Set(['browse', 'wordTest', 'phraseTest', 'daily', 'mistakes', 'mistakeTest']);
const MAX_MISTAKES = 1000;
const MAX_MISTAKE_INPUT = 5000;

type CompactProgress = {
  v: 1;
  m: string;
  b: number;
  d: [string, number, number];
  x: Array<[string, number, number, number]>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function boundedInt(value: unknown, min: number, max: number) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, parsed));
}

function parseProgress(value: unknown): CompactProgress | null {
  if (!isRecord(value)) return null;
  const mode = typeof value.m === 'string' && STUDY_MODES.has(value.m) ? value.m : 'browse';
  const rawDaily = Array.isArray(value.d) ? value.d : [];
  const date = typeof rawDaily[0] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDaily[0])
    ? rawDaily[0]
    : new Date().toISOString().slice(0, 10);
  const answered = boundedInt(rawDaily[1], 0, 50);
  const correct = boundedInt(rawDaily[2], 0, answered);
  const mistakes = new Map<string, [string, number, number, number]>();

  if (Array.isArray(value.x)) {
    for (const entry of value.x.slice(0, MAX_MISTAKE_INPUT)) {
      if (!Array.isArray(entry) || typeof entry[0] !== 'string') continue;
      const id = entry[0].trim();
      if (!/^(?:[wjp]:|(?:word|phrase):)/.test(id) || id.length > 220) continue;
      mistakes.set(id, [
        id,
        boundedInt(entry[1], 1, 1_000_000),
        boundedInt(entry[2], 0, 2),
        boundedInt(entry[3], 0, 9_999_999_999_999),
      ]);
    }
  }

  return {
    v: 1,
    m: mode,
    b: boundedInt(value.b, 0, 100_000),
    d: [date, answered, correct],
    x: [...mistakes.values()]
      .sort((a, b) => b[3] - a[3])
      .slice(0, MAX_MISTAKES),
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureTables();
    const playerId = getRequiredPlayerId(req, res);
    if (!playerId) return;
    await ensurePlayer(playerId);
    const sql = getSql();

    if (req.method === 'GET') {
      const rows = await sql`SELECT progress FROM player_study_progress WHERE player_id=${playerId}`;
      const stored = rows[0]?.progress;
      const rawProgress = typeof stored === 'string'
        ? (() => {
            try {
              return JSON.parse(stored);
            } catch {
              return null;
            }
          })()
        : stored ?? null;
      const progress = parseProgress(rawProgress);
      return res.json({ progress });
    }

    if (req.method === 'POST') {
      const progress = parseProgress(req.body?.progress);
      if (!progress) return res.status(400).json({ error: 'invalid study progress' });
      const saved = await sql`INSERT INTO player_study_progress (player_id, progress, updated_at)
        VALUES (${playerId}, ${JSON.stringify(progress)}::jsonb, NOW())
        ON CONFLICT (player_id) DO UPDATE SET progress=EXCLUDED.progress, updated_at=NOW()
        RETURNING updated_at`;
      return res.json({ ok: true, updatedAt: saved[0]?.updated_at ?? null });
    }

    return res.status(405).json({ error: 'method' });
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
