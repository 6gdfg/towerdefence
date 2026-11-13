import { useEffect, useState } from 'react';
import { readApiJson } from './apiClient';
import { getErrorMessage } from './errors';
import { RANKING_BOARDS, type RankingBoard, type RankingEntry, type RankingPayload, type RankingPeriod } from '../../shared/ranking';

export default function RankingPage({ onBack }: { onBack: () => void }) {
  const [board, setBoard] = useState<RankingBoard>('clears');
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [period, setPeriod] = useState<RankingPeriod | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchRanking() {
      try {
        setLoading(true);
        setError(null);
        setPeriod(null);
        const response = await fetch(`/api/ranking?board=${board}`, { signal: controller.signal });
        const data = await readApiJson<RankingPayload>(response, '排行榜加载失败');
        if (controller.signal.aborted) return;
        setRanking(data.ranking || []);
        setPeriod(data.period ?? null);
      } catch (err: unknown) {
        if (!controller.signal.aborted) setError(getErrorMessage(err, '排行榜加载失败'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    fetchRanking();
    return () => controller.abort();
  }, [board, refreshKey]);

  useEffect(() => {
    if (board !== 'endless' || !period) return;
    const timer = window.setTimeout(() => setRefreshKey(key => key + 1),
      Math.max(1000, new Date(period.resetsAt).getTime() - Date.now() + 1000));
    return () => window.clearTimeout(timer);
  }, [board, period]);

  const selectedBoard = RANKING_BOARDS.find(entry => entry.id === board)!;
  const periodLabel = period ? `${period.weekStart} - ${new Date(new Date(period.resetsAt).getTime() - 1000 + 8 * 3600000).toISOString().slice(0, 10)}` : null;

  return (
    <main className="page-wrap ranking-page">
      <section className="glass-panel hero-panel card-enter" style={{ opacity: 0, animationDelay: '0s' }}>
        <div className="page-title-row">
          <div>
            <div className="eyebrow">Ranking</div>
            <h1>排行榜</h1>
          </div>
          <button onClick={onBack} className="action-button">返回</button>
        </div>
      </section>

      <div className="ranking-tabs" role="tablist" aria-label="排行榜分类">
        {RANKING_BOARDS.map(entry => (
          <button key={entry.id} id={`ranking-tab-${entry.id}`} role="tab"
            aria-selected={board === entry.id} aria-controls="ranking-results"
            className={board === entry.id ? 'is-active' : ''} onClick={() => setBoard(entry.id)}>
            {entry.label}
          </button>
        ))}
      </div>
      {board === 'endless' && periodLabel && <div className="ranking-period">本周 · {periodLabel}</div>}

      <section id="ranking-results" role="tabpanel" aria-labelledby={`ranking-tab-${board}`} aria-busy={loading}
        className="soft-card table-panel card-enter" style={{ marginTop: 16, opacity: 0, animationDelay: '0.08s' }}>
        {loading && (
          <div className="muted" style={{ textAlign: 'center', padding: '42px 0' }}>加载中...</div>
        )}

        {error && (
          <div style={{ padding: 20, color: '#c33' }}>
            错误: {error}
            <button className="action-button" style={{ marginLeft: 12 }} onClick={() => setRefreshKey(key => key + 1)}>重试</button>
          </div>
        )}

        {!loading && !error && ranking.length === 0 && (
          <div className="muted" style={{ textAlign: 'center', padding: '42px 0' }}>暂无排行数据</div>
        )}

        {!loading && !error && ranking.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(248,250,252,0.68)', borderBottom: '1px solid rgba(203,213,225,0.68)' }}>
                <th style={{ padding: '13px 16px', textAlign: 'left', fontWeight: 800, fontSize: 14 }}>排名</th>
                <th style={{ padding: '13px 16px', textAlign: 'left', fontWeight: 800, fontSize: 14 }}>玩家</th>
                <th style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 800, fontSize: 14 }}>{selectedBoard.column}</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((entry) => (
                <tr key={entry.username} style={{ borderBottom: '1px solid rgba(226,232,240,0.7)' }}>
                  <td style={{ padding: '13px 16px', fontSize: 14 }}>
                    {entry.rank <= 3 ? (
                      <span style={{ fontWeight: 800, color: entry.rank === 1 ? '#f59e0b' : entry.rank === 2 ? '#94a3b8' : '#cd7f32' }}>
                        #{entry.rank}
                      </span>
                    ) : (
                      <span style={{ color: '#64748b' }}>{entry.rank}</span>
                    )}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 700, overflowWrap: 'anywhere' }}>{entry.username}</td>
                  <td style={{ padding: '13px 16px', fontSize: 14, textAlign: 'right', color: '#059669', fontWeight: 800 }}>{entry.value.toLocaleString('zh-CN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
