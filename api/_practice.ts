import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomInt } from 'node:crypto';
import { studyItemsFromJson } from '../src/study/studyData.js';
import { createId, getSql } from './_db.js';
import { ApiError } from './_errors.js';

type PracticeQuestion = { itemId: string; options: string[]; correctIndex: number };
let bank: ReturnType<typeof studyItemsFromJson> | undefined;

function getBank() {
  if (bank) return bank;
  const loaded = studyItemsFromJson(JSON.parse(readFileSync(join(process.cwd(), 'public/study-data/words.json'), 'utf8')));
  const meanings = new Set([...loaded.jsonWordItems, ...loaded.phraseItems].map(item => item.answer));
  if (!loaded.jsonWordItems.length || !loaded.phraseItems.length || meanings.size<4) {
    throw new ApiError(503, '词库内容不足，暂时无法开始练习。');
  }
  return bank = loaded;
}

export async function startPracticeRun(playerId: string, restart: boolean) {
  const sql = getSql();
  const data = getBank();
  const mixed = [...data.jsonWordItems, ...data.phraseItems];
  const questions: PracticeQuestion[] = Array.from({ length: 50 }, () => {
    const source = randomInt(2) === 0 ? data.jsonWordItems : data.phraseItems;
    const item = source[randomInt(source.length)];
    const meanings = new Set([item.answer]);
    while (meanings.size < 4) meanings.add(mixed[randomInt(mixed.length)].answer);
    const options = [...meanings];
    for (let i = options.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [options[i], options[j]] = [options[j], options[i]];
    }
    return { itemId: item.id, options, correctIndex: options.indexOf(item.answer) };
  });
  const runId = createId('practice');
  await sql.transaction(tx => [
    tx`SELECT player_id FROM player_wallet WHERE player_id=${playerId} FOR UPDATE`,
    tx`INSERT INTO practice_runs(player_id,run_id,questions) VALUES (${playerId},${runId},${JSON.stringify(questions)}::jsonb)
      ON CONFLICT(player_id) DO UPDATE SET run_id=EXCLUDED.run_id,questions=EXCLUDED.questions,started_at=NOW(),response=NULL
        WHERE ${restart} OR practice_runs.response IS NOT NULL OR practice_runs.started_at<NOW()-INTERVAL '1 day'`,
  ]);
  const rows = await sql`SELECT run_id,questions FROM practice_runs WHERE player_id=${playerId}`;
  const row = rows[0];
  return { runId: String(row.run_id), questions: (row.questions as PracticeQuestion[]).map(({ itemId, options }) => ({ itemId, options })) };
}

export async function validatePracticeRun(playerId: string, runId: unknown, answers: unknown) {
  if (typeof runId !== 'string' || !/^practice_[0-9a-f-]{36}$/i.test(runId)
    || !Array.isArray(answers) || answers.length !== 50 || answers.some(answer => !Number.isInteger(answer) || answer<0 || answer>4)) {
    throw new ApiError(400, '练习记录无效，请先开始并完成50题练习。');
  }
  const sql = getSql();
  const rows = await sql`SELECT questions,response,EXTRACT(EPOCH FROM (NOW()-started_at)) AS elapsed
    FROM practice_runs WHERE player_id=${playerId} AND run_id=${runId}`;
  const row = rows[0];
  if (!row) throw new ApiError(409, '练习记录已失效。');
  if (row.response) return { cached: row.response as Record<string, unknown> };
  if (Number(row.elapsed)<50 || Number(row.elapsed)>86400) throw new ApiError(400, '练习耗时无效，请正常完成本轮练习。');
  const correct = (row.questions as PracticeQuestion[]).reduce((count, question, index) => count+(question.correctIndex===answers[index] ? 1 : 0), 0);
  return { runId, correct };
}
