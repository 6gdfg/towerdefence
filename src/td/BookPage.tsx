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
    <main className="page-wrap">
      <section className="glass-panel hero-panel card-enter" style={{ opacity: 0, animationDelay: '0s' }}>
        <div className="page-title-row">
          <div>
            <div className="eyebrow">Archive</div>
            <h1>图鉴</h1>
            <p>查看已解锁植物、元素和怪物基础数据。</p>
          </div>
          <button onClick={onBack} className="action-button">返回</button>
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 className="section-title">已解锁植物</h2>
        {plantBookData.length === 0 ? (
          <div className="soft-card" style={{ padding: 16 }}>
            <div className="muted">暂无解锁植物。</div>
          </div>
        ) : (
          <div className="book-grid">
            {plantBookData.map((entry, i) => (
              <article
                key={entry.type}
                className="soft-card book-card card-enter"
                style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}
              >
                <div className="item-name">{entry.config.name}（lv.{entry.level}）</div>
                <div className="muted" style={{ marginTop: 6 }}>
                  射程 {entry.stats.range} ｜ 伤害 {entry.stats.damage} ｜ 攻速 {entry.stats.fireRate > 0 ? entry.stats.fireRate : '0（手动）'} ｜ 子弹速度 {entry.stats.projectileSpeed}
                </div>
                {entry.stats.pierceLimit ? (
                  <div className="muted" style={{ marginTop: 4 }}>
                    穿透上限 {entry.stats.pierceLimit}
                    {entry.stats.damageDecayFactor ? `，每次伤害×${entry.stats.damageDecayFactor}` : ''}
                  </div>
                ) : null}
                {entry.stats.activeAbilityCost ? (
                  <div className="muted" style={{ marginTop: 4 }}>
                    主动消耗 {entry.stats.activeAbilityCost} 金币发动攻击
                  </div>
                ) : null}
                <div className="muted" style={{ marginTop: 4, color: '#94a3b8' }}>{entry.config.description}</div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 className="section-title">已解锁元素</h2>
        {elementBookData.length === 0 ? (
          <div className="soft-card" style={{ padding: 16 }}>
            <div className="muted">暂无解锁元素。</div>
          </div>
        ) : (
          <div className="book-grid">
            {elementBookData.map((entry, i) => (
              <article
                key={entry.id}
                className="soft-card book-card card-enter"
                style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}
              >
                <div className="item-name">{entry.cfg.name}（lv.{entry.level}）</div>
                <div className="muted" style={{ marginTop: 6 }}>费用 {entry.cfg.cost} ｜ 伤害倍率 ×{entry.damageMultiplier}</div>
                {entry.fireRateMultiplier !== null && (
                  <div className="muted" style={{ marginTop: 4 }}>攻速倍率 ×{entry.fireRateMultiplier}</div>
                )}
                {entry.fireRatePenalty !== null && (
                  <div className="muted" style={{ marginTop: 4 }}>攻速惩罚 -{entry.fireRatePenalty}</div>
                )}
                {entry.breakArmor && (
                  <div className="muted" style={{ marginTop: 4 }}>破甲倍率 ×{entry.breakArmor.multiplier}（{entry.breakArmor.duration}s）</div>
                )}
                {entry.burn && (
                  <div className="muted" style={{ marginTop: 4 }}>灼烧 {entry.burn.dps}/s（{entry.burn.duration}s）</div>
                )}
                {entry.splash && (
                  <div className="muted" style={{ marginTop: 4 }}>溅射 {entry.splash.percent}% ｜ 半径 {entry.splash.radius}</div>
                )}
                {entry.slow && (
                  <div className="muted" style={{ marginTop: 4 }}>减速 {entry.slow.pct}%（{entry.slow.duration}s）</div>
                )}
                {entry.knockback && (
                  <div className="muted" style={{ marginTop: 4 }}>击退 {entry.knockback}</div>
                )}
                {entry.aura && (
                  <div className="muted" style={{ marginTop: 4 }}>光环伤害 {entry.aura.dps}/s</div>
                )}
                {entry.bounce && (
                  <div className="muted" style={{ marginTop: 4 }}>反弹上限 {entry.bounce.maxBounces}</div>
                )}
                <div className="muted" style={{ marginTop: 4, color: '#94a3b8' }}>{entry.cfg.description}</div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 className="section-title">怪物图鉴</h2>
        <div className="book-grid">
          {monsterEntries.map(([id, stats], i) => (
            <article
              key={id}
              className="soft-card book-card card-enter"
              style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}
            >
              <div className="item-name">{MONSTER_LABELS[id]}（{id}）</div>
              <div className="muted" style={{ marginTop: 6 }}>基础生命 {stats.hp} ｜ 基础速度 {stats.speed.toFixed(2)} ｜ 泄漏伤害 {stats.leakDamage}</div>
              <div className="muted" style={{ marginTop: 4, color: '#94a3b8' }}>实际数值会随关卡等级提升。</div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
