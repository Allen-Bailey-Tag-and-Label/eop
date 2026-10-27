import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function git(args) {
	const result = spawnSync('git', args, { encoding: 'utf8' });
	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(result.stderr.trim() || result.stdout.trim() || 'Git command failed.');
	}
	return result.stdout;
}

try {
	const changelogOnly = process.argv[2] === '--changelog';
	const message = process.argv
		.slice(changelogOnly ? 3 : 2)
		.join(' ')
		.trim();
	if (!message) throw new Error('Usage: npm run commit -- "Commit message"');
	const root = git(['rev-parse', '--show-toplevel']).trim();
	process.chdir(root);
	if (!git(['diff', '--cached', '--name-only']).trim()) {
		throw new Error('No staged changes. Stage the files you want to commit first.');
	}
	if (git(['diff', '--name-only', '--', 'changelog.md']).trim()) {
		throw new Error('changelog.md has unstaged edits. Review and stage them before continuing.');
	}
	const path = resolve(root, 'changelog.md');
	const contents = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
	const marker = contents.indexOf('\n## ');
	const header = (marker < 0 ? contents : contents.slice(0, marker)).trimEnd();
	const history = marker < 0 ? '' : contents.slice(marker).trim();
	const entry = `## ${new Date().toISOString()}\n\n${message}`;
	// A failed commit leaves its entry staged. Reuse it when retrying the same message.
	const previousMessage = history.split('\n## ')[0].split('\n').slice(2).join('\n').trim();
	const changelogStaged = git(['diff', '--cached', '--name-only', '--', 'changelog.md']).trim();
	if (!changelogStaged || previousMessage !== message) {
		writeFileSync(path, `${header}\n\n${entry}\n${history ? `\n${history}\n` : ''}`);
	}
	git(['add', '--', 'changelog.md']);
	if (!changelogOnly) {
		const output = git(['commit', '-m', message]);
		process.stdout.write(output);
	} else {
		console.log('Changelog updated and staged. Commit the staged changes in VS Code.');
	}
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
