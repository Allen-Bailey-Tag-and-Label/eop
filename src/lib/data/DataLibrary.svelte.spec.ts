import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/svelte';
import DataLibrary from './DataLibrary.svelte';
import DataLibraryDialog from '$lib/components/fixtures/DataLibraryDialog.svelte';
import { blankWorkflow } from './types';
import type { WorkflowDefinition } from './types';
import forecast from '../../../weather-14423-workflow.json';

vi.mock('$app/forms', () => ({
	enhance: vi.fn(() => ({ destroy: vi.fn() })),
	deserialize: (value: string) => JSON.parse(value)
}));
vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn().mockResolvedValue(undefined) }));
vi.mock('svelte/transition', async (importOriginal) => ({
	...(await importOriginal<typeof import('svelte/transition')>()),
	scale: () => ({ duration: 0 })
}));
vi.mock('sveltewind/transitions', () => ({ subtleReveal: () => ({ duration: 0 }) }));
beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});
const connection = {
	id: 'b'.repeat(24),
	title: 'National Weather Service',
	version: 1,
	config: {
		baseUrl: 'https://api.weather.gov',
		paths: ['/gridpoints/BUF/71,54/forecast'],
		auth: 'none' as const,
		headerName: 'X-API-Key',
		secretEnv: '',
		timeoutMs: 10000
	}
};
const selfJoin: WorkflowDefinition = {
	...blankWorkflow(),
	nodes: [
		...blankWorkflow().nodes,
		{
			id: 'joined',
			type: 'join',
			inputs: ['rows', 'rows'],
			config: { leftKey: 'id', rightKey: 'id', mode: 'left', prefix: 'right' }
		}
	]
};
describe('data library dialogs', () => {
	it('keeps connection forms separate from the list and opens the selected connection for editing or deletion', async () => {
		const view = render(DataLibraryDialog, { scopeId: 'c'.repeat(24), connections: [connection] });
		await fireEvent.click(view.getByRole('tab', { name: 'API connections' }));
		expect(view.queryByLabelText('Connection title')).not.toBeInTheDocument();
		await fireEvent.click(view.getByRole('button', { name: 'Add API connection' }));
		const createDialog = view.getByRole('dialog', { name: 'New API connection' });
		const parentLayer = view
			.getByRole('dialog', { name: 'Data links' })
			.closest<HTMLElement>('[style*="z-index"]')!;
		const childLayer = createDialog.closest<HTMLElement>('[style*="z-index"]')!;
		expect(Number(childLayer.style.zIndex)).toBeGreaterThan(Number(parentLayer.style.zIndex));
		const create = within(createDialog);
		await fireEvent.input(create.getByLabelText('Connection title'), {
			target: { value: 'Draft' }
		});
		await fireEvent.click(create.getByRole('button', { name: 'Cancel' }));
		await fireEvent.click(view.getByRole('button', { name: 'Edit' }));
		const edit = within(view.getByRole('dialog', { name: 'Edit API connection' }));
		expect(edit.getByLabelText('Connection title')).toHaveValue(connection.title);
		expect(edit.getByRole('checkbox', { name: 'GET' })).toBeChecked();
		await fireEvent.click(edit.getByRole('checkbox', { name: 'POST' }));
		await fireEvent.click(
			edit.getByRole('checkbox', { name: "Allow approved monitors to use this connection's proxy" })
		);
		expect(edit.getByLabelText('Monitor proxy URL (first allowed endpoint)')).toHaveValue(
			'/monitors/api/' + connection.id + connection.config.paths[0]
		);
		const settings = JSON.parse(
			(
				view
					.getByRole('dialog', { name: 'Edit API connection' })
					.querySelector('input[name="definition"]') as HTMLInputElement
			).value
		);
		expect(settings).toMatchObject({ methods: ['GET', 'HEAD', 'POST'], monitorProxy: true });

		await fireEvent.click(edit.getByRole('button', { name: 'Cancel' }));
		await fireEvent.click(view.getByRole('button', { name: 'Delete' }));
		expect(view.getByRole('dialog', { name: 'Delete API connection?' })).toBeInTheDocument();
		expect(view.queryByLabelText('Connection title')).not.toBeInTheDocument();
	});
	it.each([
		['literal', blankWorkflow()],
		['forecast', forecast],
		['self-join', selfJoin]
	])('opens a saved %s data link from This slide', async (_, draft) => {
		const source = {
			id: 'a'.repeat(24),
			title: 'Saved source',
			version: 1,
			scope: 'slide',
			publishedAt: null
		};
		vi.stubGlobal(
			'fetch',
			vi.fn(
				async () =>
					new Response(
						JSON.stringify({ type: 'success', data: { source: { ...source, draft }, usage: [] } })
					)
			)
		);
		const view = render(DataLibrary, {
			scopeId: 'c'.repeat(24),
			sources: [source],
			connections: [connection]
		});
		await fireEvent.click(view.getByRole('button', { name: 'Edit' }));
		await waitFor(() =>
			expect(view.getByRole('heading', { name: 'Edit data link' })).toBeInTheDocument()
		);
		expect(view.container.querySelector('input[name="title"]')).toHaveValue('Saved source');
		await fireEvent.click(view.getByRole('button', { name: 'All data links' }));
		expect(view.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
	});
});
