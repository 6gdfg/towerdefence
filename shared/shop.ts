export type ShopPurchaseChannel = 'direct';

export type ShopProductKind = 'instant' | 'redemption';

export type ShopDelivery =
  | { type: 'plantShards'; amount: number }
  | { type: 'elementShards'; amount: number };

export type ShopProduct = {
  id: string;
  name: string;
  description: string;
  priceCoins: number;
  /**
   * instant: 兑换后立刻发货（发放碎片等），不写购买记录。
   * redemption: 需要凭截图联系 owner 领取，写入一条凭据记录。
   */
  kind: ShopProductKind;
  channel: ShopPurchaseChannel;
  delivery?: ShopDelivery;
};

export const SHOP_PURCHASE_CHANNEL_LABELS: Record<ShopPurchaseChannel, string> = {
  direct: '直接购买',
};

export const SHOP_PRODUCTS: readonly ShopProduct[] = [
  {
    id: 'yogurtCup',
    name: '一杯酸奶',
    description: '兑换后凭截图联系 owner 领取。',
    priceCoins: 1_000_000,
    kind: 'redemption',
    channel: 'direct',
  },
  {
    id: 'plantShardBox',
    name: '植物碎片盲盒',
    description: '立即到账：随机 3 个植物碎片，所有植物等概率。',
    priceCoins: 22_222,
    kind: 'instant',
    channel: 'direct',
    delivery: { type: 'plantShards', amount: 3 },
  },
  {
    id: 'elementShardBox',
    name: '元素碎片盲盒',
    description: '立即到账：随机 1 个元素碎片，六种元素等概率。',
    priceCoins: 12_345,
    kind: 'instant',
    channel: 'direct',
    delivery: { type: 'elementShards', amount: 1 },
  },
];

export function getShopProduct(productId: unknown): ShopProduct | null {
  if (typeof productId !== 'string') return null;
  return SHOP_PRODUCTS.find(product => product.id === productId) ?? null;
}

export function getShopPurchaseChannelLabel(channel: string): string {
  return SHOP_PURCHASE_CHANNEL_LABELS[channel as ShopPurchaseChannel] ?? channel;
}
