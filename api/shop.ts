import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createId, ensurePlayer, ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { getErrorMessage } from './_errors.js';
import { ELEMENT_ITEM_IDS, NON_UPGRADEABLE_PLANT_ITEMS, PLANT_ITEM_IDS } from '../shared/unlocks.js';
import { getShopProduct, getShopPurchaseChannelLabel, type ShopDelivery, type ShopProduct } from '../shared/shop.js';

type WalletRow = { coins?: number | string; diamonds?: number | string; experience?: number | string };
type PurchaseRow = {
  purchase_id: string;
  product_id: string;
  price_coins: number | string;
  purchase_channel: string;
  created_at: string | Date;
};
type AccountRow = { username: string };
type ShardGrant = { itemId: string; amount: number };

const PURCHASE_HISTORY_LIMIT = 20;

// 不可升级的植物没有碎片用途，和宝箱奖励池保持一致，不放进盲盒。
const PLANT_SHARD_POOL: readonly string[] = PLANT_ITEM_IDS
  .filter(itemId => !(NON_UPGRADEABLE_PLANT_ITEMS as readonly string[]).includes(itemId));

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

async function readCoins(playerId: string) {
  const sql = getSql();
  const rows = await sql`SELECT coins FROM player_wallet WHERE player_id=${playerId}`;
  return Number((rows as WalletRow[])[0]?.coins ?? 0);
}

/** 每次抽取都是独立随机，同一个物品可以在一次兑换里命中多次（碎片会累加）。 */
function rollShardGrants(delivery: ShopDelivery): ShardGrant[] {
  const pool: readonly string[] = delivery.type === 'plantShards' ? PLANT_SHARD_POOL : ELEMENT_ITEM_IDS;
  const counts = new Map<string, number>();
  const draws = Math.max(1, Math.floor(delivery.amount));

  for (let index = 0; index < draws; index += 1) {
    const itemId = pool[Math.floor(Math.random() * pool.length)];
    if (!itemId) continue;
    counts.set(itemId, (counts.get(itemId) ?? 0) + 1);
  }

  return Array.from(counts, ([itemId, amount]) => ({ itemId, amount }));
}

/**
 * 立即发货类商品：扣金币和发碎片在同一条语句里完成，避免出现扣了钱没发货的情况。
 * 扣款失败时 deducted 为空，INSERT 也就不会写入任何行，返回空数组。
 */
async function deliverInstantPurchase(playerId: string, product: ShopProduct, grants: ShardGrant[]) {
  const sql = getSql();
  const payload = JSON.stringify(grants.map(grant => ({ item_id: grant.itemId, amount: grant.amount })));
  const rows = await sql.query(
    `WITH deducted AS (
       UPDATE player_wallet
       SET coins = coins - $2::bigint, updated_at = NOW()
       WHERE player_id = $1 AND coins >= $2::bigint
       RETURNING player_id
     )
     INSERT INTO inventory_shards (player_id, tower_type, shards)
     SELECT $1::text, granted.item_id, granted.amount
     FROM deducted
     CROSS JOIN jsonb_to_recordset($3::jsonb) AS granted(item_id text, amount integer)
     ON CONFLICT (player_id, tower_type)
     DO UPDATE SET shards = inventory_shards.shards + EXCLUDED.shards
     RETURNING tower_type`,
    [playerId, product.priceCoins, payload],
  );
  return rows;
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
        // 只有需要凭据的商品会留下记录，立即发货的商品不写库。
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

    if (product.kind === 'instant') {
      if (!product.delivery) return res.status(500).json({ error: 'PRODUCT_MISCONFIGURED' });

      const grants = rollShardGrants(product.delivery);
      const delivered = await deliverInstantPurchase(pid, product, grants);
      if (delivered.length === 0) {
        return res.status(400).json({ error: 'COINS_NOT_ENOUGH', need: product.priceCoins, have: await readCoins(pid) });
      }

      const shards: Record<string, number> = {};
      grants.forEach(grant => { shards[grant.itemId] = grant.amount; });

      return res.json({
        ok: true,
        kind: 'instant',
        coins: await readCoins(pid),
        shards,
      });
    }

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
      return res.status(400).json({ error: 'COINS_NOT_ENOUGH', need: product.priceCoins, have: await readCoins(pid) });
    }

    const username = await readUsername(pid);
    const purchase = serializePurchase(row, product.name);

    return res.json({
      ok: true,
      kind: 'redemption',
      coins: await readCoins(pid),
      purchase: { ...purchase, buyerId: pid, username },
    });
  } catch (e: unknown) {
    console.error(e);
    return res.status(500).json({ error: getErrorMessage(e) });
  }
}
