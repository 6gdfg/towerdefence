import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createId, ensurePlayer, ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { getErrorMessage } from './_errors.js';
import { getShopProduct, getShopPurchaseChannelLabel } from '../shared/shop.js';

type WalletRow = { coins?: number | string; diamonds?: number | string; experience?: number | string };
type PurchaseRow = {
  purchase_id: string;
  product_id: string;
  price_coins: number | string;
  purchase_channel: string;
  created_at: string | Date;
};
type AccountRow = { username: string };

const PURCHASE_HISTORY_LIMIT = 20;

function serializePurchase(row: PurchaseRow, productName: string) {
  const channel = String(row.purchase_channel);
  return {
    id: String(row.purchase_id),
    productId: String(row.product_id),
    productName,
    priceCoins: Number(row.price_coins),
    channel,
    channelLabel: getShopPurchaseChannelLabel(channel),
    purchasedAt: new Date(row.created_at).toISOString(),
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

async function readUsername(playerId: string) {
  const sql = getSql();
  const rows = await sql`SELECT username FROM user_accounts WHERE player_id=${playerId} LIMIT 1`;
  const account = rows[0] as AccountRow | undefined;
  return account?.username ? String(account.username) : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await ensureTables();
    const sql = getSql();

    if (req.method === 'GET') {
      const playerId = getRequiredPlayerId(req, res);
      if (!playerId) return;
      await ensurePlayer(playerId);

      const [walletRows, purchaseRows, username] = await Promise.all([
        sql`SELECT coins, diamonds, experience FROM player_wallet WHERE player_id=${playerId}`,
        sql`SELECT purchase_id, product_id, price_coins, purchase_channel, created_at
            FROM shop_purchases WHERE player_id=${playerId}
            ORDER BY created_at DESC LIMIT ${PURCHASE_HISTORY_LIMIT}::int`,
        readUsername(playerId),
      ]);

      const wallet = (walletRows as WalletRow[])[0] ?? {};
      return res.json({
        ok: true,
        buyerId: playerId,
        username,
        coins: Number(wallet.coins ?? 0),
        diamonds: Number(wallet.diamonds ?? 0),
        experience: Number(wallet.experience ?? 0),
        purchases: (purchaseRows as PurchaseRow[]).map(row => serializePurchase(row, getShopProduct(row.product_id)?.name ?? row.product_id)),
      });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

    const pid = getRequiredPlayerId(req, res);
    if (!pid) return;
    await ensurePlayer(pid);

    const { action, productId } = (req.body || {}) as { action?: string; productId?: string };
    if (action !== 'purchase') return res.status(400).json({ error: 'bad action' });

    const product = getShopProduct(productId);
    if (!product) return res.status(400).json({ error: 'PRODUCT_NOT_FOUND' });

    const purchaseId = createId('sp');
    // One statement so the coin deduction and the credential row either both happen or neither does.
    const inserted = await sql`
      WITH deducted AS (
        UPDATE player_wallet
        SET coins = coins - ${product.priceCoins}::bigint, updated_at = NOW()
        WHERE player_id = ${pid} AND coins >= ${product.priceCoins}::bigint
        RETURNING coins
      )
      INSERT INTO shop_purchases (purchase_id, player_id, product_id, price_coins, purchase_channel)
      SELECT ${purchaseId}::text, ${pid}::text, ${product.id}::text, ${product.priceCoins}::bigint, ${product.channel}::text
      FROM deducted
      RETURNING purchase_id, product_id, price_coins, purchase_channel, created_at
    `;

    const row = (inserted as PurchaseRow[])[0];
    if (!row) {
      const walletRows = await sql`SELECT coins FROM player_wallet WHERE player_id=${pid}`;
      const coins = Number((walletRows as WalletRow[])[0]?.coins ?? 0);
      return res.status(400).json({ error: 'COINS_NOT_ENOUGH', need: product.priceCoins, have: coins });
    }

    const [walletRows, username] = await Promise.all([
      sql`SELECT coins FROM player_wallet WHERE player_id=${pid}`,
      readUsername(pid),
    ]);
    const purchase = serializePurchase(row, product.name);

    return res.json({
      ok: true,
      coins: Number((walletRows as WalletRow[])[0]?.coins ?? 0),
      purchase: { ...purchase, buyerId: pid, username },
    });
  } catch (e: unknown) {
    console.error(e);
    return res.status(500).json({ error: getErrorMessage(e) });
  }
}
