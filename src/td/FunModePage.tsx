import type { FunModeType } from './funModes';

type FunModePageProps = {
  onBack: () => void;
  onStartMode: (mode: FunModeType) => void;
};

export default function FunModePage({ onBack, onStartMode }: FunModePageProps) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>趣味模式</h2>
        <button onClick={onBack} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>返回主界面</button>
      </div>
      <p style={{ fontSize: 14, color: '#475569', marginBottom: 16 }}>在究极回环地图上体验自由挑战：测试模式可自定义全部植物/元素等级，无尽模式沿用当前账号配置，新增的随机模式会把地图、金币、植物、元素与波次统统洗牌。</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>测试模式</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>所有植物与元素全部解锁，开始前可逐一设定等级，适合验证数值与组合。</p>
          </div>
          <button onClick={() => onStartMode('test')} className="btn-hover" style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 600 }}>配置并开始</button>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>无尽模式</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>沿用当前账号的解锁与等级配置，逐波强化敌人，每 10 波迎战 Boss。</p>
          </div>
          <button onClick={() => onStartMode('endless')} className="btn-hover" style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #0f172a', background: '#fff', color: '#0f172a', fontWeight: 600 }}>直接开始</button>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>随机模式</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>地图从全部地图池抽取，初始金币 1000-3000 随机；随机获得 3-7 种植物与 3-5 种元素，并赋予 3-10 级等级，波数 4-10 波、怪物组合完全随机。</p>
          </div>
          <button onClick={() => onStartMode('random')} className="btn-hover" style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 600 }}>立即开局</button>
        </div>
      </div>
    </div>
  );
}
