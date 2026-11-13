export type RankingBoard = 'clears' | 'coins' | 'endless';

export const RANKING_BOARDS = [
  { id: 'clears', label: '通关榜', column: '通关数' },
  { id: 'coins', label: '金币榜', column: '金币' },
  { id: 'endless', label: '无尽模式榜', column: '最高通关波数' },
] as const;

export const ENDLESS_CHAMPION_COINS = 20000;
export const ENDLESS_CHAMPION_EXPERIENCE = 100;

export type RankingEntry = { rank: number; username: string; value: number };
export type RankingPeriod = { weekStart: string; startsAt: string; resetsAt: string };
export type RankingPayload = { board: RankingBoard; ranking: RankingEntry[]; period?: RankingPeriod };

export function getEndlessRankingPeriod(now = new Date()): RankingPeriod {
  const beijingDate = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  beijingDate.setUTCHours(0, 0, 0, 0);
  beijingDate.setUTCDate(beijingDate.getUTCDate() - beijingDate.getUTCDay());
  const weekStart = beijingDate.toISOString().slice(0, 10);
  const startsAt = new Date(beijingDate.getTime() - 8 * 60 * 60 * 1000);
  return { weekStart, startsAt: startsAt.toISOString(), resetsAt: new Date(startsAt.getTime() + 7 * 86400000).toISOString() };
}
