type SubmissionRewardModalProps = {
  levelName: string;
  difficulty: string;
  confirming: boolean;
  error: string | null;
  onConfirm: () => void;
};

export default function SubmissionRewardModal({
  levelName,
  difficulty,
  confirming,
  error,
  onConfirm,
}: SubmissionRewardModalProps) {
  const levelLabel = difficulty ? `${levelName} ${difficulty}` : levelName;
  return (
    <div className="modal-backdrop" style={{ zIndex: 1240 }}>
      <section className="glass-panel modal-panel update-announcement-modal" role="dialog" aria-modal="true" aria-label="关卡投稿采纳通知">
        <div className="eyebrow">LEVEL ACCEPTED</div>
        <h2>{`恭喜！你的关卡 ${levelLabel} 已被采纳！`}</h2>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>奖励 5000 金币 + 50 经验！</p>
        {error && <p className="update-announcement-error">{error}</p>}
        <button type="button" className="action-button primary" onClick={onConfirm} disabled={confirming}>
          {confirming ? '确认中...' : '确定'}
        </button>
      </section>
    </div>
  );
}
