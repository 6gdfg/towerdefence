import type { ChallengeId } from './ChallengeSelectPage';

type ChallengeConfigModalProps = {
  levelName: string;
  difficultyLabel: string;
  selected: ChallengeId[];
  onToggle: (challenge: ChallengeId) => void;
  onClose: () => void;
};

const CHALLENGE_OPTIONS: Array<{ id: ChallengeId; name: string; reward: string; detail: string }> = [
  {
    id: 'fullHealth',
    name: '完美防守',
    reward: '+0.5 钻石',
    detail: '结束时生命值不低于本局开局生命值。',
  },
  {
    id: 'halfHealth',
    name: '半血开局',
    reward: '+0.5 钻石',
    detail: '本局开局生命减半，通关即可完成。',
  },
  {
    id: 'elementless',
    name: '元素之殇',
    reward: '+1 钻石',
    detail: '本局禁用所有元素，通关即可完成。',
  },
  {
    id: 'twilightForest',
    name: '暮色森林',
    reward: '+1 钻石',
    detail: '本局天空不再掉落阳光，通关即可完成。',
  },
];

export default function ChallengeConfigModal({
  levelName,
  difficultyLabel,
  selected,
  onToggle,
  onClose,
}: ChallengeConfigModalProps) {
  return (
    <div className="modal-backdrop" style={{ zIndex: 1185 }}>
      <section className="glass-panel modal-panel challenge-config-modal" role="dialog" aria-modal="true" aria-label={`${levelName} challenge`}>
        <div className="level-start-head">
          <div>
            <div className="eyebrow">{difficultyLabel}</div>
            <h2>{levelName}</h2>
          </div>
        </div>

        <div className="challenge-config-list">
          {CHALLENGE_OPTIONS.map(challenge => {
            const active = selected.includes(challenge.id);
            return (
              <button
                key={challenge.id}
                type="button"
                onClick={() => onToggle(challenge.id)}
                className={`challenge-config-item ${active ? 'is-active' : ''}`}
                aria-pressed={active}
              >
                <span>{challenge.reward}</span>
                <strong>{challenge.name}</strong>
                <small>{challenge.detail}</small>
              </button>
            );
          })}
        </div>

        <button type="button" onClick={onClose} className="action-button primary challenge-config-close">
          确定
        </button>
      </section>
    </div>
  );
}
