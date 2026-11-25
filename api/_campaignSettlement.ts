import { getSql, createId } from './_db.js';
import { LEVEL_UNLOCK_REQUIREMENTS } from '../shared/unlocks.js';
import { CHEST_REWARD_CONFIG, MAX_CHEST_INVENTORY, REPEAT_CLEAR_COIN_MULTIPLIER, getRepeatClearChestRewardConfig, getStarRewardConfig, type ChestType } from '../shared/rewards.js';

type ClearRequest = {
  playerId: string;
  levelId: string;
  star: number;
  difficulty?: string;
  fullHealth: boolean;
  challengeDiamonds: number;
  clearId: string | null;
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chestOffers(types: ChestType[]) {
  return types.map(chestType => {
    const config = CHEST_REWARD_CONFIG[chestType];
    return { chest_id: createId('c'), chest_type: chestType, duration_seconds: config.unlockSeconds,
      coin_reward: randInt(config.coins.min, config.coins.max) };
  });
}

export async function settleCampaignClear(request: ClearRequest) {
  const { playerId, levelId, star, difficulty, fullHealth, challengeDiamonds, clearId } = request;
  const isAt = difficulty === 'AT';
  const config = getStarRewardConfig(star);
  const baseCoins = randInt(config.coins.min, config.coins.max);
  const firstCoins = isAt ? randInt(5000, 8000) : baseCoins;
  const repeatCoins = star === 1 ? baseCoins : Math.max(1, Math.floor(baseCoins * REPEAT_CLEAR_COIN_MULTIPLIER));
  const repeatConfig = getRepeatClearChestRewardConfig(difficulty, star);
  const repeatTypes = [...repeatConfig.guaranteed, ...repeatConfig.bonus.filter(offer => Math.random() < offer.chance).map(offer => offer.chestType)];
  const levelNumber = Number(levelId.replace(/^L/i, ''));
  const unlocks = Array.from(new Set(LEVEL_UNLOCK_REQUIREMENTS.filter(rule => rule.level === levelNumber && rule.difficulty === difficulty).map(rule => rule.itemId)));
  const sql = getSql();

  // The wallet lock serializes clear rewards with chest allocation and duplicate retries.
  const results = await sql.transaction(tx => [
    tx`SELECT player_id FROM player_wallet WHERE player_id=${playerId} FOR UPDATE`,
    tx.query(`WITH cached AS (
        SELECT response FROM campaign_clear_claims WHERE player_id=$1::text AND clear_id=$12::text
      ), consumed AS (
        UPDATE campaign_runs SET completed=TRUE WHERE player_id=$1::text AND run_id=$12::text AND completed=FALSE
          AND EXTRACT(EPOCH FROM (NOW()-started_at))+1 >= (config->>'minimumSeconds')::numeric
          AND started_at >= NOW()-INTERVAL '72 hours'
          AND NOT EXISTS (SELECT 1 FROM cached)
        RETURNING run_id
      ), previous AS (
        SELECT COALESCE((SELECT max_star FROM player_progress WHERE player_id=$1::text AND level_id=$2::text), 0) AS star,
          COALESCE((SELECT in_full_health_clear FROM player_progress WHERE player_id=$1::text AND level_id=$2::text), FALSE) AS full_health,
          COALESCE((SELECT at_cleared FROM player_progress WHERE player_id=$1::text AND level_id=$2::text), FALSE) AS at_clear
      ), outcome AS (
        SELECT previous.star AS previous_star, GREATEST(previous.star, $3::integer) AS next_star,
          previous.full_health OR $4::boolean AS full_health, previous.at_clear OR $5::boolean AS at_clear,
          $4::boolean AND NOT previous.full_health AS new_full_health,
          $5::boolean AND NOT previous.at_clear AS at_first_clear,
          CASE WHEN $5::boolean THEN NOT previous.at_clear ELSE $3::integer > previous.star END AS new_record,
          CASE WHEN (CASE WHEN $5::boolean THEN NOT previous.at_clear ELSE $3::integer > previous.star END)
            THEN $7::bigint ELSE $8::bigint END AS coins,
          $6::numeric + CASE WHEN $5::boolean AND NOT previous.at_clear THEN 1 ELSE 0 END AS diamonds,
          CASE WHEN $2::text='L4' AND previous.star=0 THEN 1 ELSE 0 END AS magic_keys
        FROM previous WHERE EXISTS (SELECT 1 FROM consumed)
      ), progress_saved AS (
        INSERT INTO player_progress(player_id, level_id, max_star, in_full_health_clear, at_cleared)
        SELECT $1::text, $2::text, next_star, full_health, at_clear FROM outcome
        ON CONFLICT(player_id, level_id) DO UPDATE SET max_star=GREATEST(player_progress.max_star, EXCLUDED.max_star),
          in_full_health_clear=player_progress.in_full_health_clear OR EXCLUDED.in_full_health_clear,
          at_cleared=player_progress.at_cleared OR EXCLUDED.at_cleared, updated_at=NOW()
        RETURNING player_id
      ), eligible_unlocks AS (
        SELECT value #>> '{}' AS item_id FROM jsonb_array_elements($9::jsonb)
        WHERE EXISTS (SELECT 1 FROM outcome) AND NOT EXISTS (
          SELECT 1 FROM unlocked_items WHERE player_id=$1::text AND item_id=value #>> '{}' AND unlocked=TRUE
        )
      ), unlocked AS (
        INSERT INTO unlocked_items(player_id, item_id, unlocked, unlocked_at)
        SELECT $1::text, item_id, TRUE, NOW() FROM eligible_unlocks
        ON CONFLICT(player_id, item_id) DO UPDATE SET unlocked=TRUE, unlocked_at=NOW() RETURNING item_id
      ), credited AS (
        UPDATE player_wallet SET coins=player_wallet.coins+outcome.coins, magic_keys=player_wallet.magic_keys+outcome.magic_keys,
          diamonds=player_wallet.diamonds+outcome.diamonds, updated_at=NOW()
        FROM outcome, progress_saved WHERE player_wallet.player_id=progress_saved.player_id RETURNING player_wallet.player_id
      ), capacity AS (
        SELECT GREATEST(0, $13::integer-COUNT(*)) AS slots FROM chests WHERE player_id=$1::text
      ), offers AS (
        SELECT value, ordinality FROM outcome,
          LATERAL jsonb_array_elements(CASE WHEN outcome.new_record THEN $10::jsonb ELSE $11::jsonb END) WITH ORDINALITY
      ), awarded AS (
        INSERT INTO chests(chest_id, player_id, status, duration_seconds, chest_type, coin_reward)
        SELECT value->>'chest_id', $1::text, 'locked', (value->>'duration_seconds')::integer,
          value->>'chest_type', (value->>'coin_reward')::integer FROM offers, credited
        WHERE ordinality <= (SELECT slots FROM capacity) RETURNING chest_id, chest_type
      ), allocated AS (
        SELECT COALESCE(jsonb_agg(offers.value->'chest_type' ORDER BY ordinality), '[]'::jsonb) AS types,
          (array_agg(awarded.chest_id ORDER BY ordinality))[1] AS first_id, COUNT(*) AS count
        FROM offers JOIN awarded ON offers.value->>'chest_id'=awarded.chest_id
      ), result AS (
        SELECT jsonb_build_object('ok', TRUE, 'star', next_star, 'previousStar', previous_star, 'rewardCoins', coins,
          'rewardMagicKeys', magic_keys, 'diamondReward', diamonds, 'newRecord', new_record, 'atFirstClear', at_first_clear,
          'atCleared', at_clear, 'fullHealthClear', full_health, 'newFullHealthClear', new_full_health,
          'newUnlocks', COALESCE((SELECT jsonb_agg(item_id) FROM unlocked), '[]'::jsonb),
          'chestId', first_id, 'chestType', types->0, 'chestTypes', types, 'chestAwarded', allocated.count > 0,
          'chestInventoryFull', (SELECT COUNT(*) FROM offers) > allocated.count) AS response FROM outcome, allocated
      ), remembered AS (
        INSERT INTO campaign_clear_claims(player_id, clear_id, response)
        SELECT $1::text, $12::text, response FROM result WHERE $12::text IS NOT NULL
        RETURNING clear_id
      )
      SELECT response, FALSE AS duplicate FROM result UNION ALL SELECT response, TRUE AS duplicate FROM cached`,
    [playerId, levelId, star, fullHealth, isAt, challengeDiamonds, firstCoins, repeatCoins, JSON.stringify(unlocks),
      JSON.stringify(chestOffers(isAt ? ['epic', 'epic', 'legendary'] : [config.chestType])), JSON.stringify(chestOffers(repeatTypes)), clearId, MAX_CHEST_INVENTORY]),
    tx`DELETE FROM campaign_clear_claims WHERE player_id=${playerId} AND clear_id NOT IN (
      SELECT clear_id FROM campaign_clear_claims WHERE player_id=${playerId} ORDER BY created_at DESC, clear_id DESC LIMIT 20
    )`,
  ]) as unknown[];
  const row = (results[1] as Array<{ response: Record<string, unknown>; duplicate: boolean }>)[0];
  if (!row) throw new Error('通关结算未完成，请重新连接后重试。');
  return row;
}
