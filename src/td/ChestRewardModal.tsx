import type { ChestReward } from './appTypes';
import { resolveChestTypeLabel, resolveShardLabel } from './labels';

type ChestRewardModalProps = {
  reward: ChestReward;
  onClose: () => void;
};

export default function ChestRewardModal({ reward, onClose }: ChestRewardModalProps) {
  const plantEntries = Object.entries(reward.plantShards);
  const elementEntries = Object.entries(reward.elementShards).map(([element, count]) => [`element:${element}`, count] as const);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ width: 400, borderRadius: 12, background:'#ffffff', border:'1px solid #e5e7eb', padding:20, boxShadow:'0 10px 30px rgba(0,0,0,0.15)' }}>
        <div style={{ fontWeight:700, fontSize:20, marginBottom:12, textAlign:'center' }}>🎁 宝箱开启成功！</div>
        <div style={{ fontSize:14, color:'#6b7280', marginBottom:16, textAlign:'center' }}>
          {resolveChestTypeLabel(reward.chestType)}
        </div>
        <div style={{ background:'#f9fafb', borderRadius:8, padding:12, marginBottom:16 }}>
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
        </div>
        <button onClick={onClose} style={{ width:'100%', padding:'10px', borderRadius:8, border:'1px solid #111827', background:'#fff', fontWeight:600, cursor:'pointer' }}>确定</button>
      </div>
    </div>
  );
}
