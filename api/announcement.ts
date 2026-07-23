import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensurePlayer, ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { getErrorMessage } from './_errors.js';

function getReleaseVersion(value: unknown) {
  const version = typeof value === 'string' ? value.trim() : '';
  return /^[0-9A-Za-z][0-9A-Za-z._-]{0,63}$/.test(version) ? version : null;
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

    const version = getReleaseVersion(req.method === 'GET' ? req.query.version : req.body?.version);
    if (!version) return res.status(400).json({ error: 'invalid version' });

    const sql = getSql();
    if (req.method === 'GET') {
      const rows = await sql`SELECT 1 FROM player_release_reads WHERE player_id=${playerId} AND release_version=${version}`;
      return res.json({ seen: rows.length > 0 });
    }

    if (req.method === 'POST') {
      // Only the most recently acknowledged release matters. Keeping prior
      // versions would make this table grow once per player on every deploy.
      await sql.transaction(tx => [
        tx`SELECT player_id FROM players WHERE player_id=${playerId} FOR UPDATE`,
        tx`DELETE FROM player_release_reads WHERE player_id=${playerId}`,
        tx`INSERT INTO player_release_reads (player_id, release_version, read_at)
          VALUES (${playerId}, ${version}, NOW())
          ON CONFLICT (player_id, release_version) DO UPDATE SET read_at=EXCLUDED.read_at`,
      ]);
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'method' });
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
