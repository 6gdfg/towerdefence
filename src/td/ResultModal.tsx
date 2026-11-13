import type { CSSProperties } from 'react';
import { getChapterLevelLabel } from './chapters';
import { LEVELS } from './levels';
import type { WinReward } from './appTypes';
import type { FunModeType } from './funModes';
import { resolveChestTypeLabel } from './labels';

type ResultModalProps = {
  result: 'won' | 'lost';
  activeFunMode: FunModeType | null;
  funModeLabel: string;
  levelIndex: number | null;
  currentStar: 1 | 2 | 3;
  wavesCleared: number;
  winReward: WinReward | null;
  onChallengeHigherStar: () => void;
  onNextLevel: () => void;
  onRestartLevel: () => void;
  onBackToSelect: () => void;
  onBackToHub: () => void;
  onRestartFunMode: () => void;
  onBackToFunMode: () => void;
  rewardPending?: boolean;
  rewardBusy?: boolean;
  onRetryReward?: () => void;
};

const secondaryButtonStyle: CSSProperties = {
  flex: '1 1 auto',
};

function summarizeChestTypes(types: string[]) {
  const counts = new Map<string, number>();
  types.forEach(type => counts.set(type, (counts.get(type) ?? 0) + 1));
  return Array.from(counts.entries())
    .map(([type, count]) => `${resolveChestTypeLabel(type)}${count > 1 ? ` x${count}` : ''}`)
    .join('、');
}

export default function ResultModal({
  result,
  activeFunMode,
  funModeLabel,
  levelIndex,
  currentStar,
  wavesCleared,
  winReward,
  onChallengeHigherStar,
  onNextLevel,
  onRestartLevel,
  onBackToSelect,
  onBackToHub,
  onRestartFunMode,
  onBackToFunMode,
  rewardPending = false,
  rewardBusy = false,
  onRetryReward,
}: ResultModalProps) {
  const isWon = result === 'won';
  const levelName = levelIndex != null ? LEVELS[levelIndex]?.name ?? '' : '';
  const summary = levelIndex != null
    ? `${getChapterLevelLabel(levelIndex)} ${levelName}`
    : activeFunMode
      ? `趣味模式 · ${funModeLabel}`
      : '';
  const reward = isWon || activeFunMode === 'endless' ? winReward : null;
  const chestTypes = reward?.chestTypes?.length
    ? reward.chestTypes
    : reward?.chestType
      ? [reward.chestType]
      : [];
  const showReward = Boolean(reward && (
    reward.coins > 0
    || (reward.diamonds ?? 0) > 0
    || chestTypes.length > 0
    || Boolean(reward.message)
  ));

  return (
    <div className="modal-backdrop" style={{ zIndex: 999 }}>
      <div className="glass-panel modal-panel">
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
          {isWon ? '关卡完成' : (activeFunMode ? `挑战结束 · ${funModeLabel}` : '挑战失败')}
        </div>
        <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 10 }}>{summary}</div>

        {result === 'lost' && activeFunMode && (
          <div style={{ color: '#475569', fontSize: 13, marginBottom: 10 }}>本轮击退波数：{wavesCleared}</div>
        )}

        {showReward && reward && (
          <div className="reward-panel" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: '#059669' }}>{activeFunMode === 'endless' ? '结算奖励' : '通关奖励'}</div>
            {reward.message && (
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 6 }}>{reward.message}</div>
            )}
            {reward.coins > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span>金币</span>
                <span style={{ fontWeight: 600, color: '#f59e0b' }}>+{reward.coins}</span>
              </div>
            )}
            {(reward.diamonds ?? 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 4 }}>
                <span>钻石</span>
                <span style={{ fontWeight: 600, color: '#0ea5e9' }}>+{reward.diamonds ?? 0}</span>
              </div>
            )}
            {chestTypes.length > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14, marginTop: 4 }}>
                <span>宝箱</span>
                <span style={{ fontWeight: 600, color: '#8b5cf6', textAlign: 'right' }}>
                  {summarizeChestTypes(chestTypes)}
                </span>
              </div>
            ) : !reward.newRecord ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 4 }}>
                <span>宝箱</span>
                <span style={{ fontWeight: 600, color: '#94a3b8' }}>未掉落</span>
              </div>
            ) : null}
          </div>
        )}

        {activeFunMode === 'endless' && rewardPending && (
          <button className="action-button" onClick={onRetryReward} disabled={rewardBusy} style={{ marginBottom: 12 }}>
            {rewardBusy ? '结算中...' : '重试结算'}
          </button>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isWon ? (
            <>
              {levelIndex != null && currentStar < 3 && (
                <button onClick={onChallengeHigherStar} className="action-button" style={secondaryButtonStyle}>挑战更高难度</button>
              )}
              <button onClick={onNextLevel} className="action-button primary" style={secondaryButtonStyle}>下一关</button>
              <button onClick={onRestartLevel} className="action-button" style={secondaryButtonStyle}>重玩</button>
              <button onClick={onBackToSelect} className="action-button" style={secondaryButtonStyle}>返回关卡</button>
              <button onClick={onBackToHub} className="action-button" style={secondaryButtonStyle}>返回主界面</button>
            </>
          ) : activeFunMode ? (
            <>
              <button onClick={onRestartFunMode} disabled={rewardBusy} className="action-button primary" style={secondaryButtonStyle}>重新开始{funModeLabel}</button>
              <button onClick={onBackToFunMode} disabled={rewardBusy} className="action-button" style={secondaryButtonStyle}>返回趣味模式</button>
              <button onClick={onBackToHub} disabled={rewardBusy} className="action-button" style={secondaryButtonStyle}>返回主界面</button>
            </>
          ) : (
            <>
              <button onClick={onRestartLevel} className="action-button primary" style={secondaryButtonStyle}>重玩</button>
              <button onClick={onBackToSelect} className="action-button" style={secondaryButtonStyle}>返回关卡</button>
              <button onClick={onBackToHub} className="action-button" style={secondaryButtonStyle}>返回主界面</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
