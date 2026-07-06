import { MONSTER_BASE_STATS } from './levels';
import { MONSTER_LABELS } from './appConfig';
import type { ElementBookEntry, PlantBookEntry } from './appTypes';
import type { ElementType, PlantType } from './types';

type MonsterEntry = [keyof typeof MONSTER_BASE_STATS, typeof MONSTER_BASE_STATS[keyof typeof MONSTER_BASE_STATS]];

type BookPageProps = {
  onBack: () => void;
  plantBookData: PlantBookEntry[];
  elementBookData: ElementBookEntry[];
  monsterEntries: MonsterEntry[];
};

const ELEMENT_LABELS: Record<ElementType, string> = {
  gold: '金',
  fire: '火',
  electric: '电',
  ice: '冰',
  wind: '风',
  light: '光',
};

function fmt(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}

function BookMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="book-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FeatureTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="book-tags">
      {tags.map(tag => (
        <span key={tag} className="book-tag">{tag}</span>
      ))}
    </div>
  );
}

function plantTags(entry: PlantBookEntry) {
  const { config, stats } = entry;
  const tags: string[] = [];

  if (config.incomeInterval) tags.push(`${config.incomeInterval}s 产币`);
  if (config.sunflowerBoostAura) {
    const speedBonus = config.sunflowerBoostAura.speedBonus + config.sunflowerBoostAura.bonusPerLevel * (entry.level - 1);
    tags.push(`5x5 金盏花产速 +${Math.round(speedBonus * 100)}%`, '不叠加');
  }
  if (config.range >= 90 && stats.fireRate > 0) tags.push('全屏索敌');
  if (config.lifetimeSec) tags.push(`${config.lifetimeSec}s 后消失`);
  if (config.activeAbilityCost) tags.push(`主动 ${config.activeAbilityCost} 金币`);
  if (config.penetration) tags.push('直线穿透');
  if (config.pierceLimit) tags.push(`穿透 ${config.pierceLimit}`);
  if (config.damageDecayFactor) tags.push(`衰减 ${Math.round(config.damageDecayFactor * 100)}%`);
  if (config.breakArmorDuration) tags.push(`破甲 ${config.breakArmorDuration}s`);
  if (config.targetPriority === 'armorFirst') tags.push('优先护甲');

  if (config.instantEffect?.type === 'crossDamage') {
    tags.push('一次性', `延迟 ${config.instantEffect.delaySec}s`, '横竖爆炸', '升级仅伤害');
  } else if (config.instantEffect?.type === 'radiusFrostBlast') {
    tags.push('一次性', `半径 ${config.instantEffect.radius}`, `冻结 ${config.instantEffect.freezeDuration}s`, `减速 ${Math.round(config.instantEffect.slowPct * 100)}%`, '升级仅伤害');
  }

  if (config.controlAura) {
    const slow = Math.round((config.controlAura.slowPct + config.controlAura.slowBonusPerLevel * (entry.level - 1)) * 100);
    const knockback = config.controlAura.knockbackDistance + config.controlAura.knockbackBonusPerLevel * (entry.level - 1);
    tags.push(`光环减速 ${slow}%`, `${config.controlAura.pulseInterval}s 击退 ${fmt(knockback)}`);
  }

  if (config.channelAttack) {
    tags.push(
      '持续锁定',
      `${config.channelAttack.tickInterval}s 跳伤`,
      `起始 ${Math.round(config.channelAttack.initialDamagePct * 100)}%`,
      `每跳 +${fmt(config.channelAttack.rampPctPerTick * 100)}%`,
      '断锁重置',
      '最高伤害每级 +3%',
    );
  }

  if (config.elementAllowed === false) {
    tags.push('禁元素');
  } else if (config.allowedElementTypes?.length) {
    tags.push(`可附 ${config.allowedElementTypes.map(el => ELEMENT_LABELS[el]).join('/')}`);
  } else {
    tags.push('可附元素');
  }

  if (stats.fireRate === 0 && !config.instantEffect && !config.activeAbilityCost && !config.controlAura) tags.push('不自动攻击');
  return tags;
}

function plantMetrics(entry: PlantBookEntry) {
  const { config, stats } = entry;
  if (config.channelAttack) {
    return [
      ['费用', config.cost],
      ['最高伤害', fmt(stats.damage)],
      ['射程', fmt(stats.range)],
      ['间隔', `${config.channelAttack.tickInterval}s`],
    ] as const;
  }
  return [
    ['费用', config.cost],
    ['伤害', fmt(stats.damage)],
    ['射程', fmt(stats.range)],
    ['攻速', stats.fireRate > 0 ? fmt(stats.fireRate) : '0'],
  ] as const;
}

