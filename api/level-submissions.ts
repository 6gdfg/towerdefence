import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { createId, ensurePlayer, ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { getErrorMessage } from './_errors.js';

const ADMIN_PASSWORD = 'csx081028';
const DAILY_SUBMISSION_LIMIT = 10;
const MAX_LEVEL_NAME_LENGTH = 120;
const MAX_DIFFICULTY_LENGTH = 12;
const MAX_CODE_LENGTH = 60_000;

function getRequiredPlayerId(req: VercelRequest, res: VercelResponse) {
  const playerId = getAuthPlayerId(req);
  if (!playerId) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  return playerId;
}

function readText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function hasAdminAccess(value: unknown) {
  if (typeof value !== 'string') return false;
  const expected = Buffer.from(ADMIN_PASSWORD);
  const provided = Buffer.from(value);
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}

function requireAdmin(req: VercelRequest, res: VercelResponse) {
  if (hasAdminAccess(req.body?.password)) return true;
  res.status(401).json({ error: 'admin password incorrect' });
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    await ensureTables();
    const sql = getSql();
    const action = req.body?.action;

    if (action === 'submit') {
      const playerId = getRequiredPlayerId(req, res);
      if (!playerId) return;
      await ensurePlayer(playerId);

      const levelName = readText(req.body?.levelName, MAX_LEVEL_NAME_LENGTH);
      const difficulty = readText(req.body?.difficulty, MAX_DIFFICULTY_LENGTH);
      const submissionCode = typeof req.body?.submissionCode === 'string' ? req.body.submissionCode.trim() : '';
      if (!levelName || !['EZ', 'HD', 'IN', 'AT'].includes(difficulty) || !submissionCode) {
        return res.status(400).json({ error: 'invalid level submission' });
      }
      if (submissionCode.length > MAX_CODE_LENGTH) {
        return res.status(400).json({ error: 'level submission is too large' });
      }

      const accountRows = await sql`SELECT username FROM user_accounts WHERE player_id=${playerId} LIMIT 1`;
      const submitterUsername = readText(accountRows[0]?.username, 64) || 'unknown';
      const submissionId = createId('level_submission');
      const dayRows = await sql`SELECT TO_CHAR(NOW() AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD') AS submission_day`;
      const submissionDay = String(dayRows[0]?.submission_day ?? '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(submissionDay)) {
        return res.status(500).json({ error: 'failed to resolve submission day' });
      }
      const inserted = await sql`
        WITH allowance AS (
          INSERT INTO player_daily_level_submission_limits (player_id, submission_day, submitted_count)
          VALUES (${playerId}, ${submissionDay}::date, 1)
          ON CONFLICT (player_id, submission_day) DO UPDATE
            SET submitted_count = player_daily_level_submission_limits.submitted_count + 1
            WHERE player_daily_level_submission_limits.submitted_count < ${DAILY_SUBMISSION_LIMIT}
          RETURNING submitted_count
        )
        INSERT INTO level_submissions (
          submission_id, player_id, submitter_username, level_name, difficulty, submission_code, submitted_at
        )
        SELECT
          ${submissionId}, ${playerId}, ${submitterUsername}, ${levelName}, ${difficulty}, ${submissionCode}, NOW()
        FROM allowance
        RETURNING submitted_at, (SELECT submitted_count FROM allowance) AS submitted_count
      `;
      if (inserted.length === 0) {
        return res.status(429).json({ error: `daily submission limit reached (${DAILY_SUBMISSION_LIMIT})` });
      }
      return res.status(201).json({
        ok: true,
        remainingToday: Math.max(0, DAILY_SUBMISSION_LIMIT - Number(inserted[0]?.submitted_count ?? DAILY_SUBMISSION_LIMIT)),
        submittedAt: inserted[0]?.submitted_at ?? null,
      });
    }

    if (action === 'list') {
      if (!requireAdmin(req, res)) return;
      const rows = await sql`
        SELECT submission_id, submitter_username, level_name, difficulty, submission_code, submitted_at
        FROM level_submissions
        ORDER BY submitted_at DESC
        LIMIT 200
      `;
      const submissions = rows.map(row => ({
        id: String(row.submission_id),
        submitter: String(row.submitter_username),
        levelName: String(row.level_name),
        difficulty: String(row.difficulty),
        code: String(row.submission_code),
        submittedAt: row.submitted_at instanceof Date ? row.submitted_at.toISOString() : String(row.submitted_at),
      }));
      return res.json({ submissions });
    }

    if (action === 'complete') {
      if (!requireAdmin(req, res)) return;
      const submissionId = readText(req.body?.submissionId, 120);
      if (!submissionId) return res.status(400).json({ error: 'invalid submission id' });
      const deleted = await sql`DELETE FROM level_submissions WHERE submission_id=${submissionId} RETURNING submission_id`;
      return res.json({ ok: true, removed: deleted.length > 0 });
    }

    return res.status(400).json({ error: 'bad action' });
  } catch (error: unknown) {
    console.error('Level submission error:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
