import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	optimizeDeps: {
		include: [
			'clsx',
			'devalue',
			'imask',
			'luxon',
			'shiki',
			'sveltewind',
			'sveltewind/actions',
			'sveltewind/components',
			'sveltewind/icons',
			'sveltewind/themes',
			'tailwind-merge'
		]
	},
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
