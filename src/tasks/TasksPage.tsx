import { useCallback, useEffect, useState } from 'react';
import { getToken } from '../td/authProgress';
import AuthBar from '../td/AuthBar';
import { claimTask, fetchTasks, type PlayerTask, type TasksPayload } from './tasksApi';

type TasksPageProps = { onBack: () => void };

function RewardLine({ task }: { task: PlayerTask }) {
  const reward = task.reward;
  const parts = [
    reward.coins > 0 ? `${reward.coins} 阳光` : '',
    reward.experience > 0 ? `${reward.experience} 经验` : '',
    reward.diamonds > 0 ? `${reward.diamonds} 钻石` : '',
  ].filter(Boolean);
  return <span className="tasks-reward">奖励: {parts.join(' + ')}</span>;
}

export default function TasksPage({ onBack }: TasksPageProps) {
  const [payload, setPayload] = useState<TasksPayload | null>(null);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState<PlayerTask['id'] | null>(null);

  const load = useCallback(() => {
    if (!getToken()) return;
    setError('');
    void fetchTasks().then(setPayload).catch(reason => setError(reason instanceof Error ? reason.message : '任务加载失败'));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleClaim = async (taskId: PlayerTask['id']) => {
    if (claiming) return;
    setClaiming(taskId);
    setError('');
    try {
      setPayload(await claimTask(taskId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '任务领取失败');
    } finally {
      setClaiming(null);
    }
  };

  if (!getToken()) {
    return (
      <>
        <AuthBar onAuthed={() => window.location.reload()} />
        <main className="tasks-shell">
        <div className="soft-card tasks-empty-state">
          <strong>登录后可查看任务</strong>
          <button className="action-button primary" onClick={onBack}>返回学习</button>
        </div>
        </main>
      </>
    );
  }

  const renderTask = (task: PlayerTask) => (
    <article key={task.id} className="soft-card task-card">
      <div className="task-card-main">
        <div>
          <h3>{task.title}</h3>
          <p>{task.progress} / {task.target}</p>
        </div>
        <RewardLine task={task} />
      </div>
      <div className="task-progress-track"><span style={{ width: `${Math.min(100, task.progress / task.target * 100)}%` }} /></div>
      <button
        className={`action-button ${task.complete && !task.claimed ? 'primary' : ''}`}
        disabled={!task.complete || task.claimed || claiming !== null}
        onClick={() => void handleClaim(task.id)}
      >
        {task.claimed ? '已领取' : task.complete ? '领取' : '进行中'}
      </button>
    </article>
  );

  return (
    <>
      <AuthBar />
      <main className="tasks-shell">
      <header className="tasks-header">
        <div>
          <span className="study-kicker">TASKS</span>
          <h1>任务中心</h1>
        </div>
        <div className="tasks-header-actions">
          {payload && <div className="tasks-wallet"><span>阳光 {payload.wallet.coins}</span><span>钻石 {payload.wallet.diamonds}</span><span>经验 {payload.wallet.experience}</span></div>}
          <button className="action-button" onClick={onBack}>返回学习</button>
        </div>
      </header>

      {error && <div className="tasks-error">{error}</div>}
      {!payload && !error && <div className="soft-card tasks-empty-state"><strong>正在读取任务...</strong></div>}
      {payload && (
        <div className="tasks-sections">
          <section>
            <div className="tasks-section-title"><h2>每日任务</h2><span>每日 00:00 重置</span></div>
            <div className="tasks-grid">{payload.daily.map(renderTask)}</div>
            <p className="tasks-note">每日练习已完成 {payload.dailyPracticeRuns} 轮</p>
          </section>
          <section>
            <div className="tasks-section-title"><h2>每周任务</h2></div>
            <div className="soft-card tasks-empty-state"><strong>本周暂未开放任务</strong></div>
          </section>
        </div>
      )}
      </main>
    </>
  );
}
