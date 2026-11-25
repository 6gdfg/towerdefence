import { ELEMENT_ITEM_IDS, NON_UPGRADEABLE_PLANT_ITEMS, PLANT_ITEM_IDS } from './unlocks.js';

export type ShopCurrency = 'coins' | 'diamonds';
export type DailyShopProduct = {
  id: string;
  itemId: string;
  amount: number;
  currency: ShopCurrency;
  price: number;
};
export type ShopProductView = DailyShopProduct & { purchased: boolean };
export type ShopWallet = { coins: number; diamonds: number; experience: number };
export type DailyShopState = ShopWallet & {
  dayKey: string;
  refreshAt: string;
  products: ShopProductView[];
};

export const DAILY_SHOP_PLANT_POOL = PLANT_ITEM_IDS.filter(
  item => !(NON_UPGRADEABLE_PLANT_ITEMS as readonly string[]).includes(item),
);
export const DAILY_SHOP_PRODUCT_IDS = ['daily-plant-0', 'daily-plant-1', 'daily-plant-2', 'daily-element-0'] as const;

export function createDailyShopProducts(randomInt: (exclusiveMax: number) => number): DailyShopProduct[] {
  const available = [...DAILY_SHOP_PLANT_POOL];
  const plants: DailyShopProduct[] = Array.from({ length: 3 }, (_, index) => {
    const itemId = available.splice(randomInt(available.length), 1)[0];
    const amount = 1 + randomInt(10);
    return { id: DAILY_SHOP_PRODUCT_IDS[index], itemId, amount, currency: 'coins', price: amount * 500 };
  });
  const amount = 1 + randomInt(4);
  return [...plants, {
    id: DAILY_SHOP_PRODUCT_IDS[3], itemId: ELEMENT_ITEM_IDS[randomInt(ELEMENT_ITEM_IDS.length)],
    amount, currency: 'diamonds', price: amount,
  }];
}
