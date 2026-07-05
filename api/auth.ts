import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createId, ensurePlayer, ensureTables, getSql } from './_db';
import { hashPassword, issueToken, verifyPassword } from './_auth';
import { getErrorMessage } from './_errors';

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type AuthRow = {
  password_hash: string;
  player_id: string;
};

function issuePlayerToken(playerId: string, username: string) {
  return issueToken({ pid: playerId, u: username, exp: Date.now() + TOKEN_TTL_MS });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureTables();
    const sql = getSql();

    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

    const { action } = req.body || {};
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!username || !password) return res.status(400).json({ error: 'params' });

    if (action === 'register') {
      const exist = await sql`SELECT username FROM user_accounts WHERE username=${username}`;
      if (exist.length > 0) return res.status(400).json({ error: 'USERNAME_TAKEN' });

      const playerId = createId('p');
      await ensurePlayer(playerId);

      const passwordHash = await hashPassword(password);
      await sql`INSERT INTO user_accounts (username, password_hash, player_id)
        VALUES (${username}, ${passwordHash}, ${playerId})`;

      return res.json({
        ok: true,
        playerId,
        username,
        token: issuePlayerToken(playerId, username),
      });
    }

    if (action === 'login') {
      const rows = await sql`SELECT password_hash, player_id FROM user_accounts WHERE username=${username}`;
      const row = rows[0] as AuthRow | undefined;
      if (!row) return res.status(400).json({ error: 'BAD_CREDENTIALS' });

      const ok = await verifyPassword(password, row.password_hash);
      if (!ok) return res.status(400).json({ error: 'BAD_CREDENTIALS' });

      await ensurePlayer(row.player_id);

      return res.json({
        ok: true,
        playerId: row.player_id,
        username,
        token: issuePlayerToken(row.player_id, username),
      });
    }

    return res.status(400).json({ error: 'bad action' });
  } catch (e: unknown) {
    console.error(e);
    return res.status(500).json({ error: getErrorMessage(e) });
  }
}
