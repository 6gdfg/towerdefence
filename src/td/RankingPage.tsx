import { useEffect, useState } from 'react';
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
        if (!response.ok) {
          throw new Error('Failed to fetch ranking');
        }
        const data = await response.json();
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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>通关排行榜</h2>
        <button onClick={onBack} className="btn-hover" style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>返回</button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>加载中...</div>
      )}

      {error && (
        <div style={{ padding: '20px', background: '#fee', border: '1px solid #fcc', borderRadius: 8, color: '#c33' }}>
          错误: {error}
        </div>
      )}

      {!loading && !error && ranking.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>暂无排行数据</div>
      )}

      {!loading && !error && ranking.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>排名</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>玩家</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: 14 }}>通关数</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((entry) => (
                <tr key={entry.username} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14 }}>
                    {entry.rank <= 3 ? (
                      <span style={{ fontWeight: 600, color: entry.rank === 1 ? '#f59e0b' : entry.rank === 2 ? '#94a3b8' : '#cd7f32' }}>
                        #{entry.rank}
                      </span>
                    ) : (
                      <span style={{ color: '#6b7280' }}>{entry.rank}</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{entry.username}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, textAlign: 'right', color: '#059669', fontWeight: 600 }}>{entry.clearedLevels}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
