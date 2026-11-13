import { getSql, type TransactionSqlClient } from './_db.js';
import { ENDLESS_CHAMPION_COINS, ENDLESS_CHAMPION_EXPERIENCE } from '../shared/ranking.js';

export const CURRENT_ENDLESS_WEEK_SQL = `(date_trunc('week',
  (transaction_timestamp() AT TIME ZONE 'Asia/Shanghai') + INTERVAL '1 day')::date - 1)`;

export function endlessRankingSettlementQueries(tx: TransactionSqlClient) {
  return [
    tx`SELECT week_start FROM endless_ranking_state WHERE singleton=TRUE FOR UPDATE`,
    tx.query(`WITH current_week AS (
        SELECT ${CURRENT_ENDLESS_WEEK_SQL} AS week_start
      ), closing AS (
        SELECT state.week_start FROM endless_ranking_state state, current_week
        WHERE state.singleton=TRUE AND state.week_start < current_week.week_start
      ), winner AS (
        SELECT player_id, best_waves FROM endless_weekly_records
        WHERE EXISTS (SELECT 1 FROM closing)
        ORDER BY best_waves DESC, achieved_at ASC, player_id ASC LIMIT 1
      ), paid AS (
        UPDATE player_wallet wallet SET coins=wallet.coins + $1::bigint,
          experience=wallet.experience + $2::bigint, updated_at=NOW()
        FROM winner WHERE wallet.player_id=winner.player_id
        RETURNING wallet.player_id, winner.best_waves
      ), notified AS (
        INSERT INTO player_notifications (notification_id, player_id, notification_type, payload)
        SELECT 'endless_champion:' || closing.week_start::text, paid.player_id, 'endless_weekly_champion',
          jsonb_build_object('weekStart', closing.week_start::text, 'bestWaves', paid.best_waves,
            'coins', $1::bigint, 'experience', $2::bigint)
        FROM paid CROSS JOIN closing
      ), cleared AS (
        DELETE FROM endless_weekly_records WHERE EXISTS (SELECT 1 FROM closing) RETURNING player_id
      )
      UPDATE endless_ranking_state state SET week_start=current_week.week_start
      FROM current_week WHERE state.singleton=TRUE AND state.week_start < current_week.week_start
      RETURNING state.week_start`, [ENDLESS_CHAMPION_COINS, ENDLESS_CHAMPION_EXPERIENCE]),
  ];
}

export async function settleEndlessRanking() {
  const sql = getSql();
  const due = await sql.query(`SELECT 1 FROM endless_ranking_state
    WHERE singleton=TRUE AND week_start < ${CURRENT_ENDLESS_WEEK_SQL}`);
  if (due.length === 0) return;
  await sql.transaction(endlessRankingSettlementQueries);
}
