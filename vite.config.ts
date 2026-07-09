import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

type BalanceDraftRecord = {
  sourceLevelId?: string;
  levelNumber?: number;
  difficulty?: string;
  unlockRewards?: unknown;
  [key: string]: unknown;
};

const DIFFICULTY_ORDER = ['EZ', 'HD', 'IN', 'AT'];
const STAR_BY_DIFFICULTY: Record<string, 1 | 2 | 3> = { EZ: 1, HD: 2, IN: 3, AT: 3 };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asBalanceDraft(value: unknown): BalanceDraftRecord | null {
  if (!isRecord(value)) return null;
  if (typeof value.sourceLevelId !== 'string') return null;
  if (typeof value.difficulty !== 'string') return null;
  const draft = value as BalanceDraftRecord;
  if (Array.isArray(draft.waves)) {
    draft.waves = draft.waves.map(wave => {
      if (!isRecord(wave) || !Array.isArray(wave.groups)) return wave;
      return {
        ...wave,
        groups: wave.groups.map(group => {
          if (!isRecord(group)) return group;
          const next = { ...group };
          delete next.reward;
          return next;
        }),
      };
    });
  }
  return draft;
}

function getDraftKey(draft: BalanceDraftRecord) {
  const sourceLevelId = draft.sourceLevelId || `L${Number(draft.levelNumber) || 0}`;
  const difficulty = draft.difficulty || 'EZ';
  return `${sourceLevelId}:${difficulty}`;
}

function sortDrafts(drafts: BalanceDraftRecord[]) {
  return [...drafts].sort((a, b) => {
    const levelA = typeof a.levelNumber === 'number' ? a.levelNumber : Number.MAX_SAFE_INTEGER;
    const levelB = typeof b.levelNumber === 'number' ? b.levelNumber : Number.MAX_SAFE_INTEGER;
    if (levelA !== levelB) return levelA - levelB;
    const diffA = DIFFICULTY_ORDER.indexOf(String(a.difficulty));
    const diffB = DIFFICULTY_ORDER.indexOf(String(b.difficulty));
    return (diffA === -1 ? 99 : diffA) - (diffB === -1 ? 99 : diffB);
  });
}

function extractJsonConst(source: string, constName: string): unknown {
  const match = new RegExp(`export\\s+const\\s+${constName}\\b`).exec(source);
  if (!match) return null;

  const equalsIndex = source.indexOf('=', match.index);
  if (equalsIndex < 0) return null;

  const startIndex = source.slice(equalsIndex + 1).search(/[\[{]/);
  if (startIndex < 0) return null;

  const rootIndex = equalsIndex + 1 + startIndex;
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let index = rootIndex; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      stack.push('}');
      continue;
    }

    if (char === '[') {
      stack.push(']');
      continue;
    }

    if (char === '}' || char === ']') {
      if (stack[stack.length - 1] !== char) return null;
      stack.pop();
      if (stack.length === 0) {
        const jsonLike = source.slice(rootIndex, index + 1).replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(jsonLike);
      }
    }
  }

  return null;
}

async function readExistingDrafts(file: string) {
  const drafts = new Map<string, BalanceDraftRecord>();

  try {
    const source = await readFile(file, 'utf8');
    const draftList = extractJsonConst(source, 'BALANCE_LAB_LEVEL_DRAFTS');
    if (Array.isArray(draftList)) {
      draftList.forEach(item => {
        const draft = asBalanceDraft(item);
        if (draft) drafts.set(getDraftKey(draft), draft);
      });
      return drafts;
    }

    const singleDraft = asBalanceDraft(extractJsonConst(source, 'BALANCE_LAB_LEVEL_DRAFT'));
    if (singleDraft) {
      drafts.set(getDraftKey(singleDraft), singleDraft);
      return drafts;
    }

    if (source.trim().length > 0) {
      throw new Error(`Cannot parse existing balance drafts: ${file}`);
    }
  } catch (error) {
    if (isRecord(error) && error.code === 'ENOENT') return drafts;
    throw error;
  }

  return drafts;
}

