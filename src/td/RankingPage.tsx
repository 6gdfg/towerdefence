import { useEffect, useState } from 'react';
import { readApiJson } from './apiClient';
import { getErrorMessage } from './errors';

export default function RankingPage({ onBack }: { onBack: () => void }) {
  const [ranking, setRanking] = useState<Array<{ rank: number; username: string; clearedLevels: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRanking() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/ranking');
        const data = await readApiJson<{ ranking?: Array<{ rank: number; username: string; clearedLevels: number }> }>(response, 'Failed to fetch ranking');
        setRanking(data.ranking || []);
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Failed to load ranking'));
      } finally {
        setLoading(false);
      }
    }
    fetchRanking();
  }, []);

  return (
    <main className="page-wrap">
      <section className="glass-panel hero-panel card-enter" style={{ opacity: 0, animationDelay: '0s' }}>
        <div className="page-title-row">
          <div>
            <div className="eyebrow">Ranking</div>
            <h1>通关排行榜</h1>
            <p>按通关数量展示玩家排名。</p>
          </div>
          <button onClick={onBack} className="action-button">返回</button>
        </div>
      </section>

      <section className="soft-card table-panel card-enter" style={{ marginTop: 16, opacity: 0, animationDelay: '0.08s' }}>
        {loading && (
          <div className="muted" style={{ textAlign: 'center', padding: '42px 0' }}>加载中...</div>
        )}

        {error && (
          <div style={{ padding: 20, color: '#c33' }}>
            错误: {error}
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
                <th style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 800, fontSize: 14 }}>通关数</th>
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
                  <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 700 }}>{entry.username}</td>
                  <td style={{ padding: '13px 16px', fontSize: 14, textAlign: 'right', color: '#059669', fontWeight: 800 }}>{entry.clearedLevels}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
