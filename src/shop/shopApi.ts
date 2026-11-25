import { getToken } from '../td/authProgress';
import { readApiJson } from '../td/apiClient';
import type { DailyShopState } from '../../shared/shop';

export type { DailyShopState, ShopProductView } from '../../shared/shop';

async function shopRequest(body?: Record<string, unknown>): Promise<DailyShopState> {
  const token = getToken();
  if (!token) throw new Error('请先登录账号');
  const response = await fetch('/api/shop', body ? {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  } : {
    cache: 'no-store', headers: { Authorization: `Bearer ${token}` },
  });
  return readApiJson<DailyShopState>(response, '商店操作失败');
}

export function fetchDailyShop() {
  return shopRequest();
}

export function purchaseShopProduct(productId: string, dayKey: string) {
  return shopRequest({ action: 'purchase', productId, dayKey });
}
