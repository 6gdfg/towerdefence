import { useEffect, useMemo, useState } from 'react';
import AuthBar from '../td/AuthBar';
import { getToken } from '../td/authProgress';
import { resolveChestTypeLabel, resolveUnlockItemLabel } from '../td/labels';
import { fetchGarden, harvestGardenPlot, isGardenDevPreview, plantGardenSeed, unlockGardenPlot, upgradeGarden, type GardenPayload, type GardenSeedType } from './gardenApi';

type GardenPageProps = { onBack: () => void };

function formatRemaining(milliseconds: number) {
  const total = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total % 3600 / 60);
  const seconds = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function GardenPage({ onBack }: GardenPageProps) {
  const [garden, setGarden] = useState<GardenPayload | null>(null);
  const [selectedSeed, setSelectedSeed] = useState<GardenSeedType>('plant');
  const [now, setNow] = useState(Date.now());
  const [busyPlot, setBusyPlot] = useState<number | 'unlock' | 'efficiency' | 'luck' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken() && !isGardenDevPreview()) return;
    void fetchGarden().then(setGarden).catch(reason => setError(reason instanceof Error ? reason.message : '花园加载失败'));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const plotByIndex = useMemo(() => new Map(garden?.plots.map(plot => [plot.index, plot]) ?? []), [garden?.plots]);

  const runAction = async (key: number | 'unlock' | 'efficiency' | 'luck', action: () => Promise<GardenPayload>) => {
    if (busyPlot !== null) return;
    setBusyPlot(key);
    setError('');
    setMessage('');
    try {
      const result = await action();
      setGarden(result);
      if (result.harvest?.seedType === 'plant') {
        const recycled = result.harvest.recycledSeed ? '，种子已回收' : '';
        setMessage(`收获 ${resolveUnlockItemLabel(result.harvest.targetItem ?? '')}碎片 x${result.harvest.shards ?? 1}${recycled}`);
      } else if (result.harvest?.seedType === 'chest') {
        setMessage(`收获 ${resolveChestTypeLabel(result.harvest.chestType ?? 'common')}宝箱 x1`);
      }
    } catch (reason) {
      const rawMessage = reason instanceof Error ? reason.message : '花园操作失败';
      const friendlyMessage = rawMessage.includes('CHEST_INVENTORY_FULL')
        ? '宝箱库存已满，请先打开或合成宝箱'
        : rawMessage.includes('EXPERIENCE_NOT_ENOUGH')
          ? '经验不足'
          : rawMessage.includes('MAX_LEVEL')
            ? '已达到最高等级'
            : rawMessage;
      setError(friendlyMessage);
    } finally {
      setBusyPlot(null);
    }
  };

  if (!getToken() && !isGardenDevPreview()) {
    return (
      <>
        <AuthBar onAuthed={() => window.location.reload()} />
        <main className="garden-shell"><div className="soft-card garden-empty"><strong>登录后可进入花园</strong><button className="action-button" onClick={onBack}>返回主界面</button></div></main>
      </>
    );
  }

  return (
    <>
      <AuthBar wallet={garden?.wallet} />
      <main className="garden-shell">
        <header className="garden-header">
          <div><span className="study-kicker">GARDEN</span><h1>花园</h1></div>
          <button className="action-button" onClick={onBack}>返回主界面</button>
        </header>

        <div className="garden-toolbar">
          <div className="garden-seed-picker" role="group" aria-label="选择种子">
            <button className={selectedSeed === 'plant' ? 'is-active' : ''} onClick={() => setSelectedSeed('plant')}>
              <span className="garden-seed-icon plant" aria-hidden="true" /><strong>植物种子</strong><em>{garden?.plantSeeds ?? 0}</em>
            </button>
            <button className={selectedSeed === 'chest' ? 'is-active' : ''} onClick={() => setSelectedSeed('chest')}>
              <span className="garden-seed-icon chest" aria-hidden="true" /><strong>宝箱种子</strong><em>{garden?.chestSeeds ?? 0}</em>
            </button>
          </div>
          {garden && <div className="garden-inventory-count">宝箱库存 {garden.chestCount} / {garden.maxChests}</div>}
          {message && <div className="garden-message">{message}</div>}
          {error && <div className="garden-error">{error}</div>}
        </div>

        {garden && (
          <section className="garden-upgrades">
            <article className="soft-card garden-upgrade-card">
              <div className="garden-upgrade-head"><div><span>效率</span><strong>Lv.{garden.efficiencyLevel} / {garden.maxEfficiencyLevel}</strong></div><b>-{garden.efficiencyReductionPct}%</b></div>
              <div className="garden-upgrade-track"><span style={{ width: `${garden.efficiencyLevel / garden.maxEfficiencyLevel * 100}%` }} /></div>
              <div className="garden-upgrade-footer">
                <span>新种子成熟时间</span>
                <button
                  className="action-button"
                  disabled={busyPlot !== null || garden.efficiencyLevel >= garden.maxEfficiencyLevel || garden.wallet.experience < 3 + garden.efficiencyLevel}
                  onClick={() => void runAction('efficiency', () => upgradeGarden('efficiency'))}
                >
                  {garden.efficiencyLevel >= garden.maxEfficiencyLevel ? '已满级' : `升级 ${3 + garden.efficiencyLevel} 经验`}
                </button>
              </div>
            </article>
            <article className="soft-card garden-upgrade-card">
              <div className="garden-upgrade-head"><div><span>时运</span><strong>Lv.{garden.luckLevel} / {garden.maxLuckLevel}</strong></div><b>{garden.seedRecyclePct}%</b></div>
              <div className="garden-luck-rates">
                <span>1碎片 {garden.shardChances.one}%</span>
                <span>2碎片 {garden.shardChances.two}%</span>
                <span>3碎片 {garden.shardChances.three}%</span>
                <span>种子回收 {garden.seedRecyclePct}%</span>
              </div>
              <div className="garden-upgrade-footer">
                <span>碎片收益 Lv.11 封顶</span>
                <button
                  className="action-button"
                  disabled={busyPlot !== null || garden.luckLevel >= garden.maxLuckLevel || garden.wallet.experience < 3 + garden.luckLevel}
                  onClick={() => void runAction('luck', () => upgradeGarden('luck'))}
                >
                  {garden.luckLevel >= garden.maxLuckLevel ? '已满级' : `升级 ${3 + garden.luckLevel} 经验`}
                </button>
              </div>
            </article>
          </section>
        )}

        {!garden ? <div className="soft-card garden-empty"><strong>正在整理花园...</strong></div> : (
          <section className="garden-grid">
            {Array.from({ length: garden.unlockedPlots }, (_, index) => {
              const plot = plotByIndex.get(index);
              const remaining = plot ? new Date(plot.readyAt).getTime() - now : 0;
              const ready = Boolean(plot && remaining <= 0);
              const seedCount = selectedSeed === 'plant' ? garden.plantSeeds : garden.chestSeeds;
              return (
                <button
                  key={index}
                  className={`garden-plot ${plot ? `is-growing ${plot.seedType}` : 'is-empty'} ${ready ? 'is-ready' : ''}`}
                  disabled={busyPlot !== null || (!plot && seedCount < 1) || Boolean(plot && !ready)}
                  onClick={() => void runAction(index, () => plot ? harvestGardenPlot(index) : plantGardenSeed(index, selectedSeed))}
                >
                  <span className="garden-plot-index">{index + 1}</span>
                  {!plot && <span className="garden-soil" aria-hidden="true" />}
                  {plot?.seedType === 'plant' && <span className="garden-growth plant" aria-hidden="true" />}
                  {plot?.seedType === 'chest' && <span className="garden-growth chest" aria-hidden="true" />}
                  <strong>{!plot ? '空地' : plot.seedType === 'plant' ? resolveUnlockItemLabel(plot.targetItem ?? '') : '宝箱'}</strong>
                  {plot && <span>{ready ? '收获' : formatRemaining(remaining)}</span>}
                </button>
              );
            })}
            <button
              className="garden-plot is-locked"
              disabled={busyPlot !== null || garden.wallet.coins < garden.unlockCost}
              onClick={() => void runAction('unlock', unlockGardenPlot)}
            >
              <span className="garden-lock-plus">+</span><strong>解锁田地</strong><span>{garden.unlockCost} 金币</span>
            </button>
          </section>
        )}
      </main>
    </>
  );
}
