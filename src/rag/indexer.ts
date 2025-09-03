import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'path';
import { getLLM } from '../providers/llm.js';

type Doc = { id: string; path: string; embedding: number[]; meta: Record<string, any> };
const OUT = 'data/index.json';

async function main() {
  const llm = await getLLM();

  const files = [
    ...(await glob('adr/**/*.md')),
    ...(await glob('docs/**/*.md')),
    ...(await glob('kb/**/*.md'))
  ];

  const texts = files.map((p) => fs.readFileSync(p, 'utf8'));
  const embs = await llm.embed(texts);

  const rows: Doc[] = files.map((p, i) => ({
    id: `${i}`,
    path: p,
    embedding: embs[i],
    meta: {}
  }));

  await fs.ensureDir('data');
  await fs.writeJson(OUT, { createdAt: new Date().toISOString(), rows }, { spaces: 2 });
  console.log(`Indexed ${rows.length} docs → ${OUT}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
