import { useState } from 'react';

export type ChallengeId = 'fullHealth' | 'halfHealth';

type ChallengeSelectPageProps = {
  title: string;
  difficultyLabel: string;
  onBack: () => void;
  onStart: (challenges: ChallengeId[]) => void;
};

const CHALLENGES: Array<{ id: ChallengeId; name: string; reward: string; detail: string }> = [
  {
    id: 'fullHealth',
    name: '满血通关',
    reward: '+1 钻石',
    detail: '结束时生命值保持为本局开局值。',
  },
  {
    id: 'halfHealth',
    name: '半血通关',
    reward: '+1 钻石',
    detail: '开局生命减半，通关即完成。',
  },
];

export default function ChallengeSelectPage({ title, difficultyLabel, onBack, onStart }: ChallengeSelectPageProps) {
  const [selected, setSelected] = useState<ChallengeId[]>([]);

  const toggle = (id: ChallengeId) => {
    setSelected(current => current.includes(id)
      ? current.filter(item => item !== id)
      : [...current, id]);
  };

  return (
    <main className="page-wrap challenge-select-page">
      <section className="glass-panel hero-panel card-enter" style={{ opacity: 0, animationDelay: '0s' }}>
        <div className="page-title-row">
          <div>
            <div className="eyebrow">Challenge</div>
            <h1>{title}</h1>
            <p>{difficultyLabel}</p>
          </div>
          <div className="button-row">
            <button onClick={onBack} className="action-button">返回</button>
            <button onClick={() => onStart(selected)} className="action-button primary">开始</button>
          </div>
        </div>
      </section>

      <section className="challenge-grid">
        {CHALLENGES.map((challenge, index) => {
          const active = selected.includes(challenge.id);
          return (
            <button
              key={challenge.id}
              type="button"
              onClick={() => toggle(challenge.id)}
              className={`challenge-card card-enter ${active ? 'is-active' : ''}`}
              style={{ opacity: 0, animationDelay: `${0.05 + index * 0.04}s` }}
            >
              <span>{challenge.reward}</span>
              <strong>{challenge.name}</strong>
              <small>{challenge.detail}</small>
            </button>
          );
        })}
      </section>
    </main>
  );
}
