import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import matter from 'gray-matter';
import { getLLM } from './providers/llm.js';
import { cosine } from './util/similarity.js';

const INDEX = 'data/index.json';
const TEMPLATE = 'templates/madr.md';

type Row = { path: string; embedding: number[] };

async function loadIndex(): Promise<Row[]> {
  if (!fs.existsSync(INDEX)) return [];
  const j = await fs.readJson(INDEX);
  return j.rows;
}

function nextAdrNumber(): string {
  const files = fs.existsSync('adr') ? fs.readdirSync('adr') : [];
  const nums = files
    .map((f) => f.match(/^(\d+)-/))
    .filter(Boolean)
    .map((m) => parseInt((m as RegExpMatchArray)[1], 10));
  const n = nums.length ? Math.max(...nums) + 1 : 1;
  return n.toString().padStart(3, '0');
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('title', { type: 'string', demandOption: true })
    .option('drivers', { type: 'string', describe: 'Comma-separated decision drivers' })
    .option('options', { type: 'string', describe: 'Comma-separated considered options', demandOption: true })
    .option('constraints', { type: 'string', default: '' })
    .option('context', { type: 'string', default: '' })
    .help().argv;

  const llm = await getLLM();
  const index = await loadIndex();
  const optionsList = argv.options.split(',').map((s) => s.trim());
  const drivers = (argv.drivers || '').split(',').map((s) => s.trim()).filter(Boolean);

  // Find similar ADRs/docs to reference
  let similarText = '';
  if (index.length) {
    const embs = await llm.embed([argv.title + ' ' + argv.context + ' ' + argv.constraints + ' ' + optionsList.join(' ')]);
    const q = embs[0];
    const scored = index.map((r) => ({
      path: r.path,
      score: cosine(q, r.embedding)
    })).sort((a, b) => b.score - a.score).slice(0, 5);
    similarText = scored.filter(s => s.score > 0.2).map(s => `- ${s.path} (score ${s.score.toFixed(2)})`).join('\n');
  }

  const prompt = `
You are drafting a high-quality Architecture Decision Record (ADR) using the MADR style.
Title: ${argv.title}
Context: ${argv.context}
Constraints: ${argv.constraints}
Decision drivers (quality attributes): ${drivers.join(', ') || 'N/A'}
Considered options: ${optionsList.join(', ')}

Return a completed ADR body with: context, options, chosen option with rationale, pros/cons, consequences.
Use neutral, evidence-based language, avoid hallucinations, and clearly call out assumptions/estimates.
If conflicts are likely with existing ADRs, warn explicitly.

Similar existing docs:
${similarText || '- (no index yet or nothing similar)'}
`;

  const draft = await llm.generate(prompt);

  const template = await fs.readFile(TEMPLATE, 'utf8');
  const date = new Date().toISOString().slice(0, 10);
  const content = template
    .replace('{title}', argv.title)
    .replace('{status}', 'Proposed')
    .replace('{date}', date)
    .replace('{drivers}', drivers.join(', ') || '—')
    .replace('{context}', argv.context || '(fill in any additional constraints/assumptions)')
    .replace('{options}', optionsList.map(o => `- ${o}`).join('\n'))
    .replace('{chosen}', '(to be confirmed)')
    .replace('{rationale}', '(summarize once approved)')
    .replace('{pros}', '(enumerate)')
    .replace('{cons}', '(enumerate)')
    .replace('{options_pros_cons}', draft.trim())
    .replace('{related}', similarText || '—')
    .replace('{c4_refs}', '(e.g., Container: api, Component: event-bus)');

  await fs.ensureDir('adr');
  const file = `adr/${nextAdrNumber()}-${argv.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.md`;
  await fs.writeFile(file, content, 'utf8');
  console.log(`✨ ADR drafted: ${file}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
