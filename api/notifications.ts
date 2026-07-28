import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensurePlayer, ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { getErrorMessage } from './_errors.js';

type NotificationRow = {
  notification_id: string;
  notification_type: string;
  payload: unknown;
};

function getRequiredPlayerId(req: VercelRequest, res: VercelResponse) {
  const playerId = getAuthPlayerId(req);
  if (!playerId) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  return playerId;
}

function readPayload(value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== 'string') return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureTables();
    const playerId = getRequiredPlayerId(req, res);
    if (!playerId) return;
    await ensurePlayer(playerId);
    const sql = getSql();

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT notification_id, notification_type, payload
        FROM player_notifications
        WHERE player_id=${playerId} AND read_at IS NULL
        ORDER BY created_at ASC
        LIMIT 1
      `;
      const notification = rows[0] as NotificationRow | undefined;
      if (!notification) return res.json({ notification: null });
      return res.json({
        notification: {
          id: String(notification.notification_id),
          type: String(notification.notification_type),
          payload: readPayload(notification.payload),
        },
      });
    }

    if (req.method === 'POST') {
      if (req.body?.action !== 'markRead') return res.status(400).json({ error: 'bad action' });
      const notificationId = typeof req.body?.notificationId === 'string' ? req.body.notificationId.trim() : '';
      if (!notificationId || notificationId.length > 120) return res.status(400).json({ error: 'invalid notification id' });
      const updated = await sql`
        UPDATE player_notifications
        SET read_at=NOW()
        WHERE notification_id=${notificationId} AND player_id=${playerId} AND read_at IS NULL
        RETURNING notification_id
      `;
      return res.json({ ok: true, marked: updated.length > 0 });
    }

    return res.status(405).json({ error: 'method' });
  } catch (error: unknown) {
    console.error('Notification error:', error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
