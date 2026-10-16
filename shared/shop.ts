export type ShopPurchaseChannel = 'direct';

export type ShopProduct = {
  id: string;
  name: string;
  description: string;
  priceCoins: number;
  channel: ShopPurchaseChannel;
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
    channel: 'direct',
  },
];

export function getShopProduct(productId: unknown): ShopProduct | null {
  if (typeof productId !== 'string') return null;
  return SHOP_PRODUCTS.find(product => product.id === productId) ?? null;
}

export function getShopPurchaseChannelLabel(channel: string): string {
  return SHOP_PURCHASE_CHANNEL_LABELS[channel as ShopPurchaseChannel] ?? channel;
}
