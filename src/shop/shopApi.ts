import { getToken } from '../td/authProgress';
import { readApiJson } from '../td/apiClient';
import { SHOP_PRODUCTS } from '../../shared/shop';

export type ShopProductView = {
  id: string;
  name: string;
  description: string;
  priceCoins: number;
};

export type ShopPurchaseRecord = {
  id: string;
  productId: string;
  productName: string;
  priceCoins: number;
  channel: string;
  channelLabel: string;
  purchasedAt: string;
};

export type ShopWallet = {
  buyerId: string;
  username: string;
  coins: number;
  diamonds: number;
  experience: number;
  purchases: ShopPurchaseRecord[];
};

export type ShopReceipt = ShopPurchaseRecord & {
  buyerId: string;
  username: string;
};

export const SHOP_PRODUCT_VIEWS: ShopProductView[] = SHOP_PRODUCTS.map(product => ({
  id: product.id,
  name: product.name,
  description: product.description,
  priceCoins: product.priceCoins,
}));

async function shopRequest<T>(body?: Record<string, unknown>): Promise<T> {
  const token = getToken();
  if (!token) throw new Error('请先登录账号');
  const response = await fetch('/api/shop', body ? {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  } : {
    headers: { Authorization: `Bearer ${token}` },
  });
  return readApiJson<T>(response, '商店操作失败');
}

export function fetchShopWallet() {
  return shopRequest<ShopWallet>();
}

export async function purchaseShopProduct(productId: string) {
  const data = await shopRequest<{ ok: boolean; coins: number; purchase: ShopReceipt }>({ action: 'purchase', productId });
  return data;
}
