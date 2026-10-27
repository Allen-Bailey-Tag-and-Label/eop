import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';

function git(args) {
	const result = spawnSync('git', args, { encoding: 'utf8' });
	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(result.stderr.trim() || 'Git command failed.');
	}
	return result.stdout;
}

try {
	const message = process.argv.slice(2).join(' ').trim();
	if (!message) throw new Error('Usage: npm run changelog -- "Proposed commit message"');
	const root = git(['rev-parse', '--show-toplevel']).trim();
	process.chdir(root);
	// Ignore uncommitted proposals entirely: only Git history confirms a commit.
	const firstChangelogCommit = git(['log', '--first-parent', '--format=%H', '--', 'changelog.md'])
		.trim()
		.split('\n')
		.at(-1);
	const fields = git(['log', '--first-parent', '--format=%H%x00%cI%x00%B%x00']).split('\0');
	const entries = [];
	if (firstChangelogCommit) {
		for (let i = 0; i + 2 < fields.length; i += 3) {
			const hash = fields[i].trim();
			entries.push(`## ${fields[i + 1].trim()}\n\n${fields[i + 2].trim()}`);
			if (hash === firstChangelogCommit) break;
		}
	}
	const path = resolve(root, 'changelog.md');
	const contents = [
		'# Changelog',
		'Pending describes the current proposed commit. Dated entries reflect actual Git history since this changelog was introduced.',
		`## Pending\n\n${message}`,
		...entries
	].join('\n\n');
	writeFileSync(path, await format(contents, { ...(await resolveConfig(path)), filepath: path }));
	console.log(
		'Changelog reconciled with Git history and the pending proposal updated. No commit made.'
	);
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
