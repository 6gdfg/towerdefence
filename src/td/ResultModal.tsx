import type { CSSProperties } from 'react';
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
};

const secondaryButtonStyle: CSSProperties = {
  flex: '1 1 auto',
};

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
}: ResultModalProps) {
  const isWon = result === 'won';
  const summary = isWon
    ? (levelIndex != null ? `第${levelIndex + 1}关 ${LEVELS[levelIndex].name}` : activeFunMode ? `趣味模式 · ${funModeLabel}` : '')
    : (activeFunMode ? `趣味模式 · ${funModeLabel}` : levelIndex != null ? `第${levelIndex + 1}关 ${LEVELS[levelIndex].name}` : '');

  return (
    <div className="modal-backdrop" style={{ zIndex: 999 }}>
      <div className="glass-panel modal-panel">
        <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>
          {isWon ? '关卡完成 🎉' : (activeFunMode ? `挑战结束 · ${funModeLabel}` : '挑战失败 💥')}
        </div>
        <div style={{ color:'#6b7280', fontSize:13, marginBottom:10 }}>{summary}</div>

        {result === 'lost' && activeFunMode && (
          <div style={{ color:'#475569', fontSize:13, marginBottom:10 }}>本轮击退波数：{wavesCleared}</div>
        )}

        {isWon && winReward && winReward.coins > 0 && (
          <div className="reward-panel" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight:600, marginBottom:6, color:'#059669' }}>🎁 通关奖励</div>
            {winReward.message && (
              <div style={{ fontSize:14, color:'#6b7280', marginBottom:6 }}>{winReward.message}</div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
              <span>金币</span>
              <span style={{ fontWeight:600, color:'#f59e0b' }}>+{winReward.coins}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginTop:4 }}>
              <span>宝箱</span>
              <span style={{ fontWeight:600, color:'#8b5cf6' }}>
                {resolveChestTypeLabel(winReward.chestType)}
              </span>
            </div>
            {winReward.chestCoins ? (
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginTop:4 }}>
                <span>宝箱内金币</span>
                <span style={{ fontWeight:600, color:'#b45309' }}>+{winReward.chestCoins}</span>
              </div>
            ) : null}
          </div>
        )}

        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {isWon ? (
            <>
              {levelIndex != null && currentStar < 3 && (
                <button onClick={onChallengeHigherStar} className="action-button" style={secondaryButtonStyle}>挑战更高星级</button>
              )}
              <button onClick={onNextLevel} className="action-button primary" style={secondaryButtonStyle}>下一关</button>
              <button onClick={onRestartLevel} className="action-button" style={secondaryButtonStyle}>重玩</button>
              <button onClick={onBackToSelect} className="action-button" style={secondaryButtonStyle}>返回关卡</button>
              <button onClick={onBackToHub} className="action-button" style={secondaryButtonStyle}>返回主界面</button>
            </>
          ) : activeFunMode ? (
            <>
              <button onClick={onRestartFunMode} className="action-button primary" style={secondaryButtonStyle}>重新开始{funModeLabel}</button>
              <button onClick={onBackToFunMode} className="action-button" style={secondaryButtonStyle}>返回趣味模式</button>
              <button onClick={onBackToHub} className="action-button" style={secondaryButtonStyle}>返回主界面</button>
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
