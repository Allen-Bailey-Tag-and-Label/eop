import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('./commit.js', import.meta.url));

function fixture() {
	const cwd = mkdtempSync(join(tmpdir(), 'eop-commit-test-'));
	const env = {
		...process.env,
		GIT_AUTHOR_NAME: 'Test',
		GIT_AUTHOR_EMAIL: 'test@example.com',
		GIT_COMMITTER_NAME: 'Test',
		GIT_COMMITTER_EMAIL: 'test@example.com',
		HUSKY: '0'
	};
	const git = (...args) => {
		const result = spawnSync('git', args, { cwd, env, encoding: 'utf8' });
		assert.equal(result.status, 0, result.stderr);
		return result.stdout;
	};
	git('init');
	writeFileSync(join(cwd, 'changelog.md'), '# Changelog\n');
	git('add', 'changelog.md');
	git('commit', '-m', 'Initial');
	return {
		cwd,
		git,
		run: (...args) => spawnSync(process.execPath, [script, ...args], { cwd, env, encoding: 'utf8' })
	};
}

test('records the complete message and commits only staged files plus the changelog', () => {
	const { cwd, git, run } = fixture();
	writeFileSync(join(cwd, 'feature.txt'), 'feature');
	writeFileSync(join(cwd, 'unrelated.txt'), 'leave alone');
	git('add', 'feature.txt');
	const message = 'Add feature\n\nPreserve full details and "quotes".';
	const result = run(message);
	assert.equal(result.status, 0, result.stderr);
	assert.equal(git('log', '-1', '--format=%B').trim(), message);
	assert.ok(git('show', 'HEAD:changelog.md').includes(message));
	assert.equal(git('ls-tree', '--name-only', 'HEAD', '--', 'unrelated.txt'), '');
	assert.equal(git('diff', '--cached', '--name-only'), '');
	// Reusing a message for a later commit should still create a new history entry.
	writeFileSync(join(cwd, 'feature.txt'), 'updated');
	git('add', 'feature.txt');
	assert.equal(run(message).status, 0);
	assert.equal(readFileSync(join(cwd, 'changelog.md'), 'utf8').split('\n## ').length, 3);
});

test('rejects missing messages and empty staging without modifying the changelog', () => {
	const { cwd, run } = fixture();
	assert.notEqual(run().status, 0);
	assert.notEqual(run('Nothing staged').status, 0);
	assert.equal(readFileSync(join(cwd, 'changelog.md'), 'utf8'), '# Changelog\n');
});

test('preserves unstaged changelog edits and does not commit', () => {
	const { cwd, git, run } = fixture();
	writeFileSync(join(cwd, 'feature.txt'), 'feature');
	git('add', 'feature.txt');
	writeFileSync(join(cwd, 'changelog.md'), '# Changelog\nManual edit\n');
	assert.notEqual(run('Add feature').status, 0);
	assert.equal(git('log', '-1', '--format=%s').trim(), 'Initial');
	assert.equal(readFileSync(join(cwd, 'changelog.md'), 'utf8'), '# Changelog\nManual edit\n');
});

test('changelog-only mode stages the entry without committing, ready for Source Control', () => {
	const { cwd, git, run } = fixture();
	writeFileSync(join(cwd, 'feature.txt'), 'feature');
	git('add', 'feature.txt');
	const message = 'Commit from Source Control\n\nFull message body.';
	assert.equal(run('--changelog', message).status, 0);
	assert.equal(git('log', '-1', '--format=%s').trim(), 'Initial');
	assert.ok(git('show', ':changelog.md').includes(message));
	const messageFile = join(cwd, 'message.txt');
	writeFileSync(messageFile, message);
	git('commit', '--file', messageFile);
	assert.ok(git('show', 'HEAD:changelog.md').includes(message));
	assert.equal(git('diff', '--cached', '--name-only'), '');
	assert.equal(git('diff', '--name-only', '--', 'changelog.md'), '');
	assert.equal(git('ls-tree', '--name-only', 'HEAD', '--', 'message.txt'), '');
	// Preparing the changelog and then using the commit command records it once.
	writeFileSync(join(cwd, 'feature.txt'), 'updated');
	git('add', 'feature.txt');
	assert.equal(run('--changelog', 'Next commit').status, 0);
	assert.equal(run('Next commit').status, 0);
	assert.equal(git('show', 'HEAD:changelog.md').split('\n## ').length, 3);
});
