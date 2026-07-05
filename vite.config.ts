import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function balanceLabSavePlugin(): Plugin {
  return {
    name: 'td-balance-lab-save',
    configureServer(server) {
      server.middlewares.use('/__td_lab_save', (req, res, next) => {
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
            const parsed = JSON.parse(body || '{}') as { draft?: unknown; config?: unknown };
            const draft = parsed.draft ?? parsed.config;
            if (!draft) {
              throw new Error('Missing balance lab draft');
            }

            const relativeFile = 'src/td/balanceDraft.generated.ts';
            const file = path.resolve(process.cwd(), relativeFile);
            const source = `import type { BalanceLabLevelDraft } from './BalanceLabPage';\n\nexport const BALANCE_LAB_LEVEL_DRAFT: BalanceLabLevelDraft = ${JSON.stringify(draft, null, 2)};\n`;
            await writeFile(file, source, 'utf8');

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, file: relativeFile }));
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

