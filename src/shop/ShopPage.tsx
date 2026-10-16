import { useCallback, useEffect, useState } from 'react';
import AuthBar from '../td/AuthBar';
import { getToken } from '../td/authProgress';
import { getErrorMessage } from '../td/errors';
import { fetchShopWallet, purchaseShopProduct, SHOP_PRODUCT_VIEWS, type ShopProductView, type ShopReceipt, type ShopWallet } from './shopApi';

type ShopPageProps = { onBack: () => void };

function formatCoins(amount: number) {
  return Number(amount || 0).toLocaleString('zh-CN');
}

function formatPurchaseTime(value: string) {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return value;
  const formatted = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(timestamp);
  return `${formatted}（北京时间）`;
}

function buildReceiptText(receipt: ShopReceipt) {
  return [
    '【兑换凭据】',
    `凭据编号：${receipt.id}`,
    `购买者ID：${receipt.buyerId}`,
    `用户名：${receipt.username || '未记录'}`,
    `商品：${receipt.productName}`,
    `金额：${formatCoins(receipt.priceCoins)} 金币`,
    `购买形式：${receipt.channelLabel}`,
    `购买时间：${formatPurchaseTime(receipt.purchasedAt)}`,
  ].join('\n');
}

export default function ShopPage({ onBack }: ShopPageProps) {
  const [wallet, setWallet] = useState<ShopWallet | null>(null);
  const [receipt, setReceipt] = useState<ShopReceipt | null>(null);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const authed = Boolean(getToken());

  const loadWallet = useCallback(async () => {
    try {
      setWallet(await fetchShopWallet());
    } catch (reason: unknown) {
      setError(getErrorMessage(reason, '商店加载失败'));
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    void loadWallet();
  }, [authed, loadWallet]);

  const handlePurchase = async (product: ShopProductView) => {
    if (busyProductId) return;
    if (!window.confirm(`确认消耗 ${formatCoins(product.priceCoins)} 金币兑换「${product.name}」吗？兑换后金币不予退还。`)) return;
    setBusyProductId(product.id);
    setError('');
    setMessage('');
    try {
      const result = await purchaseShopProduct(product.id);
      setCopied(false);
      setReceipt(result.purchase);
      setWallet(current => current ? {
        ...current,
        coins: result.coins,
        purchases: [result.purchase, ...current.purchases],
      } : current);
    } catch (reason: unknown) {
      const rawMessage = getErrorMessage(reason, '兑换失败，请稍后重试');
      setError(rawMessage.includes('COINS_NOT_ENOUGH') ? '金币不足，无法兑换该商品' : rawMessage);
    } finally {
      setBusyProductId(null);
    }
  };

  const copyReceipt = async () => {
    if (!receipt) return;
    try {
      await navigator.clipboard.writeText(buildReceiptText(receipt));
      setCopied(true);
    } catch {
      setMessage('复制失败，请直接截屏。');
    }
  };

  if (!authed) {
    return (
      <>
        <AuthBar onAuthed={() => window.location.reload()} />
        <main className="page-wrap">
          <section className="soft-card shop-empty">
            <strong>登录后可进入商店</strong>
            <button className="action-button" onClick={onBack}>返回主界面</button>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <AuthBar wallet={wallet ?? undefined} />
      <main className="page-wrap">
        <section className="glass-panel hero-panel card-enter" style={{ opacity: 0, animationDelay: '0s' }}>
          <div className="page-title-row">
            <div>
              <div className="eyebrow">SHOP</div>
              <h1>商店</h1>
              <p>用游戏金币兑换实物，兑换成功后凭截图联系 owner 领取。</p>
            </div>
            <div className="button-row">
              <button onClick={onBack} className="action-button">返回主界面</button>
            </div>
          </div>

          <div className="stats-row">
            <div className="metric-pill">
              <span>金币</span>
              <strong>{wallet ? formatCoins(wallet.coins) : '-'}</strong>
            </div>
            <div className="metric-pill">
              <span>钻石</span>
              <strong>{wallet?.diamonds ?? '-'}</strong>
            </div>
            <div className="metric-pill">
              <span>购买者ID</span>
              <strong style={{ fontSize: 14, wordBreak: 'break-all' }}>{wallet?.buyerId ?? '-'}</strong>
            </div>
          </div>
        </section>

        {error && <p className="shop-error">{error}</p>}
        {message && <p className="shop-message">{message}</p>}

        <div className="dashboard-grid">
          <section className="soft-card card-enter" style={{ opacity: 0, animationDelay: '0.08s', padding: 16 }}>
            <div className="section-title">商品</div>
            <div className="item-list">
              {SHOP_PRODUCT_VIEWS.map(product => {
                const affordable = (wallet?.coins ?? 0) >= product.priceCoins;
                const busy = busyProductId === product.id;
                const can = affordable && wallet !== null && busyProductId === null;
                return (
                  <div key={product.id} className="item-row">
                    <div>
                      <div className="item-name">🥛 {product.name}</div>
                      <div className="muted">
                        {formatCoins(product.priceCoins)} 金币 · {product.description}
                        {wallet !== null && !affordable && <span className="warning-text">（金币不足）</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => void handlePurchase(product)}
                      disabled={!can}
                      className="action-button primary"
                      style={{ opacity: can ? 1 : 0.52 }}
                    >
                      {busy ? '兑换中...' : '兑换'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="soft-card card-enter" style={{ opacity: 0, animationDelay: '0.14s', padding: 16 }}>
            <div className="section-title">我的兑换记录</div>
            {!wallet ? (
              <div className="muted">正在读取兑换记录...</div>
            ) : wallet.purchases.length === 0 ? (
              <div className="muted">还没有兑换记录。</div>
            ) : (
              <div className="item-list">
                {wallet.purchases.map(purchase => (
                  <div key={purchase.id} className="item-row">
                    <div>
                      <div className="item-name">{purchase.productName}</div>
                      <div className="muted">{purchase.channelLabel} · {formatPurchaseTime(purchase.purchasedAt)}</div>
                    </div>
                    <span className="muted">{formatCoins(purchase.priceCoins)} 金币</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {receipt && (
        <div className="modal-backdrop">
          <div className="glass-panel modal-panel shop-receipt-panel">
            <div className="shop-receipt-title">🥛 兑换成功</div>
            <div className="muted" style={{ textAlign: 'center' }}>请截屏并发给owner。</div>

            <div className="shop-receipt">
              <div className="shop-receipt-row"><span>凭据编号</span><strong>{receipt.id}</strong></div>
              <div className="shop-receipt-row"><span>购买者ID</span><strong>{receipt.buyerId}</strong></div>
              <div className="shop-receipt-row"><span>用户名</span><strong>{receipt.username || '未记录'}</strong></div>
              <div className="shop-receipt-row"><span>商品</span><strong>{receipt.productName}</strong></div>
              <div className="shop-receipt-row"><span>金额</span><strong>{formatCoins(receipt.priceCoins)} 金币</strong></div>
              <div className="shop-receipt-row"><span>购买形式</span><strong>{receipt.channelLabel}</strong></div>
              <div className="shop-receipt-row"><span>购买时间</span><strong>{formatPurchaseTime(receipt.purchasedAt)}</strong></div>
            </div>

            <div className="button-row">
              <button onClick={() => void copyReceipt()} className="action-button">{copied ? '已复制' : '复制凭据'}</button>
              <button onClick={() => setReceipt(null)} className="action-button primary">确定</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
