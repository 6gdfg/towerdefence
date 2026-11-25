import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Coins, Diamond, LoaderCircle, RefreshCw, ShoppingCart } from 'lucide-react';
import AuthBar from '../td/AuthBar';
import { getToken } from '../td/authProgress';
import { getErrorMessage } from '../td/errors';
import { resolveUnlockItemLabel } from '../td/labels';
import { ElementIcon, PlantIcon } from '../td/TowerIcons';
import { ELEMENT_PLANT_CONFIG } from '../td/plants';
import type { ElementType, PlantType } from '../td/types';
import { fetchDailyShop, purchaseShopProduct, type DailyShopState, type ShopProductView } from './shopApi';

type ShopPageProps = { onBack: () => void };
const formatAmount = (amount: number) => amount.toLocaleString('zh-CN');

export default function ShopPage({ onBack }: ShopPageProps) {
  const [shop, setShop] = useState<DailyShopState | null>(null);
  const [pending, setPending] = useState<ShopProductView | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(Date.now());
  const operation = useRef(false);
  const mounted = useRef(true);
  const authed = Boolean(getToken());

  const load = useCallback(async () => {
    if (operation.current) return;
    operation.current = true;
    setLoading(true);
    try {
      const result = await fetchDailyShop();
      if (mounted.current) { setShop(result); setError(''); }
    } catch (reason) {
      if (mounted.current) setError(getErrorMessage(reason, '商店加载失败'));
    } finally {
      operation.current = false;
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (authed) void load();
    return () => { mounted.current = false; };
  }, [authed, load]);

  useEffect(() => {
    if (!authed) return;
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 1000);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [authed]);

  const expired = shop !== null && now >= Date.parse(shop.refreshAt);
  useEffect(() => {
    if (!expired) return;
    setPending(null);
    setMessage('');
    void load();
  }, [expired, load]);

  useEffect(() => {
    if (!pending || busy) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setPending(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, busy]);

  const buy = async () => {
    if (!shop || !pending || operation.current || expired) return;
    operation.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await purchaseShopProduct(pending.id, shop.dayKey);
      if (mounted.current) {
        setShop(result);
        setMessage(`${resolveUnlockItemLabel(pending.itemId)}碎片 x${pending.amount} 已到账。`);
      }
    } catch (reason) {
      if (mounted.current) setError(getErrorMessage(reason, '购买失败，请稍后重试'));
      // Re-read after ambiguous network failures or a purchase made on another device.
      try { const result = await fetchDailyShop(); if (mounted.current) setShop(result); } catch { /* Keep the original error. */ }
    } finally {
      operation.current = false;
      if (mounted.current) { setBusy(false); setPending(null); }
    }
  };

  if (!authed) return <>
    <AuthBar onAuthed={() => window.location.reload()} />
    <main className="shop-shell"><div className="shop-empty">
      <strong>登录后可进入商店</strong>
      <button className="action-button" onClick={onBack}><ArrowLeft size={16} />返回主页</button>
    </div></main>
  </>;

  const remaining = shop ? Math.max(0, Math.ceil((Date.parse(shop.refreshAt) - now) / 1000)) : 0;
  const countdown = [Math.floor(remaining / 3600), Math.floor(remaining / 60) % 60, remaining % 60]
    .map(value => String(value).padStart(2, '0')).join(':');

  return <>
    <AuthBar wallet={shop ?? undefined} />
    <main className="shop-shell">
      <header className="shop-header">
        <div><span className="study-kicker">SHOP</span><h1>商店</h1></div>
        <button className="action-button" onClick={onBack}><ArrowLeft size={16} />返回主页</button>
      </header>
      {error && <div className="shop-error" role="alert">{error}</div>}
      {message && <div className="shop-message" role="status">{message}</div>}
      <section className="shop-section" aria-labelledby="daily-shop-title">
        <div className="shop-section-heading">
          <div><h2 id="daily-shop-title">每日商店</h2><span className="muted">北京时间 00:00 刷新</span></div>
          <div className="shop-refresh">
            {shop && <span>{expired ? '待刷新' : `${countdown} 后刷新`}</span>}
            <button className="shop-icon-button" onClick={() => void load()} disabled={loading || busy}
              title="刷新商店" aria-label="刷新商店"><RefreshCw size={16} className={loading ? 'shop-spinner' : ''} /></button>
          </div>
        </div>
        {!shop ? <div className="shop-empty"><strong>{loading ? '正在读取商品...' : '暂时无法读取商品'}</strong></div>
          : <div className="shop-product-grid">{shop.products.map(product => {
            const affordable = shop[product.currency] >= product.price;
            const label = resolveUnlockItemLabel(product.itemId);
            const CurrencyIcon = product.currency === 'coins' ? Coins : Diamond;
            return <article key={`${shop.dayKey}-${product.id}`} className={`shop-product${product.purchased ? ' is-purchased' : ''}`}>
              <div className={`shop-product-icon ${product.currency === 'coins' ? 'is-plant' : 'is-element'}`}>
                {product.currency === 'coins' ? <PlantIcon type={product.itemId as PlantType} color="#15803d" size={40} />
                  : <ElementIcon color={ELEMENT_PLANT_CONFIG[product.itemId.split(':')[1] as ElementType].color} size={40} />}
              </div>
              <h3>{label}碎片</h3>
              <span className="shop-product-quantity">x{product.amount}</span>
              <div className="shop-product-price"><CurrencyIcon size={16} /><strong>{formatAmount(product.price)}</strong>
                <span>{product.currency === 'coins' ? '金币' : '钻石'}</span></div>
              <button className={`action-button${product.purchased ? '' : ' primary'}`}
                disabled={product.purchased || !affordable || busy || loading || expired}
                onClick={() => { setError(''); setMessage(''); setPending(product); }}>
                {product.purchased ? <Check size={16} /> : <ShoppingCart size={16} />}
                {product.purchased ? '已购买' : affordable ? '购买' : product.currency === 'coins' ? '金币不足' : '钻石不足'}
              </button>
            </article>;
          })}</div>}
      </section>
    </main>
    {pending && <div className="modal-backdrop" onClick={() => { if (!busy) setPending(null); }}>
      <div className="glass-panel modal-panel shop-confirm" role="dialog" aria-modal="true" aria-labelledby="shop-confirm-title"
        onClick={event => event.stopPropagation()}>
        <h2 id="shop-confirm-title">确认购买</h2>
        <p>{resolveUnlockItemLabel(pending.itemId)}碎片 x{pending.amount}</p>
        <strong>{formatAmount(pending.price)} {pending.currency === 'coins' ? '金币' : '钻石'}</strong>
        <div className="button-row">
          <button className="action-button" disabled={busy} onClick={() => setPending(null)}>取消</button>
          <button className="action-button primary" disabled={busy || expired} onClick={() => void buy()} autoFocus>
            {busy ? <LoaderCircle size={16} className="shop-spinner" /> : <ShoppingCart size={16} />}{busy ? '购买中...' : '确认购买'}
          </button>
        </div>
      </div>
    </div>}
  </>;
}
