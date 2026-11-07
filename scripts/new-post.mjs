import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline/promises';

const help = `Usage: npm run new-post -- [options]

Prompts for missing fields in a terminal. Creates an unpublished Markdown draft.
Without a terminal, --title and --description are required.

  --title TEXT         Post title
  --description TEXT   Short summary for the index, feed, and search results
  --slug TEXT          URL slug (default: derived from title)
  --date YYYY-MM-DD    Publication date (default: today, local time)
  --no-interactive     Use flags and defaults without prompting
  --help               Show this help

The created file's absolute path is printed to stdout; prompts use stderr.
`;

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function slugify(title) {
  return title.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  const { values } = parseArgs({
    allowNegative: true,
    options: {
      title: { type: 'string' },
      description: { type: 'string' },
      slug: { type: 'string' },
      date: { type: 'string' },
      interactive: { type: 'boolean', default: Boolean(process.stdin.isTTY && process.stderr.isTTY) },
      help: { type: 'boolean' },
    },
  });
  if (values.help) {
    process.stdout.write(help);
    return;
  }

  const terminal = values.interactive
    ? createInterface({ input: process.stdin, output: process.stderr })
    : undefined;
  const cancellation = new AbortController();
  terminal?.on('close', () => cancellation.abort());
  terminal?.on('SIGINT', () => terminal.close());

  async function field(name, label, fallback = '') {
    let value = values[name];
    if (value === undefined && terminal) {
      value = await terminal.question(`${label}${fallback ? ` [${fallback}]` : ''}: `, {
        signal: cancellation.signal,
      });
      value = value.trim() || fallback;
    }
    value = (value ?? fallback).trim();
    if (!value) throw new Error(`--${name} is required.`);
    return value;
  }

  let title, description, slug, date;
  try {
    title = await field('title', 'Title');
    description = await field('description', 'Description');
    slug = await field('slug', 'Slug', slugify(title));
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error('Slug must contain lowercase ASCII letters or numbers separated by single hyphens.');
    }
    date = await field('date', 'Publication date', today());
    const parsedDate = new Date(`${date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate.getTime())
      || parsedDate.toISOString().slice(0, 10) !== date) {
      throw new Error('Publication date must be a real date in YYYY-MM-DD format.');
    }
  } finally {
    terminal?.close();
  }

  const path = fileURLToPath(new URL(`../src/content/blog/${slug}.md`, import.meta.url));
  const content = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\npubDate: ${date}\ndraft: true\n---\n\n`;
  try {
    await writeFile(path, content, { flag: 'wx' });
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Post already exists: ${path}`);
    throw error;
  }
  process.stdout.write(`${path}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.name === 'AbortError' ? 'Post creation cancelled.' : error.message}\n`);
  process.exitCode = 1;
});
