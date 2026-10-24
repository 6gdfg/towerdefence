import type { CSSProperties } from 'react';
import { MONSTER_LABELS } from './appConfig';
import type { Enemy } from './types';

type BossHealthBarsProps = {
  enemies: Enemy[];
  style: CSSProperties;
  availableHeight: number;
};

export default function BossHealthBars({ enemies, style, availableHeight }: BossHealthBarsProps) {
  const bosses = enemies.filter(enemy => enemy.isBoss && enemy.hp > 0);
  if (bosses.length === 0) return null;
  // Match the 38px row and 8px gap so the last visible name keeps its full bar.
  const listHeight = Math.max(0, Math.floor((availableHeight + 8) / 46) * 46 - 8);

  return (
    <div className="boss-health-area" style={style} aria-label="Boss 血条">
      <div className="boss-health-list" style={{ maxHeight: listHeight }} tabIndex={0}>
        {bosses.map(boss => {
          const name = MONSTER_LABELS[boss.shape];
          const health = Math.max(0, Math.min(boss.maxHp, boss.hp));
          const armor = Math.max(0, Math.min(boss.maxArmorHp ?? 0, boss.armorHp ?? 0));
          const maximum = Math.max(1, boss.maxHp + (boss.maxArmorHp ?? 0));
          const healthRatio = health / maximum;
          const armorRatio = armor / maximum;
          const valueText = `生命 ${Math.ceil(health)} / ${boss.maxHp}${boss.maxArmorHp ? `，护甲 ${Math.ceil(armor)} / ${boss.maxArmorHp}` : ''}`;

          return (
            <div className="boss-health-item" key={boss.id}>
              <div className="boss-health-name" title={name}>{name}</div>
              <div
                className="boss-health-track"
                role="progressbar"
                aria-label={name}
                aria-valuemin={0}
                aria-valuemax={maximum}
                aria-valuenow={health + armor}
                aria-valuetext={valueText}
                title={valueText}
              >
                <div className="boss-health-fill" style={{ transform: `scaleX(${healthRatio})` }} />
                <div
                  className="boss-health-armor"
                  style={{ left: `${healthRatio * 100}%`, width: `${armorRatio * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