function elementTags(entry: ElementBookEntry) {
  const tags: string[] = [];
  if (entry.fireRateMultiplier !== null) tags.push(`攻速 x${entry.fireRateMultiplier}`);
  if (entry.fireRatePenalty !== null) tags.push(`攻速 -${entry.fireRatePenalty}`);
  if (entry.breakArmor) tags.push(`破甲 ${entry.breakArmor.duration}s`, `无甲 x${entry.breakArmor.multiplier}`);
  if (entry.burn) tags.push(`灼烧 ${entry.burn.dps}/s`, `${entry.burn.duration}s`);
  if (entry.splash) tags.push(`溅射 ${entry.splash.percent}%`, `半径 ${entry.splash.radius}`);
  if (entry.slow) tags.push(`减速 ${entry.slow.pct}%`, `${entry.slow.duration}s`);
  if (entry.knockback) tags.push(`击退 ${entry.knockback}`);
  if (entry.aura) tags.push(`光环 ${entry.aura.dps}/s`);
  if (entry.bounce) tags.push(`反弹 ${entry.bounce.maxBounces}`);
  if (entry.id === 'electric') tags.push('重置治疗/狙击倒计时');
  return tags;
}

function monsterTags(id: MonsterEntry[0], stats: MonsterEntry[1]) {
  const tags: string[] = [];
  if (stats.armorHp) tags.push(`护甲 ${stats.armorHp}`);
  switch (id) {
    case 'triangle':
      tags.push('高速低血');
      break;
    case 'square':
      tags.push('高血低速');
      break;
    case 'healer':
      tags.push('3.5s 治疗', '半径 2.8');
      break;
    case 'evilSniper':
      tags.push('20s 摧毁植物');
      break;
    case 'rager':
      tags.push('速度光环 x2', '半径 3.6');
      break;
    case 'summoner':
      tags.push('5s 召唤');
      break;
    case 'igniter':
      tags.push('死亡加速', '半径 2.8');
      break;
    case 'armored':
      tags.push('先扣护甲', '破甲打本体');
      break;
    case 'iceShell':
      tags.push('免疫冻结/减速', '灼烧易伤 x2');
      break;
    case 'purifier':
      tags.push('3s 净化', '半径 3', '清除负面状态');
      break;
    default:
      tags.push('标准怪');
  }
  return tags;
}

function plantRole(type: PlantType) {
  const roles: Partial<Record<PlantType, string>> = {
    sunflower: '经济',
    bottleGrass: '单体',
    puffShroom: '临时',
    fourLeafClover: '穿透',
    machineGun: '高速',
    sniper: '高伤',
    rocket: '穿透',
    sunlightFlower: '主动',
    holyFlower: '经济辅助',
    hotPepper: '灰烬',
    frostBlastShroom: '控制',
    cycloneShroom: '光环',
    magnetNeedle: '反甲',
    electricFlower: '持续单体',
  };
  return roles[type] ?? '植物';
}

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
                <div className="book-title-row">
                  <div>
                    <div className="item-name">{entry.config.name}</div>
                    <div className="book-subtitle">Lv.{entry.level} · {plantRole(entry.type)}</div>
                  </div>
                </div>
                <div className="book-metrics">
                  {plantMetrics(entry).map(([label, value]) => <BookMetric key={label} label={label} value={value} />)}
                </div>
                <FeatureTags tags={plantTags(entry)} />
                <div className="book-note">{entry.config.description}</div>
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
                <div className="book-title-row">
                  <div>
                    <div className="item-name">{entry.cfg.name}</div>
                    <div className="book-subtitle">Lv.{entry.level} · 元素</div>
                  </div>
                </div>
                <div className="book-metrics">
                  <BookMetric label="费用" value={entry.cfg.cost} />
                  <BookMetric label="伤害倍率" value={`x${entry.damageMultiplier}`} />
                  <BookMetric label="攻速修正" value={entry.fireRateMultiplier !== null ? `x${entry.fireRateMultiplier}` : entry.fireRatePenalty !== null ? `-${entry.fireRatePenalty}` : '无'} />
                </div>
                <FeatureTags tags={elementTags(entry)} />
                <div className="book-note">{entry.cfg.description}</div>
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
              <div className="book-title-row">
                <div>
                  <div className="item-name">{MONSTER_LABELS[id]}</div>
                  <div className="book-subtitle">{id}</div>
                </div>
              </div>
              <div className="book-metrics">
                <BookMetric label="生命" value={stats.hp} />
                <BookMetric label="护甲" value={stats.armorHp ?? 0} />
                <BookMetric label="速度" value={fmt(stats.speed)} />
                <BookMetric label="漏怪" value={stats.leakDamage} />
              </div>
              <FeatureTags tags={monsterTags(id, stats)} />
              <div className="book-note">实际生命和护甲会随关卡怪物等级提升。</div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
