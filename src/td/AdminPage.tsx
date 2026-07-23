import { useState } from 'react';
import { readApiJson } from './apiClient';
import { getErrorMessage } from './errors';

type LevelSubmission = {
  id: string;
  submitter: string;
  levelName: string;
  difficulty: string;
  code: string;
  submittedAt: string;
};

type AdminPageProps = {
  onExit: () => void;
};

function formatSubmittedAt(value: string) {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(timestamp);
}

export default function AdminPage({ onExit }: AdminPageProps) {
  const [password, setPassword] = useState('');
  const [submissions, setSubmissions] = useState<LevelSubmission[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/level-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', password }),
      });
      const data = await readApiJson<{ submissions?: LevelSubmission[] }>(response, '读取投稿失败');
      setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
      setAuthorized(true);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, '管理员密码错误或服务不可用'));
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const completeSubmission = async (submission: LevelSubmission) => {
    if (!window.confirm(`确认已处理 ${submission.levelName} ${submission.difficulty} 的投稿？`)) return;
    setRemovingId(submission.id);
    setError(null);
    try {
      const response = await fetch('/api/level-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', password, submissionId: submission.id }),
      });
      await readApiJson(response, '处理投稿失败');
      setSubmissions(current => current.filter(item => item.id !== submission.id));
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, '处理投稿失败'));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="app-shell admin-shell">
      <main className="page-wrap admin-page">
        <section className="glass-panel hero-panel card-enter" style={{ opacity: 0, animationDelay: '0s' }}>
          <div className="page-title-row">
            <div>
              <div className="eyebrow">Administrator</div>
              <h1>关卡投稿审核</h1>
            </div>
            <button onClick={onExit} className="action-button">返回主页</button>
          </div>
        </section>

        {!authorized ? (
          <section className="soft-card admin-login-card card-enter" style={{ opacity: 0, animationDelay: '0.06s' }}>
            <label className="lab-field">
              <span>管理员密码</span>
              <input
                className="input-field"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !loading) void loadSubmissions();
                }}
              />
            </label>
            {error && <p className="admin-error">{error}</p>}
            <button onClick={() => void loadSubmissions()} disabled={loading || !password} className="action-button primary">
              {loading ? '验证中...' : '进入审核'}
            </button>
          </section>
        ) : (
          <section className="soft-card admin-submissions card-enter" style={{ opacity: 0, animationDelay: '0.06s' }}>
            <div className="lab-panel-title">
              <span>{`待处理投稿 ${submissions.length}`}</span>
              <button onClick={() => void loadSubmissions()} disabled={loading} className="lab-mini-button">刷新</button>
            </div>
            {error && <p className="admin-error">{error}</p>}
            {submissions.length === 0 ? (
              <div className="muted admin-empty">暂无待处理投稿</div>
            ) : (
              <div className="admin-submission-list">
                {submissions.map(submission => (
                  <article key={submission.id} className="admin-submission-card">
                    <div className="admin-submission-head">
                      <div>
                        <strong>{`${submission.levelName} ${submission.difficulty}`}</strong>
                        <span>{`${submission.submitter} · ${formatSubmittedAt(submission.submittedAt)}`}</span>
                      </div>
                      <button
                        onClick={() => void completeSubmission(submission)}
                        disabled={removingId === submission.id}
                        className="action-button primary"
                      >
                        {removingId === submission.id ? '处理中...' : '处理完成'}
                      </button>
                    </div>
                    <details className="admin-code-details">
                      <summary>查看关卡代码</summary>
                      <pre>{submission.code}</pre>
                    </details>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
