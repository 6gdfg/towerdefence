import type { ChestReward } from './appTypes';
import { resolveChestTypeLabel, resolveShardLabel, resolveUnlockItemLabel } from './labels';

type ChestRewardModalProps = {
  reward: ChestReward;
  onClose: () => void;
};

export default function ChestRewardModal({ reward, onClose }: ChestRewardModalProps) {
  const plantEntries = Object.entries(reward.plantShards);
  const elementEntries = Object.entries(reward.elementShards).map(([element, count]) => [`element:${element}`, count] as const);
  const unlockEntries = reward.newUnlocks ?? [];

  return (
    <div className="modal-backdrop">
      <div className="glass-panel modal-panel">
        <div style={{ fontWeight:700, fontSize:20, marginBottom:12, textAlign:'center' }}>🎁 宝箱开启成功！</div>
        <div style={{ fontSize:14, color:'#6b7280', marginBottom:16, textAlign:'center' }}>
          <span className={reward.chestType === 'legendary' ? 'legendary-text' : undefined}>
            {resolveChestTypeLabel(reward.chestType)}
          </span>
        </div>
        <div className="reward-panel">
          {plantEntries.length > 0 && (
            <>
              <div style={{ fontWeight:600, marginBottom:8 }}>获得植物碎片：</div>
              {plantEntries.map(([tower, count]) => (
                <div key={tower} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:14 }}>
                  <span>{resolveShardLabel(tower)}</span>
                  <span style={{ fontWeight:600, color:'#10b981' }}>+{count}</span>
                </div>
              ))}
            </>
          )}
          {elementEntries.length > 0 && (
            <>
              <div style={{ fontWeight:600, marginTop: plantEntries.length > 0 ? 10 : 0, marginBottom:8 }}>获得元素碎片：</div>
              {elementEntries.map(([elementKey, count]) => (
                <div key={elementKey} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:14 }}>
                  <span>{resolveShardLabel(elementKey)}</span>
                  <span style={{ fontWeight:600, color:'#3b82f6' }}>+{count}</span>
                </div>
              ))}
            </>
          )}
          {reward.coins > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:14, borderTop:'1px dashed #e5e7eb', marginTop:8, paddingTop:8 }}>
              <span>金币</span>
              <span style={{ fontWeight:600, color:'#f59e0b' }}>+{reward.coins}</span>
            </div>
          )}
          {(reward.magicKeys ?? 0) > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:14 }}>
              <span>神奇钥匙</span>
              <span style={{ fontWeight:600, color:'#8b5cf6' }}>+{reward.magicKeys}</span>
            </div>
          )}
          {unlockEntries.length > 0 && (
            <>
              <div style={{ fontWeight:600, marginTop: 10, marginBottom:8 }}>直接解锁：</div>
              {unlockEntries.map(itemId => (
                <div key={itemId} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:14 }}>
                  <span>{resolveUnlockItemLabel(itemId)}</span>
                  <span style={{ fontWeight:600, color:'#ec4899' }}>NEW</span>
                </div>
              ))}
            </>
          )}
        </div>
        <button onClick={onClose} className="action-button primary" style={{ width:'100%' }}>确定</button>
      </div>
    </div>
  );
}