function buildDraftSource(drafts: BalanceDraftRecord[]) {
  const orderedDrafts = sortDrafts(drafts);
  const draftMap = Object.fromEntries(orderedDrafts.map(draft => [getDraftKey(draft), draft]));

  return `import type { BalanceLabLevelDraft } from './BalanceLabPage';\n\nexport const BALANCE_LAB_LEVEL_DRAFTS: BalanceLabLevelDraft[] = ${JSON.stringify(orderedDrafts, null, 2)};\n\nexport const BALANCE_LAB_DRAFT_BY_KEY: Record<string, BalanceLabLevelDraft> = ${JSON.stringify(draftMap, null, 2)};\n\nexport const BALANCE_LAB_LEVEL_DRAFT: BalanceLabLevelDraft = BALANCE_LAB_LEVEL_DRAFTS[0] as BalanceLabLevelDraft;\n`;
}

function buildDraftResponse(drafts: BalanceDraftRecord[]) {
  const orderedDrafts = sortDrafts(drafts);
  return {
    drafts: orderedDrafts,
    draftByKey: Object.fromEntries(orderedDrafts.map(draft => [getDraftKey(draft), draft])),
    count: orderedDrafts.length,
  };
}

function buildUnlockDraftSource(drafts: BalanceDraftRecord[]) {
  const orderedDrafts = sortDrafts(drafts);
  const requirements = orderedDrafts.flatMap(draft => {
    if (typeof draft.levelNumber !== 'number' || typeof draft.difficulty !== 'string') return [];
    if (!Array.isArray(draft.unlockRewards)) return [];
    if (!(draft.difficulty in STAR_BY_DIFFICULTY)) return [];
    const star = STAR_BY_DIFFICULTY[draft.difficulty] ?? 1;
    return draft.unlockRewards
      .filter((itemId): itemId is string => typeof itemId === 'string' && itemId.length > 0)
      .map(itemId => ({
        level: draft.levelNumber,
        difficulty: draft.difficulty,
        star,
        itemId,
      }));
  });

  return `export const GENERATED_LEVEL_UNLOCK_REQUIREMENTS: Array<{\n  level: number;\n  difficulty: 'EZ' | 'HD' | 'IN' | 'AT';\n  star: 1 | 2 | 3;\n  itemId: string;\n}> = ${JSON.stringify(requirements, null, 2)};\n`;
}

function balanceLabSavePlugin(): Plugin {
  return {
    name: 'td-balance-lab-save',
    configureServer(server) {
      server.middlewares.use('/__td_lab_save', (req, res, next) => {
        if (req.method === 'GET') {
          const relativeFile = 'src/td/balanceDraft.generated.ts';
          const file = path.resolve(process.cwd(), relativeFile);

          readExistingDrafts(file)
            .then(drafts => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, file: relativeFile, ...buildDraftResponse([...drafts.values()]) }));
            })
            .catch(error => {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'text/plain');
              res.end(error instanceof Error ? error.message : 'Failed to read balance lab drafts');
            });
          return;
        }

        if (req.method !== 'POST') {
          next();
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}') as { draft?: unknown; config?: unknown; replaceAll?: boolean };
            const draft = asBalanceDraft(parsed.draft ?? parsed.config);
            if (!draft) {
              throw new Error('Missing balance lab draft');
            }

            const relativeFile = 'src/td/balanceDraft.generated.ts';
            const file = path.resolve(process.cwd(), relativeFile);
            const unlockFile = path.resolve(process.cwd(), 'shared/unlockDraft.generated.ts');
            const drafts = parsed.replaceAll ? new Map<string, BalanceDraftRecord>() : await readExistingDrafts(file);
            const key = getDraftKey(draft);
            drafts.set(key, draft);
            if (typeof draft.levelName === 'string' && draft.levelName.trim().length > 0) {
              const unifiedLevelName = draft.levelName.trim();
              drafts.forEach(existingDraft => {
                if (existingDraft.sourceLevelId === draft.sourceLevelId) {
                  existingDraft.levelName = unifiedLevelName;
                }
              });
            }
            const nextDrafts = [...drafts.values()];
            const source = buildDraftSource(nextDrafts);
            await writeFile(file, source, 'utf8');
            await writeFile(unlockFile, buildUnlockDraftSource(nextDrafts), 'utf8');

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, file: relativeFile, key, count: drafts.size }));
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain');
            res.end(error instanceof Error ? error.message : 'Failed to save balance lab config');
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), balanceLabSavePlugin()],
})

