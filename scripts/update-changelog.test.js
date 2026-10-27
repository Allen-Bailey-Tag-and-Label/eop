import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('./update-changelog.js', import.meta.url));

function fixture() {
	const cwd = mkdtempSync(join(tmpdir(), 'eop-changelog-test-'));
	const env = {
		...process.env,
		GIT_AUTHOR_NAME: 'Test',
		GIT_AUTHOR_EMAIL: 'test@example.com',
		GIT_COMMITTER_NAME: 'Test',
		GIT_COMMITTER_EMAIL: 'test@example.com'
	};
	const git = (...args) => {
		const result = spawnSync('git', args, { cwd, env, encoding: 'utf8' });
		assert.equal(result.status, 0, result.stderr);
		return result.stdout;
	};
	git('init');
	writeFileSync(join(cwd, 'seed.txt'), 'seed');
	git('add', 'seed.txt');
	git('commit', '-m', 'Before changelog');
	return {
		cwd,
		git,
		read: () => readFileSync(join(cwd, 'changelog.md'), 'utf8'),
		run: (...args) => spawnSync(process.execPath, [script, ...args], { cwd, env, encoding: 'utf8' })
	};
}

test('replaces uncommitted proposals without staging or committing', () => {
	const { git, read, run } = fixture();
	assert.equal(run('Rejected proposal').status, 0);
	assert.equal(run('Current proposal').status, 0);
	assert.ok(read().includes('Current proposal'));
	assert.ok(!read().includes('Rejected proposal'));
	assert.ok(!read().includes('Pending'));
	assert.match(read(), /^# Changelog\s+## \d{4}-\d{2}-\d{2}T/);
	assert.equal(read().split('\n## ').length, 2);
	assert.equal(git('log', '-1', '--format=%s').trim(), 'Before changelog');
	assert.equal(git('diff', '--cached', '--name-only'), '');
});

test('uses actual messages, includes intervening commits, and preserves repeated messages', () => {
	const { cwd, git, read, run } = fixture();
	assert.equal(run('Original proposed message').status, 0);
	git('add', 'changelog.md');
	git('commit', '-m', 'User edited message');
	writeFileSync(join(cwd, 'seed.txt'), 'update');
	git('add', 'seed.txt');
	git('commit', '-m', 'Repeated message');
	writeFileSync(join(cwd, 'seed.txt'), 'another update');
	git('add', 'seed.txt');
	git('commit', '-m', 'Repeated message');
	// An arbitrary stale entry, even in the file on disk, is not proof of a commit.
	writeFileSync(join(cwd, 'changelog.md'), '# Changelog\n\n## Fake\n\nNever committed\n');
	assert.equal(run('Next proposal').status, 0);
	assert.ok(read().includes('User edited message'));
	assert.ok(!read().includes('Original proposed message'));
	assert.ok(!read().includes('Never committed'));
	assert.ok(!read().includes('Before changelog'));
	assert.equal(read().split('Repeated message').length, 3);
	const contents = read();
	assert.equal(run('Next proposal').status, 0);
	assert.equal(read().replace(/^## .*$/gm, '## Date'), contents.replace(/^## .*$/gm, '## Date'));
});

test('rejects an empty message without modifying files', () => {
	const { cwd, run } = fixture();
	writeFileSync(join(cwd, 'changelog.md'), 'Keep this');
	assert.notEqual(run().status, 0);
	assert.equal(readFileSync(join(cwd, 'changelog.md'), 'utf8'), 'Keep this');
});
