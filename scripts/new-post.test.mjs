import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'blog-new-post-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const posts = join(root, 'src/content/blog');
  await mkdir(posts, { recursive: true });
  await mkdir(join(root, 'scripts'));
  const script = join(root, 'scripts/new-post.mjs');
  await copyFile(new URL('./new-post.mjs', import.meta.url), script);
  return {
    posts,
    run: (...args) => spawnSync(process.execPath, [script, '--no-interactive', ...args], {
      cwd: tmpdir(), encoding: 'utf8',
    }),
  };
}

const metadata = ['--title', 'A small idea', '--description', 'The question this post explores.'];

test('creating from another working directory preserves an existing draft on collision', async (t) => {
  const { posts, run } = await fixture(t);
  const created = run(...metadata);
  assert.equal(created.status, 0, created.stderr);
  const path = join(posts, 'a-small-idea.md');
  assert.equal(created.stdout.trim(), path);
  const edited = `${await readFile(path, 'utf8')}My unfinished article.\n`;
  await writeFile(path, edited);
  const duplicate = run(...metadata);
  assert.equal(duplicate.status, 1);
  assert.match(duplicate.stderr, /Post already exists/);
  assert.equal(await readFile(path, 'utf8'), edited);
});

test('invalid metadata creates no files', async (t) => {
  for (const [name, args, message] of [
    ['path traversal', [...metadata, '--slug', '../escape'], /Slug must/],
    ['impossible calendar date', [...metadata, '--date', '2026-02-30'], /real date/],
    ['missing title', ['--description', 'Summary'], /--title is required/],
    ['blank summary', ['--title', 'Title', '--description', '  '], /--description is required/],
    ['title without an ASCII slug', ['--title', '日本語', '--description', 'Summary'], /--slug is required/],
  ]) {
    await t.test(name, async (t) => {
      const { posts, run } = await fixture(t);
      const result = run(...args);
      assert.equal(result.status, 1);
      assert.match(result.stderr, message);
      assert.deepEqual(await readdir(posts), []);
    });
  }
});
