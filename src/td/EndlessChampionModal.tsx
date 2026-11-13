type EndlessChampionModalProps = {
  weekStart: string;
  bestWaves: number;
  coins: number;
  experience: number;
  confirming: boolean;
  error: string | null;
  onConfirm: () => void;
};

export default function EndlessChampionModal({ weekStart, bestWaves, coins, experience, confirming, error, onConfirm }: EndlessChampionModalProps) {
  return (
    <div className="modal-backdrop" style={{ zIndex: 1240 }}>
      <section className="glass-panel modal-panel update-announcement-modal" role="dialog" aria-modal="true" aria-label="无尽模式周冠军通知">
        <div className="eyebrow">ENDLESS CHAMPION</div>
        <h2>恭喜！你获得了无尽模式榜周冠军！</h2>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>{weekStart} 起的一周 · 最高通关 {bestWaves} 波</p>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>奖励 {coins} 金币 + {experience} 经验！</p>
        {error && <p className="update-announcement-error">{error}</p>}
        <button type="button" className="action-button primary" onClick={onConfirm} disabled={confirming}>
          {confirming ? '确认中...' : '确定'}
        </button>
      </section>
    </div>
  );
}
