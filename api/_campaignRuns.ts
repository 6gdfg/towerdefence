import { BALANCE_LAB_LEVEL_DRAFTS } from '../src/td/balanceDraft.generated.js';
import { createId, getSql } from './_db.js';

export type CampaignConfig = {
  levelId: string;
  difficulty: 'EZ' | 'HD' | 'IN' | 'AT';
  star: 1 | 2 | 3;
  lives: number;
  startLives: number;
  waveCount: number;
  minimumSeconds: number;
  challenges: string[];
};

const STARS = { EZ: 1, HD: 2, IN: 3, AT: 3 } as const;
const CHALLENGES = ['fullHealth', 'halfHealth', 'elementless', 'twilightForest'];
const truthy = (value: unknown) => value === true || value === 'true' || value === 1;

export function findCampaignDraft(levelId: unknown, difficulty: unknown) {
  return BALANCE_LAB_LEVEL_DRAFTS.find(draft => draft.sourceLevelId === levelId && draft.difficulty === difficulty);
}

export function campaignMinimumSeconds(draft: (typeof BALANCE_LAB_LEVEL_DRAFTS)[number]) {
  const waveTimes = draft.waves.map(wave => {
    let sequentialStart = 0;
    let lastSpawn = 0;
    for (const group of wave.groups) {
      const start = group.startDelay ?? sequentialStart;
      const end = start + Math.max(0, group.count - 1) * group.interval;
      if (group.count > 0) lastSpawn = Math.max(lastSpawn, end);
      sequentialStart = Math.max(sequentialStart, end + 2);
    }
    return lastSpawn;
  });
  // This is only a lower bound: do not estimate combat time or preparation time.
  return Math.max(1, waveTimes.reduce((sum, time) => sum + time, 0) + Math.max(0, waveTimes.length - 1) * 2);
}

export async function startCampaignRun(playerId: string, body: Record<string, unknown>) {
  const draft = findCampaignDraft(body.levelId, body.difficulty);
  if (!draft || !draft.waves.length) return { error: '关卡或难度不存在，请刷新页面。', status: 400 };
  const challenges = body.challenges ?? [];
  if (!Array.isArray(challenges) || challenges.length > 4 || challenges.some(id => !CHALLENGES.includes(id))
    || new Set(challenges).size !== challenges.length) return { error: '挑战配置无效。', status: 400 };
  const sql = getSql();
  const rows = await sql`SELECT level_id, max_star, in_full_health_clear FROM player_progress
    WHERE player_id=${playerId} AND level_id IN (${draft.sourceLevelId}, ${`L${draft.levelNumber - 1}`})`;
  const own = rows.find(row => row.level_id === draft.sourceLevelId);
  const previous = rows.find(row => row.level_id === `L${draft.levelNumber - 1}`);
  const ownStar = Number(own?.max_star ?? 0);
  const unlockStar = draft.levelNumber === 1 ? 3 : Math.max(Number(previous?.max_star ?? 0),
    ownStar > 0 ? Math.min(3, ownStar + 1) : 0, own ? 1 : 0);
  if (draft.difficulty === 'AT' ? !truthy(own?.in_full_health_clear) : STARS[draft.difficulty] > unlockStar) {
    return { error: '该难度尚未解锁。', status: 403 };
  }
  const config: CampaignConfig = {
    levelId: draft.sourceLevelId, difficulty: draft.difficulty, star: STARS[draft.difficulty], lives: draft.lives,
    startLives: challenges.includes('halfHealth') ? Math.max(1, Math.ceil(draft.lives / 2)) : draft.lives,
    waveCount: draft.waves.length, minimumSeconds: campaignMinimumSeconds(draft), challenges,
  };
  const runId = createId('campaign');
  await sql.transaction(tx => [
    tx`SELECT player_id FROM player_wallet WHERE player_id=${playerId} FOR UPDATE`,
    tx`INSERT INTO campaign_runs(player_id, run_id, config) VALUES (${playerId}, ${runId}, ${JSON.stringify(config)}::jsonb)
      ON CONFLICT(player_id) DO UPDATE SET run_id=EXCLUDED.run_id, config=EXCLUDED.config, started_at=NOW(), completed=FALSE`,
  ]);
  return { runId };
}

export async function validateCampaignClear(playerId: string, body: Record<string, unknown>) {
  const runId = body.runId;
  if (typeof runId !== 'string' || !/^campaign_[0-9a-f-]{36}$/i.test(runId)) {
    return { error: '缺少有效对局记录，请刷新页面后重新开始关卡。', status: 400 };
  }
  const sql = getSql();
  const cached = await sql`SELECT response FROM campaign_clear_claims WHERE player_id=${playerId} AND clear_id=${runId}`;
  if (cached[0]) return { cached: cached[0].response as Record<string, unknown> };
  const rows = await sql`SELECT config, completed, EXTRACT(EPOCH FROM (NOW()-started_at)) AS elapsed
    FROM campaign_runs WHERE player_id=${playerId} AND run_id=${runId}`;
  const row = rows[0];
  if (!row || truthy(row.completed)) return { error: '对局已失效，请勿同时开启多局游戏。', status: 409 };
  const config = row.config as CampaignConfig;
  if (Number(row.elapsed) > 72 * 3600) return { error: '对局已过期。', status: 409 };
  if (Number(row.elapsed) + 1 < config.minimumSeconds) return { error: '对局耗时与出怪配置不符。', status: 400 };
  if ((body.levelId !== undefined && body.levelId !== config.levelId)
    || (body.difficulty !== undefined && body.difficulty !== config.difficulty)
    || (body.star !== undefined && body.star !== config.star)) return { error: '对局关卡或难度不符。', status: 400 };
  const endLives = body.endLives;
  if (typeof endLives !== 'number' || !Number.isInteger(endLives) || endLives <= 0 || endLives > config.lives
    || body.wavesCleared !== config.waveCount) return { error: '通关结果无效。', status: 400 };
  const full = endLives >= config.startLives;
  const challengeDiamonds = (config.challenges.includes('fullHealth') && full ? 0.5 : 0)
    + (config.challenges.includes('halfHealth') ? 0.5 : 0)
    + (config.challenges.includes('elementless') ? 1 : 0)
    + (config.challenges.includes('twilightForest') ? 1 : 0);
  return { request: { playerId, levelId: config.levelId, difficulty: config.difficulty, star: config.star,
    fullHealth: config.difficulty === 'IN' && full, challengeDiamonds, clearId: runId } };
}
