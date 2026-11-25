import { randomInt } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensurePlayer, ensureTables, getSql } from './_db.js';
import { getAuthPlayerId } from './_auth.js';
import { getErrorMessage } from './_errors.js';
import { createDailyShopProducts, DAILY_SHOP_PRODUCT_IDS, type DailyShopProduct, type DailyShopState } from '../shared/shop.js';

type ShopRow = {
  coins: number | string;
  diamonds: number | string;
  experience: number | string;
  day_key: string;
  refresh_at: Date | string;
  products: DailyShopProduct[];
  purchased_mask: number;
};

function serializeShop(row: ShopRow): DailyShopState {
  return {
    coins: Number(row.coins), diamonds: Number(row.diamonds), experience: Number(row.experience),
    dayKey: row.day_key, refreshAt: new Date(row.refresh_at).toISOString(),
    products: row.products.map((product, index) => ({ ...product, purchased: (row.purchased_mask & (1 << index)) !== 0 })),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const playerId = getAuthPlayerId(req);
    if (!playerId) return res.status(401).json({ error: 'unauthorized' });
    res.setHeader('Cache-Control', 'no-store');
    const body = req.body ?? {};
    const purchasing = req.method === 'POST';
    if (purchasing && (body.action !== 'purchase' || !DAILY_SHOP_PRODUCT_IDS.includes(body.productId))) {
      return res.status(400).json({ error: '商品不存在。' });
    }
    if (purchasing && (typeof body.dayKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.dayKey))) {
      return res.status(400).json({ error: '商店日期无效，请刷新页面。' });
    }
    await ensureTables();
    await ensurePlayer(playerId);
    const sql = getSql();
    const generated = JSON.stringify(createDailyShopProducts(randomInt));

    // Serialize purchases with all wallet operations. The DB clock owns daily rollover.
    const results = await sql.transaction(tx => [
      tx`SELECT player_id FROM player_wallet WHERE player_id=${playerId} FOR UPDATE`,
      tx`INSERT INTO player_daily_shop(player_id, shop_date, products)
        VALUES (${playerId}, (NOW() AT TIME ZONE 'Asia/Shanghai')::date, ${generated}::jsonb)
        ON CONFLICT(player_id) DO UPDATE SET shop_date=EXCLUDED.shop_date, products=EXCLUDED.products, purchased_mask=0
          WHERE player_daily_shop.shop_date <> EXCLUDED.shop_date`,
      ...(purchasing ? [tx.query(`WITH offer AS (
          SELECT s.player_id, item.product, (1 << (item.ordinality::integer - 1)) AS bit
          FROM player_daily_shop s CROSS JOIN LATERAL jsonb_array_elements(s.products) WITH ORDINALITY AS item(product, ordinality)
          WHERE s.player_id=$1::text AND s.shop_date::text=$2::text
            AND s.shop_date=(NOW() AT TIME ZONE 'Asia/Shanghai')::date
            AND item.product->>'id'=$3::text AND (s.purchased_mask & (1 << (item.ordinality::integer - 1)))=0
        ), deducted AS (
          UPDATE player_wallet w SET
            coins=w.coins-CASE WHEN o.product->>'currency'='coins' THEN (o.product->>'price')::bigint ELSE 0 END,
            diamonds=w.diamonds-CASE WHEN o.product->>'currency'='diamonds' THEN (o.product->>'price')::numeric ELSE 0 END,
            updated_at=NOW()
          FROM offer o WHERE w.player_id=o.player_id
            AND ((o.product->>'currency'='coins' AND w.coins >= (o.product->>'price')::bigint)
              OR (o.product->>'currency'='diamonds' AND w.diamonds >= (o.product->>'price')::numeric))
          RETURNING w.player_id
        ), marked AS (
          UPDATE player_daily_shop s SET purchased_mask=s.purchased_mask | o.bit
          FROM offer o JOIN deducted d ON d.player_id=o.player_id WHERE s.player_id=o.player_id
          RETURNING o.product
        ) INSERT INTO inventory_shards(player_id, tower_type, shards)
          SELECT $1::text, product->>'itemId', (product->>'amount')::integer FROM marked
          ON CONFLICT(player_id, tower_type) DO UPDATE SET shards=inventory_shards.shards+EXCLUDED.shards
          RETURNING tower_type, shards`, [playerId, body.dayKey, body.productId])] : []),
      tx`SELECT w.coins, w.diamonds, w.experience, s.shop_date::text AS day_key, s.products, s.purchased_mask,
          ((s.shop_date + 1)::timestamp AT TIME ZONE 'Asia/Shanghai') AS refresh_at
        FROM player_daily_shop s JOIN player_wallet w ON w.player_id=s.player_id WHERE s.player_id=${playerId}`,
    ]) as unknown[][];
    const shop = serializeShop(results.at(-1)![0] as ShopRow);
    if (purchasing && results[2].length === 0) {
      const product = shop.products.find(item => item.id === body.productId)!;
      const error = shop.dayKey !== body.dayKey ? '每日商店已刷新，请确认新的商品。'
        : product.purchased ? '今日已购买此商品。'
        : product.currency === 'coins' ? '金币不足，无法购买。' : '钻石不足，无法购买。';
      return res.status(409).json({ error, shop });
    }
    return res.json(shop);
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
}
