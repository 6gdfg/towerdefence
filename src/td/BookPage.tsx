import { MONSTER_BASE_STATS } from './levels';
import { MONSTER_LABELS } from './appConfig';
import type { ElementBookEntry, PlantBookEntry } from './appTypes';

type MonsterEntry = [keyof typeof MONSTER_BASE_STATS, typeof MONSTER_BASE_STATS[keyof typeof MONSTER_BASE_STATS]];

type BookPageProps = {
  onBack: () => void;
  plantBookData: PlantBookEntry[];
  elementBookData: ElementBookEntry[];
  monsterEntries: MonsterEntry[];
};

export default function BookPage({ onBack, plantBookData, elementBookData, monsterEntries }: BookPageProps) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>图鉴</h2>
        <button onClick={onBack} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>返回</button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, margin: '12px 0 8px 0' }}>已解锁植物</h3>
        {plantBookData.length === 0 ? (
          <div style={{ fontSize: 12, color: '#9ca3af' }}>暂无解锁植物。</div>
        ) : (
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {plantBookData.map((entry, i) => (
              <div
                key={entry.type}
                className="card-enter"
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 12,
                  background: '#fff',
                  animationDelay: `${i * 0.05}s`,
                  opacity: 0,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{entry.config.name}（lv.{entry.level}）</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>
                  射程 {entry.stats.range} ｜ 伤害 {entry.stats.damage} ｜ 攻速 {entry.stats.fireRate > 0 ? entry.stats.fireRate : '0（手动）'} ｜ 子弹速度 {entry.stats.projectileSpeed}
                </div>
                {entry.stats.pierceLimit ? (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    穿透上限 {entry.stats.pierceLimit}
                    {entry.stats.damageDecayFactor ? `，每次伤害×${entry.stats.damageDecayFactor}` : ''}
                  </div>
                ) : null}
                {entry.stats.activeAbilityCost ? (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    主动消耗 {entry.stats.activeAbilityCost} 金币发动攻击
                  </div>
                ) : null}
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{entry.config.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, margin: '12px 0 8px 0' }}>已解锁元素</h3>
        {elementBookData.length === 0 ? (
          <div style={{ fontSize: 12, color: '#9ca3af' }}>暂无解锁元素。</div>
        ) : (
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {elementBookData.map((entry, i) => (
              <div
                key={entry.id}
                className="card-enter"
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 12,
                  background: '#fff',
                  animationDelay: `${i * 0.05}s`,
                  opacity: 0,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>{entry.cfg.name}（lv.{entry.level}）</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>费用 {entry.cfg.cost} ｜ 伤害倍率 ×{entry.damageMultiplier}</div>
                {entry.fireRateMultiplier !== null && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>攻速倍率 ×{entry.fireRateMultiplier}</div>
                )}
                {entry.fireRatePenalty !== null && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>攻速惩罚 -{entry.fireRatePenalty}</div>
                )}
                {entry.breakArmor && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>破甲倍率 ×{entry.breakArmor.multiplier}（{entry.breakArmor.duration}s）</div>
                )}
                {entry.burn && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>灼烧 {entry.burn.dps}/s（{entry.burn.duration}s）</div>
                )}
                {entry.splash && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>溅射 {entry.splash.percent}% ｜ 半径 {entry.splash.radius}</div>
                )}
                {entry.slow && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>减速 {entry.slow.pct}%（{entry.slow.duration}s）</div>
                )}
                {entry.knockback && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>击退 {entry.knockback}</div>
                )}
                {entry.aura && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>光环伤害 {entry.aura.dps}/s</div>
                )}
                {entry.bounce && (
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>反弹上限 {entry.bounce.maxBounces}</div>
                )}
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{entry.cfg.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: 16, margin: '12px 0 8px 0' }}>怪物图鉴</h3>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {monsterEntries.map(([id, stats], i) => (
            <div
              key={id}
              className="card-enter"
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 12,
                background: '#fff',
                animationDelay: `${i * 0.05}s`,
                opacity: 0,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14 }}>{MONSTER_LABELS[id]}（{id}）</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>基础生命 {stats.hp} ｜ 基础速度 {stats.speed.toFixed(2)} ｜ 泄漏伤害 {stats.leakDamage}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>实际数值会随关卡等级提升。</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
