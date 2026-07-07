import { MONSTER_LABELS } from './appConfig';
import { MonsterIcon } from './TowerIcons';
import type { ShapeType } from './types';

type LevelStartModalProps = {
  levelName: string;
  difficultyLabel: string;
  monsters: ShapeType[];
  onStart: () => void;
  onOpenBook: () => void;
};

export default function LevelStartModal({ levelName, difficultyLabel, monsters, onStart, onOpenBook }: LevelStartModalProps) {
  return (
    <div className="modal-backdrop" style={{ zIndex: 1180 }}>
      <section className="glass-panel modal-panel level-start-modal" role="dialog" aria-modal="true" aria-label={`${levelName} enemy preview`}>
        <div className="level-start-head">
          <div>
            <div className="eyebrow">{difficultyLabel}</div>
            <h2>{levelName}</h2>
          </div>
        </div>

        {monsters.length > 0 ? (
          <div className="level-start-monster-grid">
            {monsters.map(monster => (
              <div key={monster} className="level-start-monster-chip">
                <MonsterIcon type={monster} size={30} color="#334155" />
                <span>{MONSTER_LABELS[monster] ?? monster}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="level-start-empty">暂无怪物配置</div>
        )}

        <div className="level-start-actions">
          <button type="button" onClick={onStart} className="action-button primary">start</button>
          <button type="button" onClick={onOpenBook} className="action-button">图鉴</button>
        </div>
      </section>
    </div>
  );
}
